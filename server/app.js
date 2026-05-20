require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const express = require("express");
const cors = require("cors");
const db = require("./db");

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

// Ensure schema exists before any request is handled.
// Promise is created once per process/serverless instance.
const ready = db.initDB();
app.use((_req, _res, next) => ready.then(next).catch(next));

// Silence Chrome DevTools auto-probe
app.get("/.well-known/appspecific/com.chrome.devtools.json", (_req, res) => res.status(204).end());

// ---- Health ----------------------------------------------------

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

// ---- Sessions --------------------------------------------------

app.get("/api/session/:id", async (req, res, next) => {
  try {
    const data = await db.getSession(req.params.id);
    res.json({ data });
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

// ---- Results ---------------------------------------------------

app.get("/api/results", async (_req, res, next) => {
  try {
    const results = await db.getResults();
    res.json({ results });
  } catch (e) { next(e); }
});

app.post("/api/results", async (req, res, next) => {
  try {
    const r = req.body;
    if (!r || !r.id || !r.participantName || !r.track)
      return res.status(400).json({ error: "missing required fields" });
    await db.saveResult(r);
    res.status(201).json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = app;
