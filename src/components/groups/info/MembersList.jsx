import { useState } from "react";
import { Crown, Loader2, UserMinus } from "lucide-react";
import { toast } from "sonner";
import { getAuthUser } from "@/lib/authSession";
import { useGroupMembers, useRemoveGroupMember } from "@/hooks/queries/groups";
import ConfirmActionDialog from "../ConfirmActionDialog";
import MemberAvatar from "../MemberAvatar";

function sortMembers(members) {
  return [...members].sort((a, b) => {
    if (a.role !== b.role) return a.role === "owner" ? -1 : 1;
    return (a.joinedAt ?? "").localeCompare(b.joinedAt ?? "");
  });
}

export default function MembersList({ group }) {
  const isOwner = group.myRole === "owner";
  const myUserId = getAuthUser()?.id ?? null;
  const { members, isLoading, error, refetch } = useGroupMembers(group.id);
  const removeMember = useRemoveGroupMember(group.id);
  const [pendingRemoval, setPendingRemoval] = useState(null);

  const confirmRemove = async () => {
    if (!pendingRemoval || removeMember.isPending) return;
    try {
      await removeMember.mutateAsync(pendingRemoval.userId);
      toast.success(`Removed ${pendingRemoval.fullName}`);
      setPendingRemoval(null);
    } catch {
      // error is rendered by the dialog from mutation state
    }
  };

  if (isLoading) {
    return (
      <div className="px-4 py-2">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 flex items-center justify-between gap-2 text-xs">
        <span className="text-destructive">{error}</span>
        <button type="button" onClick={() => refetch()} className="font-medium text-primary">
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
      <ul>
        {sortMembers(members).map((member) => {
          const isMe = member.userId === myUserId;
          const canRemove = isOwner && member.role !== "owner" && !isMe;
          return (
            <li key={member.userId} className="group/member flex items-center gap-3 px-4 py-2">
              <MemberAvatar user={member} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate flex items-center gap-1.5">
                  <span className="truncate">{member.fullName}</span>
                  {isMe && <span className="text-xs font-normal text-muted-foreground">(you)</span>}
                  {member.role === "owner" && (
                    <Crown className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                  )}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {member.role === "owner" ? "Owner" : "Member"}
                </p>
              </div>
              {canRemove && (
                <button
                  type="button"
                  onClick={() => setPendingRemoval(member)}
                  aria-label={`Remove ${member.fullName}`}
                  title="Remove from group"
                  className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 sm:opacity-0 sm:group-hover/member:opacity-100 focus:opacity-100 transition-opacity"
                >
                  <UserMinus className="h-4 w-4" />
                </button>
              )}
            </li>
          );
        })}
      </ul>

      <ConfirmActionDialog
        open={Boolean(pendingRemoval)}
        onOpenChange={(next) => {
          if (!next) {
            removeMember.reset();
            setPendingRemoval(null);
          }
        }}
        title="Remove this member?"
        description={`${pendingRemoval?.fullName ?? "This member"} will lose access to the group. Their assigned tasks will become unassigned.`}
        confirmLabel="Remove member"
        destructive
        busy={removeMember.isPending}
        error={removeMember.error?.message ?? null}
        onConfirm={confirmRemove}
      />
    </>
  );
}
