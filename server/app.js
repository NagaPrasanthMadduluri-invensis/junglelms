require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const express = require("express");
const cors = require("cors");
const db = require("./db");
const { scoreAttempt, checkCompleteness } = require("./scoring");
const adminRoutes = require("./admin-routes");
const { cleanAnswers } = require("./sanitize");
const auth = require("./auth");

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "2mb" }));

// Ensure the schema exists before any request is handled.
//
// Lazily memoised, and cleared on failure. A single transient Turso timeout
// used to reject this promise before anything attached a handler, which both
// crashed the process on the unhandled rejection AND meant every later request
// reused the poisoned promise. Now a failed attempt simply retries next time.
let ready = null;
function ensureReady() {
  if (!ready) {
    ready = db.initDB().catch((e) => { ready = null; throw e; });
  }
  return ready;
}
// Kick it off, with a handler attached so a rejection can never go unhandled.
ensureReady().catch((e) => console.error("initDB failed, will retry on demand:", e.message));

app.use((_req, _res, next) => ensureReady().then(() => next()).catch(next));

// Silence Chrome DevTools auto-probe
app.get("/.well-known/appspecific/com.chrome.devtools.json", (_req, res) => res.status(204).end());

// ---- Health ----------------------------------------------------

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

// ---- Admin ------------------------------------------------------

app.use("/api/admin", adminRoutes);

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

// ---- Roster ----------------------------------------------------

const NOT_REGISTERED =
  "This email is not registered for this assessment. Use the Bechtel address your invitation was sent to, or contact your Edstellar coordinator.";

// An admin address is on the roster but is NOT a participant: it exists to
// open the dashboard, not to sit the assessment. Say so plainly rather than
// claiming it is unregistered, which would be untrue and confusing.
const ADMIN_ACCOUNT =
  "This is an administrator account. Use “Log in as admin” at the bottom of the sidebar to open the dashboard.";

// =====================================================================
// PARTICIPANT AUTHENTICATION
//
// Email + password against the roster. Exactly one live session per account:
// signing in anywhere else ends the previous session immediately.
// =====================================================================

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

app.post("/api/auth/login", async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "Enter your email and password." });
    }

    const entry = await db.getRosterEntry(email);

    // Point an admin at the right door before checking a password they were
    // never issued here. Their role is already on the credentials sheet, so
    // this reveals nothing, and the alternative is a misleading
    // "incorrect password" for a correct password.
    if (entry && entry.role === "admin") {
      return res.status(403).json({ error: ADMIN_ACCOUNT, code: "admin_account" });
    }

    // Hash regardless, so a missing account and a wrong password take the
    // same time and cannot be told apart.
    const hash = entry && entry.passwordHash ? entry.passwordHash : auth.hashPassword("no-such-account");
    const passwordOk = auth.verifyPassword(String(password), hash);

    if (!entry || !entry.passwordHash || !passwordOk) {
      await sleep(400);
      return res.status(401).json({ error: "Incorrect email or password.", code: "bad_credentials" });
    }

    const sid = auth.newSessionId();
    const expiresAt = Date.now() + auth.PARTICIPANT_SESSION_HOURS * 3600 * 1000;
    // Replaces any existing session for this account.
    await db.startAuthSession({
      id: sid, subject: entry.email, kind: "participant",
      expiresAt, userAgent: req.get("user-agent") || "",
    });
    await db.touchRosterLogin(entry.email);

    auth.setParticipantCookie(res, auth.signToken({ sid, sub: entry.email, kind: "participant", exp: expiresAt }, await auth.sessionSecret()));
    res.json({ ok: true, email: entry.email, expiresAt });
  } catch (e) { next(e); }
});

