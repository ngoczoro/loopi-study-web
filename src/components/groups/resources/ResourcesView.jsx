import { useMemo, useState } from "react";
import {
  Download,
  ExternalLink,
  FolderOpen,
  Link2,
  Loader2,
  MessageCircle,
  Plus,
  Search,
  StickyNote,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getAuthUser } from "@/lib/authSession";
import { getHostname } from "@/lib/chatLinks";
import { useDeleteGroupResource, useGroupResources } from "@/hooks/queries/groups";
import ConfirmActionDialog from "../ConfirmActionDialog";
import MemberAvatar from "../MemberAvatar";
import ImageLightbox from "../chat/ImageLightbox";
import { FileBadge } from "../chat/MessageAttachments";
import { formatFileSize, formatSharedDate } from "../chat/chatFormat";
import AddResourceModal from "./AddResourceModal";
import NoteViewerModal from "./NoteViewerModal";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "link", label: "Links" },
  { id: "note", label: "Notes" },
  { id: "file", label: "Files" },
];

const actionButtonClassName =
  "h-8 w-8 rounded-lg inline-flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors";

function ResourceIcon({ resource }) {
  if (resource.type === "file") return <FileBadge name={resource.ref?.fileName} />;
  if (resource.type === "note") {
    return (
      <span className="h-10 w-10 rounded-lg bg-amber-500/15 text-amber-600 inline-flex items-center justify-center shrink-0">
        <StickyNote className="h-4 w-4" />
      </span>
    );
  }
  return (
    <span className="h-10 w-10 rounded-lg bg-primary/10 text-primary inline-flex items-center justify-center shrink-0">
      <Link2 className="h-4 w-4" />
    </span>
  );
}

function resourceSubtitle(resource) {
  if (resource.type === "link") return getHostname(resource.url);
  if (resource.type === "file") {
    const size = formatFileSize(resource.ref?.fileSize);
    return [resource.ref?.fileName, size].filter(Boolean).join(" · ");
  }
  return (resource.ref?.excerpt ?? "").split("\n").find((line) => line.trim()) ?? "Note";
}

function matchesSearch(resource, keyword) {
  if (!keyword) return true;
  return [
    resource.title,
    resource.description,
    resource.url,
    resource.ref?.fileName,
    resource.ref?.excerpt,
    resource.sharedBy?.fullName,
  ].some((value) => value?.toLowerCase().includes(keyword));
}

