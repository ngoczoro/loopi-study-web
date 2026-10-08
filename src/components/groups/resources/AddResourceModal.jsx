import { useMemo, useState } from "react";
import { Check, Link2, Loader2, Search, StickyNote } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useCreateGroupResource, useShareableContent } from "@/hooks/queries/groups";
import GroupModalShell, {
  groupInputClassName,
  groupPrimaryButtonClassName,
  groupSecondaryButtonClassName,
} from "../GroupModalShell";
import { FileBadge } from "../chat/MessageAttachments";
import { formatFileSize } from "../chat/chatFormat";

const TITLE_MAX = 200;
const DESCRIPTION_MAX = 500;

const SOURCES = [
  { id: "link", label: "Link" },
  { id: "note", label: "My notes" },
  { id: "file", label: "My files" },
];

const isHttpUrl = (value) => /^https?:\/\/\S+$/i.test(value.trim());

function ContentPicker({ type, selectedId, onSelect, disabled }) {
  const { items, isLoading, error, refetch } = useShareableContent();
  const [search, setSearch] = useState("");

  const options = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return items
      .filter((item) => item.type === type)
      .filter((item) => (type === "file" ? Boolean(item.fileUrl) : true))
      .filter(
        (item) =>
          !keyword ||
          item.title?.toLowerCase().includes(keyword) ||
          item.fileName?.toLowerCase().includes(keyword),
      );
  }, [items, type, search]);

  if (isLoading) {
    return (
      <div className="h-40 flex items-center justify-center">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-40 flex flex-col items-center justify-center gap-1 text-center">
        <p className="text-xs text-destructive">{error}</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="text-xs font-medium text-primary hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          disabled={disabled}
          placeholder={type === "note" ? "Search your notes" : "Search your files"}
          className={`${groupInputClassName} h-9 pl-9`}
        />
      </div>
      <ul className="max-h-56 overflow-y-auto rounded-xl border border-border divide-y divide-border">
        {options.length === 0 ? (
          <li className="p-4 text-center text-xs text-muted-foreground">
            {type === "note"
              ? "No notes found. Create notes in the Notes page first."
              : "No uploaded files found. Upload files in Subjects first."}
          </li>
        ) : (
          options.map((item) => {
            const selected = item.id === selectedId;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onSelect(item)}
                  aria-pressed={selected}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 text-left transition-colors",
                    selected ? "bg-primary/10" : "hover:bg-secondary/60",
                  )}
                >
                  {type === "note" ? (
                    <span className="h-9 w-9 rounded-lg bg-amber-500/15 text-amber-600 inline-flex items-center justify-center shrink-0">
                      <StickyNote className="h-4 w-4" />
                    </span>
                  ) : (
                    <FileBadge name={item.fileName} className="h-9 w-9" />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-foreground truncate">
                      {item.title}
                    </span>
                    <span className="block text-xs text-muted-foreground truncate">
                      {type === "note"
                        ? (item.content ?? "").split("\n")[0] || "Empty note"
                        : `${item.fileName ?? "File"} · ${formatFileSize(item.fileSize)}`}
                    </span>
                  </span>
                  {selected && <Check className="h-4 w-4 text-primary shrink-0" />}
                </button>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}

// Mounted only while the modal is open, so every opening starts from a clean form.
function AddResourceForm({ mutation: createResource, onCancel, onDone }) {
  const [source, setSource] = useState("link");
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [picked, setPicked] = useState(null);
  const busy = createResource.isPending;

  const switchSource = (next) => {
    if (busy || next === source) return;
    setSource(next);
    setPicked(null);
    setTitle("");
    createResource.reset();
  };

  const pick = (item) => {
    setPicked(item);
    setTitle(item.title ?? "");
  };

  const urlInvalid = source === "link" && url.trim() !== "" && !isHttpUrl(url);
  const canSubmit =
    !busy &&
    title.trim().length > 0 &&
    (source === "link" ? isHttpUrl(url) : Boolean(picked));

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSubmit) return;
    const base = {
      type: source,
      title: title.trim(),
      description: description.trim() || null,
    };
    const payload =
      source === "link"
        ? { ...base, url: url.trim() }
        : { ...base, refId: picked.id, refPreview: picked };

    try {
      await createResource.mutateAsync(payload);
      toast.success("Resource shared with the group");
      onDone();
    } catch {
      // error is rendered below from mutation state
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex rounded-full bg-secondary p-1">
        {SOURCES.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => switchSource(item.id)}
            className={cn(
              "flex-1 h-8 rounded-full text-xs font-medium transition-colors",
              source === item.id
                ? "bg-card text-foreground shadow-soft"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {source === "link" ? (
        <div className="space-y-2">
          <label htmlFor="resource-url" className="text-sm font-medium text-foreground">
            URL
          </label>
          <div className="relative">
            <Link2 className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="resource-url"
              autoFocus
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={busy}
              placeholder="https://..."
              inputMode="url"
              className={`${groupInputClassName} h-10 pl-9`}
            />
          </div>
          {urlInvalid && (
            <p className="text-xs text-destructive">URL must start with http:// or https://</p>
          )}
        </div>
      ) : (
        <ContentPicker
          type={source}
          selectedId={picked?.id ?? null}
          onSelect={pick}
          disabled={busy}
        />
      )}

      <div className="space-y-2">
        <label htmlFor="resource-title" className="text-sm font-medium text-foreground">
          Title
        </label>
        <input
          id="resource-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={TITLE_MAX}
          disabled={busy}
          placeholder={source === "link" ? "e.g. Project requirements" : "Pick an item above"}
          className={`${groupInputClassName} h-10`}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="resource-description" className="text-sm font-medium text-foreground">
          Note for the group <span className="text-muted-foreground">(optional)</span>
        </label>
        <textarea
          id="resource-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={DESCRIPTION_MAX}
          disabled={busy}
          rows={2}
          placeholder="Why is this useful?"
          className={`${groupInputClassName} py-2 resize-none`}
        />
      </div>

      {source !== "link" && (
        <p className="text-[11px] text-muted-foreground">
          Members get a copy of this {source === "note" ? "note" : "file"} as it is now. Later
          edits in your {source === "note" ? "Notes" : "Subjects"} page are not synced.
        </p>
      )}

      {createResource.error && (
        <p className="text-xs text-destructive">{createResource.error.message}</p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className={groupSecondaryButtonClassName}
        >
          Cancel
        </button>
        <button type="submit" disabled={!canSubmit} className={groupPrimaryButtonClassName}>
          {busy ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sharing...
            </>
          ) : (
            "Share"
          )}
        </button>
      </div>
    </form>
  );
}

export default function AddResourceModal({ groupId, open, onOpenChange }) {
  const createResource = useCreateGroupResource(groupId);
  const busy = createResource.isPending;

  const close = () => {
    if (busy) return;
    createResource.reset();
    onOpenChange(false);
  };

  return (
    <GroupModalShell
      open={open}
      title="Share a resource"
      description="Add a link, or share one of your notes or files with the group."
      busy={busy}
      onClose={close}
    >
      <AddResourceForm
        mutation={createResource}
        onCancel={close}
        onDone={() => onOpenChange(false)}
      />
    </GroupModalShell>
  );
}