app.post("/api/auth/logout", async (req, res, next) => {
  try {
    const token = auth.parseCookies(req)[auth.PARTICIPANT_COOKIE];
    const signed = auth.verifyToken(token, await auth.sessionSecret());
    if (signed && signed.sid) await db.endAuthSession(signed.sid);
    auth.clearParticipantCookie(res);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

app.get("/api/auth/me", auth.participantOnly, (req, res) => {
  res.json({ ok: true, email: req.participant.email });
});

/**
 * Is this email allowed to take the assessment?
 *
 * Answers only yes/no for the address supplied — it never returns the roster,
 * so the cohort list cannot be read out of this endpoint.
 */
app.post("/api/participant/verify", async (req, res, next) => {
  try {
    const email = (req.body || {}).email;
    if (!email || !String(email).trim()) {
      return res.status(400).json({ ok: false, error: "An email address is required." });
    }
    const entry = await db.getRosterEntry(email);
    if (!entry) return res.status(403).json({ ok: false, code: "not_registered", error: NOT_REGISTERED });
    if (entry.role === "admin") {
      return res.status(403).json({ ok: false, code: "admin_account", error: ADMIN_ACCOUNT });
    }
    res.json({ ok: true, email: entry.email, role: entry.role });
  } catch (e) { next(e); }
});

// ---- Sessions --------------------------------------------------

app.get("/api/session/:id", auth.participantOnly, async (req, res, next) => {
  try {
    res.json({ data: await db.getSession(req.params.id) });
  } catch (e) { next(e); }
});

app.put("/api/session/:id", auth.participantOnly, async (req, res, next) => {
  try {
    if (!req.body || typeof req.body !== "object")
      return res.status(400).json({ error: "body must be a JSON object" });

    // The email comes from the authenticated session, never from the body,
    // so a client cannot store progress against somebody else.
    await db.setSession(req.params.id, { ...req.body, email: req.participant.email });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

app.delete("/api/session/:id", auth.participantOnly, async (req, res, next) => {
  try {
    await db.deleteSession(req.params.id);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// ---- Attempts --------------------------------------------------
//
// The listing routes expose participant names, emails and dimension
// scores, and nothing in the participant UI calls them — so they sit
// behind the same reviewer token as /api/reviewer/*. Submitting stays
// open, because participants must be able to submit.

app.get("/api/attempts", reviewerOnly, async (req, res, next) => {
  try {
    res.json({ attempts: await db.getAttempts({ phase: req.query.phase }) });
  } catch (e) { next(e); }
});

app.get("/api/progress", reviewerOnly, async (_req, res, next) => {
  try {
    res.json({ progress: await db.getProgress() });
  } catch (e) { next(e); }
});

app.get("/api/participant/:name/status", reviewerOnly, async (req, res, next) => {
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
app.post("/api/attempts", auth.participantOnly, async (req, res, next) => {
  try {
    const { participantName, participantEmail, phase, answers: rawAnswers, stageTimes, startedAt } = req.body || {};

    // Blanks are not data. Whitespace-only, non-breaking spaces and
    // zero-width characters are stripped, and anything left empty is
    // dropped rather than stored as an answer.
    const answers = cleanAnswers(rawAnswers);

    if (!participantName || !String(participantName).trim())
      return res.status(400).json({ error: "participantName is required" });
    if (!["pre", "post"].includes(phase))
      return res.status(400).json({ error: 'phase must be "pre" or "post"' });

    // Identity comes from the session, not the request body — participantOnly
    // has already confirmed they are a registered participant.
    const rosterEntry = { email: req.participant.email };
    if (!rawAnswers || typeof rawAnswers !== "object")
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
      participantEmail: rosterEntry.email,
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
  // A malformed request body is the caller's fault, not a server fault.
  if (err && (err.type === "entity.parse.failed" || err.status === 400 || err.statusCode === 400)) {
    return res.status(400).json({ error: "The request body was not valid JSON." });
  }
  if (err && (err.type === "entity.too.large" || err.status === 413)) {
    return res.status(413).json({ error: "That submission is too large." });
  }
  console.error(err);
  const text = `${err && err.message} ${err && err.code}`;
  if (/timeout|ETIMEDOUT|ECONNRESET|EAI_AGAIN|fetch failed/i.test(text)) {
    return res.status(503).json({ error: "the database is unreachable — try again in a moment" });
  }
  res.status(500).json({ error: "internal error" });
});

module.exports = app;
