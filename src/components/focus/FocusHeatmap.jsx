export default function FocusHeatmap({ trends, loading }) {
  if (loading || !trends?.points?.length) {
    return null;
  }

  const maxMinutes = Math.max(
    ...trends.points.map((p) => p.focusMinutes),
    1,
  );

  const recent = trends.points.slice(-28);

  return (
    <div className="bg-card rounded-2xl p-5 shadow-soft border border-border">
      <h2 className="font-semibold text-foreground mb-4">Focus heatmap (4 weeks)</h2>
      <div className="grid grid-cols-7 gap-1.5">
        {recent.map((point) => {
          const intensity = point.focusMinutes / maxMinutes;
          const opacity = 0.15 + intensity * 0.85;

          return (
            <div
              key={point.date}
              title={`${point.date}: ${point.focusMinutes} min`}
              className="aspect-square rounded-md flex flex-col items-center justify-center text-[9px] font-medium"
              style={{
                backgroundColor: `hsl(var(--primary) / ${opacity})`,
              }}
            >
              <span className="text-muted-foreground">{point.date.slice(8)}</span>
              <span className="text-foreground/80">{point.focusMinutes}m</span>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground mt-3">
        Darker cells = more qualifying focus time that day.
      </p>
    </div>
  );
}
