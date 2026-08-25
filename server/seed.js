#!/usr/bin/env node
// =====================================================================
// Loads server/seed-data.js into the database.
//
//   npm run db:seed              seed / re-seed every phase
//   npm run db:seed -- pre       only the 'pre' assessment
//   npm run db:seed -- post      only the 'post' assessment
//
// Idempotent: a phase's stages, items, options and rubrics are deleted and
// rewritten on every run. Attempts and responses are never touched.
// =====================================================================

require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const db = require("./db");
const seedData = require("./seed-data");

const VALID_PHASES = ["pre", "post"];
const STAGE_KINDS = ["preflight", "selfmap", "discriminators", "forensics", "handson", "written", "context", "review"];
const ITEM_KINDS = ["preflight", "band", "single", "multi", "forensics", "identifier", "written", "text", "select"];
const CHOICE_KINDS = ["single", "multi"];

// =====================================================================
// VALIDATION
// Structural rules plus the scoring invariants the instrument relies on.
// =====================================================================

function validate(assessments) {
  const errors = [];
  const warnings = [];
  const phases = new Set();

  for (const [ai, a] of assessments.entries()) {
    const where = `[${a.phase || ai}]`;

    if (!VALID_PHASES.includes(a.phase)) errors.push(`${where} phase must be "pre" or "post"`);
    if (phases.has(a.phase)) errors.push(`${where} duplicate phase`);
    phases.add(a.phase);
    if (!a.title) errors.push(`${where} missing title`);

    const stages = a.stages || [];
    if (stages.length === 0) {
      warnings.push(`${where} no stages — this phase will show as "not open yet"`);
      continue;
    }

    const stageKeys = new Set();
    const itemRefs = new Set();

    for (const [si, s] of stages.entries()) {
      const sWhere = `${where} stage[${si}] (${s.key})`;
      if (!s.key) errors.push(`${sWhere} missing key`);
      if (stageKeys.has(s.key)) errors.push(`${sWhere} duplicate stage key`);
      stageKeys.add(s.key);
      if (!STAGE_KINDS.includes(s.kind)) errors.push(`${sWhere} kind must be one of: ${STAGE_KINDS.join(", ")}`);
      if (!s.name) errors.push(`${sWhere} missing name`);

      for (const [ii, item] of (s.items || []).entries()) {
        const iWhere = `${sWhere} item[${ii}] (${item.ref})`;
        if (!item.ref) errors.push(`${iWhere} missing ref`);
        if (itemRefs.has(item.ref)) errors.push(`${iWhere} duplicate item ref — refs must be unique within a phase`);
        itemRefs.add(item.ref);
        if (!ITEM_KINDS.includes(item.kind)) errors.push(`${iWhere} kind must be one of: ${ITEM_KINDS.join(", ")}`);
        if (!item.stem || !String(item.stem).trim()) errors.push(`${iWhere} empty stem`);

        const opts = item.options || [];
        const cfg = item.config || {};

        if (CHOICE_KINDS.includes(item.kind)) {
          // --- scoring invariants ---
          if (opts.length < 2) errors.push(`${iWhere} needs at least 2 options`);
          const keys = opts.filter((o) => o.isKey);
          if (keys.length === 0) errors.push(`${iWhere} no option flagged isKey — the item can never score`);
          if (item.kind === "single" && keys.length > 1) {
            errors.push(`${iWhere} a single-answer item has ${keys.length} keys; use kind "multi"`);
          }
          if (item.kind === "multi" && keys.length === 1) {
            warnings.push(`${iWhere} a multi item with one key scores like a single`);
          }
          const bothFlags = opts.filter((o) => o.isKey && o.isNeutral);
          if (bothFlags.length) errors.push(`${iWhere} ${bothFlags.length} option(s) flagged both isKey and isNeutral`);
          if (opts.some((o) => o.isNeutral) && item.kind === "single") {
            warnings.push(`${iWhere} isNeutral has no effect on a single-answer item`);
          }
          opts.forEach((o, oi) => {
            if (!o.text || !String(o.text).trim()) errors.push(`${iWhere} option[${oi}] empty text`);
          });
          if (!item.dim) warnings.push(`${iWhere} no dim — it will not reach any dimension roll-up`);

        } else if (item.kind === "select") {
          if (!Array.isArray(cfg.choices) || cfg.choices.length < 2) {
            errors.push(`${iWhere} a select item needs config.choices with at least 2 entries`);
          }

        } else if (item.kind === "forensics") {
          if (!Array.isArray(cfg.subs) || cfg.subs.length === 0) {
            errors.push(`${iWhere} a forensics item needs config.subs`);
          }
          if (!cfg.code && !cfg.narrative) {
            errors.push(`${iWhere} a forensics item needs either config.code or config.narrative`);
          }
          if (cfg.code && !cfg.alt) warnings.push(`${iWhere} code artefact has no config.alt (screen-reader description)`);

        } else if (item.kind === "preflight") {
          if (!item.hint) warnings.push(`${iWhere} no hint — the participant is not told what to paste`);
        }

        if (opts.length && !CHOICE_KINDS.includes(item.kind)) {
          warnings.push(`${iWhere} kind "${item.kind}" carries options; they will be ignored`);
        }
      }

      // Stage-level shape checks
      const kinds = new Set((s.items || []).map((i) => i.kind));
      if (s.kind === "discriminators" && [...kinds].some((k) => !CHOICE_KINDS.includes(k))) {
        errors.push(`${sWhere} a discriminators stage may only hold single/multi items`);
      }
      if (s.kind === "selfmap" && !kinds.has("band")) {
        errors.push(`${sWhere} a selfmap stage needs at least one band item`);
      }
      if (s.kind === "handson" && !kinds.has("identifier")) {
        errors.push(`${sWhere} a handson stage needs at least one identifier item`);
      }
      if (s.kind === "review" && (s.items || []).length) {
        warnings.push(`${sWhere} a review stage should have no items`);
      }
    }
  }

  return { errors, warnings };
}

