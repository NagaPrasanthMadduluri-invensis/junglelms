#!/usr/bin/env node
// =====================================================================
// Creates an admin account, or resets the password of an existing one.
//
//   npm run admin:create
//   npm run admin:list
//
// The account is written straight to the database. Nothing goes in .env,
// and the plaintext password is never stored or echoed.
// =====================================================================

require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const readline = require("readline");
const { hashPassword } = require("./auth");
const db = require("./db");

function ask(question, { hidden = false } = {}) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  return new Promise((resolve) => {
    if (!hidden) {
      rl.question(question, (a) => { rl.close(); resolve(a); });
      return;
    }
    // Suppress echo while a password is being typed.
    const onData = (char) => {
      if (["\n", "\r", ""].includes(char.toString())) process.stdin.removeListener("data", onData);
      else process.stdout.write("\x1b[2K\x1b[200D" + question + "*".repeat(rl.line.length));
    };
    process.stdin.on("data", onData);
    rl.question(question, (a) => { rl.close(); process.stdout.write("\n"); resolve(a); });
  });
}

async function main() {
  await db.initDB();

  if (process.argv[2] === "--list") {
    const admins = await db.listAdmins();
    if (!admins.length) {
      console.log("\n  No admin accounts yet. Run `npm run admin:create`.\n");
      return;
    }
    console.log("\n  Admin accounts\n");
    for (const a of admins) {
      const last = a.lastLoginAt ? new Date(a.lastLoginAt).toLocaleString() : "never";
      console.log(`    ${a.username.padEnd(20)} last login: ${last}`);
    }
    console.log("");
    return;
  }

  const existing = await db.countAdmins();
  console.log(`\n  Admin account for the assessment dashboard`);
  console.log(`  ${existing} account(s) currently exist\n`);

  const username = (await ask("  Username: ")).trim().toLowerCase();
  if (!username) { console.error("\n  a username is required\n"); process.exit(1); }

  const already = await db.getAdminByUsername(username);
  if (already) console.log(`  \n  "${username}" already exists — this will reset their password.\n`);

  const password = await ask("  Password: ", { hidden: true });
  if (password.length < 10) {
    console.error("\n  use at least 10 characters — this login exposes every participant's answers\n");
    process.exit(1);
  }
  const again = await ask("  Confirm : ", { hidden: true });
  if (password !== again) { console.error("\n  passwords did not match\n"); process.exit(1); }

  const displayName = (await ask("  Display name (optional): ")).trim();

  await db.upsertAdmin({ username, passwordHash: hashPassword(password), displayName });

  console.log(`\n  ✓ ${already ? "password reset for" : "created"} "${username}"`);
  console.log("  Sign in from the button at the bottom of the assessment sidebar.\n");
}

main().catch((e) => { console.error(e); process.exit(1); });
