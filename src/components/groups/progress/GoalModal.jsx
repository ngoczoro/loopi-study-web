import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  useCreateGroupGoal,
  useUpdateGroupGoal,
} from "@/hooks/queries/groupProgress";
import GroupModalShell, {
  groupInputClassName,
  groupPrimaryButtonClassName,
  groupSecondaryButtonClassName,
} from "../GroupModalShell";

const today = () => new Date().toISOString().slice(0, 10);
const inDays = (days) => {
  const value = new Date();
  value.setDate(value.getDate() + days);
  return value.toISOString().slice(0, 10);
};

function GoalForm({ goal, mutation, onClose }) {
  const [title, setTitle] = useState(goal?.title ?? "");
  const [description, setDescription] = useState(goal?.description ?? "");
  const [startDate, setStartDate] = useState(
    goal?.startDate?.slice(0, 10) ?? today(),
  );
  const [endDate, setEndDate] = useState(
    goal?.endDate?.slice(0, 10) ?? inDays(14),
  );
  const busy = mutation.isPending;
  const valid =
    title.trim() &&
    startDate &&
    endDate &&
    endDate > startDate;

  const submit = async (event) => {
    event.preventDefault();
    if (!valid || busy) return;
    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      startDate: new Date(`${startDate}T00:00:00`).toISOString(),
      endDate: new Date(`${endDate}T23:59:59`).toISOString(),
    };
    try {
      if (goal) {
        await mutation.mutateAsync({ goalId: goal.id, payload });
      } else {
        await mutation.mutateAsync(payload);
      }
      toast.success(goal ? "Goal updated" : "Goal created");
      onClose();
    } catch {
      // mutation error is rendered below
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-foreground">Goal name</span>
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          disabled={busy}
          placeholder="e.g. Complete the UI prototype"
          className={`${groupInputClassName} h-10`}
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-foreground">
          Description <span className="text-muted-foreground">(optional)</span>
        </span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={1000}
          rows={2}
          disabled={busy}
          className={`${groupInputClassName} py-2 resize-none`}
        />
      </label>

      <p className="rounded-xl bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
        Goal progress is calculated automatically from tasks that select this goal
        in Related goal. You do not need to enter a unit or target.
      </p>

      <div className="grid grid-cols-2 gap-2">
        <label className="space-y-1.5">
          <span className="text-sm font-medium text-foreground">Start date</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            disabled={busy}
            className={`${groupInputClassName} h-10`}
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-sm font-medium text-foreground">End date</span>
          <input
            type="date"
            value={endDate}
            min={startDate}
            onChange={(e) => setEndDate(e.target.value)}
            disabled={busy}
            className={`${groupInputClassName} h-10`}
          />
        </label>
      </div>

      {endDate && startDate && endDate <= startDate && (
        <p className="text-xs text-destructive">End date must be after start date.</p>
      )}
      {mutation.error && (
        <p className="text-xs text-destructive">{mutation.error.message}</p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          className={groupSecondaryButtonClassName}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!valid || busy}
          className={groupPrimaryButtonClassName}
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          {goal ? "Save changes" : "Create goal"}
        </button>
      </div>
    </form>
  );
}

export default function GoalModal({ groupId, goal, open, onOpenChange }) {
  const createGoal = useCreateGroupGoal(groupId);
  const updateGoal = useUpdateGroupGoal(groupId);
  const mutation = goal ? updateGoal : createGoal;
  const close = () => {
    if (mutation.isPending) return;
    mutation.reset();
    onOpenChange(false);
  };

  return (
    <GroupModalShell
      open={open}
      title={goal ? "Edit group goal" : "Create group goal"}
      description="Progress is behind when completion is lower than elapsed time."
      busy={mutation.isPending}
      onClose={close}
    >
      <GoalForm
        key={goal?.id ?? "new"}
        goal={goal}
        mutation={mutation}
        onClose={close}
      />
    </GroupModalShell>
  );
}
