import {
  AlarmClock,
  Ban,
  Bell,
  BellRing,
  Bot,
  CalendarClock,
  ClipboardList,
  Clock,
  ShieldAlert,
  Target,
} from "lucide-react";

const TYPE_ICONS = {
  reminder: Clock,
  deadline: Target,
  ai: Bot,
  streak: Bell,
  session: Clock,
  moderation: ShieldAlert,
  group_task_assigned: ClipboardList,
  group_task_reminder: BellRing,
  group_task_due_soon: CalendarClock,
  group_task_overdue: AlarmClock,
  group_task_blocked: Ban,
};

export function getNotificationIcon(type) {
  return TYPE_ICONS[type] ?? Bell;
}

export const isGroupTaskNotification = (notification) =>
  typeof notification?.type === "string" && notification.type.startsWith("group_task_");

/** Where clicking a notification should take the user, or null to stay on the list. */
export function getNotificationLink(notification) {
  const groupId = notification?.metadata?.groupId;
  if (isGroupTaskNotification(notification) && groupId) {
    return `/groups/${groupId}?view=tasks`;
  }
  return null;
}

export function formatNotificationTime(createdAt) {
  if (!createdAt) return "";
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return "";

  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour === 1 ? "" : "s"} ago`;
  if (diffDay === 1) return "Yesterday";
  if (diffDay < 7) return `${diffDay} days ago`;

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
