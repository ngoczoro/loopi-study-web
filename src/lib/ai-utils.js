const spamPatterns = [
  /buy\s+cheap/i,
  /free\s+money/i,
  /click\s+here/i,
  /limited\s+offer/i,
  /act\s+now/i,
  /!!!/,
];
const inappropriatePatterns = [/stupid/i, /hate/i, /idiot/i, /dumb/i];

/** Client-side pre-check before AI quiz generation; reports via POST /violations when flagged. */
export function moderateContent(text) {
  if (!text) return null;

  for (const pattern of spamPatterns) {
    if (pattern.test(text)) {
      return { flagged: true, type: "spam", severity: "high" };
    }
  }
  for (const pattern of inappropriatePatterns) {
    if (pattern.test(text)) {
      return { flagged: true, type: "inappropriate", severity: "medium" };
    }
  }

  if (text.trim().length < 3 && text.trim().length > 0) {
    return { flagged: true, type: "irrelevant", severity: "low" };
  }

  return null;
}
