import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Check, Loader2, MessageSquare, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  useDeleteAssistantConversation,
  useUpdateAssistantConversation,
} from "@/hooks/queries/assistant";
import ConfirmActionDialog from "@/components/groups/ConfirmActionDialog";

const DAY_MS = 24 * 60 * 60 * 1000;

function groupByRecency(conversations, now) {
  const startOfToday = new Date(now).setHours(0, 0, 0, 0);
  const groups = [
    { label: "Today", items: [] },
    { label: "Previous 7 days", items: [] },
    { label: "Older", items: [] },
  ];
  conversations.forEach((conversation) => {
    const at = new Date(conversation.lastMessageAt ?? conversation.createdAt).getTime();
    if (at >= startOfToday) groups[0].items.push(conversation);
    else if (at >= startOfToday - 7 * DAY_MS) groups[1].items.push(conversation);
    else groups[2].items.push(conversation);
  });
  return groups.filter((group) => group.items.length > 0);
}

function ConversationRow({ conversation, active, onDelete, onNavigate }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(conversation.title);
  const update = useUpdateAssistantConversation();

  const save = async () => {
    const next = title.trim();
    if (!next || next === conversation.title) {
      setEditing(false);
      setTitle(conversation.title);
      return;
    }
    try {
      await update.mutateAsync({ conversationId: conversation.id, payload: { title: next } });
      setEditing(false);
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (editing) {
    return (
      <li className="flex items-center gap-1 rounded-xl bg-secondary px-2 py-1.5">
        <input
          autoFocus
          value={title}
          maxLength={100}
          onChange={(event) => setTitle(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") save();
            if (event.key === "Escape") {
              setEditing(false);
              setTitle(conversation.title);
            }
          }}
          className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none"
        />
        <button
          type="button"
          onClick={save}
          disabled={update.isPending}
          aria-label="Save title"
          className="rounded-md p-1 text-muted-foreground hover:text-foreground"
        >
          {update.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
        </button>
        <button
          type="button"
          onClick={() => {
            setEditing(false);
            setTitle(conversation.title);
          }}
          aria-label="Cancel rename"
          className="rounded-md p-1 text-muted-foreground hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </li>
    );
  }

  return (
    <li className="group/row relative">
      <Link
        to={`/assistant/${conversation.id}`}
        onClick={onNavigate}
        className={cn(
          "flex items-center gap-2 rounded-xl px-3 py-2 pr-16 text-sm transition-colors",
          active
            ? "bg-primary/10 font-medium text-primary"
            : "text-foreground hover:bg-secondary",
        )}
      >
        <MessageSquare className="h-4 w-4 shrink-0 opacity-60" />
        <span className="truncate">{conversation.title}</span>
      </Link>
      <div className="absolute right-1.5 top-1/2 hidden -translate-y-1/2 gap-0.5 group-hover/row:flex group-focus-within/row:flex">
        <button
          type="button"
          onClick={() => setEditing(true)}
          aria-label={`Rename ${conversation.title}`}
          className="rounded-md p-1 text-muted-foreground hover:bg-background hover:text-foreground"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(conversation)}
          aria-label={`Delete ${conversation.title}`}
          className="rounded-md p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </li>
  );
}

export default function ConversationSidebar({
  conversations,
  isLoading,
  error,
  activeId,
  onNewChat,
  onDeleted,
  onNavigate,
}) {
  const [now] = useState(() => Date.now());
  const [search, setSearch] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null);
  const deleteConversation = useDeleteAssistantConversation();

  const groups = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = query
      ? conversations.filter((item) => item.title.toLowerCase().includes(query))
      : conversations;
    return groupByRecency(filtered, now);
  }, [conversations, search, now]);

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await deleteConversation.mutateAsync(pendingDelete.id);
      toast.success("Conversation deleted");
      onDeleted(pendingDelete.id);
      setPendingDelete(null);
    } catch {
      // error is rendered by the dialog
    }
  };

  return (
    <div className="flex h-full flex-col bg-card">
      <div className="space-y-3 p-3">
        <button
          type="button"
          onClick={onNewChat}
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          New chat
        </button>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search chats"
            className="h-9 w-full rounded-full border border-border bg-background pl-9 pr-4 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-3">
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <p className="px-3 py-4 text-xs text-destructive">{error}</p>
        ) : groups.length === 0 ? (
          <p className="px-3 py-6 text-center text-xs text-muted-foreground">
            {search ? "No chats match your search." : "No chats yet. Ask your first question!"}
          </p>
        ) : (
          groups.map((group) => (
            <div key={group.label} className="mb-3">
              <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {group.label}
              </p>
              <ul className="space-y-0.5">
                {group.items.map((conversation) => (
                  <ConversationRow
                    key={conversation.id}
                    conversation={conversation}
                    active={conversation.id === activeId}
                    onDelete={setPendingDelete}
                    onNavigate={onNavigate}
                  />
                ))}
              </ul>
            </div>
          ))
        )}
      </div>

      <ConfirmActionDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => {
          if (!open) {
            setPendingDelete(null);
            deleteConversation.reset();
          }
        }}
        title="Delete this chat?"
        description={`“${pendingDelete?.title ?? ""}” and all its messages will be removed.`}
        confirmLabel="Delete"
        destructive
        busy={deleteConversation.isPending}
        error={deleteConversation.error?.message ?? null}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
