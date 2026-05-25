export const normalizeTaskSubjectId = (subjectId) => {
  if (
    subjectId === undefined ||
    subjectId === null ||
    subjectId === "" ||
    subjectId === "none" ||
    subjectId === "all"
  ) {
    return null;
  }
  return subjectId;
};

export const todayDateString = () => new Date().toISOString().slice(0, 10);

export const isTaskOverdue = (task) => {
  if (!task || task.completed || !task.dueDate) return false;
  return task.dueDate < todayDateString();
};

export const formatDueDate = (dueDate) => {
  if (!dueDate) return "";
  const date = new Date(`${dueDate}T00:00:00`);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const getDueDateLabel = (task) => {
  if (!task?.dueDate) return "";
  if (task.dueDate === todayDateString()) return "Today";
  if (isTaskOverdue(task)) return "Overdue";
  return formatDueDate(task.dueDate);
};

export const PRIORITY_RANK = {
  high: 1,
  medium: 2,
  low: 3,
};

export const sortTodayTasks = (tasks) =>
  [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    const priorityDiff =
      (PRIORITY_RANK[a.priority] ?? 99) - (PRIORITY_RANK[b.priority] ?? 99);
    if (priorityDiff !== 0) return priorityDiff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

export const getTodayCompletedCount = (tasks, today = todayDateString()) =>
  tasks.filter((task) => task.dueDate === today && task.completed).length;

export const getUpcomingDeadlineTasks = (
  taskSummary,
  { limit = 5, today = todayDateString() } = {},
) => {
  const items = [
    ...(taskSummary?.overdue ?? []),
    ...(taskSummary?.upcoming ?? []),
  ].filter((task) => !task.completed && task.dueDate);

  const unique = new Map();
  for (const task of items) {
    if (!unique.has(task.id)) unique.set(task.id, task);
  }

  return [...unique.values()]
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, limit);
};

export const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

export const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "completed", label: "Completed" },
];

export const SORT_OPTIONS = [
  { value: "dueDate:asc", label: "Due date (earliest)" },
  { value: "dueDate:desc", label: "Due date (latest)" },
  { value: "priority:desc", label: "Priority (high first)" },
  { value: "createdAt:desc", label: "Recently added" },
];
