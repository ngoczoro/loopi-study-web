import { toast } from "sonner";
import { useDeleteGroup, useLeaveGroup } from "@/hooks/queries/groups";
import ConfirmActionDialog from "./ConfirmActionDialog";

/**
 * Owners cannot leave a group (API returns 409), so for them this dialog
 * deletes the group instead.
 */
export default function LeaveGroupDialog({ group, open, onOpenChange, onDone }) {
  const leaveGroup = useLeaveGroup();
  const deleteGroup = useDeleteGroup();
  const isOwner = group?.myRole === "owner";
  const mutation = isOwner ? deleteGroup : leaveGroup;

  const handleOpenChange = (next) => {
    if (!next) mutation.reset();
    onOpenChange(next);
  };

  const handleConfirm = async () => {
    if (!group || mutation.isPending) return;
    try {
      await mutation.mutateAsync(group.id);
      toast.success(isOwner ? `Deleted "${group.name}"` : `Left "${group.name}"`);
      onOpenChange(false);
      onDone?.(group);
    } catch {
      // error is rendered by the dialog from mutation state
    }
  };

  return (
    <ConfirmActionDialog
      open={open}
      onOpenChange={handleOpenChange}
      title={isOwner ? "Delete this group?" : "Leave this group?"}
      description={
        isOwner
          ? `"${group?.name}" and all of its resources, goals, tasks and messages will be removed for every member. This cannot be undone.`
          : `You will lose access to "${group?.name}". Tasks assigned to you will become unassigned. You can rejoin later with the invite code.`
      }
      confirmLabel={isOwner ? "Delete group" : "Leave group"}
      destructive
      busy={mutation.isPending}
      error={mutation.error?.message ?? null}
      onConfirm={handleConfirm}
    />
  );
}
