const express = require("express");
const db = require("./db");
const auth = require("./auth");
const { buildParticipants, buildStats, buildComparison, flattenItems } = require("./analytics");

const router = express.Router();

// A deliberate delay on a failed login, to make guessing expensive.
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// =====================================================================
// SESSION
// =====================================================================

/** Public: does an admin account exist? Lets the login modal say the right thing. */
router.get("/status", async (_req, res, next) => {
  try {
    res.json({ configured: await auth.isConfigured() });
  } catch (e) { next(e); }
});

router.post("/login", async (req, res, next) => {
  try {
    if (!(await auth.isConfigured())) {
      return res.status(503).json({
        error: "no admin account exists yet — run `npm run admin:create`",
        code: "not_configured",
      });
    }

    const { username, password } = req.body || {};
    const admin = await db.getAdminByUsername(username);

    // Hash even when the user does not exist, so a missing username and a
    // wrong password cost the same time and cannot be told apart.
    const hash = admin ? admin.passwordHash : auth.hashPassword("no-such-user");
    const okPass = auth.verifyPassword(String(password || ""), hash);

    if (!admin || !okPass) {
      await sleep(400);
      return res.status(401).json({ error: "incorrect username or password" });
    }

    const token = auth.signToken(
      { sub: admin.username, name: admin.displayName, exp: Date.now() + auth.SESSION_HOURS * 3600 * 1000 },
      await auth.sessionSecret()
    );
    auth.setSessionCookie(res, token);
    await db.touchAdminLogin(admin.id);
    res.json({ ok: true, username: admin.username, displayName: admin.displayName });
  } catch (e) { next(e); }
});

router.post("/logout", (_req, res) => {
  auth.clearSessionCookie(res);
  res.json({ ok: true });
});

router.get("/me", async (req, res, next) => {
  try {
    if (!(await auth.isConfigured())) {
      return res.status(503).json({ error: "no admin account exists yet", code: "not_configured" });
    }
    const token = auth.parseCookies(req)[auth.COOKIE_NAME];
    const session = auth.verifyToken(token, await auth.sessionSecret());
    if (!session) return res.status(401).json({ error: "not signed in", code: "unauthenticated" });
    res.json({ ok: true, username: session.sub, displayName: session.name || "", expiresAt: session.exp });
  } catch (e) { next(e); }
});

// Everything below requires a valid session.
router.use(auth.adminOnly);

// =====================================================================
// OVERVIEW
// =====================================================================

async function loadPhase(phase) {
  const assessment = await db.getAssessment(phase);
  if (!assessment) return null;
  const [attempts, responsesByAttempt, sessions] = await Promise.all([
    db.getAttempts({ phase }),
    db.getResponsesByPhase(phase),
    db.listSessions(),
  ]);
  const participants = buildParticipants(assessment, attempts, responsesByAttempt, sessions);
  return { assessment, participants };
}

router.get("/overview", async (req, res, next) => {
  try {
    const phase = req.query.phase === "post" ? "post" : "pre";
    const loaded = await loadPhase(phase);
    if (!loaded) return res.status(404).json({ error: "assessment not found" });

    const { assessment, participants } = loaded;
    const other = await loadPhase(phase === "pre" ? "post" : "pre");

    const phases = await db.listAssessments();

    res.json({
      phase,
      assessment: {
        id: assessment.id,
        phase: assessment.phase,
        title: assessment.title,
        subtitle: assessment.subtitle,
        stageCount: assessment.stages.length,
        itemCount: flattenItems(assessment).answerable.length,
        seeded: assessment.stages.length > 0,
      },
      phases: phases.map((p) => ({
        phase: p.phase, title: p.title, seeded: p.stageCount > 0,
      })),
      stats: buildStats(assessment, participants),
      participants,
      comparison: other
        ? (phase === "pre"
            ? buildComparison(participants, other.participants)
            : buildComparison(other.participants, participants))
        : null,
    });
  } catch (e) { next(e); }
});

// =====================================================================
// ONE PARTICIPANT — every answer, marked against the key
// =====================================================================

