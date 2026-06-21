import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  X,
  User,
  BookOpen,
  FileText,
  Brain,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { adminGlobalSearch } from "@/services/adminSearchService";

const GROUP_ORDER = ["users", "subjects", "documents", "quizzes", "violations"];

const GROUP_CONFIG = {
  users: { label: "Users", icon: User },
  subjects: { label: "Subjects", icon: BookOpen },
  documents: { label: "Documents", icon: FileText },
  quizzes: { label: "Quizzes", icon: Brain },
  violations: { label: "Violations", icon: AlertTriangle },
};

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 300;

function highlightMatch(text, query) {
  const safeText = String(text ?? "");
  if (!query) return safeText;

  const idx = safeText.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return safeText;

  return (
    <>
      {safeText.slice(0, idx)}
      <mark className="bg-primary/30 text-foreground rounded-sm px-0.5">
        {safeText.slice(idx, idx + query.length)}
      </mark>
      {safeText.slice(idx + query.length)}
    </>
  );
}

function normalizeResults(data) {
  const buckets = {
    users: [],
    subjects: [],
    documents: [],
    quizzes: [],
    violations: [],
  };

  (data?.users ?? []).forEach((item) => {
    buckets.users.push({
      id: item.id,
      category: "users",
      title: item.fullName || "Unknown user",
      subtitle: item.email || "",
      avatarUrl: item.avatarUrl,
      meta: item,
    });
  });

  (data?.subjects ?? []).forEach((item) => {
    buckets.subjects.push({
      id: item.id,
      category: "subjects",
      title: item.name || "Untitled subject",
      subtitle:
        typeof item.documentCount === "number"
          ? `${item.documentCount} document${item.documentCount === 1 ? "" : "s"}`
          : "",
      meta: item,
    });
  });

  (data?.documents ?? []).forEach((item) => {
    buckets.documents.push({
      id: item.id,
      category: "documents",
      title: item.title || item.fileName || "Untitled document",
      subtitle: [item.ownerName, item.subjectName].filter(Boolean).join(" · "),
      meta: item,
    });
  });

  (data?.quizzes ?? []).forEach((item) => {
    buckets.quizzes.push({
      id: item.id,
      category: "quizzes",
      title: item.title || "Untitled quiz",
      subtitle: item.questionCount
        ? `${item.questionCount} question${item.questionCount === 1 ? "" : "s"}`
        : "",
      meta: item,
    });
  });

  (data?.violations ?? []).forEach((item) => {
    buckets.violations.push({
      id: item.id,
      category: "violations",
      title: item.title || item.typeLabel || `Violation #${item.id.slice(0, 8)}`,
      subtitle: [item.userName, item.status].filter(Boolean).join(" · "),
      meta: item,
    });
  });

  return GROUP_ORDER.flatMap((key) => buckets[key] ?? []);
}

export function AdminGlobalSearch() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [selectedIdx, setSelectedIdx] = useState(0);

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const searchSessionRef = useRef(0);

  const navigate = useNavigate();

  const trimmedQuery = query.trim();
  const showDropdown = open && trimmedQuery.length >= MIN_QUERY_LENGTH;

  const groupedResults = useMemo(() => {
    const groups = {};

    for (const item of results) {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
    }

    return groups;
  }, [results]);

  const performSearch = useCallback(async (q) => {
    const trimmed = String(q ?? "").trim();
    if (trimmed.length < MIN_QUERY_LENGTH) {
      setResults([]);
      setLoading(false);
      return;
    }

    const session = searchSessionRef.current + 1;
    searchSessionRef.current = session;
    setLoading(true);

    const response = await adminGlobalSearch(trimmed);

    if (searchSessionRef.current !== session) return;

    setLoading(false);

    if (!response.success) {
      setResults([]);
      return;
    }

    const flat = normalizeResults(response.data);
    setResults(flat);
    setSelectedIdx(0);
  }, []);

  useEffect(() => {
    if (trimmedQuery.length < MIN_QUERY_LENGTH) {
      setResults([]);
      setLoading(false);
      return;
    }

    const timer = setTimeout(() => performSearch(trimmedQuery), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [trimmedQuery, performSearch]);

  const handleSelect = useCallback(
    (item) => {
      if (!item?.id) return;

      setOpen(false);
      setQuery("");
      setResults([]);

      switch (item.category) {
        case "users":
          navigate(
            `/admin/users?search=${encodeURIComponent(item.meta?.email || item.title)}`,
          );
          break;
        case "subjects":
          navigate("/admin/content", { state: { highlightSubjectId: item.id } });
          break;
        case "documents":
          navigate(`/admin/content/${item.id}`);
          break;
        case "quizzes":
          navigate("/admin/content", {
            state: {
              highlightQuizId: item.id,
              highlightQuizTitle: item.title,
            },
          });
          break;
        case "violations":
          navigate("/admin/warnings", { state: { violationId: item.id } });
          break;
        default:
          break;
      }
    },
    [navigate],
  );

  const handleKeyDown = (event) => {
    if (event.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
      return;
    }

    if (!results.length) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedIdx((prev) => (prev + 1) % results.length);
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedIdx((prev) => (prev === 0 ? results.length - 1 : prev - 1));
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const selected = results[selectedIdx];
      if (selected) {
        handleSelect(selected);
      }
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  let flatIndex = -1;

  return (
    <div ref={containerRef} className="relative w-full max-w-md min-w-0">
      <Search
        className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
        strokeWidth={1.5}
      />
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder="Search users, subjects, documents, quizzes..."
        className="h-9 w-full rounded-full bg-secondary/50 pl-9 pr-9 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all"
      />
      {query ? (
        <button
          type="button"
          onClick={() => {
            setQuery("");
            setResults([]);
            setOpen(false);
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          aria-label="Clear search"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}

      {showDropdown ? (
        <div className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border/50 rounded-2xl shadow-lg overflow-hidden z-50 animate-in fade-in-0 slide-in-from-top-2 duration-200">
          {loading ? (
            <div className="flex items-center justify-center py-6 gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-sm">Searching...</span>
            </div>
          ) : results.length === 0 ? (
            <div className="py-8 px-4 text-center text-muted-foreground text-sm">
              No matching results found.
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto py-1">
              {GROUP_ORDER.map((category) => {
                const items = groupedResults[category] ?? [];
                if (!items.length) return null;

                const config = GROUP_CONFIG[category];

                return (
                  <div key={category}>
                    <div className="px-4 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {config.label}
                    </div>
                    {items.map((item) => {
                      flatIndex += 1;
                      const itemIndex = flatIndex;
                      const Icon = config.icon;

                      return (
                        <button
                          key={`${category}-${item.id}`}
                          type="button"
                          onClick={() => handleSelect(item)}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
                            itemIndex === selectedIdx
                              ? "bg-primary/10"
                              : "hover:bg-primary/5",
                          )}
                        >
                          {category === "users" && item.avatarUrl ? (
                            <img
                              src={item.avatarUrl}
                              alt=""
                              className="h-8 w-8 rounded-full object-cover shrink-0 ring-2 ring-primary/10"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                              <Icon
                                className="h-4 w-4 text-primary"
                                strokeWidth={1.5}
                              />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div
                              className="text-sm font-medium text-foreground truncate"
                              title={item.title}
                            >
                              {highlightMatch(item.title, trimmedQuery)}
                            </div>
                            {item.subtitle ? (
                              <div className="text-xs text-muted-foreground truncate">
                                {item.subtitle}
                              </div>
                            ) : null}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
