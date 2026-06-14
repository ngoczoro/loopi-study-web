import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  Loader2,
  RefreshCw,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  WidgetScrollArea,
  LEARNING_RESOURCE_SCROLL_MAX,
} from "@/components/WidgetScrollArea";
import {
  deleteSavedLearningResource,
  getResourceRecommendationHistory,
  getResourceRecommendationHistoryById,
  getResourceRecommendations,
  getSavedLearningResources,
  regenerateResourceRecommendations,
  saveLearningResource,
} from "@/services/aiService";

const TYPE_LABELS = {
  documentation: "Tài liệu",
  article: "Bài viết",
  video: "Video",
  course: "Khóa học",
  tutorial: "Hướng dẫn",
};

const TYPE_BADGE_CLASS = {
  documentation: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  article: "bg-purple-500/10 text-purple-700 dark:text-purple-300",
  video: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
  course: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  tutorial: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
};

const HISTORY_FETCH_LIMIT = 20;
const VISIBLE_SIDEBAR_ITEMS = 3;

const getTypeLabel = (type) => TYPE_LABELS[type] ?? type;

const getTypeBadgeClass = (type) =>
  TYPE_BADGE_CLASS[type] ?? "bg-secondary text-secondary-foreground";

const dedupeRecentSearches = (searches = []) => {
  const seen = new Set();
  const unique = [];

  for (const item of searches) {
    const key = String(item.normalizedQuery ?? item.query ?? "")
      .trim()
      .toLowerCase();

    if (!key || seen.has(key)) {
      continue;
    }

    seen.add(key);
    unique.push(item);
  }

  return unique;
};

function SidebarSection({
  title,
  emptyText,
  itemCount,
  children,
  listClassName = "space-y-1.5",
}) {
  return (
    <div className="min-h-0 flex flex-col rounded-xl border border-primary/10 bg-primary/5 p-3">
      <h3 className="text-sm font-semibold text-foreground mb-2 shrink-0">
        {title}
      </h3>
      {itemCount === 0 ? (
        <p className="text-xs text-muted-foreground">{emptyText}</p>
      ) : (
        <WidgetScrollArea
          itemCount={itemCount}
          maxHeightClass={LEARNING_RESOURCE_SCROLL_MAX}
          listClassName={listClassName}
          scrollHint="Cuộn để xem thêm"
          visibleItems={VISIBLE_SIDEBAR_ITEMS}
        >
          {children}
        </WidgetScrollArea>
      )}
    </div>
  );
}

