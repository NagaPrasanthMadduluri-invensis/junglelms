// ---------------------------------------------------------------
// Client mirror of server/sanitize.js - the SAME rule must run in both
// places: here so the participant is told at once that spaces are not an
// answer, and on the server so a crafted request cannot store one anyway.
// If you change one, change the other.
// ---------------------------------------------------------------
//
// INPUT SANITISATION
//
// The only thing rejected is an answer with no actual content. Everything
// else is preserved exactly as typed:
//
//   * special characters, symbols, punctuation, quotes, emoji
//   * code and markup - "<script>", "&&", "|| true", YAML, SQL, regexes
//   * any script - Devanagari, Arabic, CJK, Cyrillic, accented Latin
//   * spaces, tabs and blank lines BETWEEN words and paragraphs
//
// Nothing is escaped or stripped from the middle of an answer. Values are
// stored raw and rendered as text (never as HTML), so markup in an answer is
// data, not a scripting risk.
//
// What does not count as an answer: a value made only of whitespace and/or
// invisible formatting characters. \s covers ordinary spaces, tabs, newlines
// and the exotic Unicode spaces (N\P, en/em, ideographic). \p{Cf} covers the
// invisible format characters - zero-width space, word joiner, BOM.
//
// \p{Cf} also contains ZWNJ and ZWJ, which ARE meaningful inside Persian,
// Hindi and emoji sequences. That is why they only disqualify an answer that
// contains nothing else - they are never stripped from within real text.
// =====================================================================

const HAS_REAL_CHARACTER = /[^\s\p{Cf}]/u;

/**
 * Normalise line endings and trim the outer edges. Deliberately nothing else:
 * internal spacing, blank lines and every character are left untouched.
 */
export function cleanText(value) {
  if (typeof value !== "string") return "";
  return value.replace(/\r\n?/g, "\n").trim();
}

/** True when this value contains at least one real character. */
export function hasContent(value) {
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "string") return HAS_REAL_CHARACTER.test(value);
  return value !== undefined && value !== null && value !== "";
}

