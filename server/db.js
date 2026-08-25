const { createClient } = require("@libsql/client");
const path = require("path");

// Local dev  → file:./junglelms.db  (no TURSO_DATABASE_URL needed)
// Production → libsql://your-db.turso.io  (set TURSO_DATABASE_URL + TURSO_AUTH_TOKEN)
const client = createClient({
  url: process.env.TURSO_DATABASE_URL || `file:${path.join(__dirname, "..", "junglelms.db")}`,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// =====================================================================
// SCHEMA
//
// Models the instrument as content, not as code, so a pre and a post
// assessment are the same shape with different rows.
//
//   assessments        one per phase ('pre' | 'post')
//     └── stages           ordered modules — pre-flight, self-map, …
//           └── items          one question / row / artefact
//                 ├── item_options   choices, flagged is_key / is_neutral
//                 └── item_rubrics   reviewer-only keys, defect tables, bands
//
//   attempts           one sitting
//     ├── responses            one row per item, value stored as JSON
//     └── attempt_dimensions   auto-scored roll-up, D1…D5 + LLM
//
//   sessions           resume-in-progress blob, keyed by client session id
//
// The answer key (item_options.is_key / is_neutral) and item_rubrics are
// never sent to a participant — see getAssessment() vs getReviewerKey().
// =====================================================================

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS assessments (
      id         TEXT    PRIMARY KEY,
      phase      TEXT    NOT NULL CHECK (phase IN ('pre','post')),
      title      TEXT    NOT NULL,
      subtitle   TEXT    NOT NULL DEFAULT '',
      lead       TEXT    NOT NULL DEFAULT '',
      copy       TEXT    NOT NULL DEFAULT '{}',
      is_active  INTEGER NOT NULL DEFAULT 1,
      UNIQUE (phase)
   )`,

  // kind drives which screen component renders the stage.
  `CREATE TABLE IF NOT EXISTS stages (
      id            TEXT    PRIMARY KEY,
      assessment_id TEXT    NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
      idx           INTEGER NOT NULL,
      key           TEXT    NOT NULL,
      name          TEXT    NOT NULL,
      meta          TEXT    NOT NULL DEFAULT '',
      kind          TEXT    NOT NULL,
      scored        INTEGER NOT NULL DEFAULT 1,
      one_way       INTEGER NOT NULL DEFAULT 0,
      one_per_screen INTEGER NOT NULL DEFAULT 0,
      copy          TEXT    NOT NULL DEFAULT '{}',
      UNIQUE (assessment_id, key)
   )`,

  // config holds the shape variance per kind: forensics sub-parts and
  // evidence tables, select choices, textarea rows, word targets.
  `CREATE TABLE IF NOT EXISTS items (
      id         TEXT    PRIMARY KEY,
      stage_id   TEXT    NOT NULL REFERENCES stages(id) ON DELETE CASCADE,
      ref        TEXT    NOT NULL,
      kind       TEXT    NOT NULL,
      dim        TEXT    NOT NULL DEFAULT '',
      stem       TEXT    NOT NULL DEFAULT '',
      hint       TEXT    NOT NULL DEFAULT '',
      config     TEXT    NOT NULL DEFAULT '{}',
      sort_order INTEGER NOT NULL DEFAULT 0
   )`,

  `CREATE TABLE IF NOT EXISTS item_options (
      id         TEXT    PRIMARY KEY,
      item_id    TEXT    NOT NULL REFERENCES items(id) ON DELETE CASCADE,
      text       TEXT    NOT NULL,
      is_key     INTEGER NOT NULL DEFAULT 0,
      is_neutral INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0
   )`,

  // kind: 'why' | 'defect' | 'band' | 'check' | 'note' | 'chain'
  `CREATE TABLE IF NOT EXISTS item_rubrics (
      id         TEXT    PRIMARY KEY,
      item_id    TEXT    NOT NULL REFERENCES items(id) ON DELETE CASCADE,
      kind       TEXT    NOT NULL,
      ref        TEXT    NOT NULL DEFAULT '',
      label      TEXT    NOT NULL DEFAULT '',
      weight     TEXT    NOT NULL DEFAULT '',
      detail     TEXT    NOT NULL DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0
   )`,

  `CREATE TABLE IF NOT EXISTS attempts (
      id                TEXT    PRIMARY KEY,
      participant_key   TEXT    NOT NULL,
      participant_name  TEXT    NOT NULL,
      participant_email TEXT    NOT NULL DEFAULT '',
      assessment_id     TEXT    NOT NULL REFERENCES assessments(id),
      phase             TEXT    NOT NULL CHECK (phase IN ('pre','post')),
      status            TEXT    NOT NULL DEFAULT 'in_progress',
      started_at        INTEGER NOT NULL,
      completed_at      INTEGER,
      stage_times       TEXT    NOT NULL DEFAULT '{}',
      completeness      TEXT    NOT NULL DEFAULT '{}'
   )`,

  `CREATE TABLE IF NOT EXISTS responses (
      attempt_id    TEXT    NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
      item_ref      TEXT    NOT NULL,
      value         TEXT    NOT NULL DEFAULT '',
      confidence    TEXT    NOT NULL DEFAULT '',
      blocked       INTEGER NOT NULL DEFAULT 0,
      justification TEXT    NOT NULL DEFAULT '',
      auto_score    REAL,
      updated_at    INTEGER NOT NULL,
      PRIMARY KEY (attempt_id, item_ref)
   )`,

  `CREATE TABLE IF NOT EXISTS attempt_dimensions (
      attempt_id TEXT    NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
      dimension  TEXT    NOT NULL,
      raw        REAL    NOT NULL DEFAULT 0,
      n          INTEGER NOT NULL DEFAULT 0,
      pct        INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (attempt_id, dimension)
   )`,

  `CREATE TABLE IF NOT EXISTS sessions (
      id         TEXT    PRIMARY KEY,
      data       TEXT    NOT NULL,
      updated_at INTEGER NOT NULL
   )`,

  // Admin accounts live here, not in the environment, so they can be added
  // or revoked without a redeploy. password_hash is scrypt — never plaintext.
  `CREATE TABLE IF NOT EXISTS admins (
      id            TEXT    PRIMARY KEY,
      username      TEXT    NOT NULL UNIQUE,
      password_hash TEXT    NOT NULL,
      display_name  TEXT    NOT NULL DEFAULT '',
      is_active     INTEGER NOT NULL DEFAULT 1,
      created_at    INTEGER NOT NULL,
      last_login_at INTEGER
   )`,

  // Small key/value store. Holds the admin session signing secret, so no
  // environment variable is needed for admin access at all.
  `CREATE TABLE IF NOT EXISTS settings (
      key        TEXT    PRIMARY KEY,
      value      TEXT    NOT NULL,
      updated_at INTEGER NOT NULL
   )`,

  `CREATE INDEX IF NOT EXISTS idx_stages_assessment ON stages (assessment_id, idx)`,
  `CREATE INDEX IF NOT EXISTS idx_items_stage       ON items  (stage_id, sort_order)`,
  `CREATE INDEX IF NOT EXISTS idx_options_item      ON item_options (item_id, sort_order)`,
  `CREATE INDEX IF NOT EXISTS idx_rubrics_item      ON item_rubrics (item_id, sort_order)`,
  `CREATE INDEX IF NOT EXISTS idx_attempts_person   ON attempts (participant_key, phase)`,
  `CREATE INDEX IF NOT EXISTS idx_attempts_done     ON attempts (completed_at DESC)`,
];

// Turso is a network hop, and the connection occasionally times out for a few
// seconds. Retry transient failures rather than letting the whole process die.
const TRANSIENT = /timeout|ETIMEDOUT|ECONNRESET|ENOTFOUND|EAI_AGAIN|fetch failed|socket hang up/i;

function isTransient(e) {
  const text = `${e && e.message} ${e && e.code} ${e && e.cause && e.cause.code}`;
  return TRANSIENT.test(text);
}

/** Run a database call, retrying a few times on a transient network error. */
async function withRetry(fn, { attempts = 4, delayMs = 1200 } = {}) {
  let last;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      if (!isTransient(e) || i === attempts - 1) throw e;
      await new Promise((r) => setTimeout(r, delayMs * (i + 1)));
    }
  }
  throw last;
}

async function initDB() {
  await withRetry(() => client.batch(SCHEMA.map((sql) => ({ sql })), "deferred"));
}

/** Lowercased, whitespace-collapsed name — the pre↔post linkage key. */
function participantKey(name) {
  return String(name || "").trim().toLowerCase().replace(/\s+/g, " ");
}

const parse = (s, fallback) => { try { return JSON.parse(s); } catch { return fallback; } };

// ---- Assessment content ----------------------------------------

async function listAssessments() {
  const { rows } = await client.execute(
    `SELECT a.id, a.phase, a.title, a.subtitle, a.lead,
            (SELECT COUNT(*) FROM stages s WHERE s.assessment_id = a.id) AS stage_count,
            (SELECT COUNT(*) FROM items i
               JOIN stages s ON s.id = i.stage_id
              WHERE s.assessment_id = a.id) AS item_count
       FROM assessments a
      WHERE a.is_active = 1
      ORDER BY a.phase DESC`
  );
  return rows.map((r) => ({
    id: r.id, phase: r.phase, title: r.title, subtitle: r.subtitle, lead: r.lead,
    stageCount: Number(r.stage_count), itemCount: Number(r.item_count),
  }));
}

/**
 * Full assessment tree for a participant.
 *
 * `includeKey` is false for participants: is_key / is_neutral flags and every
 * rubric row are stripped, so the answer key never reaches the browser.
 */
async function getAssessment(phase, { includeKey = false } = {}) {
  const { rows: aRows } = await client.execute({
    sql: `SELECT * FROM assessments WHERE phase = ? AND is_active = 1`,
    args: [phase],
  });
  if (!aRows[0]) return null;
  const a = aRows[0];

  const [{ rows: sRows }, { rows: iRows }, { rows: oRows }, { rows: rRows }] = await Promise.all([
    client.execute({ sql: `SELECT * FROM stages WHERE assessment_id = ? ORDER BY idx`, args: [a.id] }),
    client.execute({
      sql: `SELECT i.* FROM items i JOIN stages s ON s.id = i.stage_id
             WHERE s.assessment_id = ? ORDER BY s.idx, i.sort_order`,
      args: [a.id],
    }),
    client.execute({
      sql: `SELECT o.* FROM item_options o
              JOIN items i ON i.id = o.item_id
              JOIN stages s ON s.id = i.stage_id
             WHERE s.assessment_id = ? ORDER BY o.sort_order`,
      args: [a.id],
    }),
    includeKey
      ? client.execute({
          sql: `SELECT r.* FROM item_rubrics r
                  JOIN items i ON i.id = r.item_id
                  JOIN stages s ON s.id = i.stage_id
                 WHERE s.assessment_id = ? ORDER BY r.kind, r.sort_order`,
          args: [a.id],
        })
      : Promise.resolve({ rows: [] }),
  ]);

  const optionsByItem = new Map();
  for (const o of oRows) {
    if (!optionsByItem.has(o.item_id)) optionsByItem.set(o.item_id, []);
    const opt = { id: o.id, text: o.text };
    if (includeKey) { opt.isKey = !!o.is_key; opt.isNeutral = !!o.is_neutral; }
    optionsByItem.get(o.item_id).push(opt);
  }

  const rubricsByItem = new Map();
  for (const r of rRows) {
    if (!rubricsByItem.has(r.item_id)) rubricsByItem.set(r.item_id, []);
    rubricsByItem.get(r.item_id).push({
      kind: r.kind, ref: r.ref, label: r.label, weight: r.weight, detail: r.detail,
    });
  }

  const itemsByStage = new Map();
  for (const i of iRows) {
    if (!itemsByStage.has(i.stage_id)) itemsByStage.set(i.stage_id, []);
    const item = {
      id: i.id,
      ref: i.ref,
      kind: i.kind,
      dim: i.dim,
      stem: i.stem,
      hint: i.hint,
      config: parse(i.config, {}),
      options: optionsByItem.get(i.id) || [],
    };
    if (includeKey) item.rubrics = rubricsByItem.get(i.id) || [];
    itemsByStage.get(i.stage_id).push(item);
  }

  return {
    id: a.id,
    phase: a.phase,
    title: a.title,
    subtitle: a.subtitle,
    lead: a.lead,
    copy: parse(a.copy, {}),
    stages: sRows.map((s) => ({
      id: s.id,
      idx: Number(s.idx),
      key: s.key,
      name: s.name,
      meta: s.meta,
      kind: s.kind,
      scored: !!s.scored,
      oneWay: !!s.one_way,
      onePerScreen: !!s.one_per_screen,
      copy: parse(s.copy, {}),
      items: itemsByStage.get(s.id) || [],
    })),
  };
}

/** Flat answer key for scoring. Never sent to a participant. */
async function getAnswerKey(assessmentId) {
  const { rows } = await client.execute({
    sql: `SELECT i.ref, i.kind, i.dim, o.id AS option_id, o.is_key, o.is_neutral, o.sort_order
            FROM items i
            JOIN stages s ON s.id = i.stage_id
       LEFT JOIN item_options o ON o.item_id = i.id
           WHERE s.assessment_id = ? AND i.kind IN ('single','multi')
           ORDER BY s.idx, i.sort_order, o.sort_order`,
    args: [assessmentId],
  });

  const items = new Map();
  for (const r of rows) {
    if (!items.has(r.ref)) items.set(r.ref, { ref: r.ref, kind: r.kind, dim: r.dim, options: [] });
    if (r.option_id) {
      items.get(r.ref).options.push({
        id: r.option_id,
        isKey: !!r.is_key,
        isNeutral: !!r.is_neutral,
        index: Number(r.sort_order),
      });
    }
  }
  return [...items.values()];
}

// ---- Sessions --------------------------------------------------

async function getSession(id) {
  const { rows } = await client.execute({
    sql: "SELECT data FROM sessions WHERE id = ?",
    args: [id],
  });
  return rows[0] ? parse(rows[0].data, null) : null;
}

async function setSession(id, data) {
  await client.execute({
    sql: `INSERT INTO sessions (id, data, updated_at) VALUES (?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`,
    args: [id, JSON.stringify(data), Date.now()],
  });
}

async function deleteSession(id) {
  await client.execute({ sql: "DELETE FROM sessions WHERE id = ?", args: [id] });
}

// ---- Attempts --------------------------------------------------

async function saveAttempt(attempt, responses, dimensions) {
  const stmts = [
    {
      sql: `INSERT INTO attempts
              (id, participant_key, participant_name, participant_email, assessment_id,
               phase, status, started_at, completed_at, stage_times, completeness)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              participant_name = excluded.participant_name,
              participant_email = excluded.participant_email,
              status = excluded.status,
              completed_at = excluded.completed_at,
              stage_times = excluded.stage_times,
              completeness = excluded.completeness`,
      args: [
        attempt.id, attempt.participantKey, attempt.participantName,
        attempt.participantEmail || "", attempt.assessmentId, attempt.phase,
        attempt.status || "submitted", attempt.startedAt, attempt.completedAt ?? null,
        JSON.stringify(attempt.stageTimes || {}),
        JSON.stringify(attempt.completeness || {}),
      ],
    },
    { sql: `DELETE FROM responses WHERE attempt_id = ?`, args: [attempt.id] },
    { sql: `DELETE FROM attempt_dimensions WHERE attempt_id = ?`, args: [attempt.id] },
    ...responses.map((r) => ({
      sql: `INSERT INTO responses
              (attempt_id, item_ref, value, confidence, blocked, justification, auto_score, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        attempt.id, r.itemRef,
        typeof r.value === "string" ? r.value : JSON.stringify(r.value ?? ""),
        r.confidence || "", r.blocked ? 1 : 0, r.justification || "",
        r.autoScore ?? null, attempt.completedAt || Date.now(),
      ],
    })),
    ...dimensions.map((d) => ({
      sql: `INSERT INTO attempt_dimensions (attempt_id, dimension, raw, n, pct) VALUES (?, ?, ?, ?, ?)`,
      args: [attempt.id, d.dimension, d.raw, d.n, d.pct],
    })),
  ];
  await client.batch(stmts, "write");
}

