#!/usr/bin/env node
// =====================================================================
// Cohort roster management.
//
//   npm run roster:seed              load server/roster-data.js
//   npm run roster:list              show who is registered
//   npm run roster:admin <email>     promote to admin (default password)
//   npm run roster:revoke <email>    remove admin rights, keep them as a participant
//
// Seeding is idempotent: emails in the file are added or updated, and any
// email no longer in the file is deactivated, so the file stays the source
// of truth. Promoting to admin also creates the dashboard login.
// =====================================================================

require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const db = require("./db");
const { hashPassword } = require("./auth");
const rosterData = require("./roster-data");

const DEFAULT_PASSWORD = "Edstellar@123";

function validate(list) {
  const errors = [];
  const seen = new Set();
  list.forEach((r, i) => {
    const e = db.normEmail(r.email);
    if (!e) errors.push(`entry[${i}]: missing email`);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) errors.push(`entry[${i}]: "${r.email}" is not a valid email`);
    if (seen.has(e)) errors.push(`entry[${i}]: "${e}" appears more than once`);
    seen.add(e);
    if (!["participant", "admin"].includes(r.role || "participant")) {
      errors.push(`entry[${i}]: role must be "participant" or "admin"`);
    }
  });
  return errors;
}

async function seed() {
  const errors = validate(rosterData);
  if (errors.length) {
    console.error(`\n  roster-data.js has ${errors.length} problem(s):\n`);
    errors.forEach((e) => console.error(`    ✗ ${e}`));
    console.error("");
    process.exit(1);
  }

  await db.initDB();
  for (const entry of rosterData) {
    await db.upsertRosterEntry(entry);
  }
  await db.deactivateRosterExcept(rosterData.map((r) => r.email));

  // Anyone marked admin in the file gets a dashboard login too.
  for (const entry of rosterData.filter((r) => r.role === "admin")) {
    const email = db.normEmail(entry.email);
    const existing = await db.getAdminByUsername(email);
    if (!existing) {
      await db.upsertAdmin({
        username: email,
        passwordHash: hashPassword(DEFAULT_PASSWORD),
        displayName: entry.displayName || email,
      });
      console.log(`  + dashboard login created for ${email} (password: ${DEFAULT_PASSWORD})`);
    }
  }

  const rows = await db.listRoster();
  const admins = rows.filter((r) => r.role === "admin");
  console.log(`\n  ✓ roster seeded — ${rows.length} registered`);
  console.log(`    ${admins.length} admin(s), ${rows.length - admins.length} participant(s)\n`);
}

async function list() {
  await db.initDB();
  const rows = await db.listRoster();
  if (!rows.length) {
    console.log("\n  Roster is empty. Run `npm run roster:seed`.\n");
    return;
  }
  const logins = await db.listAdmins();
  const hasLogin = new Set(logins.map((a) => a.username));

  console.log(`\n  ${rows.length} registered\n`);
  for (const r of rows) {
    const tag = r.role === "admin" ? "ADMIN" : "     ";
    const login = r.role === "admin" ? (hasLogin.has(r.email) ? " · dashboard login set" : " · NO LOGIN YET") : "";
    console.log(`    ${tag}  ${r.email.padEnd(26)}${login}`);
  }
  console.log("");
}

async function setAdmin(email, makeAdmin) {
  const e = db.normEmail(email);
  if (!e) { console.error("\n  usage: npm run roster:admin -- <email>\n"); process.exit(1); }

  await db.initDB();
  const entry = await db.getRosterEntry(e);
  if (!entry) {
    console.error(`\n  "${e}" is not on the roster. Add it to server/roster-data.js and seed first.\n`);
    process.exit(1);
  }

  await db.upsertRosterEntry({ email: e, role: makeAdmin ? "admin" : "participant", displayName: entry.displayName });

  if (makeAdmin) {
    const existing = await db.getAdminByUsername(e);
    if (!existing) {
      await db.upsertAdmin({ username: e, passwordHash: hashPassword(DEFAULT_PASSWORD), displayName: entry.displayName || e });
      console.log(`\n  ✓ ${e} is now an admin`);
      console.log(`    password: ${DEFAULT_PASSWORD}  (change it with \`npm run admin:create\`)\n`);
    } else {
      console.log(`\n  ✓ ${e} is now an admin (existing password kept)\n`);
    }
  } else {
    await db.deactivateAdmin(e);
    console.log(`\n  ✓ ${e} is a participant again; dashboard login removed\n`);
  }
}

async function main() {
  const cmd = process.argv[2];
  if (cmd === "--list") return list();
  if (cmd === "--admin") return setAdmin(process.argv[3], true);
  if (cmd === "--revoke") return setAdmin(process.argv[3], false);
  return seed();
}

main().catch((e) => { console.error(e); process.exit(1); });
