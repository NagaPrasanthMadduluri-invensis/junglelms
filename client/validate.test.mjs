import { validateScreen } from "./src/validate.js";

// The API host, so the suite can run against a dev server on any port:
//   API=http://localhost:3099 node --test client/validate.test.mjs
const API = process.env.API || "http://localhost:3002";
const res = await fetch(`${API}/api/assessment/pre`);
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
// The email now comes from the signed-in session rather than being typed, so
// every real call arrives with one; the validator still checks it, because a
// missing email means an attempt that cannot be attributed.
const SIGNED_IN = "rkshee@bechtel.com";
check("ident blank name", validateScreen({ key: "ident" }, { name: "  ", email: SIGNED_IN }), ["who_name"]);
check("ident real name", validateScreen({ key: "ident" }, { name: "Ravi", email: SIGNED_IN }), []);
check("ident no session email", validateScreen({ key: "ident" }, { name: "Ravi" }), ["who_email"]);

// =================================================================
// POST ASSESSMENT
// The evidence desk is the only stage whose questions answer through named
// parts rather than one value, so it gets its own coverage.
// =================================================================

const postRes = await fetch(`${API}/api/assessment/post`);
const post = (await postRes.json()).assessment;
const pstage = (k) => post.stages.find((s) => s.key === k);

const ev = pstage("p3");
const evRefs = (item) => item.config.parts.map((x) => `${item.ref}_${x.key}`);
const allEv = {};
for (const it of ev.items) for (const r of evRefs(it)) allEv[r] = { value: "8" };

check("evidence desk nothing filled -> every part",
  validateScreen({ key: "p3", stage: ev }, { answers: {} }),
  ev.items.flatMap(evRefs));
check("evidence desk fully answered -> clean",
  validateScreen({ key: "p3", stage: ev }, { answers: allEv }), []);

const e3 = ev.items.find((i) => i.ref === "E3");
const missingSelect = { ...allEv }; delete missingSelect.E3_ind;
check("evidence desk select left at the placeholder",
  validateScreen({ key: "p3", stage: ev }, { answers: missingSelect }), ["E3_ind"]);

const blankWhy = { ...allEv }; blankWhy.E1_w = { value: "   \n  " };
check("evidence desk whitespace-only reasoning is still blank",
  validateScreen({ key: "p3", stage: ev }, { answers: blankWhy }), ["E1_w"]);

const e6 = ev.items.find((i) => i.ref === "E6");
check("E6 is reasoning only, no exact fields",
  { [e6.config.parts.length === 1 && e6.config.parts[0].kind === "why" ? "" : "shape"]: 1 }, [""]);

// ---- post discriminators: one per screen, some with a code artefact ----
const pd = pstage("p2");
const p8 = pd.items.find((i) => i.ref === "P8");
const p8Screen = { key: "p2-7", stage: pd, item: p8, itemNo: 7 };
check("P8 nothing chosen", validateScreen(p8Screen, { answers: {} }), ["P8"]);
check("P8 chosen but no confidence",
  validateScreen(p8Screen, { answers: { P8: { value: [p8.options[0].id] } } }), ["P8::conf"]);
check("P8 chosen with confidence -> clean",
  validateScreen(p8Screen, { answers: { P8: { value: [p8.options[0].id] }, "P8": { value: [p8.options[0].id], confidence: "High" } } }), []);
check("P8 justification box stays optional",
  validateScreen(p8Screen, { answers: { P8: { value: [p8.options[0].id], confidence: "Low" } } }), []);

// ---- post forensics: F1 part (d) asks for written-out code ----
const pf = pstage("p4");
const F1 = pf.items.find((i) => i.ref === "F1");
const f1p = { key: "p4-0", stage: pf, item: F1, itemNo: 0 };
check("post F1 nothing filled -> all four parts",
  validateScreen(f1p, { answers: {} }), F1.config.subs.map((x) => `F1_${x[0]}`));
const f1All = {};
for (const x of F1.config.subs) f1All[`F1_${x[0]}`] = { value: "answer" };
check("post F1 fully filled -> clean", validateScreen(f1p, { answers: f1All }), []);
delete f1All.F1_d;
check("post F1 missing the rewrite -> only (d)", validateScreen(f1p, { answers: f1All }), ["F1_d"]);

// ---- post self-map and reflection ----
const ps = pstage("p1");
const psAll = {};
for (const i of ps.items.filter((x) => x.kind === "band")) psAll[i.ref] = { value: "3", confidence: "I did it myself" };
check("post self-map complete, optional free text blank",
  validateScreen({ key: "p1", stage: ps }, { answers: psAll }), []);
delete psAll.sm0.confidence;
check("post self-map row missing the programme column",
  validateScreen({ key: "p1", stage: ps }, { answers: psAll }), ["sm0::conf"]);

const pr = pstage("p6");
check("reflection nothing answered", validateScreen({ key: "p6", stage: pr }, { answers: {} }),
  pr.items.map((i) => i.ref));

console.log(`\n  ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