// =====================================================================
// SEEDING
// =====================================================================

function seedStatements(a) {
  const assessmentId = a.phase;
  const stmts = [
    { sql: `DELETE FROM item_rubrics WHERE item_id IN (
              SELECT i.id FROM items i JOIN stages s ON s.id = i.stage_id WHERE s.assessment_id = ?)`, args: [assessmentId] },
    { sql: `DELETE FROM item_options WHERE item_id IN (
              SELECT i.id FROM items i JOIN stages s ON s.id = i.stage_id WHERE s.assessment_id = ?)`, args: [assessmentId] },
    { sql: `DELETE FROM items WHERE stage_id IN (SELECT id FROM stages WHERE assessment_id = ?)`, args: [assessmentId] },
    { sql: `DELETE FROM stages WHERE assessment_id = ?`, args: [assessmentId] },
    {
      sql: `INSERT INTO assessments (id, phase, title, subtitle, lead, copy, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              title = excluded.title, subtitle = excluded.subtitle, lead = excluded.lead,
              copy = excluded.copy, is_active = excluded.is_active`,
      args: [
        assessmentId, a.phase, a.title, a.subtitle || "", a.lead || "",
        JSON.stringify(a.copy || {}), a.isActive === false ? 0 : 1,
      ],
    },
  ];

  (a.stages || []).forEach((s, si) => {
    const stageId = `${assessmentId}-${s.key}`;
    stmts.push({
      sql: `INSERT INTO stages
              (id, assessment_id, idx, key, name, meta, kind, scored, one_way, one_per_screen, copy)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        stageId, assessmentId, si, s.key, s.name, s.meta || "", s.kind,
        s.scored === false ? 0 : 1, s.oneWay ? 1 : 0, s.onePerScreen ? 1 : 0,
        JSON.stringify(s.copy || {}),
      ],
    });

    (s.items || []).forEach((item, ii) => {
      const itemId = `${assessmentId}-${item.ref}`;
      stmts.push({
        sql: `INSERT INTO items (id, stage_id, ref, kind, dim, stem, hint, config, sort_order)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          itemId, stageId, item.ref, item.kind, item.dim || "",
          item.stem || "", item.hint || "", JSON.stringify(item.config || {}), ii,
        ],
      });

      (item.options || []).forEach((o, oi) => {
        stmts.push({
          sql: `INSERT INTO item_options (id, item_id, text, is_key, is_neutral, sort_order)
                VALUES (?, ?, ?, ?, ?, ?)`,
          args: [`${itemId}-o${oi + 1}`, itemId, o.text, o.isKey ? 1 : 0, o.isNeutral ? 1 : 0, oi],
        });
      });

      (item.rubrics || []).forEach((r, ri) => {
        stmts.push({
          sql: `INSERT INTO item_rubrics (id, item_id, kind, ref, label, weight, detail, sort_order)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            `${itemId}-r${ri + 1}`, itemId, r.kind, r.ref || "",
            r.label || "", String(r.weight ?? ""), r.detail || "", ri,
          ],
        });
      });
    });
  });

  return stmts;
}

async function main() {
  const filter = process.argv[2];
  if (filter && !VALID_PHASES.includes(filter)) {
    console.error(`unknown phase "${filter}" — expected one of: ${VALID_PHASES.join(", ")}`);
    process.exit(1);
  }

  const { errors, warnings } = validate(seedData);

  if (warnings.length) {
    console.error(`\n  ${warnings.length} warning(s):\n`);
    warnings.forEach((w) => console.error(`    ! ${w}`));
  }
  if (errors.length) {
    console.error(`\n  seed-data.js has ${errors.length} problem(s):\n`);
    errors.forEach((e) => console.error(`    ✗ ${e}`));
    console.error("");
    process.exit(1);
  }

  await db.initDB();

  const targets = filter ? seedData.filter((a) => a.phase === filter) : seedData;
  console.log("");
  for (const a of targets) {
    await db.client.batch(seedStatements(a), "write");
    const stages = (a.stages || []).length;
    const items = (a.stages || []).reduce((n, s) => n + (s.items || []).length, 0);
    const flag = stages === 0 ? "   ⚠ empty" : "";
    console.log(`  ✓ ${a.phase.padEnd(6)} ${String(stages).padStart(2)} stages  ${String(items).padStart(3)} items${flag}`);
  }
  console.log("");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
