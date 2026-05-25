export default function FocusPlannerInsights({ planner, loading }) {
  if (loading || !planner) return null;

  const { consistency, blocks } = planner;
  if (!blocks?.length) return null;

  return (
    <div className="bg-card rounded-2xl p-5 shadow-soft border border-border space-y-4">
      <div>
        <h2 className="font-semibold text-foreground">Planner vs actual focus</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Week of {planner.weekStartDate} · {consistency.linkRate}% blocks linked to focus sessions
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
        <MiniStat label="Planned" value={`${consistency.totalPlannedMinutes}m`} />
        <MiniStat label="Actual" value={`${consistency.totalActualMinutes}m`} />
        <MiniStat label="Completion" value={`${consistency.overallCompletionRate}%`} />
        <MiniStat label="Linked" value={`${consistency.linkedBlocks}/${consistency.plannedBlocks}`} />
      </div>
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {blocks.filter((b) => b.plannedMinutes > 0).slice(0, 6).map((block) => (
          <div key={block.plannerSessionId} className="flex items-center justify-between text-sm rounded-lg bg-muted/30 px-3 py-2">
            <span className="truncate text-foreground">{block.plannerTitle || block.subjectName || "Planner block"}</span>
            <span className="text-xs text-muted-foreground shrink-0 ml-2">
              {block.actualFocusMinutes}/{block.plannedMinutes}m
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-xl bg-muted/30 p-3">
      <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">{label}</p>
      <p className="text-lg font-bold text-foreground">{value}</p>
    </div>
  );
}
