import { Bell, Clock, Bot, Target } from "lucide-react";

const notifications = [
  { icon: Clock, title: "Study reminder", body: "Time for your daily Linear Algebra review!", time: "5 min ago", unread: true },
  { icon: Target, title: "Deadline approaching", body: "Problem Set #7 is due in 2 days", time: "1 hour ago", unread: true },
  { icon: Bot, title: "AI suggestion", body: "Based on your progress, try reviewing Biology genetics", time: "3 hours ago", unread: false },
  { icon: Bell, title: "Streak alert", body: "Don't forget to study today to keep your streak!", time: "Yesterday", unread: false },
  { icon: Clock, title: "Session completed", body: "You finished a 25-min Pomodoro session. Nice!", time: "Yesterday", unread: false },
];

export default function Notifications() {
  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Notifications</h1>
        <p className="text-sm text-muted-foreground">Stay on top of your study schedule</p>
      </div>

      <div className="space-y-2">
        {notifications.map((n, i) => (
          <div
            key={i}
            className={`flex items-start gap-4 p-4 rounded-xl transition-colors ${
              n.unread ? "bg-primary/5 shadow-soft" : "bg-card shadow-soft"
            }`}
          >
            <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${n.unread ? "bg-primary/15" : "bg-secondary"}`}>
              <n.icon className={`h-4 w-4 ${n.unread ? "text-primary" : "text-muted-foreground"}`} strokeWidth={1.5} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{n.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>
            </div>
            <span className="text-[10px] text-muted-foreground shrink-0">{n.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
