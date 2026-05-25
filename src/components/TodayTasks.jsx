import { useMemo, useState } from "react";
import { useAppStore } from "../lib/store";
import { CheckCircle2, Plus, Trash2, ListChecks, Loader2 } from "lucide-react";
import { Input } from "./input";
import { Button } from "./button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";
import { Skeleton } from "./skeleton";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  isTaskOverdue,
  normalizeTaskSubjectId,
  sortTodayTasks,
  todayDateString,
} from "../lib/task-utils";
import {
  WidgetScrollArea,
  TASK_LIST_SCROLL_MAX,
} from "./WidgetScrollArea";

const priorityColors = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-primary/15 text-primary",
  high: "bg-destructive/15 text-destructive",
};

export default function TodayTasks() {
  const tasks = useAppStore((s) => s.tasks);
  const tasksLoading = useAppStore((s) => s.tasksLoading);
  const subjects = useAppStore((s) => s.subjects);

  const createTask = useAppStore((s) => s.createTask);
  const updateTask = useAppStore((s) => s.updateTask);
  const toggleTaskComplete = useAppStore((s) => s.toggleTaskComplete);
  const deleteTask = useAppStore((s) => s.deleteTask);

  const [title, setTitle] = useState("");
  const [subjectId, setSubjectId] = useState("none");
  const [priority, setPriority] = useState("medium");
  const [submitting, setSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [editingTitleId, setEditingTitleId] = useState(null);
  const [titleDraft, setTitleDraft] = useState("");
  const [savingTitleId, setSavingTitleId] = useState(null);
  const [savingPriorityId, setSavingPriorityId] = useState(null);

  const today = todayDateString();

  const todayTasks = useMemo(
    () => sortTodayTasks(tasks.filter((task) => task.dueDate === today)),
    [tasks, today],
  );

  const completedCount = todayTasks.filter((task) => task.completed).length;
  const allCompleted =
    todayTasks.length > 0 && completedCount === todayTasks.length;

  const handleAdd = async () => {
    const trimmed = title.trim();
    if (!trimmed) return;

    setSubmitting(true);
    const result = await createTask({
      title: trimmed,
      subjectId: normalizeTaskSubjectId(subjectId),
      priority,
      dueDate: today,
    });
    setSubmitting(false);

    if (result.ok) {
      setTitle("");
      toast.success("Task added!");
      return;
    }

    toast.error(result.message || "Failed to add task");
  };

  const handleToggle = async (id, wasDone) => {
    setTogglingId(id);
    const result = await toggleTaskComplete(id);
    setTogglingId(null);

    if (result.ok) {
      if (!wasDone) toast.success("Task completed 🎉");
      return;
    }
    toast.error(result.message || "Failed to update task");
  };

  const handleDelete = async (id) => {
    const result = await deleteTask(id);
    if (result.ok) {
      toast("Task deleted");
      return;
    }
    toast.error(result.message || "Failed to delete task");
  };

  const startEditingTitle = (task) => {
    if (!task) {
      setEditingTitleId(null);
      setTitleDraft("");
      return;
    }
    setEditingTitleId(task.id);
    setTitleDraft(task.title);
  };

  const saveTitle = async (task) => {
    const trimmed = titleDraft.trim();
    setEditingTitleId(null);

    if (!trimmed || trimmed === task.title) return;

    setSavingTitleId(task.id);
    const result = await updateTask(task.id, { title: trimmed });
    setSavingTitleId(null);

    if (!result.ok) {
      toast.error(result.message || "Failed to update task");
    }
  };

  const handlePriorityChange = async (task, nextPriority) => {
    if (nextPriority === task.priority) return;

    setSavingPriorityId(task.id);
    const result = await updateTask(task.id, { priority: nextPriority });
    setSavingPriorityId(null);

    if (!result.ok) {
      toast.error(result.message || "Failed to update priority");
    }
  };

  const getSubjectName = (sid) =>
    sid ? subjects.find((s) => s.id === sid)?.name : null;

  const getSubjectColor = (sid) =>
    sid ? subjects.find((s) => s.id === sid)?.color : null;

  return (
    <div
      id="todays-tasks"
      className="bg-card rounded-2xl p-5 shadow-soft scroll-mt-24 min-h-0 overflow-hidden"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-display font-semibold text-foreground">
          Today's Tasks
        </h2>
        <span className="text-xs font-bold text-muted-foreground">
          {completedCount}/{todayTasks.length} completed
        </span>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <Input
          placeholder="Add a task…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !submitting && handleAdd()}
          className="flex-1 rounded-xl bg-background/60"
        />
        <div className="flex gap-2">
          <Select value={subjectId} onValueChange={setSubjectId}>
            <SelectTrigger className="w-[130px] rounded-xl bg-background/60">
              <SelectValue placeholder="Subject" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Subject</SelectItem>
              {subjects.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger className="w-[100px] rounded-xl bg-background/60">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>

          <Button
            size="icon"
            onClick={handleAdd}
            disabled={submitting}
            className="rounded-xl shrink-0"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {tasksLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      ) : todayTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <ListChecks className="h-10 w-10 mb-2 opacity-40" />
          <p className="text-sm">No tasks for today. Add one above!</p>
        </div>
      ) : (
        <>
          {allCompleted ? (
            <div className="flex flex-col items-center justify-center py-3 mb-2 text-muted-foreground">
              <p className="text-sm font-medium text-foreground">
                You finished all today's tasks 🎉
              </p>
            </div>
          ) : null}
          <WidgetScrollArea
            itemCount={todayTasks.length}
            maxHeightClass={TASK_LIST_SCROLL_MAX}
            listClassName="space-y-2"
          >
            <AnimatePresence initial={false}>
              {todayTasks.map((task) => {
                const subjectName = getSubjectName(task.subjectId);
                const subjectColor = getSubjectColor(task.subjectId);

                return (
                  <TaskRow
                    key={task.id}
                    task={task}
                    subjectName={subjectName}
                    subjectColor={subjectColor}
                    editingTitleId={editingTitleId}
                    titleDraft={titleDraft}
                    savingTitleId={savingTitleId}
                    savingPriorityId={savingPriorityId}
                    togglingId={togglingId}
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                    onStartEditingTitle={startEditingTitle}
                    onTitleDraftChange={setTitleDraft}
                    onSaveTitle={saveTitle}
                    onPriorityChange={handlePriorityChange}
                  />
                );
              })}
            </AnimatePresence>
          </WidgetScrollArea>
        </>
      )}
    </div>
  );
}

