import { useState } from "react";
import { Loader2 } from "lucide-react";
import GroupModalShell, {
  groupInputClassName,
  groupPrimaryButtonClassName,
  groupSecondaryButtonClassName,
} from "@/components/groups/GroupModalShell";

const fieldClassName = `${groupInputClassName} h-10 w-full`;

export default function DeckFormModal({
  deck,
  subjects,
  defaultSubjectId = null,
  busy = false,
  onClose,
  onSubmit,
}) {
  const [title, setTitle] = useState(deck?.title ?? "");
  const [subjectId, setSubjectId] = useState(
    deck?.subjectId ?? defaultSubjectId ?? "",
  );

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!title.trim()) return;
    onSubmit({ title: title.trim(), subjectId: subjectId || null });
  };

  return (
    <GroupModalShell
      open
      title={deck ? "Edit deck" : "New deck"}
      description="A deck belongs to one subject and holds the cards you review."
      busy={busy}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-foreground">Name</span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={80}
            required
            autoFocus
            placeholder="Enter a deck name"
            className={`${fieldClassName} placeholder:text-muted-foreground`}
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-foreground">
            Subject <span className="font-normal text-muted-foreground">(optional)</span>
          </span>
          <select
            value={subjectId}
            onChange={(event) => setSubjectId(event.target.value)}
            className={fieldClassName}
          >
            <option value="">No subject</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
        </label>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={groupSecondaryButtonClassName}>
            Cancel
          </button>
          <button type="submit" disabled={!title.trim()} className={groupPrimaryButtonClassName}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {deck ? "Save" : "Create deck"}
          </button>
        </div>
      </form>
    </GroupModalShell>
  );
}
