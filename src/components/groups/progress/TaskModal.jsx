import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  useCreateGroupTask,
  useUpdateGroupTask,
} from "@/hooks/queries/groupProgress";
import GroupModalShell, {
  groupInputClassName,
  groupPrimaryButtonClassName,
  groupSecondaryButtonClassName,
} from "../GroupModalShell";

function toLocalDateTime(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function TaskForm({
  task,
  canChangeStatus,
  members,
  goals,
  tasks,
  mutation,
  onClose,
}) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [assigneeId, setAssigneeId] = useState(task?.assignee?.userId ?? "");
  const [goalId, setGoalId] = useState(task?.goalId ?? "");
  const [dueAt, setDueAt] = useState(toLocalDateTime(task?.dueAt));
  const [dependsOnTaskId, setDependsOnTaskId] = useState(
    task?.dependsOnTaskId ?? "",
  );
  const [status, setStatus] = useState(task?.status ?? "todo");
  const busy = mutation.isPending;
  const selectedGoal = goals.find((goal) => goal.id === goalId) ?? null;
  const dueTimestamp = dueAt ? new Date(dueAt).getTime() : null;
  const goalStart = selectedGoal ? new Date(selectedGoal.startDate).getTime() : null;
  const goalEnd = selectedGoal ? new Date(selectedGoal.endDate).getTime() : null;
  const dueBeforeGoal = Boolean(
    selectedGoal && dueTimestamp && dueTimestamp < goalStart,
  );
  const dueAfterGoal = Boolean(
    selectedGoal && dueTimestamp && dueTimestamp > goalEnd,
  );
  const deadlineInvalid = dueBeforeGoal || dueAfterGoal;
  const dependencyOptions = tasks.filter(
    (candidate) => candidate.id !== task?.id && candidate.status !== "done",
  );

  const submit = async (event) => {
    event.preventDefault();
    if (!title.trim() || deadlineInvalid || busy) return;
    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      assigneeId: assigneeId || null,
      goalId: goalId || null,
      dueAt: dueAt ? new Date(dueAt).toISOString() : null,
      dependsOnTaskId: dependsOnTaskId || null,
      ...(task && canChangeStatus ? { status } : {}),
    };
    try {
      if (task) {
        await mutation.mutateAsync({ taskId: task.id, payload });
      } else {
        await mutation.mutateAsync(payload);
      }
      toast.success(task ? "Task updated" : "Task created");
      onClose();
    } catch {
      // mutation error is rendered below
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4 max-h-[72vh] overflow-y-auto pr-1">
      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-foreground">Task name</span>
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          disabled={busy}
          placeholder="e.g. Implement group progress UI"
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
          maxLength={2000}
          rows={2}
          disabled={busy}
          className={`${groupInputClassName} py-2 resize-none`}
        />
      </label>

      <div className="grid sm:grid-cols-2 gap-3">
        <label className="space-y-1.5">
          <span className="text-sm font-medium text-foreground">Assignee</span>
          <select
            value={assigneeId}
            onChange={(e) => setAssigneeId(e.target.value)}
            disabled={busy}
            className={`${groupInputClassName} h-10`}
          >
            <option value="">Unassigned</option>
            {members.map((member) => (
              <option key={member.userId} value={member.userId}>
                {member.fullName}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1.5">
          <span className="text-sm font-medium text-foreground">Related goal</span>
          <select
            value={goalId}
            onChange={(e) => setGoalId(e.target.value)}
            disabled={busy}
            className={`${groupInputClassName} h-10`}
          >
            <option value="">No goal</option>
            {goals.map((goal) => (
              <option key={goal.id} value={goal.id}>
                {goal.title}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-foreground">Due date</span>
        <input
          type="datetime-local"
          value={dueAt}
          onChange={(e) => setDueAt(e.target.value)}
          min={selectedGoal ? toLocalDateTime(selectedGoal.startDate) : undefined}
          max={selectedGoal ? toLocalDateTime(selectedGoal.endDate) : undefined}
          disabled={busy}
          className={`${groupInputClassName} h-10`}
        />
        {selectedGoal && (
          <p className={deadlineInvalid ? "text-[11px] text-destructive" : "text-[11px] text-muted-foreground"}>
            Deadline must be within {new Date(selectedGoal.startDate).toLocaleDateString("en-GB")} –{" "}
            {new Date(selectedGoal.endDate).toLocaleDateString("en-GB")} for this goal.
          </p>
        )}
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-foreground">
          Depends on <span className="text-muted-foreground">(optional)</span>
        </span>
        <select
          value={dependsOnTaskId}
          onChange={(e) => setDependsOnTaskId(e.target.value)}
          disabled={busy}
          className={`${groupInputClassName} h-10`}
        >
          <option value="">No dependency</option>
          {dependencyOptions.map((candidate) => (
            <option key={candidate.id} value={candidate.id}>
              {candidate.title}
              {candidate.isOverdue ? " — overdue" : ""}
            </option>
          ))}
        </select>
        <p className="text-[11px] text-muted-foreground">
          If the prerequisite becomes overdue, this task automatically becomes blocked.
        </p>
      </label>

      {task && (
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-foreground">Status</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            disabled={busy || task.isBlocked || !canChangeStatus}
            className={`${groupInputClassName} h-10`}
          >
            <option value="todo">To do</option>
            <option value="doing">In progress</option>
            <option value="done">Done</option>
          </select>
          {task.isBlocked && (
            <p className="text-[11px] text-destructive">
              Finish the blocking task before changing this task's status.
            </p>
          )}
          {!task.isBlocked && !canChangeStatus && (
            <p className="text-[11px] text-muted-foreground">
              Only the group owner or current assignee can change status.
            </p>
          )}
        </label>
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
          disabled={!title.trim() || deadlineInvalid || busy}
          className={groupPrimaryButtonClassName}
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          {task ? "Save changes" : "Create task"}
        </button>
      </div>
    </form>
  );
}

export default function TaskModal({
  groupId,
  task,
  canChangeStatus = true,
  members,
  goals,
  tasks,
  open,
  onOpenChange,
}) {
  const createTask = useCreateGroupTask(groupId);
  const updateTask = useUpdateGroupTask(groupId);
  const mutation = task ? updateTask : createTask;
  const close = () => {
    if (mutation.isPending) return;
    mutation.reset();
    onOpenChange(false);
  };

  return (
    <GroupModalShell
      open={open}
      title={task ? "Edit task" : "Create task"}
      description="Assign work, set a deadline and optionally link a prerequisite."
      busy={mutation.isPending}
      onClose={close}
    >
      <TaskForm
        key={task?.id ?? "new"}
        task={task}
        canChangeStatus={canChangeStatus}
        members={members}
        goals={goals}
        tasks={tasks}
        mutation={mutation}
        onClose={close}
      />
    </GroupModalShell>
  );
}
