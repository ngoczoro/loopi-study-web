import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Search,
  X,
  BookOpen,
  FileText,
  StickyNote,
  CalendarDays,
  Brain,
  Loader2,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const categoryMap = {
  "/subjects": "subjects",
  "/notes": "notes",
  "/planner": "tasks",
  "/quiz": "quizzes",
};

const categoryLabels = {
  all: { label: "All", emoji: "" },
  subjects: { label: "Subjects", emoji: "📚" },
  documents: { label: "Documents", emoji: "📄" },
  notes: { label: "Notes", emoji: "📝" },
  tasks: { label: "Tasks", emoji: "📅" },
  quizzes: { label: "Quizzes", emoji: "🧪" },
};

const RECENT_KEY = "study-beaver-recent-searches";

function getRecentSearches() {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]").slice(0, 5);
  } catch {
    return [];
  }
}

function saveRecentSearch(q) {
  const recent = getRecentSearches().filter((r) => r !== q);
  recent.unshift(q);
  localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, 5)));
}

function highlightMatch(text, query) {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;

  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-primary/30 text-foreground rounded-sm px-0.5">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [recentSearches] = useState(getRecentSearches());

  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();

  const subjects = useAppStore((s) => s.subjects || []);
  const documents = useAppStore((s) => s.documents || []);
  const quizzes = useAppStore((s) => s.quizzes || []);
  const sessions = useAppStore((s) => s.sessions || []);

  const activeFilter = categoryMap[location.pathname] || "all";

  // SEARCH
  const performSearch = useCallback(
    (q) => {
      if (!q.trim()) {
        setResults([]);
        setLoading(false);
        return;
      }

      const lower = q.toLowerCase();
      const out = [];

      subjects.forEach((s) => {
        if (s.name.toLowerCase().includes(lower)) {
          out.push({
            id: s.id,
            title: s.name,
            subtitle: `${s.credits} credits`,
            category: "subjects",
            icon: BookOpen,
            route: "/subjects",
          });
        }
      });

      documents.forEach((d) => {
        if (d.title.toLowerCase().includes(lower)) {
          out.push({
            id: d.id,
            title: d.title,
            category: "documents",
            icon: FileText,
            route: "/subjects",
          });
        }
      });

      quizzes.forEach((qz) => {
        if (qz.title.toLowerCase().includes(lower)) {
          out.push({
            id: qz.id,
            title: qz.title,
            category: "quizzes",
            icon: Brain,
            route: "/quiz",
          });
        }
      });

      sessions.forEach((s) => {
        if (s.title.toLowerCase().includes(lower)) {
          out.push({
            id: s.id,
            title: s.title,
            category: "tasks",
            icon: CalendarDays,
            route: "/planner",
          });
        }
      });

      setResults(out);
      setSelectedIdx(0);
      setLoading(false);
    },
    [subjects, documents, quizzes, sessions],
  );

  // debounce
  useEffect(() => {
    if (!query.trim()) return;
    setLoading(true);
    const t = setTimeout(() => performSearch(query), 300);
    return () => clearTimeout(t);
  }, [query, performSearch]);

  // GROUP
  const grouped = results.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  // SELECT
  const handleSelect = (item) => {
    navigate(item.route);
    saveRecentSearch(item.title);
    setOpen(false);
  };

  // KEYBOARD
  const handleKeyDown = (e) => {
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
      handleSelect(results[selectedIdx]);
    }

    if (e.key === "Escape") {
      setOpen(false);
    }
  };

  useEffect(() => {
    if (!query.trim()) return;
    setLoading(true);
    const t = setTimeout(() => performSearch(query), 300);
    return () => clearTimeout(t);
  }, [query, performSearch]);

  return (
    <div className="relative hidden sm:block">
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
        placeholder={
          activeFilter !== "all"
            ? `Search in ${categoryLabels[activeFilter].label}...`
            : "Search anything..."
        }
        className="h-9 w-72 rounded-full bg-secondary/50 pl-9 pr-9 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all"
      />
      {query && (
        <button
          onClick={() => {
            setQuery("");
            setResults([]);
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}

      {open && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 mt-2 w-96 bg-popover border border-border/50 rounded-2xl shadow-lg overflow-hidden z-50 animate-in fade-in-0 slide-in-from-top-2 duration-200"
        >
          {activeFilter !== "all" && (
            <div className="px-4 py-2 border-b border-border/30 flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                Filtering:
              </span>
              <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                {categoryLabels[activeFilter].emoji}{" "}
                {categoryLabels[activeFilter].label}
              </span>
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-6 gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Searching...</span>
            </div>
          )}

          {!loading && query && results.length === 0 && (
            <div className="py-8 text-center text-muted-foreground text-sm">
              No results found for "{query}"
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="max-h-80 overflow-y-auto py-1">
              {Object.entries(grouped).map(([cat, items]) => (
                <div key={cat}>
                  <div className="px-4 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {categoryLabels[cat]?.emoji}
                    {categoryLabels[cat]?.label}
                  </div>
                  {items.map((item) => {
                    const thisIdx = flatIdx++;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSelect(item)}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
                          thisIdx === selectedIdx
                            ? "bg-primary/10"
                            : "hover:bg-secondary/60",
                        )}
                      >
                        <item.icon
                          className="h-4 w-4 text-primary shrink-0"
                          strokeWidth={1.5}
                        />
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-foreground truncate">
                            {highlightMatch(item.title, query)}
                          </div>
                          {item.subtitle && (
                            <div className="text-xs text-muted-foreground truncate">
                              {highlightMatch(item.subtitle, query)}
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}

          {!loading && !query && recentSearches.length > 0 && (
            <div className="py-2">
              <div className="px-4 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Recent Searches
              </div>
              {recentSearches.map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    setQuery(r);
                    setOpen(true);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-secondary/60 transition-colors"
                >
                  <Search className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm text-foreground">{r}</span>
                </button>
              ))}
            </div>
          )}

          {!loading && !query && recentSearches.length === 0 && (
            <div className="py-6 text-center text-muted-foreground text-sm">
              Start typing to search...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
