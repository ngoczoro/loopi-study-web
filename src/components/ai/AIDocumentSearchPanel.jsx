import { useCallback, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Loader2, Search, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  WidgetScrollArea,
  LEARNING_RESOURCE_SCROLL_MAX,
} from "@/components/WidgetScrollArea";
import {
  explainDocumentSearch,
  isAiDocumentSearchSupported,
  searchInsideDocument,
} from "@/services/aiService";

const NOT_ENOUGH_INFO =
  "The available documents do not contain enough information to answer this question.";

const EXCERPT_PREVIEW_LINES = 3;
const VISIBLE_RESULT_ITEMS = 3;

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlightTerms(text, query) {
  const safeText = String(text ?? "");
  const terms = String(query ?? "")
    .trim()
    .split(/\s+/)
    .map((term) => term.trim())
    .filter((term) => term.length >= 2);

  if (!terms.length) return safeText;

  const pattern = new RegExp(
    `(${terms.map((term) => escapeRegExp(term)).join("|")})`,
    "gi",
  );
  const parts = safeText.split(pattern);

  return parts.map((part, index) => {
    const isMatch = terms.some(
      (term) => part.toLowerCase() === term.toLowerCase(),
    );

    return isMatch ? (
      <mark
        key={`${part}-${index}`}
        className="bg-primary/30 text-foreground rounded-sm px-0.5"
      >
        {part}
      </mark>
    ) : (
      part
    );
  });
}

function RelevanceBadge({ score }) {
  if (typeof score !== "number") return null;

  return (
    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 shrink-0">
      {Math.round(score * 100)}% Relevant
    </span>
  );
}

function ExplainButton({ onClick, disabled, loading, label = "Explain with AI" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className="h-7 px-2.5 rounded-full border border-border text-[11px] font-medium inline-flex items-center gap-1 hover:bg-secondary disabled:opacity-50 shrink-0"
    >
      {loading ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <Sparkles className="h-3 w-3" />
      )}
      {label}
    </button>
  );
}

function PassageCard({
  passage,
  query,
  groupByDocument = false,
  onExplain,
  explaining = false,
}) {
  const [expanded, setExpanded] = useState(false);
  const excerpt = passage.excerpt ?? "";
  const shouldTruncate = excerpt.length > 180;

  return (
    <div className="rounded-lg bg-background/70 border border-border/60 p-2.5 min-w-0 space-y-2">
      {!groupByDocument ? (
        <div className="min-w-0">
          <p
            className="text-sm font-medium text-foreground truncate"
            title={passage.documentTitle}
          >
            {passage.documentTitle}
          </p>
          {passage.subjectName ? (
            <span className="inline-flex mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              {passage.subjectName}
            </span>
          ) : null}
        </div>
      ) : null}

      <p
        className={cn(
          "text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap",
          !expanded && shouldTruncate && "line-clamp-3",
        )}
        style={
          !expanded && shouldTruncate
            ? { WebkitLineClamp: EXCERPT_PREVIEW_LINES }
            : undefined
        }
      >
        {highlightTerms(excerpt, query)}
      </p>

      <div className="flex flex-wrap items-center gap-1.5">
        <ExplainButton
          onClick={() => onExplain([passage])}
          loading={explaining}
        />
        {shouldTruncate ? (
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
          >
            {expanded ? (
              <>
                <ChevronUp className="h-3 w-3" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3" />
                View More
              </>
            )}
          </button>
        ) : null}
        <div className="ml-auto">
          <RelevanceBadge score={passage.score} />
        </div>
      </div>
    </div>
  );
}

function DocumentGroup({ group, query, onExplain, explainingId }) {
  return (
    <div className="space-y-2">
      <div className="min-w-0">
        <p
          className="text-sm font-medium text-foreground truncate"
          title={group.documentTitle}
        >
          {group.documentTitle}
        </p>
        {group.subjectName ? (
          <span className="inline-flex mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
            {group.subjectName}
          </span>
        ) : null}
      </div>
      {group.items.map((passage, index) => (
        <PassageCard
          key={`${passage.documentId}-${index}`}
          passage={passage}
          query={query}
          groupByDocument
          onExplain={onExplain}
          explaining={explainingId === `${passage.documentId}-${index}`}
        />
      ))}
    </div>
  );
}

