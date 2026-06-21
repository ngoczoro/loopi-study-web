import { useCallback, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Loader2, Search, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  explainDocumentSearch,
  isAiDocumentSearchSupported,
  searchInsideDocument,
} from "@/services/aiService";

const NOT_ENOUGH_INFO =
  "Tài liệu hiện có chưa đủ thông tin để trả lời câu hỏi này.";

const EXCERPT_PREVIEW_LINES = 3;

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
    <div className="rounded-xl border border-primary/10 bg-primary/5 p-3 space-y-2">
      {groupByDocument ? null : (
        <div className="flex items-start justify-between gap-2">
          <p
            className="text-sm font-medium text-foreground truncate"
            title={passage.documentTitle}
          >
            {passage.documentTitle}
          </p>
          {passage.subjectName ? (
            <span className="text-[10px] text-muted-foreground shrink-0">
              {passage.subjectName}
            </span>
          ) : null}
        </div>
      )}

      <div>
        <p
          className={cn(
            "text-sm text-foreground/90 whitespace-pre-wrap",
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
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {shouldTruncate ? (
            <button
              type="button"
              onClick={() => setExpanded((prev) => !prev)}
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              {expanded ? (
                <>
                  <ChevronUp className="h-3 w-3" />
                  Thu gọn
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3" />
                  Xem thêm
                </>
              )}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => onExplain([passage])}
            disabled={explaining}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline disabled:opacity-50"
          >
            {explaining ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Sparkles className="h-3 w-3" />
            )}
            Giải thích bằng AI
          </button>
          {typeof passage.score === "number" ? (
            <span className="text-[10px] text-muted-foreground ml-auto">
              {Math.round(passage.score * 100)}% liên quan
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function DocumentGroup({ group, query, onExplain, explainingId }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p
          className="text-sm font-semibold text-foreground truncate"
          title={group.documentTitle}
        >
          {group.documentTitle}
        </p>
        {group.subjectName ? (
          <span className="text-[10px] text-muted-foreground shrink-0">
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

  const scopeLabel = documentId
    ? documentTitle || "tài liệu này"
    : subjectName
      ? `môn ${subjectName}`
      : "tài liệu môn học";

  const handleSearch = useCallback(async () => {
    const trimmed = query.trim();

    if (trimmed.length < 2) {
      toast.error("Vui lòng nhập ít nhất 2 ký tự.");
      return;
    }

    if (!documentId && !subjectId) {
      toast.error("Không xác định được phạm vi tìm kiếm.");
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
      toast.error(response.message || "Không thể tìm kiếm trong tài liệu.");
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
        toast.error(response.message || "Không thể tạo giải thích AI.");
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

  return (
    <div
      className={cn(
        "rounded-2xl border border-primary/10 bg-gradient-to-br from-primary/5 to-transparent",
        compact ? "p-3" : "p-4",
        className,
      )}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Search className="h-4 w-4 text-primary" strokeWidth={1.5} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            {documentId ? "Tìm trong tài liệu" : "Tìm trong tài liệu môn học"}
          </h3>
          <p className="text-xs text-muted-foreground">
            Tìm kiếm trong {scopeLabel}
          </p>
        </div>
      </div>

      <div
        className={cn(
          "flex gap-2",
          compact ? "flex-col" : "flex-col sm:flex-row",
        )}
      >
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              handleSearch();
            }
          }}
          placeholder="Nhập từ khóa hoặc câu hỏi..."
          disabled={loading}
          className="flex-1 h-10 rounded-xl bg-background px-4 text-sm text-foreground border border-border focus:ring-2 focus:ring-primary/20 outline-none disabled:opacity-50"
        />
        <button
          type="button"
          onClick={handleSearch}
          disabled={loading}
          className="h-10 px-4 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:scale-[1.01] transition-transform disabled:opacity-50 inline-flex items-center justify-center gap-2 shrink-0"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Đang tìm...
            </>
          ) : (
            <>
              <Search className="h-4 w-4" />
              Tìm kiếm
            </>
          )}
        </button>
      </div>

      {loading ? (
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          Đang tìm trong tài liệu...
        </div>
      ) : null}

      {!loading && hasResults ? (
        <div className="mt-4 space-y-3">
          {hasResults && !groupByDocument ? (
            <div className="space-y-2">
              {results.map((passage, index) => (
                <PassageCard
                  key={`${passage.documentId}-${index}`}
                  passage={passage}
                  query={query}
                  onExplain={handleExplain}
                  explaining={explaining}
                />
              ))}
            </div>
          ) : null}

          {hasResults && groupByDocument ? (
            <div className="space-y-4">
              {groupedResults.map((group) => (
                <DocumentGroup
                  key={group.documentId}
                  group={group}
                  query={query}
                  onExplain={handleExplain}
                  explainingId={explainingId}
                />
              ))}
            </div>
          ) : null}

          {results.length > 1 ? (
            <button
              type="button"
              onClick={() => handleExplain(results)}
              disabled={explaining}
              className="w-full h-9 rounded-full border border-primary/20 text-primary text-xs font-medium hover:bg-primary/5 transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              {explaining && explainingId === "all" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              Giải thích tất cả bằng AI
            </button>
          ) : null}
        </div>
      ) : null}

      {!loading && searched && !hasResults ? (
        <p className="mt-4 text-sm text-muted-foreground text-center py-2">
          Không tìm thấy nội dung phù hợp trong tài liệu.
        </p>
      ) : null}

      {aiExplanation ? (
        <div className="mt-4 rounded-xl bg-card p-3 shadow-soft space-y-2">
          <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
            Giải thích AI
          </p>
          <p className="text-sm text-foreground whitespace-pre-wrap">
            {aiExplanation.answer || NOT_ENOUGH_INFO}
          </p>
          {(aiExplanation.passageReasons ?? []).length > 0 ? (
            <div className="space-y-1 pt-1">
              {aiExplanation.passageReasons.map((item) => (
                <p key={item.documentId} className="text-xs text-muted-foreground">
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
