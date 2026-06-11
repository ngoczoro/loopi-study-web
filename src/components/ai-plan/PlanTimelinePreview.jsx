const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const formatSessionTime = (startHour) => {
  const hour = Math.floor(startHour);
  const minutes = Math.round((startHour % 1) * 60);
  return `${hour}:${minutes.toString().padStart(2, "0")}`;
};

/**
 * @param {{ weeks: import("@/lib/study-plan/types").WeekPlan[], warnings?: string[], summary?: import("@/lib/study-plan/types").PlanSubjectSummary[], replacePreview?: import("@/lib/study-plan/types").ReplacePreviewItem[] }} props
 */
export default function PlanTimelinePreview({
  weeks,
  warnings = [],
  summary = [],
  replacePreview = [],
}) {
  if (!weeks.length) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        No sessions could be scheduled. Check exam dates and availability
        settings.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {summary.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {summary.map((item) => (
            <div
              key={item.subjectId}
              className="rounded-xl bg-secondary/40 px-3 py-2 text-xs"
            >
              <p className="font-medium text-foreground">{item.subjectName}</p>
              <p className="text-muted-foreground">
                {item.totalSessions} sessions · {item.totalHours}h total
              </p>
            </div>
          ))}
        </div>
      )}

      {replacePreview.some((item) => item.countToReplace > 0) && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-foreground">
          {replacePreview
            .filter((item) => item.countToReplace > 0)
            .map((item) => (
              <p key={item.subjectId}>
                {item.countToReplace} existing AI Plan session(s) for{" "}
                {item.subjectName} will be replaced on Apply.
              </p>
            ))}
        </div>
      )}

      {warnings.length > 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 space-y-1">
          {warnings.map((warning) => (
            <p key={warning} className="text-xs text-foreground">
              {warning}
            </p>
          ))}
        </div>
      )}

      <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
        {weeks.map((week) => (
          <details
            key={week.weekStartDate}
            className="group rounded-xl border border-border bg-secondary/20"
            open
          >
            <summary className="cursor-pointer list-none px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">
                  {week.label}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {week.sessions.length} sessions · {week.totalHours}h
                </p>
              </div>
            </summary>
            <div className="px-4 pb-3 space-y-1.5">
              {week.sessions.map((session, index) => (
                <div
                  key={`${session.weekStartDate}-${session.dayOfWeek}-${session.startHour}-${index}`}
                  className="flex items-center gap-3 rounded-lg bg-card/80 px-3 py-2"
                >
                  <div
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{
                      backgroundColor: session.color
                        ? `hsl(${session.color})`
                        : "hsl(var(--primary))",
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">
                      {session.title}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {DAY_LABELS[session.dayOfWeek]} ·{" "}
                      {formatSessionTime(session.startHour)} ·{" "}
                      {session.durationHours}h
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
