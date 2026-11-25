import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { selectIsAuthenticated, useAuthStore } from "@/lib/authStore";
import { isMockEnabled } from "@/mocks/mockUtils";
import { patchCachedGroup } from "@/hooks/queries/groups";
import { queryKeys } from "@/lib/query/queryKeys";
import { onSocketEvent, subscribeSocketStatus, isSocketConnected } from "@/lib/socket";

const TOAST_DURATION_MS = 10_000;

const isViewingGroup = (groupId) => window.location.pathname === `/groups/${groupId}`;

/**
 * Group call start/end, pushed to every member (`call:started` / `call:ended`):
 * keeps the green "in call" dot in the group list current and, unless the member muted
 * the group (`notify: false`), shows a silent toast with a Join button.
 *
 * Mount once inside the authenticated app shell.
 */
export function useGroupCallAlerts() {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  // Kept in a ref so moving between pages does not resubscribe.
  const navigateRef = useRef(navigate);
  useEffect(() => {
    navigateRef.current = navigate;
  }, [navigate]);

  useEffect(() => {
    if (!isAuthenticated || isMockEnabled()) return undefined;

    const refreshCall = (groupId) =>
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.call(groupId), exact: true });

    const offStarted = onSocketEvent("call:started", (event) => {
      const groupId = event?.groupId;
      if (!groupId) return;
      patchCachedGroup(queryClient, groupId, { callActive: true });
      refreshCall(groupId);
      if (!event.notify || isViewingGroup(groupId)) return;

      const who = event.startedBy?.fullName ?? "Someone";
      toast(`${who} started a call`, {
        id: `group-call-${groupId}`,
        description: event.groupName ? `in ${event.groupName}` : undefined,
        duration: TOAST_DURATION_MS,
        action: {
          label: "Join",
          onClick: () => navigateRef.current(`/groups/${groupId}?view=call`),
        },
      });
    });

    const offEnded = onSocketEvent("call:ended", (event) => {
      const groupId = event?.groupId;
      if (!groupId) return;
      patchCachedGroup(queryClient, groupId, { callActive: false });
      refreshCall(groupId);
      toast.dismiss(`group-call-${groupId}`);
    });

    // Calls that started or ended while offline show up after a refetch.
    let wasConnected = isSocketConnected();
    const offStatus = subscribeSocketStatus(() => {
      const connected = isSocketConnected();
      if (connected && !wasConnected) {
        queryClient.invalidateQueries({ queryKey: queryKeys.groups.all, exact: true });
      }
      wasConnected = connected;
    });

    return () => {
      offStarted();
      offEnded();
      offStatus();
    };
  }, [isAuthenticated, queryClient]);
}
