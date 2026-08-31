import { hasContent } from "./sanitize.js";

// ---------------------------------------------------------------
// Per-screen required-answer validation.
//
// Pure on purpose: it takes a screen plus the answer map and returns
// { fieldRef: message }. That keeps it testable without a browser, which is
// how the forensics bug below was caught.
//
// Deliberate exemptions:
//   · an item flagged config.optional
//   · a pre-flight row may be ticked "blocked" instead of filled
//   · the hands-on identifiers are excused when the "what stopped you" note
//     is filled — a platform failure must not trap someone on a screen
//   · a discriminator's justification box is optional
// ---------------------------------------------------------------

const filled = hasContent;

/** Sub-part refs for a forensics artefact: F1 → ["F1_a", "F1_b", "F1_c"]. */
export function subRefs(item) {
  return ((item.config || {}).subs || []).map((s) => ({ ref: `${item.ref}_${s[0]}`, part: s[0] }));
}

export function validateScreen(screen, { answers = {}, name = "", email = "" } = {}) {
  const errs = {};
  if (!screen) return errs;

  const A = (ref) => answers[ref] || {};
  const need = (ref, msg) => { errs[ref] = msg; };

  if (screen.key === "ident") {
    // The email is also checked against the cohort roster over the API —
    // see checkEmail() in Assessment.jsx. This only covers "it is blank".
    if (!filled(name)) need("who_name", "Your name is required.");
    if (!filled(email)) need("who_email", "Your Bechtel email is required.");
    return errs;
  }

  const st = screen.stage;
  if (!st) return errs;

  // ---- one item per screen -------------------------------------
  // Both the discriminators AND the forensics artefacts are one-per-screen,
  // so this must branch on the item, not assume a multiple-choice question.
  if (screen.item) {
    const it = screen.item;

    // A forensics artefact has no answer of its own — it is answered through
    // its sub-parts (F1_a, F1_b, …).
    if (it.kind === "forensics") {
      for (const { ref, part } of subRefs(it)) {
        if (!filled(A(ref).value)) need(ref, `Part (${part}) needs an answer.`);
      }
      return errs;
    }

    if (!filled(A(it.ref).value)) {
      need(it.ref, it.kind === "multi"
        ? "Select every option that applies before continuing."
        : "Choose an option to continue.");
    } else if ((it.config || {}).confidence && !A(it.ref).confidence) {
      need(`${it.ref}::conf`, "Say how confident you are in this answer.");
    }
    return errs;
  }

  // ---- whole-stage screens -------------------------------------
  for (const it of st.items || []) {
    if ((it.config || {}).optional) continue;

    if (st.kind === "preflight") {
      if (!filled(A(it.ref).value) && !A(it.ref).blocked) {
        need(it.ref, "Confirm this, or tick “blocked” if it failed.");
      }
    } else if (it.kind === "band") {
      if (!filled(A(it.ref).value)) need(it.ref, "Place yourself on this row.");
      else if (!A(it.ref).confidence) need(`${it.ref}::conf`, "Choose how sure you are.");
    } else if (it.kind === "forensics") {
      for (const { ref, part } of subRefs(it)) {
        if (!filled(A(ref).value)) need(ref, `Part (${part}) needs an answer.`);
      }
    } else if (st.kind === "handson") {
      const note = (st.items || []).find((x) => x.kind === "text" && /blocked/i.test(x.ref));
      const excused = note && filled(A(note.ref).value);
      if (it.kind === "identifier" && !excused && !filled(A(it.ref).value)) {
        need(it.ref, "Paste this, or say below what stopped you.");
      }
    } else if (it.kind === "select") {
      if (!filled(A(it.ref).value)) need(it.ref, "Choose one.");
    } else if (it.kind === "written" || it.kind === "text") {
      if (!filled(A(it.ref).value)) need(it.ref, "This question needs an answer.");
    }
  }
  return errs;
}
