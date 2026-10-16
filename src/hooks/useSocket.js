import { useEffect, useSyncExternalStore } from "react";
import { selectIsAuthenticated, useAuthStore } from "@/lib/authStore";
import { isMockEnabled } from "@/mocks/mockUtils";
import {
  connectSocket,
  disconnectSocket,
  isSocketConnected,
  subscribeSocketStatus,
} from "@/lib/socket";

/** Mount once inside the authenticated app shell. */
export function useRealtimeConnection() {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);

  useEffect(() => {
    if (!isAuthenticated || isMockEnabled()) return undefined;
    connectSocket();
    return () => disconnectSocket();
  }, [isAuthenticated]);
}

export function useSocketConnected() {
  return useSyncExternalStore(subscribeSocketStatus, isSocketConnected, () => false);
}