router.get("/participants/:id(*)", async (req, res, next) => {
  try {
    const id = req.params.id;

    // An in-progress sitting lives in the session blob, not in attempts.
    if (id.startsWith("session:")) {
      const sessionId = id.slice("session:".length);
      const sessions = await db.listSessions();
      const s = sessions.find((x) => x.id === sessionId);
      if (!s) return res.status(404).json({ error: "session not found" });
      const assessment = await db.getAssessment(s.data.phase || "pre", { includeKey: true });
      return res.json({
        participant: {
          id, name: (s.data.name || "").trim(), email: (s.data.email || "").trim(),
          state: "in_progress", phase: s.data.phase || "pre",
          startedAt: s.data.startedAt, lastSeenAt: s.updatedAt,
        },
        assessment,
        answers: s.data.answers || {},
        dimensions: [],
        completeness: [],
      });
    }

    const attempt = await db.getAttemptDetail(id);
    if (!attempt) return res.status(404).json({ error: "attempt not found" });
    const assessment = await db.getAssessment(attempt.phase, { includeKey: true });

    // Reshape responses into the same { ref: {value, ...} } map the client uses.
    const answers = {};
    for (const r of attempt.responses) {
      answers[r.itemRef] = {
        value: r.value,
        confidence: r.confidence,
        blocked: r.blocked,
        justification: r.justification,
        autoScore: r.autoScore,
      };
    }

    res.json({
      participant: {
        id: attempt.id,
        name: attempt.participantName,
        email: attempt.participantEmail,
        state: (attempt.completeness || []).some((c) => !c.complete) ? "partial" : "complete",
        phase: attempt.phase,
        startedAt: attempt.startedAt,
        completedAt: attempt.completedAt,
        stageTimes: attempt.stageTimes,
      },
      assessment,
      answers,
      dimensions: attempt.dimensions,
      completeness: attempt.completeness,
    });
  } catch (e) { next(e); }
});

// =====================================================================
// EXPORT
// =====================================================================

// Answers can legitimately contain "=", "-", "+" and "@" (YAML, flags, shell).
// Spreadsheets treat a cell starting with those as a formula, so a leading
// apostrophe is added on export only — the stored answer is never altered.
const RISKY_FIRST_CHAR = /^[=+\-@\t\r]/;

const csvCell = (v) => {
  let s = String(v ?? "");
  if (RISKY_FIRST_CHAR.test(s)) s = "'" + s;
  return '"' + s.replace(/"/g, '""').replace(/\r?\n/g, " ⏎ ") + '"';
};

/** Cohort summary: one row per participant. */
router.get("/export/cohort.csv", async (req, res, next) => {
  try {
    const phase = req.query.phase === "post" ? "post" : "pre";
    const loaded = await loadPhase(phase);
    if (!loaded) return res.status(404).json({ error: "assessment not found" });

    const { participants } = loaded;
    const dims = [...new Set(participants.flatMap((p) => p.dimensions.map((d) => d.dimension)))].sort();

    const header = [
      "name", "email", "status", "progress_pct", "started", "completed",
      "minutes", "gaps", "blocked_items", "self_rating_pct",
      ...dims.map((d) => `dim_${d}_pct`),
      "used_ai", "llm_demand", "background", "prep_hours",
    ];
    const rows = participants.map((p) => [
      p.name, p.email, p.state, p.progressPct,
      p.startedAt ? new Date(p.startedAt).toISOString() : "",
      p.completedAt ? new Date(p.completedAt).toISOString() : "",
      p.durationMin ?? "", p.gaps.join(" | "), p.blockedCount,
      p.selfMapMean ?? "",
      ...dims.map((d) => {
        const hit = p.dimensions.find((x) => x.dimension === d);
        return hit ? hit.pct : "";
      }),
      p.usedAI, p.llmDemand, p.background, p.prepHours,
    ]);

    const csv = [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\n");
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${phase}-assessment-cohort.csv"`);
    res.send(csv);
  } catch (e) { next(e); }
});

/** Every answer from every participant: one row per person per item. */
router.get("/export/responses.csv", async (req, res, next) => {
  try {
    const phase = req.query.phase === "post" ? "post" : "pre";
    const assessment = await db.getAssessment(phase, { includeKey: true });
    if (!assessment) return res.status(404).json({ error: "assessment not found" });

    const [attempts, responsesByAttempt] = await Promise.all([
      db.getAttempts({ phase }),
      db.getResponsesByPhase(phase),
    ]);

    const { items } = flattenItems(assessment);
    const byRef = new Map();
    for (const item of items) {
      byRef.set(item.ref, item);
      for (const sub of (item.config && item.config.subs) || []) {
        byRef.set(`${item.ref}_${sub[0]}`, { ...item, subLabel: sub[1] });
      }
    }
    const optionText = new Map();
    for (const item of items) for (const o of item.options || []) optionText.set(o.id, o.text);

    const header = ["participant", "email", "stage", "item", "prompt", "response", "confidence", "blocked", "justification", "auto_score"];
    const rows = [];
    for (const a of attempts) {
      for (const r of responsesByAttempt.get(a.id) || []) {
        const item = byRef.get(r.itemRef) || {};
        const value = Array.isArray(r.value)
          ? r.value.map((id) => optionText.get(id) || id).join(" | ")
          : r.value;
        rows.push([
          a.participantName, a.participantEmail, item.stageName || "", r.itemRef,
          item.subLabel || item.stem || "", value, r.confidence,
          r.blocked ? "BLOCKED" : "", r.justification, r.autoScore ?? "",
        ]);
      }
    }

    const csv = [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\n");
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${phase}-assessment-responses.csv"`);
    res.send(csv);
  } catch (e) { next(e); }
});

module.exports = router;
