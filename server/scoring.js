// =====================================================================
// SCORING  —  ported from the reference instrument, rule for rule.
//
// Two deliberate properties of this design, preserved here:
//
//   1. NO COMPOSITE SCORE. Nothing sums the dimensions into one number.
//      There is nothing to rank, which is a stronger guarantee than a
//      promise not to rank.
//
//   2. Only the discriminator stage is auto-scored. Forensics, the hands-on
//      task and the written items are graded by hand against the rubric —
//      the code records the responses and computes nothing for them.
//
// Item scoring:
//   single  1 if the chosen option is the key, else 0.
//   multi   (correct − incorrect) / number-of-keys, floored at 0.
//           Options flagged neutral are neither correct nor incorrect:
//           selecting one costs nothing and earns nothing.
//
// A dimension string may name more than one dimension ("D3/D4", "D3 / LLM").
// The item then counts once towards each, exactly as the reference does.
// =====================================================================

/** "D3 / LLM" → ["D3", "LLM"] */
function splitDims(dim) {
  return String(dim || "")
    .split("/")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Score one discriminator item. Returns a number in [0, 1]. */
function scoreItem(item, selectedIds) {
  const selected = Array.isArray(selectedIds) ? selectedIds : [];
  const keys = item.options.filter((o) => o.isKey);
  if (keys.length === 0) return 0;

  if (item.kind === "single") {
    return selected.length === 1 && keys.some((k) => k.id === selected[0]) ? 1 : 0;
  }

  const keyIds = new Set(keys.map((o) => o.id));
  const neutralIds = new Set(item.options.filter((o) => o.isNeutral).map((o) => o.id));
  const correct = selected.filter((id) => keyIds.has(id)).length;
  const incorrect = selected.filter((id) => !keyIds.has(id) && !neutralIds.has(id)).length;
  return Math.max(0, (correct - incorrect) / keys.length);
}

/**
 * Auto-score an attempt's discriminator responses.
 *
 * @param key        from db.getAnswerKey()
 * @param responses  { [itemRef]: optionId | optionId[] }
 * @returns { dimensions, itemScores }
 */
function scoreAttempt(key, responses) {
  const byDim = new Map();
  const itemScores = [];

  for (const item of key) {
    const raw = responses ? responses[item.ref] : undefined;
    const selected = raw === undefined || raw === null
      ? []
      : Array.isArray(raw) ? raw : [raw];

    // Unknown option ids are dropped rather than trusted.
    const valid = selected.filter((id) => item.options.some((o) => o.id === id));
    const score = scoreItem(item, valid);
    itemScores.push({ ref: item.ref, dim: item.dim, score, answered: valid.length > 0 });

    for (const dim of splitDims(item.dim)) {
      if (!byDim.has(dim)) byDim.set(dim, { dimension: dim, raw: 0, n: 0 });
      const d = byDim.get(dim);
      d.raw += score;
      d.n += 1;
    }
  }

  const dimensions = [...byDim.values()]
    .map((d) => ({
      ...d,
      raw: Math.round(d.raw * 100) / 100,
      pct: d.n > 0 ? Math.round((100 * d.raw) / d.n) : 0,
    }))
    .sort((a, b) => a.dimension.localeCompare(b.dimension));

  return { dimensions, itemScores };
}

// =====================================================================
// COMPLETENESS
//
// Mirrors the reference "Check and submit" screen. A blank is allowed —
// a blank is data too — so this reports gaps, it does not block a submit.
// =====================================================================

const isFilled = (v) => typeof v === "string" ? v.trim() !== "" : v !== undefined && v !== null && v !== "";

/**
 * @param assessment  full tree from db.getAssessment()
 * @param answers     { [itemRef]: value }, plus meta keys
 * @returns [{ label, detail, complete }]
 */
function checkCompleteness(assessment, answers = {}, meta = {}) {
  const rows = [];
  const push = (label, detail, complete) => rows.push({ label, detail, complete });

  push("Name", "so the right pre-work reaches you", isFilled(meta.participantName));

  for (const stage of assessment.stages) {
    const items = stage.items || [];
    if (items.length === 0) continue;

    if (stage.kind === "preflight") {
      // A row counts as done when confirmed OR explicitly marked blocked.
      const done = items.filter((i) => {
        const a = answers[i.ref];
        return isFilled(a && a.value) || (a && a.blocked);
      }).length;
      push(stage.name, `${done} of ${items.length} confirmed or marked blocked`, done === items.length);

    } else if (stage.kind === "selfmap") {
      const bands = items.filter((i) => i.kind === "band");
      const done = bands.filter((i) => isFilled(answers[i.ref] && answers[i.ref].value)).length;
      push(stage.name, `${done} of ${bands.length} placed`, done === bands.length);

    } else if (stage.kind === "discriminators") {
      const done = items.filter((i) => {
        const v = answers[i.ref] && answers[i.ref].value;
        return Array.isArray(v) ? v.length > 0 : isFilled(v);
      }).length;
      push(stage.name, `${done} of ${items.length} answered`, done === items.length);

    } else if (stage.kind === "forensics") {
      for (const item of items) {
        const subs = (item.config && item.config.subs) || [];
        const done = subs.filter((s) => isFilled(answers[`${item.ref}_${s[0]}`] && answers[`${item.ref}_${s[0]}`].value)).length;
        push(`Forensics ${item.ref}`, `${done} of ${subs.length} parts answered`, done === subs.length);
      }

    } else if (stage.kind === "handson") {
      const ids = items.filter((i) => i.kind === "identifier");
      const done = ids.filter((i) => isFilled(answers[i.ref] && answers[i.ref].value)).length;
      const blockedNote = items.find((i) => i.kind === "text" && /blocked/i.test(i.ref));
      const excused = blockedNote && isFilled(answers[blockedNote.ref] && answers[blockedNote.ref].value);
      push(stage.name, `${done} of ${ids.length} identifiers, or a reason recorded`,
        done === ids.length || !!excused);

    } else if (stage.kind === "written") {
      const done = items.filter((i) => isFilled(answers[i.ref] && answers[i.ref].value));
      push(stage.name, items.map((i) => i.ref).join(" and "), done.length === items.length);

    } else if (stage.kind === "context") {
      const done = items.filter((i) => isFilled(answers[i.ref] && answers[i.ref].value)).length;
      push(stage.name, `${done} of ${items.length} answered`, done === items.length);
    }
  }

  return rows;
}

module.exports = { splitDims, scoreItem, scoreAttempt, checkCompleteness };
