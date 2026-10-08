import { useState } from "react";
import { Check, Copy, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useRegenerateInviteCode } from "@/hooks/queries/groups";
import ConfirmActionDialog from "./ConfirmActionDialog";
import GroupModalShell, { groupSecondaryButtonClassName } from "./GroupModalShell";

async function copyText(text, successMessage) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(successMessage);
    return true;
  } catch {
    toast.error("Could not copy to clipboard");
    return false;
  }
}

export default function InviteMembersModal({ group, open, onOpenChange }) {
  const isOwner = group?.myRole === "owner";
  const [copied, setCopied] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const regenerate = useRegenerateInviteCode();

  if (!group) return null;

  const inviteMessage = `Join "${group.name}" on LoopiStudy: open Study Groups → Join with code → ${group.inviteCode}`;

  const copyCode = async () => {
    if (await copyText(group.inviteCode, "Invite code copied")) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const confirmRegenerate = async () => {
    if (regenerate.isPending) return;
    try {
      const { inviteCode } = await regenerate.mutateAsync(group.id);
      toast.success(`New invite code: ${inviteCode}`);
      setConfirmOpen(false);
    } catch {
      // error is rendered by the dialog from mutation state
    }
  };

  return (
    <>
      <GroupModalShell
        open={open}
        title="Add members"
        description="Share this invite code. People join from Study Groups → Join with code."
        onClose={() => onOpenChange(false)}
      >
        <div className="space-y-4">
          <div className="rounded-2xl bg-secondary/60 p-4 flex items-center justify-between gap-3">
            <span className="font-mono text-2xl font-bold tracking-widest text-foreground">
              {group.inviteCode}
            </span>
            <button
              type="button"
              onClick={copyCode}
              aria-label="Copy invite code"
              className="h-9 w-9 rounded-full bg-card inline-flex items-center justify-center text-muted-foreground hover:text-foreground"
            >
              {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => copyText(inviteMessage, "Invite message copied")}
              className={groupSecondaryButtonClassName}
            >
              Copy invite message
            </button>
            {isOwner && (
              <button
                type="button"
                onClick={() => setConfirmOpen(true)}
                className={`${groupSecondaryButtonClassName} inline-flex items-center justify-center gap-1.5`}
              >
                <RefreshCw className="h-4 w-4" />
                New code
              </button>
            )}
          </div>
        </div>
      </GroupModalShell>

      <ConfirmActionDialog
        open={confirmOpen}
        onOpenChange={(next) => {
          if (!next) regenerate.reset();
          setConfirmOpen(next);
        }}
        title="Generate a new invite code?"
        description={`The current code ${group.inviteCode} will stop working. Existing members stay in the group.`}
        confirmLabel="Generate new code"
        busy={regenerate.isPending}
        error={regenerate.error?.message ?? null}
        onConfirm={confirmRegenerate}
      />
    </>
  );
}
