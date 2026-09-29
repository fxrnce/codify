// Breaks a product's warningMessage prose string into a bold lead sentence
// plus the remaining sentences as short bullet points, so long FDA/product
// safety text reads as a scannable list instead of one dense paragraph.
//
// The split point requires sentence-ending punctuation (. ! ?) followed by
// whitespace and a capital letter or "(" - and explicitly excludes common
// abbreviations (Dr., Inc., No., etc.) so a name like "Dr. Daily Vitamin C"
// or "FDA Advisory No. 2026-0699" is never split mid-phrase.

const ABBREVIATIONS =
  "Mr|Mrs|Ms|Dr|Jr|Sr|St|No|Inc|Corp|Ltd|Co|vs|approx|etc|Assoc|Dept|Fig";

const SENTENCE_SPLIT_REGEX = new RegExp(
  `(?<=[.!?])(?<!\\b(?:${ABBREVIATIONS})\\.)\\s+(?=[A-Z(])`,
  "g",
);

export function splitWarningMessage(message: string): {
  headline: string;
  bullets: string[];
} {
  const trimmed = message.trim();

  if (!trimmed) {
    return { headline: "", bullets: [] };
  }

  const sentences = trimmed
    .split(SENTENCE_SPLIT_REGEX)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  const [headline = trimmed, ...bullets] = sentences;

  return { headline, bullets };
}
