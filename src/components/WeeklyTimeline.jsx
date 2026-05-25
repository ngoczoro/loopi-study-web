import { useMemo } from "react";
import { Loader2 } from "lucide-react";
import { getWeekStartDate } from "@/lib/plannerWeek";
import { usePlannerWeek } from "@/hooks/usePlannerWeek";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = Array.from({ length: 25 }, (_, i) => i);

export default function WeeklyTimeline() {
  const weekStartDate = getWeekStartDate(new Date());
  const { sessions, loading, error } = usePlannerWeek(weekStartDate);

  const totalHours = useMemo(
    () => sessions.reduce((sum, s) => sum + s.duration, 0),
    [sessions],
  );

  if (loading) {
    return (
      <div className="bg-card rounded-2xl p-8 shadow-soft flex items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading this week&apos;s schedule…
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card rounded-2xl p-5 shadow-soft text-sm text-muted-foreground">
        Could not load planner sessions. Open the Planner to retry.
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl p-5 shadow-soft">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-display font-semibold text-foreground">
          This Week&apos;s Study Time
        </h2>
        <span className="text-sm font-semibold text-primary">
          {totalHours.toFixed(1)}h total
        </span>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-10 shrink-0" />
            <div className="flex-1 relative h-5">
              {HOURS.map((h) => {
                const isMajor = h % 6 === 0;
                return (
                  <div
                    key={h}
                    className={
                      isMajor
                        ? "absolute text-[10px] font-semibold text-foreground"
                        : "absolute text-[8px] font-medium text-muted-foreground/60"
                    }
                    style={{
                      left: `${(h / 24) * 100}%`,
                      transform: "translateX(-50%)",
                    }}
                  >
                    {isMajor
                      ? `${String(h).padStart(2, "0")}:00`
                      : String(h).padStart(2, "0")}
                  </div>
                );
              })}
            </div>
            <span className="w-10 shrink-0" />
          </div>

          <div className="space-y-1.5">
            {DAYS.map((day, dayIndex) => {
              const daySessions = sessions.filter((s) => s.day === dayIndex);
              const dayTotal = daySessions.reduce(
                (sum, s) => sum + s.duration,
                0,
              );

              return (
                <div key={day} className="flex items-center gap-2">
                  <span className="w-10 text-xs font-semibold text-muted-foreground text-right shrink-0">
                    {day}
                  </span>

                  <div className="flex-1 relative h-9 bg-secondary/40 rounded-lg overflow-hidden">
                    {HOURS.filter((h) => h % 4 === 0 && h > 0 && h < 24).map(
                      (h) => (
                        <div
                          key={h}
                          className="absolute top-0 bottom-0 w-px bg-border/50"
                          style={{ left: `${(h / 24) * 100}%` }}
                        />
                      ),
                    )}

                    {daySessions.map((session) => {
                      const leftPct = (session.start / 24) * 100;
                      const widthPct = (session.duration / 24) * 100;
                      const endTime = session.start + session.duration;

                      const formatTime = (t) => {
                        const hrs = Math.floor(t);
                        const mins = Math.round((t - hrs) * 60);
                        return `${String(hrs).padStart(2, "0")}:${String(
                          mins,
                        ).padStart(2, "0")}`;
                      };

                      return (
                        <div
                          key={session.id}
                          className="absolute top-1 bottom-1 rounded-md flex items-center justify-center overflow-hidden cursor-default transition-all hover:brightness-110 hover:shadow-md"
                          style={{
                            left: `${leftPct}%`,
                            width: `${widthPct}%`,
                            backgroundColor: `hsl(${session.color})`,
                            minWidth: "6px",
                          }}
                          title={`${session.title}\n${formatTime(
                            session.start,
                          )} → ${formatTime(endTime)} (${session.duration}h)`}
                        >
                          <span className="text-[9px] font-bold text-white truncate px-1 drop-shadow-sm w-full text-center">
                            {session.title}
                          </span>
                        </div>
                      );
                    })}

                    {daySessions.length === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-[10px] text-muted-foreground/50 italic">
                          No sessions
                        </span>
                      </div>
                    )}
                  </div>

                  <span className="w-10 text-[11px] font-bold text-foreground text-right shrink-0">
                    {dayTotal > 0 ? `${dayTotal}h` : "–"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <p className="text-sm text-muted-foreground mt-4">
        {sessions.length === 0 ? (
          <>No sessions scheduled this week yet. Add some in the Planner.</>
        ) : (
          <>
            You&apos;ve scheduled{" "}
            <span className="font-semibold text-foreground">
              {totalHours.toFixed(1)} hours
            </span>{" "}
            across{" "}
            <span className="font-semibold text-foreground">
              {sessions.length} sessions
            </span>{" "}
            this week.
          </>
        )}
      </p>
    </div>
  );
}
