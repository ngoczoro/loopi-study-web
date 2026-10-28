import { useEffect, useSyncExternalStore } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { selectIsAuthenticated, useAuthStore } from "@/lib/authStore";
import { isMockEnabled } from "@/mocks/mockUtils";
import { invalidateNotifications } from "@/lib/query/invalidate";
import { queryKeys } from "@/lib/query/queryKeys";
import { isGroupTaskNotification } from "@/lib/notificationDisplay";
import {
  connectSocket,
  disconnectSocket,
  isSocketConnected,
  onSocketEvent,
  subscribeSocketStatus,
} from "@/lib/socket";

/** Mount once inside the authenticated app shell. */
export function useRealtimeConnection() {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAuthenticated || isMockEnabled()) return undefined;
    connectSocket();
    return () => disconnectSocket();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || isMockEnabled()) return undefined;

    const offNotification = onSocketEvent("notification:new", (notification) => {
      invalidateNotifications(queryClient);
      const groupId = notification?.metadata?.groupId;
      if (isGroupTaskNotification(notification) && groupId) {
        queryClient.invalidateQueries({ queryKey: ["groups", groupId, "tasks"] });
        queryClient.invalidateQueries({ queryKey: queryKeys.groups.progress(groupId) });
      }
      if (notification?.title) toast(notification.title, { description: notification.body ?? undefined });
    });

    // Anything pushed while offline is only visible after a refetch.
    let wasConnected = isSocketConnected();
    const offStatus = subscribeSocketStatus(() => {
      const connected = isSocketConnected();
      if (connected && !wasConnected) invalidateNotifications(queryClient);
      wasConnected = connected;
    });

    return () => {
      offNotification();
      offStatus();
    };
  }, [isAuthenticated, queryClient]);
}

export function useSocketConnected() {
  return useSyncExternalStore(subscribeSocketStatus, isSocketConnected, () => false);
}
