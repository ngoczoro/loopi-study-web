import { useState } from "react";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useUpdateGroup } from "@/hooks/queries/groups";
import GroupModalShell, {
  groupInputClassName,
  groupPrimaryButtonClassName,
  groupSecondaryButtonClassName,
} from "./GroupModalShell";

const NAME_MAX = 100;
const DESCRIPTION_MAX = 500;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function readImage(file, onLoad) {
  if (!file.type.startsWith("image/")) {
    toast.error("Please choose an image file");
    return;
  }
  if (file.size > MAX_IMAGE_BYTES) {
    toast.error("Image must be 5 MB or smaller");
    return;
  }
  const reader = new FileReader();
  reader.onload = () => onLoad(String(reader.result));
  reader.readAsDataURL(file);
}

function MediaField({ id, label, preview, disabled, onPick, onRemove }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground">{label}</p>
      <div className="flex items-center gap-3">
        <div className="h-16 w-16 rounded-full overflow-hidden bg-secondary shrink-0">
          {preview ? (
            <img src={preview} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-muted-foreground">
              <Camera className="h-5 w-5" />
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={id}
            className="h-8 px-3 rounded-lg bg-secondary text-xs font-medium text-foreground hover:bg-secondary/80 inline-flex items-center justify-center cursor-pointer"
          >
            Choose image
          </label>
          <input
            id={id}
            type="file"
            accept="image/*"
            disabled={disabled}
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onPick(file);
              event.target.value = "";
            }}
          />
          {preview && (
            <button
              type="button"
              onClick={onRemove}
              disabled={disabled}
              className="h-8 px-3 rounded-lg text-xs text-destructive hover:bg-destructive/10 inline-flex items-center justify-center gap-1"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Remove
            </button>
          )}
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground">Image only, maximum 5 MB.</p>
    </div>
  );
}

export default function EditGroupModal({ group, open, onOpenChange }) {
  const updateGroup = useUpdateGroup();
  const busy = updateGroup.isPending;

  const close = () => {
    if (busy) return;
    updateGroup.reset();
    onOpenChange(false);
  };

  return (
    <GroupModalShell open={open} title="Edit group" busy={busy} onClose={close}>
      {group && (
        <EditGroupForm
          group={group}
          mutation={updateGroup}
          onCancel={close}
          onSaved={() => onOpenChange(false)}
        />
      )}
    </GroupModalShell>
  );
}

// Mounted only while the modal is open, so the fields start from the latest group.
function EditGroupForm({ group, mutation, onCancel, onSaved }) {
  const [name, setName] = useState(group.name ?? "");
  const [description, setDescription] = useState(group.description ?? "");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(group.avatarUrl ?? null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const busy = mutation.isPending;

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName || busy) return;

    try {
      await mutation.mutateAsync({
        groupId: group.id,
        payload: {
          name: trimmedName,
          description: description.trim() || null,
          avatarFile,
          avatarPreview: avatarFile ? avatarPreview : undefined,
          removeAvatar,
        },
      });
      toast.success("Group updated");
      onSaved();
    } catch {
      // error is rendered below from mutation state
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <MediaField
          id="edit-group-avatar"
          label="Group avatar"
          preview={avatarPreview}
          disabled={busy}
          onPick={(file) =>
            readImage(file, (preview) => {
              setAvatarFile(file);
              setAvatarPreview(preview);
              setRemoveAvatar(false);
            })
          }
          onRemove={() => {
            setAvatarFile(null);
            setAvatarPreview(null);
            setRemoveAvatar(Boolean(group.avatarUrl));
          }}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="edit-group-name" className="text-sm font-medium text-foreground">
          Group name
        </label>
        <input
          id="edit-group-name"
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={NAME_MAX}
          disabled={busy}
          className={`${groupInputClassName} h-10`}
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="edit-group-description"
          className="text-sm font-medium text-foreground"
        >
          Description <span className="text-muted-foreground">(optional)</span>
        </label>
        <textarea
          id="edit-group-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={DESCRIPTION_MAX}
          disabled={busy}
          rows={3}
          className={`${groupInputClassName} py-2 resize-none`}
        />
        <p className="text-[11px] text-muted-foreground text-right">
          {description.length}/{DESCRIPTION_MAX}
        </p>
      </div>

      {mutation.error && (
        <p className="text-xs text-destructive">{mutation.error.message}</p>
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
        <button
          type="submit"
          disabled={busy || !name.trim()}
          className={groupPrimaryButtonClassName}
        >
          {busy ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save"
          )}
        </button>
      </div>
    </form>
  );
}