function rowToAttempt(r) {
  return {
    id: r.id,
    participantKey: r.participant_key,
    participantName: r.participant_name,
    participantEmail: r.participant_email,
    assessmentId: r.assessment_id,
    phase: r.phase,
    status: r.status,
    startedAt: Number(r.started_at),
    completedAt: r.completed_at == null ? null : Number(r.completed_at),
    stageTimes: parse(r.stage_times, {}),
    completeness: parse(r.completeness, {}),
  };
}

async function getAttempts({ phase } = {}) {
  const { rows } = await client.execute({
    sql: `SELECT * FROM attempts ${phase ? "WHERE phase = ?" : ""} ORDER BY completed_at DESC, started_at DESC`,
    args: phase ? [phase] : [],
  });
  const attempts = rows.map(rowToAttempt);
  if (attempts.length === 0) return attempts;

  const { rows: dRows } = await client.execute(
    `SELECT * FROM attempt_dimensions ORDER BY dimension`
  );
  const byAttempt = new Map();
  for (const d of dRows) {
    if (!byAttempt.has(d.attempt_id)) byAttempt.set(d.attempt_id, []);
    byAttempt.get(d.attempt_id).push({
      dimension: d.dimension, raw: Number(d.raw), n: Number(d.n), pct: Number(d.pct),
    });
  }
  for (const a of attempts) a.dimensions = byAttempt.get(a.id) || [];
  return attempts;
}

