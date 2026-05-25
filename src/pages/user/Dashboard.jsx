import { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Flame, Clock, CheckCircle2, BookOpen, Timer, ArrowDown } from "lucide-react";
import WeeklyTimeline from "../../components/WeeklyTimeline";
import TodayTasks from "../../components/TodayTasks";
import { TaskSummaryCards } from "../../components/TaskSummaryCards";
import loopyHappy from "../../assets/loopy-happy.png";
import { Link } from "react-router-dom";
import { useAppStore } from "../../lib/store";
import { useAuthStore } from "../../lib/authStore";
import { useFocusAnalyticsSummary } from "@/hooks/useFocusAnalytics";
import { formatFocusHours } from "@/services/focusAnalyticsService";
import {
  formatDueDate,
  getTodayCompletedCount,
  getUpcomingDeadlineTasks,
  todayDateString,
} from "../../lib/task-utils";
import { Skeleton } from "../../components/skeleton";
import {
  WidgetScrollArea,
  DEADLINE_LIST_SCROLL_MAX,
} from "../../components/WidgetScrollArea";

export default function Dashboard() {
  const accessToken = useAuthStore((s) => s.accessToken);

  const tasks = useAppStore((s) => s.tasks);
  const subjects = useAppStore((s) => s.subjects);
  const taskSummary = useAppStore((s) => s.taskSummary);
  const taskSummaryLoading = useAppStore((s) => s.taskSummaryLoading);

  const fetchTaskSummary = useAppStore((s) => s.fetchTaskSummary);
  const fetchTasks = useAppStore((s) => s.fetchTasks);
  const fetchSubjects = useAppStore((s) => s.fetchSubjects);

  const today = todayDateString();
  const todayTasks = useMemo(
    () => tasks.filter((task) => task.dueDate === today),
    [tasks, today],
  );
  const completed = getTodayCompletedCount(tasks, today);
  const pendingToday = todayTasks.length - completed;

  const { data: focusSummary, isLoading: focusSummaryLoading } =
    useFocusAnalyticsSummary();
  const todayFocusLabel = focusSummaryLoading
    ? "…"
    : `${formatFocusHours(focusSummary?.todayFocusSeconds)} hrs`;

  useEffect(() => {
    if (!accessToken) return;
    fetchSubjects();
    fetchTaskSummary();
    fetchTasks({ dueDate: today, limit: 50 });
  }, [accessToken, fetchSubjects, fetchTaskSummary, fetchTasks, today]);

  const upcomingItems = useMemo(
    () => getUpcomingDeadlineTasks(taskSummary, { limit: 20, today }),
    [taskSummary, today],
  );

  const getSubjectName = (subjectId) =>
    subjectId
      ? subjects.find((subject) => subject.id === subjectId)?.name
      : "General";

  const scrollToTodayTasks = () => {
    document.getElementById("todays-tasks")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in p-4">
      <div className="relative bg-card rounded-2xl p-6 md:p-8 shadow-soft overflow-hidden border border-border">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1 space-y-2">
            <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight text-foreground">
              Ready for a cozy study session? 📚
            </h1>
            <p className="text-muted-foreground text-[15px] leading-relaxed">
              Loopy is cheering for you! You have{" "}
              <span className="font-semibold text-foreground">
                {taskSummaryLoading ? "…" : pendingToday} tasks
              </span>{" "}
              to tackle today.
            </p>
            <div className="flex flex-wrap gap-3 pt-3">
              <Link
                to="/pomodoro"
                className="inline-flex items-center gap-2 h-10 px-5 rounded-full bg-primary text-primary-foreground font-medium text-sm shadow-md hover:scale-[1.02] transition-transform"
              >
                <Timer className="h-4 w-4" strokeWidth={1.5} /> Start Studying
              </Link>
              <button
                type="button"
                onClick={scrollToTodayTasks}
                className="inline-flex items-center gap-2 h-10 px-5 rounded-full bg-secondary text-secondary-foreground font-medium text-sm hover:bg-secondary/80 transition-colors"
              >
                Today's Tasks <ArrowDown className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </div>
          </div>
          <motion.img
            src={loopyHappy}
            alt="Loopy mascot"
            className="w-32 h-32 md:w-40 md:h-40 object-contain"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </div>

      <TaskSummaryCards summary={taskSummary} loading={taskSummaryLoading} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Flame, label: "Streak", value: "7 days", color: "text-orange-500" },
          { icon: Clock, label: "Today", value: todayFocusLabel, color: "text-blue-500" },
          {
            icon: CheckCircle2,
            label: "Completed",
            value: `${completed} / ${todayTasks.length}`,
            color: "text-green-500",
          },
          {
            icon: BookOpen,
            label: "Subjects",
            value: `${subjects.length} active`,
            color: "text-purple-500",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-card rounded-xl p-4 shadow-sm border border-border"
          >
            <div className="flex items-center gap-2 mb-1">
              <stat.icon className={`h-4 w-4 ${stat.color}`} strokeWidth={2} />
              <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                {stat.label}
              </span>
            </div>
            <p className="text-xl font-bold text-foreground">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <TodayTasks />
        </div>

        <div className="bg-card rounded-2xl p-5 shadow-sm border border-border flex flex-col min-h-0">
          <h2 className="text-lg font-semibold text-foreground mb-4 shrink-0">
            Upcoming Deadlines
          </h2>
          {taskSummaryLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 w-full rounded-xl" />
              ))}
            </div>
          ) : upcomingItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No upcoming deadlines. You're all caught up!
            </p>
          ) : (
            <WidgetScrollArea
              itemCount={upcomingItems.length}
              maxHeightClass={DEADLINE_LIST_SCROLL_MAX}
              listClassName="space-y-3"
            >
              {upcomingItems.map((task) => (
                <div
                  key={task.id}
                  className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors min-w-0"
                >
                  <div
                    className={`h-2 w-2 rounded-full mt-2 shrink-0 ${
                      task.dueDate < today ? "bg-destructive" : "bg-primary"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">
                      {task.title}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {getSubjectName(task.subjectId)} ·{" "}
                      {formatDueDate(task.dueDate)}
                    </p>
                  </div>
                </div>
              ))}
            </WidgetScrollArea>
          )}
        </div>
      </div>

      <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
        <WeeklyTimeline />
      </div>
    </div>
  );
}
