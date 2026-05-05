import { useState, useRef, useEffect } from "react";
import { Bell, Clock, Bot, Target } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

const notifications = [
  {
    icon: Clock,
    title: "Study reminder",
    body: "Time for your daily Linear Algebra review!",
    time: "5 min ago",
    unread: true,
  },
  {
    icon: Target,
    title: "Deadline approaching",
    body: "Problem Set #7 is due in 2 days",
    time: "1 hour ago",
    unread: true,
  },
  {
    icon: Bot,
    title: "AI suggestion",
    body: "Based on your progress, try reviewing Biology genetics",
    time: "3 hours ago",
    unread: false,
  },
  {
    icon: Bell,
    title: "Streak alert",
    body: "Don't forget to study today to keep your streak!",
    time: "Yesterday",
    unread: false,
  },
];

export function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  const unreadCount = notifications.filter((n) => n.unread).length;

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative h-9 w-9 rounded-full bg-secondary/50 flex items-center justify-center hover:bg-secondary transition-colors"
      >
        <Bell className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />

        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-primary border-2 border-background" />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-12 w-80 bg-card rounded-2xl shadow-soft-lg border border-border z-50 overflow-hidden"
          >
            <div className="p-3 border-b border-border/50">
              <h3 className="text-sm font-semibold text-foreground">
                Notifications
              </h3>
            </div>

            <div className="max-h-72 overflow-auto">
              {notifications.map((n, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setOpen(false);
                    navigate("/notifications");
                  }}
                  className={`w-full flex items-start gap-3 p-3 text-left hover:bg-secondary/40 transition-colors ${
                    n.unread ? "bg-primary/5" : ""
                  }`}
                >
                  <div
                    className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                      n.unread ? "bg-primary/15" : "bg-secondary"
                    }`}
                  >
                    <n.icon
                      className={`h-3.5 w-3.5 ${
                        n.unread ? "text-primary" : "text-muted-foreground"
                      }`}
                      strokeWidth={1.5}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">
                      {n.title}
                    </p>

                    <p className="text-[11px] text-muted-foreground truncate">
                      {n.body}
                    </p>

                    <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                      {n.time}
                    </p>
                  </div>

                  {n.unread && (
                    <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
                  )}
                </button>
              ))}
            </div>

            <div className="p-2 border-t border-border/50">
              <button
                onClick={() => {
                  setOpen(false);
                  navigate("/notifications");
                }}
                className="w-full h-8 rounded-xl text-xs font-medium text-primary hover:bg-primary/5 transition-colors"
              >
                View all notifications
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