/** One attempt with every response, for the reviewer view and export. */
async function getAttemptDetail(id) {
  const { rows } = await client.execute({ sql: `SELECT * FROM attempts WHERE id = ?`, args: [id] });
  if (!rows[0]) return null;
  const attempt = rowToAttempt(rows[0]);

  const [{ rows: rRows }, { rows: dRows }] = await Promise.all([
    client.execute({ sql: `SELECT * FROM responses WHERE attempt_id = ?`, args: [id] }),
    client.execute({ sql: `SELECT * FROM attempt_dimensions WHERE attempt_id = ? ORDER BY dimension`, args: [id] }),
  ]);

  attempt.responses = rRows.map((r) => ({
    itemRef: r.item_ref,
    value: parse(r.value, r.value),
    confidence: r.confidence,
    blocked: !!r.blocked,
    justification: r.justification,
    autoScore: r.auto_score == null ? null : Number(r.auto_score),
  }));
  attempt.dimensions = dRows.map((d) => ({
    dimension: d.dimension, raw: Number(d.raw), n: Number(d.n), pct: Number(d.pct),
  }));
  return attempt;
}

async function getLatestAttempt(name, phase) {
  const { rows } = await client.execute({
    sql: `SELECT * FROM attempts WHERE participant_key = ? AND phase = ?
           ORDER BY completed_at DESC, started_at DESC LIMIT 1`,
    args: [participantKey(name), phase],
  });
  return rows[0] ? rowToAttempt(rows[0]) : null;
}

