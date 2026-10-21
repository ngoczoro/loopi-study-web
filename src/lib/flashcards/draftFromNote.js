const MAX_DRAFTS = 20;
const FRONT_MAX = 120;

function toPlainText(value) {
  return String(value ?? "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\r/g, "")
    .trim();
}

function splitPair(line) {
  const match = line.match(/^(.{1,120}?)\s*(?::|—|–)\s+(.+)$/);
  if (!match) return null;
  const front = match[1].trim();
  const back = match[2].trim();
  if (!front || !back || front.length > FRONT_MAX) return null;
  return { front, back };
}

/** Turn a note into editable front/back drafts. The user confirms before saving. */
export function draftCardsFromNote(text) {
  const plain = toPlainText(text);
  if (!plain) return [];

  const paired = plain
    .split("\n")
    .map((line) => splitPair(line.trim()))
    .filter(Boolean);
  if (paired.length >= 2) return paired.slice(0, MAX_DRAFTS);

  return plain
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.replace(/\s+/g, " ").trim())
    .filter((paragraph) => paragraph.length > 40)
    .map((paragraph) => {
      const splitAt = paragraph.search(/[.?!](\s|$)/);
      if (splitAt < 8 || splitAt > FRONT_MAX) return null;
      const front = paragraph.slice(0, splitAt + 1).trim();
      const back = paragraph.slice(splitAt + 1).trim();
      if (!back) return null;
      return { front, back };
    })
    .filter(Boolean)
    .slice(0, MAX_DRAFTS);
}
