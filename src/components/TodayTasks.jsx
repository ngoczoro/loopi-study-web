import {useState, useMemo} from "react";
import {useAppStore} from "../lib/store";
import {moderateContent} from "../lib/ai-utils";
import {CheckCircle2, Plus, Trash2, ListChecks} from "lucide-react";
import {Input} from "./input";
import {Button} from "./button";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "./select";
import {Badge} from "./badge";
import {toast} from "sonner";
import {motion, AnimatePresence} from "framer-motion";

const priorityColors = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-primary/15 text-primary",
  high: "bg-destructive/15 text-destructive",
};

export default function TodayTasks() {
  const { tasks, subjects, addTask, toggleTask, deleteTask, addViolation } = useAppStore();
  const [title, setTitle] = useState("");
  const [subjectId, setSubjectId] = useState("none");
  const [priority, setPriority] = useState("medium");

  const today = new Date().toISOString().slice(0, 10);

  const todayTasks = useMemo(
    () =>
      [...tasks]
        .filter((t) => t.taskDate === today)
        .sort((a, b) => {
          if (a.completed !== b.completed) return a.completed ? 1 : -1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }),
    [tasks, today]
  );

  const completedCount = todayTasks.filter((t) => t.completed).length;

  const handleAdd = () => {
    const trimmed = title.trim();
    if (!trimmed) return;

    const modResult = moderateContent(trimmed);
    if (modResult?.flagged) {
      addViolation({
        userId: "u1",
        userName: "Student",
        userEmail: "student@example.com",
        type: modResult.type,
        contentId: "",
        contentTitle: trimmed,
        contentType: "note",
        detectedAt: new Date().toLocaleString(),
        resolved: false,
      });
      toast.error("Content flagged by AI moderation.");
      return;
    }

    addTask({
      title: trimmed,
      subjectId: subjectId === "none" ? null : subjectId,
      completed: false,
      priority,
      taskDate: today,
      createdAt: new Date().toISOString(),
    });
    setTitle("");
    toast.success("Task added!");
  };

  const handleToggle = (id, wasDone) => {
    toggleTask(id);
    if (!wasDone) toast.success("Task completed 🎉");
  };

  const handleDelete = (id) => {
    deleteTask(id);
    toast("Task deleted");
  };

  const getSubjectName = (sid) =>
    sid ? subjects.find((s) => s.id === sid)?.name : null;

  const getSubjectColor = (sid) =>
    sid ? subjects.find((s) => s.id === sid)?.color : null;

  return (
    <div className="bg-card rounded-2xl p-5 shadow-soft">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-display font-semibold text-foreground">Today's Tasks</h2>
        <span className="text-xs font-bold text-muted-foreground">
          {completedCount}/{todayTasks.length} completed
        </span>
      </div>

      {/* Add Task Form */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <Input
          placeholder="Add a task…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
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

          <Select value={priority} onValueChange={(v) => setPriority(v)}>
            <SelectTrigger className="w-[100px] rounded-xl bg-background/60">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>

          <Button size="icon" onClick={handleAdd} className="rounded-xl shrink-0">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Task List */}
      {todayTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <ListChecks className="h-10 w-10 mb-2 opacity-40" />
          <p className="text-sm">No tasks for today. Add one above!</p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {todayTasks.map((task) => {
              const subjectName = getSubjectName(task.subjectId);
              const subjectColor = getSubjectColor(task.subjectId);
              return (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                    task.completed ? "bg-accent/20" : "bg-background/60 hover:bg-secondary/30"
                  }`}
                >
                  <button
                    onClick={() => handleToggle(task.id, task.completed)}
                    className={`h-5 w-5 rounded-md border-2 flex items-center justify-center transition-colors shrink-0 ${
                      task.completed
                        ? "bg-accent border-accent"
                        : "border-muted-foreground/30 hover:border-primary"
                    }`}
                  >
                    {task.completed && (
                      <CheckCircle2 className="h-3 w-3 text-accent-foreground" strokeWidth={2} />
                    )}
                  </button>

                  <div className="flex-1 min-w-0 flex items-center gap-2">
                    <p
                      className={`text-sm font-medium truncate ${
                        task.completed ? "line-through text-muted-foreground" : "text-foreground"
                      }`}
                    >
                      {task.title}
                    </p>
                  </div>

                  <Badge
                    className={`text-[10px] uppercase tracking-widest shrink-0 ${priorityColors[task.priority]}`}
                    variant="secondary"
                  >
                    {task.priority}
                  </Badge>

                  {subjectName && (
                    <span
                      className="text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full shrink-0"
                      style={{
                        backgroundColor: subjectColor
                          ? `hsl(${subjectColor} / 0.15)`
                          : undefined,
                        color: subjectColor ? `hsl(${subjectColor})` : undefined,
                      }}
                    >
                      {subjectName}
                    </span>
                  )}

                  <button
                    onClick={() => handleDelete(task.id)}
                    className="text-muted-foreground/50 hover:text-destructive transition-colors shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}