/**
 * Pre → post movement per participant, per dimension. Latest attempt of each
 * phase wins. No composite score is computed — by design, there is nothing
 * to rank.
 */
async function getProgress() {
  const all = await getAttempts();
  const byKey = new Map();
  for (const a of all) {
    if (!byKey.has(a.participantKey)) byKey.set(a.participantKey, { pre: null, post: null });
    const slot = byKey.get(a.participantKey);
    if (!slot[a.phase]) slot[a.phase] = a; // newest-first, so first seen is latest
  }

  return [...byKey.values()].map(({ pre, post }) => {
    const ref = post || pre;
    let delta = null;
    if (pre && post) {
      const dims = new Set([
        ...(pre.dimensions || []).map((d) => d.dimension),
        ...(post.dimensions || []).map((d) => d.dimension),
      ]);
      delta = [...dims].sort().map((dim) => {
        const p = (pre.dimensions || []).find((d) => d.dimension === dim);
        const q = (post.dimensions || []).find((d) => d.dimension === dim);
        return {
          dimension: dim,
          prePct: p ? p.pct : null,
          postPct: q ? q.pct : null,
          change: p && q ? q.pct - p.pct : null,
        };
      });
    }
    return {
      participantName: ref.participantName,
      participantEmail: ref.participantEmail,
      pre, post, delta,
    };
  });
}

