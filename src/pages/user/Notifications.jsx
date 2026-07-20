import { useState } from "react";
import { Bell, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  useDeleteAllNotifications,
  useDeleteNotification,
  useNotifications,
} from "@/hooks/queries/notifications";
import {
  formatNotificationTime,
  getNotificationIcon,
} from "@/lib/notificationDisplay";
import { Button } from "@/components/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/alert-dialog";

export default function Notifications() {
  const { notifications, isLoading, error } = useNotifications();
  const deleteNotification = useDeleteNotification();
  const deleteAllNotifications = useDeleteAllNotifications();
  const [deletingId, setDeletingId] = useState(null);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    setDeletingId(id);
    try {
      await deleteNotification.mutateAsync(id);
      toast.success("Notification deleted");
    } catch (err) {
      toast.error(err?.message || "Failed to delete notification");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteAll = async () => {
    try {
      await deleteAllNotifications.mutateAsync();
      toast.success("All notifications deleted");
    } catch (err) {
      toast.error(err?.message || "Failed to delete all notifications");
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            Notifications
          </h1>
          <p className="text-sm text-muted-foreground">
            Stay on top of your study schedule
          </p>
        </div>

        {!isLoading && !error && notifications.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={deleteAllNotifications.isPending}
                className="rounded-xl shrink-0"
              >
                {deleteAllNotifications.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" strokeWidth={1.5} />
                )}
                Delete all
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete all notifications?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently remove all {notifications.length}{" "}
                  notifications. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAll}
                  className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete all
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span className="text-sm">Loading notifications…</span>
        </div>
      )}

      {!isLoading && error && (
        <div className="rounded-xl bg-destructive/10 text-destructive text-sm p-4">
          {error}
        </div>
      )}

      {!isLoading && !error && notifications.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl bg-card shadow-soft">
          <div className="h-12 w-12 rounded-2xl bg-secondary flex items-center justify-center mb-3">
            <Bell
              className="h-6 w-6 text-muted-foreground"
              strokeWidth={1.5}
            />
          </div>
          <p className="text-sm font-medium text-foreground">No notifications yet</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs">
            Reminders, deadlines, and study updates will appear here.
          </p>
        </div>
      )}

      {!isLoading && !error && notifications.length > 0 && (
        <div className="space-y-2">
          {notifications.map((n) => {
            const Icon = getNotificationIcon(n.type);
            const unread = !n.isRead;
            const isDeleting = deletingId === n.id;

            return (
              <div
                key={n.id}
                className={`group relative flex items-start gap-4 p-4 rounded-xl transition-colors ${
                  unread ? "bg-primary/5 shadow-soft" : "bg-card shadow-soft"
                }`}
              >
                <div
                  className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${
                    unread ? "bg-primary/15" : "bg-secondary"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 ${
                      unread ? "text-primary" : "text-muted-foreground"
                    }`}
                    strokeWidth={1.5}
                  />
                </div>
                <div className="flex-1 min-w-0 pr-8">
                  <p className="text-sm font-medium text-foreground">{n.title}</p>
                  {n.body && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {n.body}
                    </p>
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0 pt-0.5">
                  {formatNotificationTime(n.createdAt)}
                </span>

                <button
                  type="button"
                  onClick={(e) => handleDelete(e, n.id)}
                  disabled={isDeleting}
                  aria-label="Delete notification"
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all disabled:opacity-50"
                >
                  {isDeleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
