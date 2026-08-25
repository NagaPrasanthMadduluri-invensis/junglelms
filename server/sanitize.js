// =====================================================================
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
function cleanText(value) {
  if (typeof value !== "string") return "";
  return value.replace(/\r\n?/g, "\n").trim();
}

/** True when this value contains at least one real character. */
function hasContent(value) {
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "string") return HAS_REAL_CHARACTER.test(value);
  return value !== undefined && value !== null && value !== "";
}

/**
 * Clean one submitted answer. Returns null when nothing is left, so a
 * whitespace-only response is dropped rather than stored as data.
 *
 * `blocked` is a real signal on pre-flight rows, so a blocked row survives
 * even with an empty value.
 */
function cleanAnswer(raw) {
  const a = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : { value: raw };

  const value = Array.isArray(a.value)
    ? a.value.filter((v) => typeof v === "string" && hasContent(v))
    : typeof a.value === "string" ? cleanText(a.value)
    : a.value;

  const out = {
    value: hasContent(value) ? value : (Array.isArray(value) ? [] : ""),
    confidence: hasContent(a.confidence) ? cleanText(a.confidence) : "",
    justification: hasContent(a.justification) ? cleanText(a.justification) : "",
    blocked: !!a.blocked,
  };

  const keep = hasContent(out.value) || out.blocked || out.confidence || out.justification;
  return keep ? out : null;
}

/** Clean a whole answers map, dropping every entry with no content. */
function cleanAnswers(answers) {
  const out = {};
  if (!answers || typeof answers !== "object") return out;
  for (const [ref, raw] of Object.entries(answers)) {
    const cleaned = cleanAnswer(raw);
    if (cleaned) out[ref] = cleaned;
  }
  return out;
}

module.exports = { cleanText, hasContent, cleanAnswer, cleanAnswers };
