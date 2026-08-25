// =====================================================================
// COHORT ANALYTICS
//
// Everything the admin dashboard shows is derived here, from three inputs:
// the assessment tree, the submitted attempts, and the in-progress session
// blobs. Nothing is precomputed or cached — the cohort is small and the
// numbers must never be stale.
//
// The instrument's own rule still holds: NO COMPOSITE SCORE. Dimensions are
// reported side by side and never summed into a single ranking number.
// =====================================================================

const median = (nums) => {
  if (!nums.length) return null;
  const s = [...nums].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
};

const mean = (nums) =>
  nums.length ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) : null;

const isFilled = (v) =>
  typeof v === "string" ? v.trim() !== "" : Array.isArray(v) ? v.length > 0 : v !== undefined && v !== null && v !== "";

/**
 * Flat list of every item, plus two ref lists:
 *
 *   answerable  every field a participant could fill, optional ones included
 *   required    only the fields they MUST fill
 *
 * PROGRESS is measured against `answerable`, and STATUS against `required`.
 * They deliberately disagree: someone who answers every required question but
 * skips the optional self-map note reads 98% / complete, and that gap is the
 * point — it shows at a glance who volunteered the optional detail. The
 * optional answers are often the most useful input to pairing, so they are
 * counted rather than hidden.
 *
 * Not required: an item flagged config.optional, and the hands-on "what
 * stopped you" note, which only matters when the identifiers are missing.
 */
function flattenItems(assessment) {
  const items = [];
  const answerable = [];
  const required = [];

  for (const stage of assessment.stages || []) {
    for (const item of stage.items || []) {
      items.push({ ...item, stageKey: stage.key, stageName: stage.name, stageKind: stage.kind });

      const optional = !!(item.config && item.config.optional);
      const isBlockerNote = stage.kind === "handson" && item.kind === "text" && /blocked/i.test(item.ref);

      const subs = (item.config && item.config.subs) || [];
      if (subs.length) {
        for (const s of subs) {
          answerable.push(`${item.ref}_${s[0]}`);
          if (!optional) required.push(`${item.ref}_${s[0]}`);
        }
      } else {
        answerable.push(item.ref);
        if (!optional && !isBlockerNote) required.push(item.ref);
      }
    }
  }
  return { items, answerable, required };
}

/**
 * One row per person, whether they submitted or are still part-way through.
 * In-progress sittings come from the session blobs, which carry the name the
 * participant typed on the identity screen.
 */
