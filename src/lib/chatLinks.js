const URL_PATTERN = /https?:\/\/[^\s<>"']+[^\s<>"'.,;:!?)\]]/gi;

/** Splits text into plain and link segments, in order. */
export function splitTextWithLinks(text) {
  const segments = [];
  let lastIndex = 0;
  for (const match of (text ?? "").matchAll(URL_PATTERN)) {
    if (match.index > lastIndex) {
      segments.push({ type: "text", value: text.slice(lastIndex, match.index) });
    }
    segments.push({ type: "link", value: match[0] });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < (text ?? "").length) {
    segments.push({ type: "text", value: text.slice(lastIndex) });
  }
  return segments;
}

export function extractUrls(text) {
  return Array.from((text ?? "").matchAll(URL_PATTERN), (match) => match[0]);
}

export function getHostname(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
