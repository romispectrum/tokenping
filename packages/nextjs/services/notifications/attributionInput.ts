/** Matches the user_attribution.answer check constraint (char_length between 1 and 500). */
export const ATTRIBUTION_MAX_LENGTH = 500;

const TYPE_ERROR = "Invalid answer: expected a string";
const EMPTY_ERROR = "Answer is empty";
const LENGTH_ERROR = `Answer is longer than ${ATTRIBUTION_MAX_LENGTH} characters`;
const ENCODING_ERROR = "Answer contains invalid characters";
const CONTROL_ERROR = "Answer contains hidden control characters. Retype it and try again.";

/**
 * Length in code points, which is what Postgres char_length counts, so an emoji counts once here and in the database
 * check. A code point takes at most 2 UTF-16 units, so anything over twice the cap fails without being counted.
 */
const exceedsMaxLength = (text: string) =>
  text.length > 2 * ATTRIBUTION_MAX_LENGTH || Array.from(text).length > ATTRIBUTION_MAX_LENGTH;

/**
 * With the u flag a surrogate pair reads as one code point, so this matches only an unpaired surrogate. Only a crafted
 * request can send one (as a JSON \ud800 escape), and it has no UTF-8 form, so it could never reach Postgres intact.
 */
const LONE_SURROGATE = /\p{Cs}/u;

/**
 * C0 controls other than tab, LF and CR (Postgres text cannot store NUL at all), DEL and the C1 controls, plus the bidi
 * embedding, override and isolate controls, which can make a stored answer display reordered when it is read.
 * Zero-width joiners stay allowed: emoji sequences need them.
 */
const isControlCode = (code: number) =>
  (code < 0x20 && code !== 0x09 && code !== 0x0a && code !== 0x0d) ||
  (code >= 0x7f && code <= 0x9f) ||
  (code >= 0x202a && code <= 0x202e) ||
  (code >= 0x2066 && code <= 0x2069);

/** Every control above is a single UTF-16 unit, and surrogate units never match, so checking units is enough. */
const hasControlCharacter = (text: string) => {
  for (let i = 0; i < text.length; i++) {
    if (isControlCode(text.charCodeAt(i))) return true;
  }
  return false;
};

/**
 * Validates the free-text "How did you hear about Tokenping?" answer and trims it for storage, or returns the problem.
 * Shared by the API route and the prompt, so the prompt can explain a rejection instead of failing on send.
 * Nothing else is normalized: messy answers are grouped at read time, not constrained on input.
 */
export const parseAttributionAnswer = (raw: unknown): { error: string } | { value: string } => {
  if (typeof raw !== "string") return { error: TYPE_ERROR };
  const answer = raw.trim();
  if (!answer) return { error: EMPTY_ERROR };
  if (exceedsMaxLength(answer)) return { error: LENGTH_ERROR };
  if (LONE_SURROGATE.test(answer)) return { error: ENCODING_ERROR };
  if (hasControlCharacter(answer)) return { error: CONTROL_ERROR };
  return { value: answer };
};