export default function AILearningResourcesPanel({
  subjectId = null,
  subjectName = "",
  layout = "stack",
  className,
}) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [recentSearches, setRecentSearches] = useState([]);
  const [savedResources, setSavedResources] = useState([]);
  const [savedUrls, setSavedUrls] = useState(new Set());
  const [savingId, setSavingId] = useState(null);
  const [removingId, setRemovingId] = useState(null);
  const searchSessionRef = useRef(0);

  const isDashboardLayout = layout === "dashboard";
  const scopeLabel = subjectName ? `cho môn ${subjectName}` : "mọi chủ đề";

  const clearRecommendationResult = useCallback(() => {
    setResult(null);
    setError("");
    setRegenerating(false);
  }, []);

  const loadSidebarData = useCallback(async () => {
    const historyParams = { limit: HISTORY_FETCH_LIMIT };
    const savedParams = {};

    if (subjectId) {
      historyParams.subjectId = subjectId;
      savedParams.subjectId = subjectId;
    }

    const [historyResult, savedResult] = await Promise.all([
      getResourceRecommendationHistory(historyParams),
      getSavedLearningResources(savedParams),
    ]);

    if (historyResult.success) {
      setRecentSearches(historyResult.data ?? []);
    }

    if (savedResult.success) {
      const items = savedResult.data ?? [];
      setSavedResources(items);
      setSavedUrls(new Set(items.map((item) => item.url)));
    }
  }, [subjectId]);

  useEffect(() => {
    loadSidebarData();
  }, [loadSidebarData]);

  const uniqueRecentSearches = useMemo(
    () => dedupeRecentSearches(recentSearches),
    [recentSearches],
  );

  const applyRecommendationResult = (data) => {
    setResult(data);
    setError("");
  };

  const handleQueryChange = (value) => {
    setQuery(value);
    searchSessionRef.current += 1;

    const trimmed = String(value).trim();
    if (!trimmed || result) {
      clearRecommendationResult();
      setLoading(false);
    }
  };

  const handleSearch = async (searchQuery = query) => {
    const trimmed = String(searchQuery ?? "").trim();

    if (!trimmed) {
      toast.error("Vui lòng nhập chủ đề cần tìm.");
      return;
    }

    if (trimmed.length < 2) {
      toast.error("Vui lòng nhập ít nhất 2 ký tự");
      return;
    }

    const session = ++searchSessionRef.current;
    setLoading(true);
    setError("");

    const response = await getResourceRecommendations({
      q: trimmed,
      limit: 5,
      subjectId,
    });

    setLoading(false);

    if (session !== searchSessionRef.current) {
      return;
    }

    if (!response.success) {
      setError(
        response.message ||
          "Không thể tìm nguồn học lúc này. Vui lòng thử lại.",
      );
      return;
    }

    applyRecommendationResult(response.data);
    setQuery(trimmed);
    loadSidebarData();
  };

  const handleRegenerate = async () => {
    const trimmed = String(result?.query ?? query).trim();
    if (trimmed.length < 2) return;

    setRegenerating(true);
    setError("");

    const response = await regenerateResourceRecommendations({
      q: trimmed,
      limit: 5,
      subjectId,
    });

    setRegenerating(false);

    if (!response.success) {
      setError(
        response.message ||
          "Không thể tìm nguồn học lúc này. Vui lòng thử lại.",
      );
      return;
    }

    applyRecommendationResult(response.data);
    loadSidebarData();
  };

  const handleRecentClick = async (historyItem) => {
    const session = ++searchSessionRef.current;
    setLoading(true);
    setError("");

    const response = await getResourceRecommendationHistoryById(historyItem.id);

    setLoading(false);

    if (session !== searchSessionRef.current) {
      return;
    }

    if (!response.success) {
      setError(response.message || "Không thể tải kết quả đã lưu.");
      return;
    }

    const restoredQuery = response.data.query ?? historyItem.query ?? "";
    setQuery(restoredQuery);
    applyRecommendationResult(response.data);
  };

  const handleSaveResource = async (resource) => {
    if (savedUrls.has(resource.url)) return;

    setSavingId(resource.resourceId);

    const response = await saveLearningResource({
      resourceId: resource.resourceId,
      title: resource.title,
      type: resource.type,
      provider: resource.provider,
      url: resource.url,
      reason: resource.reason,
      topics: resource.topics,
      ...(subjectId ? { subjectId } : {}),
      sourceQuery: result?.query ?? query,
    });

    setSavingId(null);

    if (!response.success) {
      toast.error(response.message || "Không thể lưu nguồn học");
      return;
    }

    toast.success("Đã lưu nguồn học");
    loadSidebarData();
  };

  const handleRemoveSaved = async (saved) => {
    setRemovingId(saved.id);

    const response = await deleteSavedLearningResource(saved.id);

    setRemovingId(null);

    if (!response.success) {
      toast.error(response.message || "Không thể xóa nguồn đã lưu");
      return;
    }

    toast.success("Đã xóa nguồn học");
    loadSidebarData();
  };

  const recentSearchItems = uniqueRecentSearches.map((item) => (
    <button
      key={item.id}
      type="button"
      onClick={() => handleRecentClick(item)}
      className="w-full text-left text-sm px-3 py-2 rounded-lg hover:bg-primary/10 transition-colors truncate text-foreground"
      title={item.query}
    >
      {item.query}
    </button>
  ));

  const savedResourceItems = savedResources.map((saved) => (
    <div
      key={saved.id}
      className="rounded-lg bg-background/70 border border-border/60 p-2.5 min-w-0"
    >
      <div className="min-w-0">
        <p
          className="text-sm font-medium text-foreground truncate"
          title={saved.title}
        >
          {saved.title}
        </p>
        <p
          className="text-xs text-muted-foreground truncate mt-0.5"
          title={`${getTypeLabel(saved.type)} · ${saved.provider}`}
        >
          {getTypeLabel(saved.type)} · {saved.provider}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-1.5 mt-2">
        <a
          href={saved.url}
          target="_blank"
          rel="noopener noreferrer"
          className="h-7 px-2.5 rounded-full bg-primary text-primary-foreground text-[11px] font-medium inline-flex items-center gap-1 hover:bg-primary/90"
        >
          <ExternalLink className="h-3 w-3" /> Open
        </a>
        <button
          type="button"
          onClick={() => handleRemoveSaved(saved)}
          disabled={removingId === saved.id}
          className="h-7 px-2.5 rounded-full border border-border text-[11px] font-medium hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
        >
          {removingId === saved.id ? "..." : "Remove"}
        </button>
      </div>
    </div>
  ));

  const recentSearchSection = (
    <SidebarSection
      title="Tìm kiếm gần đây"
      emptyText="Chưa có tìm kiếm nào."
      itemCount={uniqueRecentSearches.length}
    >
      {recentSearchItems}
    </SidebarSection>
  );

  const savedResourcesSection = (
    <SidebarSection
      title="Nguồn học đã lưu"
      emptyText="Chưa có nguồn nào được lưu."
      itemCount={savedResources.length}
      listClassName="space-y-2"
    >
      {savedResourceItems}
    </SidebarSection>
  );

  return (
    <div className={cn("space-y-4 min-h-0", className)}>
      <div className="shrink-0">
        <p className="text-xs text-muted-foreground mb-2">
          Bạn muốn học gì hôm nay? ({scopeLabel})
        </p>
        <div className="flex gap-2">
          <input
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
            placeholder="Java OOP, React Hook, SQL Normalization..."
            className="flex-1 h-10 rounded-xl bg-background px-4 text-sm text-foreground border border-border outline-none focus:ring-2 focus:ring-primary/20"
          />
          <button
            type="button"
            onClick={() => handleSearch()}
            disabled={loading}
            className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium inline-flex items-center gap-2 hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            Tìm kiếm
          </button>
        </div>
      </div>

      {loading && !result ? (
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Đang tìm nguồn học phù hợp...
        </p>
      ) : null}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {result ? (
        <div className="space-y-3 min-h-0">
          <div className="flex flex-wrap items-center gap-2">
            {result.fromCache ? (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                Đã lưu từ lần tìm trước
              </span>
            ) : null}
            <button
              type="button"
              onClick={handleRegenerate}
              disabled={regenerating}
              className="text-xs font-medium text-primary inline-flex items-center gap-1 hover:underline disabled:opacity-50"
            >
              {regenerating ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
              Tạo lại gợi ý
            </button>
          </div>

          {result.resources?.length ? (
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {result.resources.map((resource) => {
                const isSaved = savedUrls.has(resource.url);

                return (
                  <div
                    key={`${resource.resourceId}-${resource.url}`}
                    className="rounded-xl border border-primary/10 p-4 bg-primary/5 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p
                          className="text-sm font-semibold text-foreground truncate"
                          title={resource.title}
                        >
                          {resource.title}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span
                            className={cn(
                              "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                              getTypeBadgeClass(resource.type),
                            )}
                          >
                            {getTypeLabel(resource.type)}
                          </span>
                          <span className="text-xs text-muted-foreground truncate">
                            {resource.provider}
                          </span>
                        </div>
                      </div>
                    </div>

                    {resource.reason ? (
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                        {resource.reason}
                      </p>
                    ) : null}

                    <div className="flex items-center gap-2">
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-8 px-3 rounded-full bg-primary text-primary-foreground text-xs font-medium inline-flex items-center gap-1.5 hover:bg-primary/90"
                      >
                        <ExternalLink className="h-3 w-3" /> Open
                      </a>
                      {isSaved ? (
                        <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1">
                          <BookmarkCheck className="h-3.5 w-3.5" /> Saved
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSaveResource(resource)}
                          disabled={savingId === resource.resourceId}
                          className="h-8 px-3 rounded-full border border-border text-xs font-medium inline-flex items-center gap-1.5 hover:bg-secondary disabled:opacity-50"
                        >
                          {savingId === resource.resourceId ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Bookmark className="h-3 w-3" />
                          )}
                          Save
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Không tìm thấy nguồn học phù hợp.
            </p>
          )}

          {result.learningPath?.length ? (
            <div className="rounded-xl bg-primary/5 border border-primary/10 p-3">
              <p className="text-xs font-semibold text-foreground mb-2">
                Lộ trình gợi ý
              </p>
              <ol className="list-decimal list-inside space-y-1">
                {result.learningPath.map((step, index) => (
                  <li key={index} className="text-xs text-muted-foreground">
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          ) : null}
        </div>
      ) : null}

      {isDashboardLayout ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-h-0">
          {recentSearchSection}
          {savedResourcesSection}
        </div>
      ) : (
        <div className="space-y-4 min-h-0">
          {recentSearchSection}
          {savedResourcesSection}
        </div>
      )}
    </div>
  );
}