function buildParticipants(assessment, attempts, responsesByAttempt, sessions) {
  const { items, answerable, required } = flattenItems(assessment);
  const totalAnswerable = answerable.length;
  const itemByRef = new Map(items.map((i) => [i.ref, i]));

  const rows = [];
  const submittedKeys = new Set();

  for (const a of attempts) {
    submittedKeys.add(a.participantKey);
    const responses = responsesByAttempt.get(a.id) || [];
    const gaps = (a.completeness || []).filter((c) => !c.complete);
    const blocked = responses.filter((r) => r.blocked);
    const byRef = new Map(responses.map((r) => [r.itemRef, r]));
    const answered = answerable.filter((ref) => {
      const r = byRef.get(ref);
      return r && (isFilled(r.value) || r.blocked);
    }).length;

    // How much of the OPTIONAL detail they volunteered, reported separately.
    const optionalRefs = answerable.filter((ref) => !required.includes(ref));
    const optionalAnswered = optionalRefs.filter((ref) => {
      const r = byRef.get(ref);
      return r && (isFilled(r.value) || r.blocked);
    }).length;

    rows.push({
      id: a.id,
      name: a.participantName,
      key: a.participantKey,
      email: a.participantEmail || "",
      phase: a.phase,
      state: gaps.length === 0 ? "complete" : "partial",
      startedAt: a.startedAt,
      completedAt: a.completedAt,
      durationMin: a.completedAt && a.startedAt
        ? Math.max(1, Math.round((a.completedAt - a.startedAt) / 60000))
        : null,
      answered,
      totalAnswerable,
      progressPct: totalAnswerable ? Math.round((answered / totalAnswerable) * 100) : 0,
      optionalAnswered,
      optionalTotal: optionalRefs.length,
      gaps: gaps.map((g) => `${g.label}: ${g.detail}`),
      gapCount: gaps.length,
      blockedCount: blocked.length,
      blockedItems: blocked.map((b) => ({
        ref: b.itemRef,
        stem: (itemByRef.get(b.itemRef) || {}).stem || b.itemRef,
      })),
      dimensions: a.dimensions || [],
      selfMapMean: selfMapMean(responses),
      usedAI: pick(responses, "C7"),
      llmDemand: pick(responses, "C3"),
      background: pick(responses, "C2"),
      prepHours: pick(responses, "C5"),
    });
  }

  // In-progress: a session blob with a name, for someone with no submission yet.
  for (const s of sessions) {
    const d = s.data || {};
    const name = (d.name || "").trim();
    if (!name || d.phase !== assessment.phase) continue;
    const key = name.toLowerCase().replace(/\s+/g, " ");
    if (submittedKeys.has(key)) continue;

    const answers = d.answers || {};
    const answered = answerable.filter((ref) => {
      const a = answers[ref];
      return a && (isFilled(a.value) || a.blocked);
    }).length;

    rows.push({
      id: `session:${s.id}`,
      sessionId: s.id,
      name,
      key,
      email: (d.email || "").trim(),
      phase: assessment.phase,
      state: "in_progress",
      startedAt: d.startedAt || s.updatedAt,
      completedAt: null,
      lastSeenAt: s.updatedAt,
      durationMin: null,
      answered,
      totalAnswerable,
      progressPct: totalAnswerable ? Math.round((answered / totalAnswerable) * 100) : 0,
      optionalAnswered: 0,
      optionalTotal: 0,
      gaps: [],
      gapCount: 0,
      blockedCount: Object.values(answers).filter((a) => a && a.blocked).length,
      blockedItems: [],
      dimensions: [],
      selfMapMean: null,
      usedAI: "", llmDemand: "", background: "", prepHours: "",
    });
  }

  rows.sort((a, b) => {
    const order = { complete: 0, partial: 1, in_progress: 2 };
    if (order[a.state] !== order[b.state]) return order[a.state] - order[b.state];
    return (b.completedAt || b.lastSeenAt || 0) - (a.completedAt || a.lastSeenAt || 0);
  });
  return rows;
}

/** Mean self-map band (0–4) expressed as a percentage, for the calibration read. */
function selfMapMean(responses) {
  const bands = responses
    .filter((r) => /^sm\d+$/.test(r.itemRef))
    .map((r) => Number(r.value))
    .filter((n) => Number.isFinite(n));
  if (!bands.length) return null;
  return Math.round((bands.reduce((a, b) => a + b, 0) / bands.length / 4) * 100);
}

function pick(responses, ref) {
  const r = responses.find((x) => x.itemRef === ref);
  return r && typeof r.value === "string" ? r.value : "";
}

