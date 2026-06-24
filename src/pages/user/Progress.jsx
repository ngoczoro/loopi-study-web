import { TrendingUp, Clock, CheckCircle2, BookOpen } from "lucide-react";
import { useFocusAnalytics } from "@/hooks/queries/focusAnalytics";
import WeeklyTimeline from "@/components/WeeklyTimeline";
import FocusSummaryStats from "@/components/focus/FocusSummaryStats";
import FocusStreakCard from "@/components/focus/FocusStreakCard";
import FocusTrendChart from "@/components/focus/FocusTrendChart";
import FocusSubjectBreakdown from "@/components/focus/FocusSubjectBreakdown";
import { formatFocusHours } from "@/services/focusAnalyticsService";

export default function Progress() {
  const { summary, trends, subjects, streak, loading } = useFocusAnalytics({
    days: 28,
  });

  const avgPerDay = trends?.points?.length
    ? (summary?.monthFocusSeconds ?? 0) / Math.min(trends.points.length, 30) / 3600
    : 0;

  const sessionCount =
    summary?.qualifyingCompletedCount ?? summary?.totalSessions ?? 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in p-4">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">
          Progress & Analytics
        </h1>
        <p className="text-sm text-muted-foreground">
          Real study insights from your focus sessions
        </p>
      </div>

      {/* 4 Badges Thống kê trên cùng */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            icon: Clock,
            label: "Total Hours",
            value: loading ? "…" : `${formatFocusHours(summary?.totalFocusSeconds)} hrs`,
          },
          {
            icon: CheckCircle2,
            label: "Sessions",
            value: loading ? "…" : `${sessionCount}`,
          },
          {
            icon: TrendingUp,
            label: "Avg / Day",
            value: loading ? "…" : `${avgPerDay.toFixed(1)} hrs`,
          },
          {
            icon: BookOpen,
            label: "Subjects",
            value: loading ? "…" : `${subjects.length}`,
          },
        ].map((s) => (
          <div key={s.label} className="bg-card rounded-xl p-4 shadow-soft border border-border">
            <div className="flex items-center gap-2 mb-1">
              <s.icon className="h-4 w-4 text-primary" strokeWidth={1.5} />
              <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
                {s.label}
              </span>
            </div>
            <p className="text-xl font-bold text-foreground">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Focus summary badges (Today, This week, Completed, Avg session) */}
      <FocusSummaryStats summary={summary} loading={loading} />

      {/* Biểu đồ This Week's Study Time đã được chuyển xuống dưới tổng cộng 8 Badges */}
      <WeeklyTimeline />

      <div className="grid md:grid-cols-2 gap-6">
        <FocusTrendChart trends={trends} loading={loading} />
        <FocusStreakCard streak={streak} loading={loading} />
      </div>

      <FocusSubjectBreakdown subjects={subjects} loading={loading} />

      {summary && (
        <div className="bg-muted/30 rounded-xl p-4 text-xs text-muted-foreground space-y-1">
          <p>
            <strong className="text-foreground">Analytics rules:</strong> Focus time and charts
            include only completed Pomodoro sessions (running and paused sessions are excluded).
          </p>
          <p>
            Completed sessions under {Math.round((summary.rules?.minSessionSeconds ?? 300) / 60)}{" "}
            minutes count toward session totals but not toward focus seconds.
          </p>
          <p>
            Abandoned sessions are tracked separately and do not add to focus time. Streak days
            require at least {Math.round((summary.rules?.minStreakDaySeconds ?? 900) / 60)} minutes
            of qualifying focus time.
          </p>
        </div>
      )}
    </div>
  );
}