import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/queryKeys";
import { unwrapServiceResult } from "@/lib/query/unwrap";
import { useAuthQueryEnabled } from "@/lib/query/useAuthQueryEnabled";
import { invalidateNotifications } from "@/lib/query/invalidate";
import {
  deleteNotificationAPI,
  getNotificationsAPI,
  markNotificationReadAPI,
} from "@/services/notificationService";

const NOTIFICATIONS_LIST_PARAMS = { limit: 100 };

export function notificationsQueryOptions() {
  return {
    queryKey: queryKeys.notifications.all,
    queryFn: async () => {
      const result = await getNotificationsAPI(NOTIFICATIONS_LIST_PARAMS);
      return unwrapServiceResult(result, "Failed to fetch notifications");
    },
  };
}

export function useNotifications(options = {}) {
  const { enabled: enabledOption = true } = options;
  const authEnabled = useAuthQueryEnabled();

  const query = useQuery({
    ...notificationsQueryOptions(),
    enabled: authEnabled && enabledOption,
  });

  const notifications = Array.isArray(query.data) ? query.data : [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return {
    notifications,
    unreadCount,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error?.message ?? null,
    refetch: query.refetch,
    query,
  };
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) =>
      unwrapServiceResult(
        await deleteNotificationAPI(id),
        "Failed to delete notification",
      ),
    onSuccess: () => invalidateNotifications(queryClient),
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) =>
      unwrapServiceResult(
        await markNotificationReadAPI(id),
        "Failed to mark notification as read",
      ),
    onSuccess: () => invalidateNotifications(queryClient),
  });
}
