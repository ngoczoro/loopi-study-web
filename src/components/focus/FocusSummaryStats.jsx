import { formatFocusHours } from "@/services/focusAnalyticsService";

export default function FocusSummaryStats({ summary, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-card rounded-xl p-4 shadow-soft border border-border animate-pulse h-20" />
        ))}
      </div>
    );
  }

  const stats = [
    { label: "Today", value: `${formatFocusHours(summary?.todayFocusSeconds)} hrs` },
    { label: "This week", value: `${formatFocusHours(summary?.weekFocusSeconds)} hrs` },
    { label: "Completed", value: `${summary?.completedCount ?? 0}` },
    { label: "Avg session", value: `${summary?.avgSessionMinutes ?? 0} min` },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map((stat) => (
        <div key={stat.label} className="bg-card rounded-xl p-4 shadow-soft border border-border">
          <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1">{stat.label}</p>
          <p className="text-xl font-bold text-foreground">{stat.value}</p>
        </div>
      ))}
    </div>
  );
}
