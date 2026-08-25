#!/usr/bin/env node
// =====================================================================
// Drops every table and rebuilds the schema from scratch.
//
//   npm run db:reset              wipe everything, then re-seed
//   npm run db:reset -- --keep-questions   wipe attempts/sessions only
//
// Destructive. Requires confirmation unless --yes is passed.
// =====================================================================

require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const readline = require("readline");
const db = require("./db");

// Order matters: children before parents.
const CONTENT_TABLES = ["item_rubrics", "item_options", "items", "stages", "assessments"];
const RESULT_TABLES = ["responses", "attempt_dimensions", "attempts", "sessions"];
// Tables from earlier versions of this schema, dropped on a full reset.
const LEGACY_TABLES = ["answers", "options", "questions", "results"];
const ALL_TABLES = [...RESULT_TABLES, ...CONTENT_TABLES, ...LEGACY_TABLES];

function confirm(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (a) => { rl.close(); resolve(a.trim().toLowerCase()); });
  });
}

async function main() {
  const args = process.argv.slice(2);
  const keepQuestions = args.includes("--keep-questions");
  const skipPrompt = args.includes("--yes") || args.includes("-y");
  const tables = keepQuestions ? RESULT_TABLES : ALL_TABLES;

  const target = process.env.TURSO_DATABASE_URL || "local file (junglelms.db)";
  console.log(`\n  Database: ${target}`);
  console.log(`  Will DROP: ${tables.join(", ")}\n`);

  if (!skipPrompt) {
    const answer = await confirm("  Type 'yes' to continue: ");
    if (answer !== "yes") {
      console.log("  aborted\n");
      process.exit(0);
    }
  }

  await db.client.batch(tables.map((t) => ({ sql: `DROP TABLE IF EXISTS ${t}` })), "write");
  await db.initDB();

  console.log(`\n  ✓ dropped ${tables.length} table(s), schema rebuilt`);
  console.log(keepQuestions
    ? "  ✓ assessment content preserved\n"
    : "  → run `npm run db:seed` to load the assessment content\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
