require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const express = require("express");
const cors = require("cors");
const db = require("./db");
const { scoreAttempt, checkCompleteness } = require("./scoring");

const app = express();

app.use(cors());
app.use(express.json({ limit: "2mb" }));

// Ensure schema exists before any request is handled.
// Promise is created once per process/serverless instance.
const ready = db.initDB();
app.use((_req, _res, next) => ready.then(() => next()).catch(next));

// Silence Chrome DevTools auto-probe
app.get("/.well-known/appspecific/com.chrome.devtools.json", (_req, res) => res.status(204).end());

// ---- Health ----------------------------------------------------

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

// ---- Reviewer gate ---------------------------------------------

// Reviewer routes expose the answer key and every rubric. They are gated on
// REVIEWER_TOKEN; if that is unset the routes are refused outright rather
// than silently open, so a missing env var can't leak the key.
function reviewerOnly(req, res, next) {
  const expected = process.env.REVIEWER_TOKEN;
  if (!expected) {
    return res.status(503).json({ error: "reviewer routes disabled — set REVIEWER_TOKEN to enable" });
  }
  const given = req.get("x-reviewer-token") || req.query.token;
  if (given !== expected) return res.status(401).json({ error: "unauthorised" });
  next();
}

// ---- Assessment content ----------------------------------------

app.get("/api/assessments", async (_req, res, next) => {
  try {
    res.json({ assessments: await db.listAssessments() });
  } catch (e) { next(e); }
});

// Participant view: no is_key / is_neutral flags, no rubrics.
app.get("/api/assessment/:phase", async (req, res, next) => {
  try {
    const assessment = await db.getAssessment(req.params.phase);
    if (!assessment) return res.status(404).json({ error: "assessment not found" });
    if (assessment.stages.length === 0) {
      return res.status(409).json({ error: "assessment has no stages yet", phase: assessment.phase });
    }
    res.json({ assessment });
  } catch (e) { next(e); }
});

// Reviewer view: keys and rubrics included.
app.get("/api/reviewer/assessment/:phase", reviewerOnly, async (req, res, next) => {
  try {
    const assessment = await db.getAssessment(req.params.phase, { includeKey: true });
    if (!assessment) return res.status(404).json({ error: "assessment not found" });
    res.json({ assessment });
  } catch (e) { next(e); }
});

app.get("/api/reviewer/attempts/:id", reviewerOnly, async (req, res, next) => {
  try {
    const attempt = await db.getAttemptDetail(req.params.id);
    if (!attempt) return res.status(404).json({ error: "attempt not found" });
    res.json({ attempt });
  } catch (e) { next(e); }
});

// ---- Sessions --------------------------------------------------

app.get("/api/session/:id", async (req, res, next) => {
  try {
    res.json({ data: await db.getSession(req.params.id) });
  } catch (e) { next(e); }
});

app.put("/api/session/:id", async (req, res, next) => {
  try {
    if (!req.body || typeof req.body !== "object")
      return res.status(400).json({ error: "body must be a JSON object" });
    await db.setSession(req.params.id, req.body);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

app.delete("/api/session/:id", async (req, res, next) => {
  try {
    await db.deleteSession(req.params.id);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// ---- Attempts --------------------------------------------------

app.get("/api/attempts", async (req, res, next) => {
  try {
    res.json({ attempts: await db.getAttempts({ phase: req.query.phase }) });
  } catch (e) { next(e); }
});

app.get("/api/progress", async (_req, res, next) => {
  try {
    res.json({ progress: await db.getProgress() });
  } catch (e) { next(e); }
});

app.get("/api/participant/:name/status", async (req, res, next) => {
  try {
    const [pre, post] = await Promise.all([
      db.getLatestAttempt(req.params.name, "pre"),
      db.getLatestAttempt(req.params.name, "post"),
    ]);
    res.json({ pre, post });
  } catch (e) { next(e); }
});

/**
 * Submit a sitting.
 *
 * Body: {
 *   participantName, participantEmail?, phase, startedAt?, stageTimes?,
 *   answers: { [itemRef]: { value, confidence?, blocked?, justification? } }
 * }
 *
 * A blank is allowed — a blank is data too — so an incomplete submission is
 * accepted and the gaps are recorded alongside it.
 *
 * Only discriminator items are auto-scored, against the key held in the
 * database. Nothing computes a composite score.
 */
app.post("/api/attempts", async (req, res, next) => {
  try {
    const { participantName, participantEmail, phase, answers, stageTimes, startedAt } = req.body || {};

    if (!participantName || !String(participantName).trim())
      return res.status(400).json({ error: "participantName is required" });
    if (!["pre", "post"].includes(phase))
      return res.status(400).json({ error: 'phase must be "pre" or "post"' });
    if (!answers || typeof answers !== "object")
      return res.status(400).json({ error: "answers must be an object keyed by item ref" });

    const assessment = await db.getAssessment(phase);
    if (!assessment) return res.status(404).json({ error: "assessment not found" });
    if (assessment.stages.length === 0)
      return res.status(409).json({ error: "assessment has no stages yet" });

    // Auto-score the discriminators.
    const key = await db.getAnswerKey(assessment.id);
    const selections = {};
    for (const item of key) {
      const a = answers[item.ref];
      if (a && a.value !== undefined) selections[item.ref] = a.value;
    }
    const { dimensions, itemScores } = scoreAttempt(key, selections);
    const scoreByRef = new Map(itemScores.map((s) => [s.ref, s.score]));

    // Keep only answers that correspond to a real item, so a client cannot
    // write arbitrary rows. Forensics sub-parts key as "F1_a".
    const knownRefs = new Set();
    for (const stage of assessment.stages) {
      for (const item of stage.items) {
        knownRefs.add(item.ref);
        for (const sub of (item.config && item.config.subs) || []) {
          knownRefs.add(`${item.ref}_${sub[0]}`);
        }
      }
    }

    const responses = Object.entries(answers)
      .filter(([ref]) => knownRefs.has(ref))
      .map(([ref, a]) => ({
        itemRef: ref,
        value: a && typeof a === "object" && "value" in a ? a.value : a,
        confidence: (a && a.confidence) || "",
        blocked: !!(a && a.blocked),
        justification: (a && a.justification) || "",
        autoScore: scoreByRef.has(ref) ? scoreByRef.get(ref) : null,
      }));

    const completeness = checkCompleteness(assessment, answers, { participantName });

    const name = String(participantName).trim();
    const completedAt = Date.now();
    const attempt = {
      id: `${phase}-${db.participantKey(name).replace(/[^a-z0-9]+/g, "-") || "unnamed"}-${completedAt}`,
      participantKey: db.participantKey(name),
      participantName: name,
      participantEmail: (participantEmail || "").trim(),
      assessmentId: assessment.id,
      phase,
      status: "submitted",
      startedAt: Number.isFinite(startedAt) ? startedAt : completedAt,
      completedAt,
      stageTimes: stageTimes && typeof stageTimes === "object" ? stageTimes : {},
      completeness,
    };

    await db.saveAttempt(attempt, responses, dimensions);

    const priorPre = phase === "post" ? await db.getLatestAttempt(name, "pre") : null;

    // dimensions go back so a reviewer screen can render them; the
    // participant UI deliberately shows no score.
    res.status(201).json({
      ok: true,
      attempt: { ...attempt, dimensions },
      recorded: responses.length,
      priorPre,
    });
  } catch (e) { next(e); }
});

// ---- Errors ----------------------------------------------------

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "internal error" });
});

module.exports = app;