function TaskRow({
  task,
  subjectName,
  subjectColor,
  editingTitleId,
  titleDraft,
  savingTitleId,
  savingPriorityId,
  togglingId,
  onToggle,
  onDelete,
  onStartEditingTitle,
  onTitleDraftChange,
  onSaveTitle,
  onPriorityChange,
}) {
  const overdue = isTaskOverdue(task);
  const isEditing = editingTitleId === task.id;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className={`flex items-center gap-3 p-3 rounded-xl transition-colors min-w-0 ${
        task.completed
          ? "bg-accent/20 opacity-80"
          : overdue
            ? "bg-destructive/5 border border-destructive/20"
            : "bg-background/60 hover:bg-secondary/30"
      }`}
    >
      <button
        onClick={() => onToggle(task.id, task.completed)}
        disabled={togglingId === task.id}
        className={`h-5 w-5 rounded-md border-2 flex items-center justify-center transition-colors shrink-0 ${
          task.completed
            ? "bg-accent border-accent"
            : "border-muted-foreground/30 hover:border-primary"
        }`}
      >
        {togglingId === task.id ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          task.completed && (
            <CheckCircle2
              className="h-3 w-3 text-accent-foreground"
              strokeWidth={2}
            />
          )
        )}
      </button>

      <div className="flex-1 min-w-0">
        {isEditing ? (
          <Input
            autoFocus
            value={titleDraft}
            onChange={(e) => onTitleDraftChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSaveTitle(task);
              if (e.key === "Escape") onStartEditingTitle(null);
            }}
            onBlur={() => onSaveTitle(task)}
            className="h-8 text-sm rounded-lg"
          />
        ) : (
          <button
            type="button"
            onClick={() => !task.completed && onStartEditingTitle(task)}
            className={`text-sm font-medium truncate text-left w-full ${
              task.completed
                ? "line-through text-muted-foreground cursor-default"
                : "text-foreground hover:text-primary transition-colors"
            }`}
          >
            {savingTitleId === task.id ? "Saving…" : task.title}
          </button>
        )}
      </div>

      <Select
        value={task.priority}
        onValueChange={(value) => onPriorityChange(task, value)}
        disabled={savingPriorityId === task.id}
      >
        <SelectTrigger
          className={`h-7 w-[88px] rounded-full border-0 text-[10px] uppercase tracking-widest px-2 ${priorityColors[task.priority]}`}
        >
          {savingPriorityId === task.id ? (
            <Loader2 className="h-3 w-3 animate-spin mx-auto" />
          ) : (
            <SelectValue />
          )}
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="high">High</SelectItem>
          <SelectItem value="medium">Medium</SelectItem>
          <SelectItem value="low">Low</SelectItem>
        </SelectContent>
      </Select>

      {subjectName ? (
        <span
          className="text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full shrink-0 hidden sm:inline"
          style={{
            backgroundColor: subjectColor
              ? `hsl(${subjectColor} / 0.15)`
              : undefined,
            color: subjectColor ? `hsl(${subjectColor})` : undefined,
          }}
        >
          {subjectName}
        </span>
      ) : null}

      <button
        onClick={() => onDelete(task.id)}
        className="text-muted-foreground/50 hover:text-destructive transition-colors shrink-0"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </motion.div>
  );
}
