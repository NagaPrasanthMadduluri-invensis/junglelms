import { validateScreen } from "./src/validate.js";

const res = await fetch("http://localhost:3000/api/assessment/pre");
const { assessment } = await res.json();
const stage = (k) => assessment.stages.find((s) => s.key === k);

let pass = 0, fail = 0;
const check = (label, got, want) => {
  const g = JSON.stringify(Object.keys(got).sort());
  const w = JSON.stringify([...want].sort());
  const ok = g === w;
  ok ? pass++ : fail++;
  console.log(`  ${ok ? "ok  " : "FAIL"} ${label}`);
  if (!ok) console.log(`         got ${g}\n         want ${w}`);
};

// ---------- the reported bug: forensics F1 with all three parts filled ----------
const m3 = stage("m3");
const f1 = m3.items[0];
const f1Screen = { key: "m3-0", stage: m3, item: f1, itemNo: 0 };

check("F1 all parts filled -> no errors",
  validateScreen(f1Screen, { answers: {
    F1_a: { value: "continueOnError makes the gate decorative" },
    F1_b: { value: "1. the gate 2. the token" },
    F1_c: { value: "continueOnError: true" },
  }}), []);

check("F1 part (b) missing -> only F1_b",
  validateScreen(f1Screen, { answers: {
    F1_a: { value: "x" }, F1_c: { value: "y" },
  }}), ["F1_b"]);

check("F1 nothing filled -> all three parts",
  validateScreen(f1Screen, { answers: {} }), ["F1_a", "F1_b", "F1_c"]);

check("F1 whitespace-only -> still flagged",
  validateScreen(f1Screen, { answers: {
    F1_a: { value: "   " }, F1_b: { value: " " }, F1_c: { value: "\t\n" },
  }}), ["F1_a", "F1_b", "F1_c"]);

// F3 has five parts
const f3 = m3.items[2];
check("F3 five parts, one missing",
  validateScreen({ key: "m3-2", stage: m3, item: f3, itemNo: 2 }, { answers: {
    F3_a: { value: "a" }, F3_b: { value: "b" }, F3_c: { value: "c" }, F3_e: { value: "e" },
  }}), ["F3_d"]);

// ---------- discriminators still behave ----------
const m2 = stage("m2");
const q1 = m2.items[0];
const q1Screen = { key: "m2-0", stage: m2, item: q1, itemNo: 0 };
check("Q1 nothing chosen", validateScreen(q1Screen, { answers: {} }), ["Q1"]);
check("Q1 chosen, no confidence",
  validateScreen(q1Screen, { answers: { Q1: { value: [q1.options[0].id] } } }), ["Q1::conf"]);
check("Q1 chosen + confidence -> clean",
  validateScreen(q1Screen, { answers: { Q1: { value: [q1.options[0].id], confidence: "High" } } }), []);

// ---------- pre-flight ----------
const m0 = stage("m0");
const pfAll = {};
m0.items.forEach((i) => { pfAll[i.ref] = { value: "confirmed" }; });
check("pre-flight all filled", validateScreen({ key: "m0", stage: m0 }, { answers: pfAll }), []);
const pfBlocked = { ...pfAll, pf3: { value: "", blocked: true } };
check("pre-flight blocked counts as answered",
  validateScreen({ key: "m0", stage: m0 }, { answers: pfBlocked }), []);
const pfMissing = { ...pfAll }; delete pfMissing.pf5;
check("pre-flight one missing", validateScreen({ key: "m0", stage: m0 }, { answers: pfMissing }), ["pf5"]);

// ---------- self-map: optional row exempt ----------
const m1 = stage("m1");
const smAll = {};
m1.items.filter((i) => i.kind === "band").forEach((i) => { smAll[i.ref] = { value: "3", confidence: "Med" }; });
check("self-map complete, free-text left blank (optional)",
  validateScreen({ key: "m1", stage: m1 }, { answers: smAll }), []);
const smNoConf = { ...smAll, sm0: { value: "3" } };
check("self-map row missing confidence",
  validateScreen({ key: "m1", stage: m1 }, { answers: smNoConf }), ["sm0::conf"]);

// ---------- hands-on: excused by the blocked note ----------
const m4 = stage("m4");
check("hands-on nothing filled -> 4 identifiers",
  validateScreen({ key: "m4", stage: m4 }, { answers: {} }),
  m4.items.filter((i) => i.kind === "identifier").map((i) => i.ref));
check("hands-on excused when the blocker note explains why",
  validateScreen({ key: "m4", stage: m4 }, { answers: { m4_blocked: { value: "no CREATE MODEL privilege" } } }), []);

// ---------- written + context ----------
const m5 = stage("m5");
check("written both missing", validateScreen({ key: "m5", stage: m5 }, { answers: {} }), ["W1", "W2"]);
const m6 = stage("m6");
const ctxAll = {};
m6.items.forEach((i) => { ctxAll[i.ref] = { value: i.kind === "select" ? i.config.choices[0] : "answer" }; });
check("context all answered", validateScreen({ key: "m6", stage: m6 }, { answers: ctxAll }), []);

// ---------- ident ----------
check("ident blank name", validateScreen({ key: "ident" }, { name: "  " }), ["who_name"]);
check("ident real name", validateScreen({ key: "ident" }, { name: "Ravi" }), []);

console.log(`\n  ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
