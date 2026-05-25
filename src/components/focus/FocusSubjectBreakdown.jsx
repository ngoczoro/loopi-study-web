export default function FocusSubjectBreakdown({ subjects, loading }) {
  if (loading) {
    return (
      <div className="bg-card rounded-2xl p-5 shadow-soft border border-border">
        <p className="text-sm text-muted-foreground">Loading subject stats…</p>
      </div>
    );
  }

  if (!subjects?.length) {
    return (
      <div className="bg-card rounded-2xl p-5 shadow-soft border border-border">
        <h2 className="font-semibold text-foreground mb-2">Subject breakdown</h2>
        <p className="text-sm text-muted-foreground">Complete focus sessions to see subject stats.</p>
      </div>
    );
  }

  const maxMinutes = Math.max(...subjects.map((s) => s.focusMinutes), 1);

  return (
    <div className="bg-card rounded-2xl p-5 shadow-soft border border-border">
      <h2 className="font-semibold text-foreground mb-4">Subject breakdown</h2>
      <div className="space-y-4">
        {subjects.map((subject) => (
          <div key={subject.subjectId}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-medium text-foreground">{subject.subjectName}</span>
              <span className="text-xs text-muted-foreground">
                {subject.focusMinutes} min · {subject.sessionCount} sessions
              </span>
            </div>
            <div className="h-2 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${Math.round((subject.focusMinutes / maxMinutes) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
