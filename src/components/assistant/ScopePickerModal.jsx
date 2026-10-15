import { useMemo, useState } from "react";
import { FileText, Search, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import GroupModalShell, {
  groupPrimaryButtonClassName,
  groupSecondaryButtonClassName,
} from "@/components/groups/GroupModalShell";
import { listSubjects, pickableSources, sourcesInScope } from "./assistantScope";

const MAX_DOCUMENTS = 10;
const TABS = [
  { id: "all", label: "All documents" },
  { id: "subject", label: "Subject" },
  { id: "documents", label: "Pick documents" },
];

function SourceRow({ source, selectable, checked, disabled, onToggle }) {
  const Icon = source.type === "file" ? Upload : FileText;
  const content = (
    <>
      {selectable && (
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={onToggle}
          className="h-4 w-4 shrink-0 accent-primary"
        />
      )}
      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-foreground">{source.title}</span>
        <span className="block truncate text-[11px] text-muted-foreground">
          {source.subject?.name ?? "No subject"}
        </span>
      </span>
    </>
  );

  return (
    <li className="py-2">
      {selectable ? (
        <label
          className={cn(
            "flex items-center gap-2.5",
            disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
          )}
        >
          {content}
        </label>
      ) : (
        <div className="flex items-center gap-2.5">{content}</div>
      )}
    </li>
  );
}

function ScopeForm({ scope, sources, onCancel, onApply }) {
  const [tab, setTab] = useState(scope?.type ?? "all");
  const subjects = useMemo(() => listSubjects(sources), [sources]);
  const [subjectId, setSubjectId] = useState(
    scope?.type === "subject" ? scope.subjectId : (subjects[0]?.id ?? null),
  );
  const [documentIds, setDocumentIds] = useState(
    scope?.type === "documents" ? scope.documentIds : [],
  );
  const [search, setSearch] = useState("");

  const draft = useMemo(() => {
    if (tab === "subject") return { type: "subject", subjectId };
    if (tab === "documents") return { type: "documents", documentIds };
    return { type: "all" };
  }, [tab, subjectId, documentIds]);

  const listed = useMemo(() => {
    const base = tab === "documents" ? sources : sourcesInScope(draft, sources);
    const query = search.trim().toLowerCase();
    return query ? base.filter((source) => source.title.toLowerCase().includes(query)) : base;
  }, [tab, draft, sources, search]);

  const valid = tab === "all" || (tab === "subject" && subjectId) || documentIds.length > 0;

  const toggleDocument = (id) =>
    setDocumentIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );

  return (
    <div className="space-y-4">
      <div className="flex rounded-full bg-secondary p-1">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn(
              "h-8 flex-1 rounded-full text-xs font-medium transition-colors",
              tab === item.id
                ? "bg-card text-foreground shadow-soft"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "subject" && (
        <div className="flex flex-wrap gap-2">
          {subjects.length === 0 && (
            <p className="text-xs text-muted-foreground">Your documents have no subject yet.</p>
          )}
          {subjects.map((subject) => (
            <button
              key={subject.id}
              type="button"
              onClick={() => setSubjectId(subject.id)}
              className={cn(
                "h-8 rounded-full border px-3 text-xs font-medium transition-colors",
                subjectId === subject.id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {subject.name}
            </button>
          ))}
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search documents"
          className="h-9 w-full rounded-full border border-border bg-background pl-9 pr-4 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <ul className="max-h-72 divide-y divide-border overflow-y-auto pr-1">
        {listed.length === 0 && (
          <li className="py-6 text-center text-sm text-muted-foreground">No documents found.</li>
        )}
        {listed.map((source) => {
          const checked = documentIds.includes(source.id);
          return (
            <SourceRow
              key={source.id}
              source={source}
              selectable={tab === "documents"}
              checked={checked}
              disabled={!checked && documentIds.length >= MAX_DOCUMENTS}
              onToggle={() => toggleDocument(source.id)}
            />
          );
        })}
      </ul>

      {tab === "documents" && (
        <p className="text-xs text-muted-foreground">
          Selected {documentIds.length}/{MAX_DOCUMENTS} documents.
        </p>
      )}

      <div className="flex gap-2">
        <button type="button" onClick={onCancel} className={groupSecondaryButtonClassName}>
          Cancel
        </button>
        <button
          type="button"
          disabled={!valid}
          onClick={() => onApply(draft)}
          className={groupPrimaryButtonClassName}
        >
          Apply
        </button>
      </div>
    </div>
  );
}

export default function ScopePickerModal({ open, scope, sources, onOpenChange, onApply }) {
  return (
    <GroupModalShell
      open={open}
      title="What should the assistant read?"
      description="Answers only use the documents in this scope."
      onClose={() => onOpenChange(false)}
    >
      <ScopeForm
        scope={scope}
        sources={pickableSources(sources)}
        onCancel={() => onOpenChange(false)}
        onApply={(next) => {
          onApply(next);
          onOpenChange(false);
        }}
      />
    </GroupModalShell>
  );
}
