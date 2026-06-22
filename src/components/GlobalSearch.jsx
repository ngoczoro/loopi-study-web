import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  X,
  BookOpen,
  StickyNote,
  Brain,
  FileText,
  Loader2,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const GROUP_ORDER = ["subjects", "documents", "quizzes", "notes"];

const GROUP_CONFIG = {
  subjects: { label: "Subjects", icon: BookOpen },
  documents: { label: "Documents", icon: FileText },
  quizzes: { label: "Quizzes", icon: Brain },
  notes: { label: "Notes", icon: StickyNote },
};

const RECENT_KEY = "study-beaver-recent-searches";
const MIN_QUERY_LENGTH = 2;
const MAX_PER_GROUP = 5;
const DEBOUNCE_MS = 200;

function getRecentSearches() {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]").slice(0, 5);
  } catch {
    return [];
  }
}

function saveRecentSearch(q) {
  const trimmed = String(q ?? "").trim();
  if (!trimmed) return;
  const recent = getRecentSearches().filter((r) => r !== trimmed);
  recent.unshift(trimmed);
  localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, 5)));
}

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

function matchesQuery(text, lowerQuery) {
  return String(text ?? "")
    .toLowerCase()
    .includes(lowerQuery);
}

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [selectedIdx, setSelectedIdx] = useState(0);

  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const navigate = useNavigate();

  const subjects = useAppStore((s) => s.subjects ?? []);
  const content = useAppStore((s) => s.content ?? []);
  const quizzes = useAppStore((s) => s.quizzes ?? []);
  const fetchSubjects = useAppStore((s) => s.fetchSubjects);
  const fetchContent = useAppStore((s) => s.fetchContent);
  const fetchQuizzes = useAppStore((s) => s.fetchQuizzes);

  const trimmedQuery = query.trim();
  const showDropdown = open && trimmedQuery.length >= MIN_QUERY_LENGTH;

  useEffect(() => {
    fetchSubjects?.();
    fetchContent?.();
    fetchQuizzes?.();
  }, [fetchSubjects, fetchContent, fetchQuizzes]);

  const performSearch = useCallback(
    (q) => {
      const trimmed = String(q ?? "").trim();
      if (trimmed.length < MIN_QUERY_LENGTH) {
        setResults([]);
        setLoading(false);
        return;
      }

      const lower = trimmed.toLowerCase();
      const buckets = {
        subjects: [],
        documents: [],
        quizzes: [],
        notes: [],
      };

      (Array.isArray(subjects) ? subjects : []).forEach((subject) => {
        if (buckets.subjects.length >= MAX_PER_GROUP) return;
        if (!matchesQuery(subject?.name, lower)) return;

        buckets.subjects.push({
          id: subject.id,
          title: subject.name ?? "Untitled subject",
          subtitle: subject.credits ? `${subject.credits} credits` : "",
          category: "subjects",
          icon: BookOpen,
        });
      });

      (Array.isArray(content) ? content : []).forEach((item) => {
        const title = item?.title ?? "";
        const body = item?.content ?? "";
        if (!matchesQuery(title, lower) && !matchesQuery(body, lower)) {
          return;
        }

        const type = item?.type ?? "note";
        const isNote = type === "note";
        const bucket = isNote ? "notes" : "documents";

        if (buckets[bucket].length >= MAX_PER_GROUP) return;

        buckets[bucket].push({
          id: item.id,
          title: title || "Untitled",
          subtitle: type,
          category: bucket,
          icon: isNote ? StickyNote : FileText,
        });
      });

      (Array.isArray(quizzes) ? quizzes : []).forEach((quiz) => {
        if (buckets.quizzes.length >= MAX_PER_GROUP) return;
        if (!matchesQuery(quiz?.title, lower)) return;

        buckets.quizzes.push({
          id: quiz.id,
          title: quiz.title ?? "Untitled quiz",
          subtitle: Array.isArray(quiz.questions)
            ? `${quiz.questions.length} questions`
            : "",
          category: "quizzes",
          icon: Brain,
        });
      });

      const flat = GROUP_ORDER.flatMap((key) => buckets[key] ?? []);
      setResults(flat);
      setSelectedIdx(0);
      setLoading(false);
    },
    [subjects, content, quizzes],
  );

  useEffect(() => {
    if (trimmedQuery.length < MIN_QUERY_LENGTH) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(() => performSearch(trimmedQuery), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [trimmedQuery, performSearch]);

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

  const handleSelect = useCallback(
    (item) => {
      if (!item?.id) return;

      saveRecentSearch(item.title);
      setOpen(false);
      setQuery("");
      setResults([]);

      switch (item.category) {
        case "subjects":
          navigate("/subjects", { state: { subjectId: item.id } });
          break;
        case "documents":
        case "notes":
          navigate("/notes", { state: { contentId: item.id } });
          break;
        case "quizzes":
          navigate("/quiz", { state: { activeQuizId: item.id } });
          break;
        default:
          break;
      }
    },
    [navigate],
  );

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
      return;
    }

    if (!results.length) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIdx((prev) => (prev + 1) % results.length);
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIdx((prev) => (prev === 0 ? results.length - 1 : prev - 1));
    }

    if (e.key === "Enter") {
      e.preventDefault();
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
    <div ref={containerRef} className="relative hidden sm:block">
      <Search
        className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
        strokeWidth={1.5}
      />
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder="Search documents, notes, quizzes..."
        className="h-9 w-80 max-w-[min(20rem,calc(100vw-12rem))] rounded-full bg-secondary/50 pl-9 pr-9 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all"
      />
      {query && (
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
      )}

      {showDropdown && (
        <div className="absolute top-full left-0 mt-2 w-96 max-w-[calc(100vw-2rem)] bg-popover border border-border/50 rounded-2xl shadow-lg overflow-hidden z-50 animate-in fade-in-0 slide-in-from-top-2 duration-200">
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
                      const Icon = item.icon ?? config.icon;

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
                          <Icon
                            className="h-4 w-4 text-primary shrink-0"
                            strokeWidth={1.5}
                          />
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
      )}
    </div>
  );
}