export default function ResourcesView({ group }) {
  const isOwner = group.myRole === "owner";
  const myUserId = getAuthUser()?.id ?? null;
  const { resources, isLoading, error, refetch } = useGroupResources(group.id);
  const deleteResource = useDeleteGroupResource(group.id);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [viewingNote, setViewingNote] = useState(null);
  const [viewingImage, setViewingImage] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);

  const counts = useMemo(
    () =>
      resources.reduce(
        (acc, resource) => ({ ...acc, [resource.type]: (acc[resource.type] ?? 0) + 1 }),
        { all: resources.length },
      ),
    [resources],
  );

  const visible = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return resources.filter(
      (resource) =>
        (filter === "all" || resource.type === filter) && matchesSearch(resource, keyword),
    );
  }, [resources, filter, search]);

  const openResource = (resource) => {
    if (resource.type === "note") {
      setViewingNote(resource);
      return;
    }
    if (resource.type === "file" && resource.ref?.mimeType?.startsWith("image/")) {
      setViewingImage({ url: resource.ref.fileUrl, name: resource.ref.fileName ?? resource.title });
      return;
    }
    const href = resource.type === "link" ? resource.url : resource.ref?.fileUrl;
    if (href) window.open(href, "_blank", "noopener,noreferrer");
  };

  const confirmDelete = async () => {
    if (!pendingDelete || deleteResource.isPending) return;
    try {
      await deleteResource.mutateAsync(pendingDelete.id);
      toast.success("Resource removed");
      setPendingDelete(null);
    } catch {
      // error is rendered by the dialog from mutation state
    }
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-background">
      <div className="shrink-0 border-b border-border bg-card px-4 py-3 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-foreground">Shared resources</h2>
            <p className="text-xs text-muted-foreground">
              Links, notes and files the group wants to keep handy
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="h-9 px-4 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors inline-flex items-center gap-1.5 shrink-0"
          >
            <Plus className="h-4 w-4" />
            Share
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title, file, note or member"
              className="w-full h-9 rounded-full bg-background pl-9 pr-4 text-sm text-foreground border border-border focus:ring-2 focus:ring-primary/20 outline-none"
            />
          </div>
          <div className="flex rounded-full bg-secondary p-1">
            {FILTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilter(item.id)}
                className={cn(
                  "h-7 px-3 rounded-full text-xs font-medium transition-colors",
                  filter === item.id
                    ? "bg-card text-foreground shadow-soft"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {item.label}
                <span className="ml-1 text-muted-foreground">{counts[item.id] ?? 0}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-4">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <p className="text-sm text-destructive">{error}</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="text-sm font-medium text-primary hover:underline"
            >
              Retry
            </button>
          </div>
        ) : resources.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <FolderOpen className="h-8 w-8 text-muted-foreground" strokeWidth={1.5} />
            <p className="text-sm font-medium text-foreground">Nothing shared yet</p>
            <p className="text-xs text-muted-foreground">
              Share a link, or one of your notes or files, so everyone can find it here.
            </p>
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="mt-1 h-9 px-4 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
            >
              Share a resource
            </button>
          </div>
        ) : visible.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No resources match your search.
          </p>
        ) : (
          <ul className="space-y-2">
            {visible.map((resource) => {
              const canDelete = isOwner || resource.sharedBy?.userId === myUserId;
              const downloadable = resource.type === "file" && resource.ref?.fileUrl;
              return (
                <li
                  key={resource.id}
                  className="group/resource bg-card rounded-2xl border border-border p-3 flex items-start gap-3 hover:shadow-soft transition-shadow"
                >
                  <button
                    type="button"
                    onClick={() => openResource(resource)}
                    className="flex items-start gap-3 min-w-0 flex-1 text-left"
                  >
                    <ResourceIcon resource={resource} />
                    <span className="min-w-0 flex-1 space-y-0.5">
                      <span className="block text-sm font-medium text-foreground truncate">
                        {resource.title}
                      </span>
                      <span
                        className={cn(
                          "block text-xs truncate",
                          resource.type === "link" ? "text-primary" : "text-muted-foreground",
                        )}
                      >
                        {resourceSubtitle(resource)}
                      </span>
                      {resource.description && (
                        <span className="block text-xs text-muted-foreground line-clamp-2">
                          {resource.description}
                        </span>
                      )}
                      <span className="flex items-center gap-1.5 pt-1 text-[11px] text-muted-foreground">
                        <MemberAvatar user={resource.sharedBy} size="sm" className="h-5 w-5 text-[9px]" />
                        {resource.sharedBy?.userId === myUserId
                          ? "You"
                          : resource.sharedBy?.fullName ?? "A member"}
                        <span>· {formatSharedDate(resource.createdAt)}</span>
                      </span>
                    </span>
                  </button>

                  <div className="flex items-center gap-0.5 shrink-0">
                    {resource.type === "link" && (
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Open ${resource.title}`}
                        title="Open link"
                        className={actionButtonClassName}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                    {downloadable && (
                      <a
                        href={resource.ref.fileUrl}
                        download={resource.ref.fileName ?? resource.title}
                        aria-label={`Download ${resource.title}`}
                        title="Download"
                        className={actionButtonClassName}
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    )}
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => setPendingDelete(resource)}
                        aria-label={`Remove ${resource.title}`}
                        title="Remove from group"
                        className={`${actionButtonClassName} hover:text-destructive hover:bg-destructive/10`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <AddResourceModal groupId={group.id} open={addOpen} onOpenChange={setAddOpen} />
      <NoteViewerModal resource={viewingNote} onClose={() => setViewingNote(null)} />
      <ImageLightbox image={viewingImage} onClose={() => setViewingImage(null)} />
      <ConfirmActionDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(next) => {
          if (!next) {
            deleteResource.reset();
            setPendingDelete(null);
          }
        }}
        title="Remove this resource?"
        description={`"${pendingDelete?.title ?? ""}" will be removed from the group. The original note or file in your own library is not deleted.`}
        confirmLabel="Remove"
        destructive
        busy={deleteResource.isPending}
        error={deleteResource.error?.message ?? null}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
