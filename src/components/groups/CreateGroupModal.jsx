import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useCreateGroup } from "@/hooks/queries/groups";
import GroupModalShell, {
  groupInputClassName,
  groupPrimaryButtonClassName,
  groupSecondaryButtonClassName,
} from "./GroupModalShell";

const NAME_MAX = 100;
const DESCRIPTION_MAX = 500;

export default function CreateGroupModal({ open, onOpenChange, onCreated }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const createGroup = useCreateGroup();
  const busy = createGroup.isPending;

  const close = () => {
    if (busy) return;
    setName("");
    setDescription("");
    createGroup.reset();
    onOpenChange(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName || busy) return;

    try {
      const group = await createGroup.mutateAsync({
        name: trimmedName,
        description: description.trim() || null,
      });
      toast.success(`Created "${group.name}"`);
      setName("");
      setDescription("");
      onOpenChange(false);
      onCreated?.(group);
    } catch {
      // error is rendered below from mutation state
    }
  };

  return (
    <GroupModalShell
      open={open}
      title="Create study group"
      description="You will be the owner and can invite others with a code."
      busy={busy}
      onClose={close}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="group-name" className="text-sm font-medium text-foreground">
            Group name
          </label>
          <input
            id="group-name"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={NAME_MAX}
            disabled={busy}
            placeholder="e.g. Capstone LoopiStudy"
            className={`${groupInputClassName} h-10`}
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="group-description"
            className="text-sm font-medium text-foreground"
          >
            Description <span className="text-muted-foreground">(optional)</span>
          </label>
          <textarea
            id="group-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={DESCRIPTION_MAX}
            disabled={busy}
            rows={3}
            placeholder="What will this group study together?"
            className={`${groupInputClassName} py-2 resize-none`}
          />
          <p className="text-[11px] text-muted-foreground text-right">
            {description.length}/{DESCRIPTION_MAX}
          </p>
        </div>

        {createGroup.error && (
          <p className="text-xs text-destructive">{createGroup.error.message}</p>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={close}
            disabled={busy}
            className={groupSecondaryButtonClassName}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy || !name.trim()}
            className={groupPrimaryButtonClassName}
          >
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create group"
            )}
          </button>
        </div>
      </form>
    </GroupModalShell>
  );
}
