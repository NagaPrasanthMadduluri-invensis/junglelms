const { createClient } = require("@libsql/client");
const path = require("path");

// Local dev  → file:./junglelms.db  (no TURSO_DATABASE_URL needed)
// Production → libsql://your-db.turso.io  (set TURSO_DATABASE_URL + TURSO_AUTH_TOKEN)
const client = createClient({
  url: process.env.TURSO_DATABASE_URL || `file:${path.join(__dirname, "..", "junglelms.db")}`,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function initDB() {
  await client.batch([
    {
      sql: `CREATE TABLE IF NOT EXISTS sessions (
        id          TEXT    PRIMARY KEY,
        data        TEXT    NOT NULL,
        updated_at  INTEGER NOT NULL
      )`,
    },
    {
      sql: `CREATE TABLE IF NOT EXISTS results (
        id               TEXT    PRIMARY KEY,
        participant_name TEXT    NOT NULL,
        participant_role TEXT    NOT NULL DEFAULT '',
        track            TEXT    NOT NULL,
        track_result     TEXT    NOT NULL,
        self_rating      INTEGER,
        k_score          INTEGER NOT NULL DEFAULT 0,
        k_max            INTEGER NOT NULL DEFAULT 0,
        j_score          INTEGER NOT NULL DEFAULT 0,
        j_max            INTEGER NOT NULL DEFAULT 0,
        k_pct            INTEGER NOT NULL DEFAULT 0,
        j_pct            INTEGER NOT NULL DEFAULT 0,
        completed_at     INTEGER NOT NULL,
        raw_data         TEXT    NOT NULL
      )`,
    },
  ], "deferred");
}

// ---- Sessions --------------------------------------------------

async function getSession(id) {
  const { rows } = await client.execute({
    sql: "SELECT data FROM sessions WHERE id = ?",
    args: [id],
  });
  return rows[0] ? JSON.parse(rows[0].data) : null;
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

// ---- Results ---------------------------------------------------

async function getResults() {
  const { rows } = await client.execute(
    "SELECT raw_data FROM results ORDER BY completed_at DESC"
  );
  return rows.map((r) => JSON.parse(r.raw_data));
}

async function saveResult(result) {
  await client.execute({
    sql: `INSERT OR REPLACE INTO results
      (id, participant_name, participant_role, track, track_result, self_rating,
       k_score, k_max, j_score, j_max, k_pct, j_pct, completed_at, raw_data)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      result.id,
      result.participantName,
      result.participantRole || "",
      result.track,
      result.trackResult,
      result.selfRating ?? null,
      result.kScore ?? 0,
      result.kMax ?? 0,
      result.jScore ?? 0,
      result.jMax ?? 0,
      result.kPct ?? 0,
      result.jPct ?? 0,
      result.completedAt,
      JSON.stringify(result),
    ],
  });
}

module.exports = { initDB, getSession, setSession, deleteSession, getResults, saveResult };
