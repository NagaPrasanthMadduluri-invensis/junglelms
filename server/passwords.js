#!/usr/bin/env node
// =====================================================================
// Generate login passwords for the roster and write the credentials sheet.
//
//   npm run roster:passwords                    participants missing a password
//   npm run roster:passwords -- --all           regenerate for all participants
//   npm run roster:passwords -- --only <email>
//   npm run roster:passwords -- --include-admins  also reset admin dashboard
//                                                 passwords to new random ones
//
// Admins are SKIPPED by default. Their dashboard login lives in the `admins`
// table and is deliberately left alone, since it is managed separately.
//
// Only the scrypt hash is stored. The plaintext exists once, in the .xlsx
// this writes, and is never recoverable from the database afterwards — so if
// the sheet is lost, the password must be regenerated rather than looked up.
// =====================================================================

require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const fs = require("fs");
const path = require("path");
const db = require("./db");
const { hashPassword, generatePassword } = require("./auth");
const { buildWorkbook } = require("./xlsx");

const PASSWORD_LENGTH = 14;

async function main() {
  const args = process.argv.slice(2);
  const all = args.includes("--all");
  const includeAdmins = args.includes("--include-admins");
  const onlyIdx = args.indexOf("--only");
  const only = onlyIdx >= 0 ? db.normEmail(args[onlyIdx + 1]) : null;

  await db.initDB();
  const roster = await db.listRoster();
  if (!roster.length) {
    console.error("\n  The roster is empty. Run `npm run roster:seed` first.\n");
    process.exit(1);
  }

  // An admin cannot sit the assessment, so a roster password would be unusable
  // for them. Their dashboard password is separate and untouched by default.
  let targets = includeAdmins ? roster : roster.filter((r) => r.role === "participant");
  if (only) {
    targets = roster.filter((r) => r.email === only);
    if (!targets.length) {
      console.error(`\n  "${only}" is not on the roster.\n`);
      process.exit(1);
    }
  } else if (!all) {
    targets = targets.filter((r) => !r.passwordHash);
  }

  if (!targets.length) {
    console.log("\n  Everyone already has a password. Use --all to regenerate, or --only <email>.\n");
    console.log("  Note: existing passwords cannot be read back — only replaced.\n");
    return;
  }

  // Generate, store the hash, keep the plaintext in memory only for the sheet.
  const issued = [];
  for (const entry of targets) {
    const password = generatePassword(PASSWORD_LENGTH);
    if (entry.role === "admin") {
      // Admins authenticate against the admins table, not the roster.
      await db.upsertAdmin({
        username: entry.email,
        passwordHash: hashPassword(password),
        displayName: entry.displayName || entry.email,
      });
    } else {
      await db.setRosterPassword(entry.email, hashPassword(password));
    }
    // A new password must end any session opened with the old one.
    await db.endAuthSessionsFor(entry.email);
    issued.push({ email: entry.email, role: entry.role, password });
  }

  // Everyone goes in the sheet, so it is a complete handout. Accounts whose
  // password was not regenerated on this run are marked, because their
  // plaintext is genuinely unavailable.
  const issuedByEmail = new Map(issued.map((i) => [i.email, i.password]));
  const fresh = await db.listRoster();

  const rows = [["Email", "Password", "Role", "Login page", "Notes"]];
  for (const r of fresh.sort((a, b) => (a.role === b.role ? a.email.localeCompare(b.email) : a.role === "admin" ? -1 : 1))) {
    const pw = issuedByEmail.get(r.email);
    const isAdmin = r.role === "admin";
    rows.push([
      r.email,
      pw || (isAdmin ? "(admin password unchanged)" : "(unchanged — not recoverable)"),
      isAdmin ? "Admin" : "Participant",
      isAdmin ? "Log in as admin (sidebar button)" : "Assessment sign-in",
      pw
        ? (isAdmin ? "Dashboard access only — cannot take the assessment" : "One active session at a time")
        : (isAdmin
            ? "Managed separately; reset with --include-admins"
            : "Regenerate with --only to issue a new one"),
    ]);
  }

  const stamp = new Date().toISOString().slice(0, 10);
  const outDir = path.join(__dirname, "..", "credentials");
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, `bechtel-assessment-logins-${stamp}.xlsx`);
  fs.writeFileSync(outFile, buildWorkbook(rows, {
    sheetName: "Logins",
    widths: [30, 22, 14, 28, 40],
  }));

  console.log(`\n  ✓ issued ${issued.length} password(s)\n`);
  for (const i of issued) {
    console.log(`    ${i.role === "admin" ? "ADMIN" : "     "}  ${i.email.padEnd(26)} ${i.password}`);
  }
  console.log(`\n  Sheet: ${outFile}`);
  console.log("  It contains live credentials — send it securely and delete it afterwards.");
  console.log("  Only hashes are in the database; these plaintexts cannot be recovered.\n");
}

main().catch((e) => { console.error(e); process.exit(1); });
