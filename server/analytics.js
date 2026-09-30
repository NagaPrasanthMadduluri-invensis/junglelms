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

      // Forensics sub-parts and evidence-desk parts each answer separately,
      // so they count as their own answerable units rather than one item.
      const subs = (item.config && item.config.subs) || [];
      const parts = (item.config && item.config.parts) || [];
      if (subs.length || parts.length) {
        const keys = subs.length ? subs.map((s) => s[0]) : parts.map((p) => p.key);
        for (const k of keys) {
          answerable.push(`${item.ref}_${k}`);
          if (!optional) required.push(`${item.ref}_${k}`);
        }
      } else {
        answerable.push(item.ref);
        if (!optional && !isBlockerNote) required.push(item.ref);
      }
    }
  }
  return { items, answerable, required };
}

// =====================================================================
// CONTEXT DISTRIBUTIONS
//
// The four cards under the participant table are fed by the not-scored
// stage at the end of each instrument. The two instruments ask different
// questions there — the pre asks what to prepare for, the post asks what
// happened since — so the cards are named per phase rather than assumed.
// =====================================================================

const DISTRIBUTIONS = {
  pre: [
    { ref: "C7", title: "AI assistant use", note: "Self-declared, not enforced. Read-calibration only." },
    { ref: "C3", title: "LLM work on their roadmap", note: "Decides whether Day 3 covers operating models or extends to LLM workloads." },
    { ref: "C2", title: "Background", note: "The last six months of work. Used for pairing on complementary axes." },
    { ref: "C5", title: "Pre-work hours they can protect", note: "Caps how much pre-work each person is sent." },
  ],
  post: [
    { ref: "R8", title: "AI assistant use", note: "Self-declared, not enforced. Participants were asked not to use one on the evidence desk, the forensics or the written stages." },
    { ref: "R1", title: "How far they took it", note: "The furthest each person has taken the material since the programme. The headline number for the client conversation." },
    { ref: "R4", title: "The revisit path", note: "Whether it reached people, and whether they used it." },
    { ref: "R5", title: "Keyboard time in the paired labs", note: "Cross-read with the “In the programme” column on the self-map." },
  ],
};

const distributionDefs = (phase) => DISTRIBUTIONS[phase] || [];

/**
 * One row per person, whether they submitted or are still part-way through.
 * In-progress sittings come from the session blobs, which carry the name the
 * participant typed on the identity screen.
 */
function buildParticipants(assessment, attempts, responsesByAttempt, sessions, rosterEmails = null) {
  const { items, answerable, required } = flattenItems(assessment);
  const phaseDefs = distributionDefs(assessment.phase);
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
      usedAI: pick(responses, phaseDefs[0] ? phaseDefs[0].ref : ""),
      context: Object.fromEntries(phaseDefs.map((d) => [d.ref, pick(responses, d.ref)])),
    });
  }

  // In-progress: a session blob for someone on the roster with no submission
  // yet. A registered email is required — listing anyone who merely typed a
  // name would put unregistered people on the dashboard.
  for (const s of sessions) {
    const d = s.data || {};
    const name = (d.name || "").trim();
    const email = (d.email || "").trim().toLowerCase();
    if (!name || !email || d.phase !== assessment.phase) continue;
    if (rosterEmails && !rosterEmails.has(email)) continue;
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
      usedAI: "", context: {},
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
  const phase = assessment.phase;
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
    distributions: distributionDefs(phase).map((d) => ({
      title: d.title,
      note: d.note,
      data: tally(submitted.map((p) => ({ v: (p.context || {})[d.ref] || "" })), "v"),
    })),
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
  // Pair on the signed-in email, not the typed name. Both sittings are behind
  // the same roster login, so the address is identical by construction, while
  // a name is whatever the person typed that day — "Aryan Gurjar Banke" one
  // week and "Aryan Banke" the next would silently fail to pair. The name key
  // is kept as a fallback for any attempt recorded without an address.
  const pairKey = (p) => (p.email || "").trim().toLowerCase() || p.key;
  const preByKey = new Map(preRows.filter((p) => p.state !== "in_progress").map((p) => [pairKey(p), p]));
  const postByKey = new Map(postRows.filter((p) => p.state !== "in_progress").map((p) => [pairKey(p), p]));
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
