import { useState, useRef, useEffect } from "react";
import { Bell, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  useMarkAsRead,
  useNotifications,
} from "@/hooks/queries/notifications";
import {
  formatNotificationTime,
  getNotificationIcon,
} from "@/lib/notificationDisplay";

const DROPDOWN_PREVIEW_LIMIT = 5;

export function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();
  const { notifications, unreadCount, isLoading } = useNotifications();
  const markAsRead = useMarkAsRead();

  const preview = notifications.slice(0, DROPDOWN_PREVIEW_LIMIT);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleItemClick = async (notification) => {
    setOpen(false);
    if (!notification.isRead) {
      try {
        await markAsRead.mutateAsync(notification.id);
      } catch {
        /* list still navigates */
      }
    }
    navigate("/notifications");
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative h-9 w-9 rounded-full bg-secondary/50 flex items-center justify-center hover:bg-secondary transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />

        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center border-2 border-background">
            {unreadCount > 99 ? "99+" : unreadCount}
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
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="max-h-72 overflow-auto">
              {isLoading && (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              )}

              {!isLoading && preview.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-8 px-4">
                  No notifications yet
                </p>
              )}

              {!isLoading &&
                preview.map((n) => {
                  const Icon = getNotificationIcon(n.type);
                  const unread = !n.isRead;

                  return (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => handleItemClick(n)}
                      className={`w-full flex items-start gap-3 p-3 text-left hover:bg-secondary/40 transition-colors ${
                        unread ? "bg-primary/5" : ""
                      }`}
                    >
                      <div
                        className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                          unread ? "bg-primary/15" : "bg-secondary"
                        }`}
                      >
                        <Icon
                          className={`h-3.5 w-3.5 ${
                            unread ? "text-primary" : "text-muted-foreground"
                          }`}
                          strokeWidth={1.5}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">
                          {n.title}
                        </p>

                        {n.body && (
                          <p className="text-[11px] text-muted-foreground truncate">
                            {n.body}
                          </p>
                        )}

                        <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                          {formatNotificationTime(n.createdAt)}
                        </p>
                      </div>

                      {unread && (
                        <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
                      )}
                    </button>
                  );
                })}
            </div>

            <div className="p-2 border-t border-border/50">
              <button
                type="button"
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