// ---- Admin accounts --------------------------------------------

async function getAdminByUsername(username) {
  const { rows } = await client.execute({
    sql: `SELECT * FROM admins WHERE username = ? AND is_active = 1`,
    args: [String(username || "").trim().toLowerCase()],
  });
  if (!rows[0]) return null;
  const a = rows[0];
  return {
    id: a.id,
    username: a.username,
    passwordHash: a.password_hash,
    displayName: a.display_name,
    createdAt: Number(a.created_at),
    lastLoginAt: a.last_login_at == null ? null : Number(a.last_login_at),
  };
}

async function countAdmins() {
  const { rows } = await client.execute(`SELECT COUNT(*) AS n FROM admins WHERE is_active = 1`);
  return Number(rows[0].n);
}

async function listAdmins() {
  const { rows } = await client.execute(
    `SELECT id, username, display_name, created_at, last_login_at
       FROM admins WHERE is_active = 1 ORDER BY username`
  );
  return rows.map((a) => ({
    id: a.id,
    username: a.username,
    displayName: a.display_name,
    createdAt: Number(a.created_at),
    lastLoginAt: a.last_login_at == null ? null : Number(a.last_login_at),
  }));
}

/** Inserts, or resets the password of an existing admin with the same name. */
async function upsertAdmin({ username, passwordHash, displayName = "" }) {
  const name = String(username).trim().toLowerCase();
  await client.execute({
    sql: `INSERT INTO admins (id, username, password_hash, display_name, is_active, created_at)
          VALUES (?, ?, ?, ?, 1, ?)
          ON CONFLICT(username) DO UPDATE SET
            password_hash = excluded.password_hash,
            display_name  = excluded.display_name,
            is_active     = 1`,
    args: [`adm-${name.replace(/[^a-z0-9]+/g, "-")}`, name, passwordHash, displayName, Date.now()],
  });
  return getAdminByUsername(name);
}

