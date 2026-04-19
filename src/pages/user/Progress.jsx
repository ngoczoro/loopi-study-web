import { TrendingUp, Clock, CheckCircle2, BookOpen } from "lucide-react";
import WeeklyTimeline from "@/components/WeeklyTimeline";
import { useAppStore } from "@/lib/store";
import { useMemo } from "react";

export default function Progress() {
  const sessions = useAppStore((s) => s.sessions);
  const subjects = useAppStore((s) => s.subjects);

  const totalHours = useMemo(
    () => sessions.reduce((sum, s) => sum + s.duration, 0),
    [sessions],
  );

  const subjectProgress = useMemo(() => {
    return subjects.map((sub) => {
      const subSessions = sessions.filter((s) =>
        s.title.toLowerCase().includes(sub.name.toLowerCase().split(" ")[0]),
      );

      const hours = subSessions.reduce((sum, s) => sum + s.duration, 0);

      return {
        name: sub.name,
        hours,
        progress: sub.progress,
        color: sub.color,
      };
    });
  }, [subjects, sessions]);

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">
          Progress & Analytics
        </h1>
        <p className="text-sm text-muted-foreground">
          See how your study journey is going
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            icon: Clock,
            label: "Total Hours",
            value: `${totalHours.toFixed(1)} hrs`,
          },
          {
            icon: CheckCircle2,
            label: "Sessions",
            value: `${sessions.length}`,
          },
          {
            icon: TrendingUp,
            label: "Avg / Day",
            value: `${(totalHours / 7).toFixed(1)} hrs`,
          },
          {
            icon: BookOpen,
            label: "Active Subjects",
            value: `${subjects.length}`,
          },
        ].map((s) => (
          <div key={s.label} className="bg-card rounded-xl p-4 shadow-soft">
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

      <WeeklyTimeline />

      {/* Subject Breakdown */}
      <div className="bg-card rounded-2xl p-5 shadow-soft">
        <h2 className="text-lg font-display font-semibold text-foreground mb-4">
          Subject Breakdown
        </h2>

        <div className="space-y-4">
          {subjectProgress.map((s) => (
            <div key={s.name}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-foreground">
                  {s.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {s.hours.toFixed(1)}h studied · {s.progress}%
                </span>
              </div>

              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${s.progress}%`,
                    backgroundColor: `hsl(${s.color})`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
