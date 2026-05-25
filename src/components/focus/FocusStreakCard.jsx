import { Flame } from "lucide-react";

export default function FocusStreakCard({ streak, loading }) {
  if (loading) {
    return (
      <div className="bg-card rounded-2xl p-5 shadow-soft border border-border">
        <p className="text-sm text-muted-foreground">Loading streak…</p>
      </div>
    );
  }

  const current = streak?.currentStreak ?? 0;
  const longest = streak?.longestStreak ?? 0;
  const todayMinutes = streak?.todayFocusMinutes ?? 0;
  const minDayMinutes = streak?.minDayMinutes ?? 15;
  const todayQualifies = streak?.todayQualifies ?? false;

  return (
    <div className="bg-card rounded-2xl p-5 shadow-soft border border-border space-y-4">
      <div className="flex items-center gap-2">
        <Flame className="h-5 w-5 text-orange-500" />
        <h2 className="font-semibold text-foreground">Study streak</h2>
      </div>

      <div className="flex items-end gap-6">
        <Stat value={current} label="Current days" accent />
        <Stat value={longest} label="Best streak" />
      </div>

      <p className="text-xs text-muted-foreground">
        {todayQualifies
          ? `Today qualifies with ${todayMinutes} min of focus time.`
          : `${todayMinutes}/${minDayMinutes} min today — reach ${minDayMinutes} min to keep your streak.`}
      </p>
    </div>
  );
}

function Stat({ value, label, accent = false }) {
  return (
    <div>
      <p
        className={`text-3xl font-display font-bold ${accent ? "text-orange-500" : "text-foreground"}`}
      >
        {value}
      </p>
      <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">
        {label}
      </p>
    </div>
  );
}
