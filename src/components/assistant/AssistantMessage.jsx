import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, ChevronDown, Copy, ExternalLink, FileSearch, SearchX, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import AnswerContent from "./AnswerContent";

const timeFormatter = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" });

function CitationCard({ citation, active, onSelect }) {
  return (
    <li
      className={cn(
        "rounded-xl border p-3 transition-colors",
        active ? "border-primary/50 bg-primary/5" : "border-border bg-background",
      )}
    >
      <button type="button" onClick={onSelect} className="flex w-full items-start gap-2 text-left">
        <span
          className={cn(
            "mt-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded px-1 text-[11px] font-semibold",
            active ? "bg-primary text-primary-foreground" : "bg-primary/15 text-primary",
          )}
        >
          {citation.index}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs font-medium text-foreground">
            {citation.documentTitle}
          </span>
          <span className="block truncate text-[11px] text-muted-foreground">
            {[citation.subjectName, citation.location].filter(Boolean).join(" · ")}
          </span>
        </span>
      </button>
      <p
        className={cn(
          "mt-2 border-l-2 border-primary/30 pl-2 text-xs italic text-muted-foreground",
          !active && "line-clamp-2",
        )}
      >
        “{citation.excerpt}”
      </p>
      {active && (
        <Link
          to="/notes"
          state={{ contentId: citation.documentId }}
          className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
        >
          <ExternalLink className="h-3 w-3" />
          Open document
        </Link>
      )}
    </li>
  );
}

function AssistantAnswer({ message }) {
  const [activeCitation, setActiveCitation] = useState(null);
  const [sourcesOpen, setSourcesOpen] = useState(true);
  const [copied, setCopied] = useState(false);
  const citations = message.citations ?? [];
  const notFound = message.answerStatus !== "answered";

  const selectCitation = (index) => {
    setSourcesOpen(true);
    setActiveCitation((current) => (current === index ? null : index));
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message.content.replace(/\s?\[\d+\]/g, ""));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Could not copy the answer");
    }
  };

  return (
    <div className="flex gap-3">
      <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
        <Sparkles className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1 space-y-2">
        {notFound ? (
          <div className="flex items-start gap-2 rounded-2xl border border-dashed border-border bg-secondary/40 p-3">
            <SearchX className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{message.content}</p>
          </div>
        ) : (
          <AnswerContent
            content={message.content}
            citations={citations}
            activeCitation={activeCitation}
            onCitation={selectCitation}
          />
        )}

        {citations.length > 0 && (
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setSourcesOpen((open) => !open)}
              aria-expanded={sourcesOpen}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              <FileSearch className="h-3.5 w-3.5" />
              Sources ({citations.length})
              <ChevronDown
                className={cn("h-3.5 w-3.5 transition-transform", !sourcesOpen && "-rotate-90")}
              />
            </button>
            {sourcesOpen && (
              <ul className="grid gap-2 sm:grid-cols-2">
                {citations.map((citation) => (
                  <CitationCard
                    key={citation.index}
                    citation={citation}
                    active={activeCitation === citation.index}
                    onSelect={() => selectCitation(citation.index)}
                  />
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span>{timeFormatter.format(new Date(message.createdAt))}</span>
          {!notFound && (
            <button
              type="button"
              onClick={copy}
              aria-label="Copy answer"
              className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 hover:bg-secondary hover:text-foreground"
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied ? "Copied" : "Copy"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function UserQuestion({ content, muted = false }) {
  return (
    <div className="flex justify-end">
      <p
        className={cn(
          "max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm text-primary-foreground",
          muted && "opacity-70",
        )}
      >
        {content}
      </p>
    </div>
  );
}

export function ThinkingIndicator() {
  return (
    <div className="flex gap-3">
      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
        <Sparkles className="h-4 w-4 animate-pulse" />
      </span>
      <div className="flex items-center gap-2 rounded-2xl bg-secondary/60 px-4 py-2.5 text-sm text-muted-foreground">
        Searching your documents
        <span className="flex gap-1">
          {[0, 150, 300].map((delay) => (
            <span
              key={delay}
              className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground"
              style={{ animationDelay: `${delay}ms` }}
            />
          ))}
        </span>
      </div>
    </div>
  );
}

export default function AssistantMessage({ message }) {
  if (message.role === "user") return <UserQuestion content={message.content} />;
  return <AssistantAnswer message={message} />;
}
