import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useJoinGroup } from "@/hooks/queries/groups";
import GroupModalShell, {
  groupInputClassName,
  groupPrimaryButtonClassName,
  groupSecondaryButtonClassName,
} from "./GroupModalShell";

const CODE_MAX = 20;

export default function JoinGroupModal({ open, onOpenChange, onJoined }) {
  const [inviteCode, setInviteCode] = useState("");
  const joinGroup = useJoinGroup();
  const busy = joinGroup.isPending;

  const close = () => {
    if (busy) return;
    setInviteCode("");
    joinGroup.reset();
    onOpenChange(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const code = inviteCode.trim().toUpperCase();
    if (!code || busy) return;

    try {
      const group = await joinGroup.mutateAsync(code);
      toast.success(`Joined "${group.name}"`);
      setInviteCode("");
      onOpenChange(false);
      onJoined?.(group);
    } catch {
      // error is rendered below from mutation state
    }
  };

  return (
    <GroupModalShell
      open={open}
      title="Join a study group"
      description="Ask the group owner for the invite code."
      busy={busy}
      onClose={close}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="group-invite-code" className="text-sm font-medium text-foreground">
            Invite code
          </label>
          <input
            id="group-invite-code"
            autoFocus
            value={inviteCode}
            onChange={(e) => {
              setInviteCode(e.target.value.toUpperCase());
              if (joinGroup.error) joinGroup.reset();
            }}
            maxLength={CODE_MAX}
            disabled={busy}
            placeholder="e.g. CAPS-7KQ9"
            autoComplete="off"
            spellCheck={false}
            className={`${groupInputClassName} h-10 font-mono tracking-wider`}
          />
        </div>

        {joinGroup.error && (
          <p className="text-xs text-destructive">{joinGroup.error.message}</p>
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
            disabled={busy || !inviteCode.trim()}
            className={groupPrimaryButtonClassName}
          >
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Joining...
              </>
            ) : (
              "Join group"
            )}
          </button>
        </div>
      </form>
    </GroupModalShell>
  );
}