function tally(rows, field) {
  const out = new Map();
  for (const r of rows) {
    const v = (r[field] || "").trim();
    if (!v) continue;
    out.set(v, (out.get(v) || 0) + 1);
  }
  return [...out.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

/** The headline cards. */
function buildStats(assessment, participants) {
  const submitted = participants.filter((p) => p.state !== "in_progress");
  const complete = participants.filter((p) => p.state === "complete");
  const partial = participants.filter((p) => p.state === "partial");
  const inProgress = participants.filter((p) => p.state === "in_progress");

  // Cohort mean per dimension, across submitted attempts only.
  const dims = new Map();
  for (const p of submitted) {
    for (const d of p.dimensions) {
      if (!dims.has(d.dimension)) dims.set(d.dimension, []);
      dims.get(d.dimension).push(d.pct);
    }
  }
  const dimensionMeans = [...dims.entries()]
    .map(([dimension, vals]) => ({
      dimension,
      mean: mean(vals),
      min: Math.min(...vals),
      max: Math.max(...vals),
      n: vals.length,
    }))
    .sort((a, b) => a.dimension.localeCompare(b.dimension));

  // Calibration: self-rating minus measured. Positive = rates self above result.
  const calibration = submitted
    .filter((p) => p.selfMapMean !== null && p.dimensions.length)
    .map((p) => ({
      name: p.name,
      delta: p.selfMapMean - Math.round(
        p.dimensions.reduce((a, d) => a + d.pct, 0) / p.dimensions.length
      ),
    }))
    .sort((a, b) => b.delta - a.delta);

  const durations = submitted.map((p) => p.durationMin).filter((n) => n);
  const blockers = participants.filter((p) => p.blockedCount > 0);

  return {
    participants: participants.length,
    submitted: submitted.length,
    complete: complete.length,
    partial: partial.length,
    inProgress: inProgress.length,
    completionRate: participants.length
      ? Math.round((complete.length / participants.length) * 100)
      : 0,
    medianMinutes: median(durations),
    meanMinutes: mean(durations),
    dimensionMeans,
    calibration,
    calibrationMean: calibration.length
      ? Math.round(calibration.reduce((a, c) => a + c.delta, 0) / calibration.length)
      : null,
    blockedPeople: blockers.length,
    blockedTotal: participants.reduce((a, p) => a + p.blockedCount, 0),
    aiAssistance: tally(submitted, "usedAI"),
    llmDemand: tally(submitted, "llmDemand"),
    background: tally(submitted, "background"),
    prepHours: tally(submitted, "prepHours"),
    lastActivity: participants.reduce(
      (max, p) => Math.max(max, p.completedAt || p.lastSeenAt || 0), 0
    ) || null,
  };
}

/**
 * Pre → post comparison, per dimension and per person.
 * Returns null until both phases have submitted attempts.
 */
function buildComparison(preRows, postRows) {
  const preByKey = new Map(preRows.filter((p) => p.state !== "in_progress").map((p) => [p.key, p]));
  const postByKey = new Map(postRows.filter((p) => p.state !== "in_progress").map((p) => [p.key, p]));
  const paired = [...postByKey.keys()].filter((k) => preByKey.has(k));

  if (!paired.length) {
    return {
      available: false,
      preCount: preByKey.size,
      postCount: postByKey.size,
      pairedCount: 0,
    };
  }

  const dims = new Set();
  for (const k of paired) {
    preByKey.get(k).dimensions.forEach((d) => dims.add(d.dimension));
    postByKey.get(k).dimensions.forEach((d) => dims.add(d.dimension));
  }

  const byDimension = [...dims].sort().map((dimension) => {
    const pre = [], post = [];
    for (const k of paired) {
      const a = preByKey.get(k).dimensions.find((d) => d.dimension === dimension);
      const b = postByKey.get(k).dimensions.find((d) => d.dimension === dimension);
      if (a) pre.push(a.pct);
      if (b) post.push(b.pct);
    }
    const preMean = mean(pre), postMean = mean(post);
    return {
      dimension, preMean, postMean,
      change: preMean !== null && postMean !== null ? postMean - preMean : null,
      n: paired.length,
    };
  });

  const people = paired.map((k) => {
    const a = preByKey.get(k), b = postByKey.get(k);
    const avg = (p) => p.dimensions.length
      ? Math.round(p.dimensions.reduce((s, d) => s + d.pct, 0) / p.dimensions.length)
      : null;
    const preAvg = avg(a), postAvg = avg(b);
    return {
      name: b.name,
      preAvg, postAvg,
      change: preAvg !== null && postAvg !== null ? postAvg - preAvg : null,
      dimensions: byDimension.map((d) => {
        const x = a.dimensions.find((y) => y.dimension === d.dimension);
        const y = b.dimensions.find((z) => z.dimension === d.dimension);
        return {
          dimension: d.dimension,
          pre: x ? x.pct : null,
          post: y ? y.pct : null,
          change: x && y ? y.pct - x.pct : null,
        };
      }),
    };
  }).sort((a, b) => (b.change ?? -999) - (a.change ?? -999));

  return {
    available: true,
    preCount: preByKey.size,
    postCount: postByKey.size,
    pairedCount: paired.length,
    onlyPre: [...preByKey.keys()].filter((k) => !postByKey.has(k)).map((k) => preByKey.get(k).name),
    byDimension,
    people,
  };
}

module.exports = { buildParticipants, buildStats, buildComparison, flattenItems, median, mean };
