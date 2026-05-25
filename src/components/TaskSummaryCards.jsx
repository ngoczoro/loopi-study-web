import { CheckCircle2, Clock, AlertCircle, CalendarDays } from "lucide-react";
import { Skeleton } from "./skeleton";

const cards = [
  {
    key: "pendingCount",
    label: "Pending",
    icon: Clock,
    color: "text-blue-500",
  },
  {
    key: "completedCount",
    label: "Completed",
    icon: CheckCircle2,
    color: "text-green-500",
  },
  {
    key: "overdueCount",
    label: "Overdue",
    icon: AlertCircle,
    color: "text-destructive",
  },
  {
    key: "upcomingCount",
    label: "Upcoming",
    icon: CalendarDays,
    color: "text-primary",
  },
];

export function TaskSummaryCards({ summary, loading }) {
  const values = {
    pendingCount: summary?.pendingCount ?? 0,
    completedCount: summary?.completedCount ?? 0,
    overdueCount: summary?.overdue?.length ?? 0,
    upcomingCount: summary?.upcoming?.length ?? 0,
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map((card) => (
        <div
          key={card.key}
          className="bg-card rounded-xl p-4 shadow-sm border border-border"
        >
          <div className="flex items-center gap-2 mb-1">
            <card.icon className={`h-4 w-4 ${card.color}`} strokeWidth={2} />
            <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
              {card.label}
            </span>
          </div>
          {loading ? (
            <Skeleton className="h-7 w-12" />
          ) : (
            <p className="text-xl font-bold text-foreground">{values[card.key]}</p>
          )}
        </div>
      ))}
    </div>
  );
}
