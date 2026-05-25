import { useState, useRef, useEffect } from "react";
import { Bell, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useAdminDemoStore } from "@/lib/adminDemoStore";

export function AdminNotificationDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  const { adminNotifications = [], markAdminNotificationRead } =
    useAdminDemoStore();
  const unreadCount = adminNotifications.filter((n) => n.unread).length;

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleClick = (notif) => {
    markAdminNotificationRead(notif.id);
    setOpen(false);
    navigate("/admin/warnings");
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative h-9 w-9 rounded-full bg-secondary/50 flex items-center justify-center hover:bg-secondary transition-colors"
      >
        <Bell className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />

        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
            {unreadCount}
          </span>
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
            <div className="p-3 border-b border-border/50 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">
                Admin Alerts
              </h3>

              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-destructive/10 text-destructive">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="max-h-72 overflow-auto">
              {adminNotifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={`w-full flex items-start gap-3 p-3 text-left hover:bg-secondary/40 transition-colors ${
                    n.unread ? "bg-destructive/5" : ""
                  }`}
                >
                  <div
                    className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                      n.unread ? "bg-destructive/15" : "bg-secondary"
                    }`}
                  >
                    <AlertTriangle
                      className={`h-3.5 w-3.5 ${
                        n.unread ? "text-destructive" : "text-muted-foreground"
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
                    <span className="h-2 w-2 rounded-full bg-destructive shrink-0 mt-1.5" />
                  )}
                </button>
              ))}
            </div>

            <div className="p-2 border-t border-border/50">
              <button
                onClick={() => {
                  setOpen(false);
                  navigate("/admin/warnings");
                }}
                className="w-full h-8 rounded-xl text-xs font-medium text-primary hover:bg-primary/5 transition-colors"
              >
                View all warnings
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