async function touchAdminLogin(id) {
  await client.execute({
    sql: `UPDATE admins SET last_login_at = ? WHERE id = ?`,
    args: [Date.now(), id],
  });
}

// ---- Settings --------------------------------------------------

async function getSetting(key) {
  const { rows } = await client.execute({
    sql: `SELECT value FROM settings WHERE key = ?`, args: [key],
  });
  return rows[0] ? rows[0].value : null;
}

async function setSetting(key, value) {
  await client.execute({
    sql: `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)
          ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    args: [key, value, Date.now()],
  });
}

// ---- Admin / analytics reads -----------------------------------

/** Every stored session blob, newest first — these are the in-progress sittings. */
async function listSessions() {
  const { rows } = await client.execute(
    `SELECT id, data, updated_at FROM sessions ORDER BY updated_at DESC`
  );
  return rows.map((r) => ({
    id: r.id,
    updatedAt: Number(r.updated_at),
    data: parse(r.data, {}),
  }));
}

/** Every response for one phase, grouped by attempt id. */
async function getResponsesByPhase(phase) {
  const { rows } = await client.execute({
    sql: `SELECT r.* FROM responses r
            JOIN attempts a ON a.id = r.attempt_id
           WHERE a.phase = ?`,
    args: [phase],
  });
  const byAttempt = new Map();
  for (const r of rows) {
    if (!byAttempt.has(r.attempt_id)) byAttempt.set(r.attempt_id, []);
    byAttempt.get(r.attempt_id).push({
      itemRef: r.item_ref,
      value: parse(r.value, r.value),
      confidence: r.confidence,
      blocked: !!r.blocked,
      justification: r.justification,
      autoScore: r.auto_score == null ? null : Number(r.auto_score),
    });
  }
  return byAttempt;
}

/** Delete one stored session blob by its id. */
async function deleteSessionById(id) {
  await client.execute({ sql: `DELETE FROM sessions WHERE id = ?`, args: [id] });
}

module.exports = {
  client, initDB, withRetry, participantKey,
  getAdminByUsername, countAdmins, listAdmins, upsertAdmin, touchAdminLogin,
  getSetting, setSetting,
  listSessions, getResponsesByPhase, deleteSessionById,
  listAssessments, getAssessment, getAnswerKey,
  getSession, setSession, deleteSession,
  saveAttempt, getAttempts, getAttemptDetail, getLatestAttempt, getProgress,
};
