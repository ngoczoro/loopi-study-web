import GroupModalShell from "../GroupModalShell";

export default function NoteViewerModal({ resource, onClose }) {
  return (
    <GroupModalShell
      open={Boolean(resource)}
      title={resource?.title ?? ""}
      description={resource ? `Shared by ${resource.sharedBy?.fullName ?? "a member"}` : ""}
      onClose={onClose}
    >
      {resource?.description && (
        <p className="mb-3 rounded-xl bg-secondary/60 px-3 py-2 text-xs text-muted-foreground">
          {resource.description}
        </p>
      )}
      <div className="max-h-[60vh] overflow-y-auto rounded-xl border border-border bg-background p-4">
        <p className="text-sm text-foreground whitespace-pre-wrap break-words">
          {resource?.ref?.excerpt?.trim() || "This note is empty."}
        </p>
      </div>
    </GroupModalShell>
  );
}