export default function AIDocumentSearchPanel({
  documentId = null,
  subjectId = null,
  subjectName = "",
  document = null,
  documentTitle = "",
  compact = false,
  className,
}) {
  const supported = document
    ? isAiDocumentSearchSupported(document)
    : Boolean(documentId || subjectId);

  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [explaining, setExplaining] = useState(false);
  const [explainingId, setExplainingId] = useState(null);
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [aiExplanation, setAiExplanation] = useState(null);
  const searchSessionRef = useRef(0);

  const groupByDocument = Boolean(subjectId && !documentId);
  const isCompactSearch = true;

  const groupedResults = useMemo(() => {
    if (!groupByDocument) return [];

    const map = new Map();

    for (const item of results) {
      const key = item.documentId;
      if (!map.has(key)) {
        map.set(key, {
          documentId: item.documentId,
          documentTitle: item.documentTitle,
          subjectName: item.subjectName,
          items: [],
        });
      }
      map.get(key).items.push(item);
    }

    return Array.from(map.values());
  }, [results, groupByDocument]);

  const scopeHint = documentId
    ? `Search within ${documentTitle || "this document"}`
    : `Search within ${subjectName || "subject"} materials`;

  const handleSearch = useCallback(async () => {
    const trimmed = query.trim();

    if (trimmed.length < 2) {
      toast.error("Please enter at least 2 characters.");
      return;
    }

    if (!documentId && !subjectId) {
      toast.error("Search scope could not be determined.");
      return;
    }

    const session = searchSessionRef.current + 1;
    searchSessionRef.current = session;
    setLoading(true);
    setResults([]);
    setAiExplanation(null);
    setSearched(false);

    const response = await searchInsideDocument({
      query: trimmed,
      documentId: documentId || undefined,
      subjectId: !documentId ? subjectId || undefined : undefined,
      limit: 5,
    });

    if (searchSessionRef.current !== session) return;

    setLoading(false);
    setSearched(true);

    if (!response.success) {
      toast.error(response.message || "Could not search within documents.");
      return;
    }

    setResults(response.data?.results ?? []);
  }, [query, documentId, subjectId]);

  const handleExplain = useCallback(
    async (passages) => {
      const trimmed = query.trim();
      if (!trimmed || !passages?.length) return;

      setExplaining(true);
      setExplainingId(
        passages.length === 1
          ? `${passages[0].documentId}-${passages[0].excerpt?.slice(0, 12)}`
          : "all",
      );

      const response = await explainDocumentSearch({
        query: trimmed,
        passages,
      });

      setExplaining(false);
      setExplainingId(null);

      if (!response.success) {
        toast.error(response.message || "Could not generate AI explanation.");
        return;
      }

      setAiExplanation(response.data);
    },
    [query],
  );

  if (!supported) {
    return null;
  }

  const hasResults = results.length > 0;
  const resultCount = groupByDocument
    ? groupedResults.reduce((sum, group) => sum + group.items.length, 0)
    : results.length;

  const flatResultCards = !groupByDocument
    ? results.map((passage, index) => (
        <PassageCard
          key={`${passage.documentId}-${index}`}
          passage={passage}
          query={query}
          onExplain={handleExplain}
          explaining={explaining}
        />
      ))
    : groupedResults.map((group) => (
        <DocumentGroup
          key={group.documentId}
          group={group}
          query={query}
          onExplain={handleExplain}
          explainingId={explainingId}
        />
      ));

  return (
    <div className={cn("space-y-4 min-h-0", className)}>
      <div className="shrink-0">
        <p className="text-xs text-muted-foreground mb-2">{scopeHint}</p>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 min-w-0">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleSearch();
              }
            }}
            placeholder="Search concepts, keywords, definitions..."
            disabled={loading}
            className={cn(
              "flex-1 min-w-0 rounded-xl bg-background text-foreground border border-border outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50",
              isCompactSearch
                ? "h-7 px-3 text-xs"
                : "h-10 px-4 text-sm",
            )}
          />
          <button
            type="button"
            onClick={handleSearch}
            disabled={loading}
            className={cn(
              "inline-flex items-center justify-center gap-1 rounded-full bg-primary text-primary-foreground font-medium shrink-0 whitespace-nowrap hover:bg-primary/90 disabled:opacity-50",
              isCompactSearch
                ? "h-7 px-3 text-[11px] sm:w-auto w-full"
                : "h-10 px-4 text-sm",
            )}
          >
            {loading ? (
              <Loader2
                className={cn(
                  "animate-spin shrink-0",
                  isCompactSearch ? "h-3 w-3" : "h-4 w-4",
                )}
              />
            ) : (
              <Search
                className={cn(
                  "shrink-0",
                  isCompactSearch ? "h-3 w-3" : "h-4 w-4",
                )}
                strokeWidth={isCompactSearch ? 2 : 1.5}
              />
            )}
            Search
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          Searching documents...
        </p>
      ) : null}

      {!loading && hasResults ? (
        <div className="space-y-3 min-h-0">
          <WidgetScrollArea
            itemCount={resultCount}
            maxHeightClass={LEARNING_RESOURCE_SCROLL_MAX}
            listClassName="space-y-2"
            scrollHint="Scroll for more"
            visibleItems={VISIBLE_RESULT_ITEMS}
          >
            {flatResultCards}
          </WidgetScrollArea>

          {results.length > 1 ? (
            <ExplainButton
              onClick={() => handleExplain(results)}
              loading={explaining && explainingId === "all"}
              label="Explain all with AI"
            />
          ) : null}
        </div>
      ) : null}

      {!loading && searched && !hasResults ? (
        <p className="text-sm text-muted-foreground">
          No matching content found.
        </p>
      ) : null}

      {aiExplanation ? (
        <div className="rounded-xl bg-primary/5 border border-primary/10 p-3 space-y-2">
          <p className="text-xs font-semibold text-foreground">AI Explanation</p>
          <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {aiExplanation.answer || NOT_ENOUGH_INFO}
          </p>
          {(aiExplanation.passageReasons ?? []).length > 0 ? (
            <div className="space-y-1 pt-1">
              {aiExplanation.passageReasons.map((item) => (
                <p key={item.documentId} className="text-[11px] text-muted-foreground">
                  {item.reason}
                </p>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
