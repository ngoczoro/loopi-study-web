import { Fragment } from "react";
import { cn } from "@/lib/utils";

const INLINE_PATTERN = /(\*\*[^*]+\*\*|\[\d+\])/g;

function InlineText({ text, citationIndexes, activeCitation, onCitation }) {
  return text.split(INLINE_PATTERN).map((part, i) => {
    if (!part) return null;
    const bold = part.match(/^\*\*([^*]+)\*\*$/);
    if (bold) {
      return (
        <strong key={i} className="font-semibold text-foreground">
          {bold[1]}
        </strong>
      );
    }
    const marker = part.match(/^\[(\d+)\]$/);
    if (marker) {
      const index = Number(marker[1]);
      if (!citationIndexes.has(index)) return null;
      return (
        <button
          key={i}
          type="button"
          onClick={() => onCitation(index)}
          aria-label={`Show source ${index}`}
          className={cn(
            "mx-0.5 inline-flex h-4 min-w-4 -translate-y-0.5 items-center justify-center rounded px-1 align-middle text-[10px] font-semibold transition-colors",
            activeCitation === index
              ? "bg-primary text-primary-foreground"
              : "bg-primary/15 text-primary hover:bg-primary/25",
          )}
        >
          {index}
        </button>
      );
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

/** Renders the plain-text answer format from the contract: paragraphs, "- " bullets, **bold**, [n]. */
export default function AnswerContent({ content, citations = [], activeCitation, onCitation }) {
  const citationIndexes = new Set(citations.map((citation) => citation.index));
  const blocks = [];
  content.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    if (trimmed.startsWith("- ")) {
      const last = blocks[blocks.length - 1];
      if (last?.type === "list") last.items.push(trimmed.slice(2));
      else blocks.push({ type: "list", items: [trimmed.slice(2)] });
    } else {
      blocks.push({ type: "paragraph", text: trimmed });
    }
  });

  const inline = (text) => (
    <InlineText
      text={text}
      citationIndexes={citationIndexes}
      activeCitation={activeCitation}
      onCitation={onCitation}
    />
  );

  return (
    <div className="space-y-2 text-sm leading-relaxed text-foreground break-words">
      {blocks.map((block, i) =>
        block.type === "list" ? (
          <ul key={i} className="list-disc space-y-1 pl-5 marker:text-muted-foreground">
            {block.items.map((item, j) => (
              <li key={j}>{inline(item)}</li>
            ))}
          </ul>
        ) : (
          <p key={i}>{inline(block.text)}</p>
        ),
      )}
    </div>
  );
}
