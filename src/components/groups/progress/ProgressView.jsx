import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Ban,
  BellRing,
  CalendarClock,
  CheckCircle2,
  Circle,
  Clock3,
  Loader2,
  Pencil,
  Plus,
  Target,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getAuthUser } from "@/lib/authSession";
import { useGroupMembers } from "@/hooks/queries/groups";
import {
  useDeleteGroupGoal,
  useDeleteGroupTask,
  useGroupGoals,
  useGroupProgress,
  useGroupTasks,
  useRemindGroupTask,
  useUpdateGroupTask,
} from "@/hooks/queries/groupProgress";
import ConfirmActionDialog from "../ConfirmActionDialog";
import MemberAvatar from "../MemberAvatar";
import GoalModal from "./GoalModal";
import TaskModal from "./TaskModal";

const STATUS_LABEL = {
  todo: "To do",
  doing: "In progress",
  done: "Done",
  blocked: "Blocked",
};

const FILTERS = [
  { id: "all", label: "All" },
  { id: "blocked", label: "Blocked" },
  { id: "overdue", label: "Overdue" },
  { id: "mine", label: "My tasks" },
];

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

function StatCard({ icon, label, value, tone = "primary" }) {
  const Icon = icon;
  const toneClass =
    tone === "danger"
      ? "bg-destructive/10 text-destructive"
      : tone === "warning"
        ? "bg-amber-500/15 text-amber-600"
        : "bg-primary/10 text-primary";
  return (
    <div className="rounded-2xl bg-card border border-border p-3 flex items-center gap-3">
      <span className={cn("h-9 w-9 rounded-xl inline-flex items-center justify-center", toneClass)}>
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <p className="text-lg font-semibold text-foreground leading-tight">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function GoalCard({ goal, canManage, onEdit, onDelete }) {
  return (
    <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-foreground truncate">{goal.title}</p>
            {goal.isBehind && (
              <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-medium text-destructive shrink-0">
                Behind
              </span>
            )}
          </div>
          {goal.description && (
            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
              {goal.description}
            </p>
          )}
        </div>
        {canManage && (
          <div className="flex shrink-0">
            <button
              type="button"
              onClick={() => onEdit(goal)}
              aria-label={`Edit ${goal.title}`}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(goal)}
              aria-label={`Delete ${goal.title}`}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <div className="h-2 rounded-full bg-secondary overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-[width]",
              goal.isBehind ? "bg-destructive" : "bg-primary",
            )}
            style={{ width: `${goal.percentComplete}%` }}
          />
        </div>
        <div className="flex justify-between gap-2 text-[11px] text-muted-foreground">
          <span>
            {goal.currentValue}/{goal.targetValue} {goal.unit} · {goal.percentComplete}%
          </span>
          <span>{goal.timeElapsedPercent}% time elapsed</span>
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground">
        {dateFormatter.format(new Date(goal.startDate))} –{" "}
        {dateFormatter.format(new Date(goal.endDate))}
      </p>
    </div>
  );
}

function remindAvailableAt(task) {
  if (!task.lastRemindedAt) return null;
  return new Date(new Date(task.lastRemindedAt).getTime() + 24 * 60 * 60 * 1000);
}

function TaskCard({
  task,
  isOwner,
  myUserId,
  now,
  reminding,
  onEdit,
  onDelete,
  onStatus,
  onRemind,
}) {
  const effectiveStatus = task.effectiveStatus ?? (task.isBlocked ? "blocked" : task.status);
  const canDelete = isOwner || task.createdBy?.userId === myUserId;
  const canEdit = isOwner || task.createdBy?.userId === myUserId;
  const canChangeStatus = isOwner || task.assignee?.userId === myUserId;
  const nextReminder = remindAvailableAt(task);
  const reminderCoolingDown = nextReminder && nextReminder.getTime() > now;
  const canRemind =
    isOwner && task.assignee && task.status !== "done" && !reminderCoolingDown;

  return (
    <li className="rounded-2xl bg-card border border-border p-3 flex items-start gap-3">
      <button
        type="button"
        disabled={task.isBlocked || !canChangeStatus}
        onClick={() => onStatus(task, task.status === "done" ? "todo" : "done")}
        aria-label={task.status === "done" ? "Mark task as to do" : "Mark task as done"}
        title={
          !canChangeStatus
            ? "Only the group owner or assignee can change status"
            : task.isBlocked
              ? "Complete the blocking task first"
              : undefined
        }
        className="mt-0.5 text-muted-foreground hover:text-primary disabled:opacity-45 disabled:cursor-not-allowed"
      >
        {task.isBlocked ? (
          <Ban className="h-5 w-5" />
        ) : task.status === "done" ? (
          <CheckCircle2 className="h-5 w-5 text-primary" />
        ) : (
          <Circle className="h-5 w-5" />
        )}
      </button>

      <div className="min-w-0 flex-1 space-y-2">
        <div>
          <div className="flex flex-wrap items-center gap-1.5">
            <p
              className={cn(
                "text-sm font-medium text-foreground",
                task.status === "done" && "line-through text-muted-foreground",
              )}
            >
              {task.title}
            </p>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-medium",
                effectiveStatus === "blocked" && "bg-destructive/10 text-destructive",
                effectiveStatus === "done" && "bg-primary/10 text-primary",
                effectiveStatus === "doing" && "bg-sky-500/10 text-sky-600",
                effectiveStatus === "todo" && "bg-secondary text-muted-foreground",
              )}
            >
              {STATUS_LABEL[effectiveStatus]}
            </span>
            {task.isOverdue && (
              <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-medium text-destructive">
                Overdue
              </span>
            )}
          </div>
          {task.description && (
            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
              {task.description}
            </p>
          )}
          {task.isBlocked && task.blockedBy && (
            <p className="mt-1 text-xs font-medium text-destructive">
              Blocked by overdue task: {task.blockedBy.title}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          {task.assignee ? (
            <span className="inline-flex items-center gap-1">
              <MemberAvatar user={task.assignee} size="sm" className="h-5 w-5 text-[9px]" />
              {task.assignee.userId === myUserId ? "You" : task.assignee.fullName}
            </span>
          ) : (
            <span>Unassigned</span>
          )}
          {task.dueAt && (
            <span className={cn("inline-flex items-center gap-1", task.isOverdue && "text-destructive")}>
              <CalendarClock className="h-3 w-3" />
              {dateTimeFormatter.format(new Date(task.dueAt))}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center shrink-0">
        {isOwner && task.assignee && task.status !== "done" && (
          <button
            type="button"
            onClick={() => onRemind(task)}
            disabled={!canRemind || reminding}
            title={
              reminderCoolingDown
                ? `Available ${dateTimeFormatter.format(nextReminder)}`
                : "Remind assignee"
            }
            aria-label={`Remind ${task.assignee.fullName}`}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 disabled:opacity-40"
          >
            {reminding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <BellRing className="h-4 w-4" />
            )}
          </button>
        )}
        {canEdit && (
          <button
            type="button"
            onClick={() => onEdit(task)}
            aria-label={`Edit ${task.title}`}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary"
          >
            <Pencil className="h-4 w-4" />
          </button>
        )}
        {canDelete && (
          <button
            type="button"
            onClick={() => onDelete(task)}
            aria-label={`Delete ${task.title}`}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </li>
  );
}

export default function ProgressView({ group }) {
  const [now] = useState(() => Date.now());
  const isOwner = group.myRole === "owner";
  const myUserId = getAuthUser()?.id ?? null;
  const { goals, isLoading: goalsLoading, error: goalsError } = useGroupGoals(group.id);
  const { tasks, isLoading: tasksLoading, error: tasksError } = useGroupTasks(group.id);
  const { progress, isLoading: progressLoading, error: progressError } =
    useGroupProgress(group.id);
  const { members } = useGroupMembers(group.id);
  const updateTask = useUpdateGroupTask(group.id);
  const deleteTask = useDeleteGroupTask(group.id);
  const deleteGoal = useDeleteGroupGoal(group.id);
  const remindTask = useRemindGroupTask(group.id);
  const [filter, setFilter] = useState("all");
  const [goalModal, setGoalModal] = useState({ open: false, item: null });
  const [taskModal, setTaskModal] = useState({ open: false, item: null });
  const [pendingDelete, setPendingDelete] = useState(null);
  const [remindingTaskId, setRemindingTaskId] = useState(null);

  const visibleTasks = useMemo(
    () =>
      tasks.filter((task) => {
        if (filter === "blocked") return task.isBlocked;
        if (filter === "overdue") return task.isOverdue;
        if (filter === "mine") return task.assignee?.userId === myUserId;
        return true;
      }),
    [tasks, filter, myUserId],
  );

  const changeStatus = async (task, status) => {
    try {
      await updateTask.mutateAsync({ taskId: task.id, payload: { status } });
      toast.success(status === "done" ? "Task completed" : "Task reopened");
    } catch (error) {
      toast.error(error.message);
    }
  };

  const remind = async (task) => {
    setRemindingTaskId(task.id);
    try {
      const result = await remindTask.mutateAsync(task.id);
      toast.success(
        `Reminder sent to ${task.assignee.fullName}. Next available ${dateTimeFormatter.format(
          new Date(result.nextAllowedAt),
        )}.`,
      );
    } catch (error) {
      toast.error(error.message);
    } finally {
      setRemindingTaskId(null);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const isGoal = pendingDelete.kind === "goal";
    const mutation = isGoal ? deleteGoal : deleteTask;
    try {
      await mutation.mutateAsync(pendingDelete.item.id);
      toast.success(isGoal ? "Goal deleted" : "Task deleted");
      setPendingDelete(null);
    } catch {
      // error is rendered by the dialog
    }
  };

  const loading = goalsLoading || tasksLoading || progressLoading;
  const error = goalsError || tasksError || progressError;

  return (
    <div className="flex-1 min-h-0 overflow-y-auto bg-background p-4">
      <div className="max-w-5xl mx-auto space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-foreground">Group progress</h2>
              {progress?.isBehind && (
                <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-semibold text-destructive">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Behind schedule
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Goals, dependent tasks, deadlines and member reminders
            </p>
          </div>
          <div className="flex gap-2">
            {isOwner && (
              <button
                type="button"
                onClick={() => setGoalModal({ open: true, item: null })}
                className="h-9 px-3 rounded-full bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 inline-flex items-center gap-1.5"
              >
                <Target className="h-4 w-4" />
                New goal
              </button>
            )}
            <button
              type="button"
              onClick={() => setTaskModal({ open: true, item: null })}
              className="h-9 px-4 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 inline-flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" />
              New task
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-16 flex justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="rounded-2xl bg-card border border-border p-4 text-sm text-destructive">
            {error}
          </div>
        ) : (
          <>
            {progress?.isBehind && (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
                <p className="text-sm font-semibold text-destructive">
                  Progress needs attention
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  A task is overdue or a goal's completion is below its elapsed time.
                  Dependent tasks are blocked only when their prerequisite is overdue.
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <StatCard
                icon={Target}
                label="Goal progress"
                value={group.progress.goalPercent == null ? "—" : `${group.progress.goalPercent}%`}
              />
              <StatCard
                icon={CheckCircle2}
                label="Tasks done"
                value={`${progress?.tasks.done ?? 0}/${progress?.tasks.total ?? 0}`}
              />
              <StatCard
                icon={Clock3}
                label="Overdue"
                value={progress?.tasks.overdue ?? 0}
                tone={(progress?.tasks.overdue ?? 0) > 0 ? "danger" : "primary"}
              />
              <StatCard
                icon={Ban}
                label="Blocked"
                value={progress?.tasks.blocked ?? 0}
                tone={(progress?.tasks.blocked ?? 0) > 0 ? "warning" : "primary"}
              />
            </div>

            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">Goals</h3>
                <span className="text-xs text-muted-foreground">{goals.length} total</span>
              </div>
              {goals.length === 0 ? (
                <div className="rounded-2xl bg-card border border-border p-6 text-center text-sm text-muted-foreground">
                  No group goals yet.
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-3">
                  {goals.map((goal) => (
                    <GoalCard
                      key={goal.id}
                      goal={goal}
                      canManage={isOwner}
                      onEdit={(item) => setGoalModal({ open: true, item })}
                      onDelete={(item) => setPendingDelete({ kind: "goal", item })}
                    />
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-foreground">Tasks</h3>
                <div className="flex rounded-full bg-secondary p-1">
                  {FILTERS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setFilter(item.id)}
                      className={cn(
                        "h-7 px-3 rounded-full text-xs font-medium transition-colors",
                        filter === item.id
                          ? "bg-card text-foreground shadow-soft"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
              {visibleTasks.length === 0 ? (
                <div className="rounded-2xl bg-card border border-border p-6 text-center text-sm text-muted-foreground">
                  No tasks match this filter.
                </div>
              ) : (
                <ul className="space-y-2">
                  {visibleTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      isOwner={isOwner}
                      myUserId={myUserId}
                      now={now}
                      reminding={remindingTaskId === task.id}
                      onEdit={(item) => setTaskModal({ open: true, item })}
                      onDelete={(item) => setPendingDelete({ kind: "task", item })}
                      onStatus={changeStatus}
                      onRemind={remind}
                    />
                  ))}
                </ul>
              )}
            </section>

            {progress?.members?.length > 0 && (
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">Member workload</h3>
                <div className="rounded-2xl bg-card border border-border divide-y divide-border">
                  {progress.members.map((member) => (
                    <div key={member.userId} className="p-3 flex items-center gap-3">
                      <MemberAvatar user={member} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">
                          {member.userId === myUserId ? `${member.fullName} (you)` : member.fullName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {member.done}/{member.assigned} done
                        </p>
                      </div>
                      {member.overdue > 0 && (
                        <span className="rounded-full bg-destructive/10 px-2 py-1 text-[11px] font-medium text-destructive">
                          {member.overdue} overdue
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      <GoalModal
        groupId={group.id}
        goal={goalModal.item}
        open={goalModal.open}
        onOpenChange={(open) => setGoalModal({ open, item: open ? goalModal.item : null })}
      />
      <TaskModal
        groupId={group.id}
        task={taskModal.item}
        canChangeStatus={
          isOwner || taskModal.item?.assignee?.userId === myUserId
        }
        members={members}
        goals={goals}
        tasks={tasks}
        open={taskModal.open}
        onOpenChange={(open) => setTaskModal({ open, item: open ? taskModal.item : null })}
      />
      <ConfirmActionDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => {
          if (!open) {
            deleteGoal.reset();
            deleteTask.reset();
            setPendingDelete(null);
          }
        }}
        title={`Delete this ${pendingDelete?.kind ?? "item"}?`}
        description={
          pendingDelete?.kind === "goal"
            ? "Tasks linked to this goal will remain, but will no longer reference it."
            : "Tasks depending on this task will become independent. This cannot be undone."
        }
        confirmLabel="Delete"
        destructive
        busy={deleteGoal.isPending || deleteTask.isPending}
        error={deleteGoal.error?.message ?? deleteTask.error?.message ?? null}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
