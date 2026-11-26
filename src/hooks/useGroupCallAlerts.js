import { createElement, useEffect, useRef } from "react";
import { Phone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { selectIsAuthenticated, useAuthStore } from "@/lib/authStore";
import { isMockEnabled } from "@/mocks/mockUtils";
import { patchCachedGroup } from "@/hooks/queries/groups";
import { askNotificationPermission, showSystemNotification } from "@/lib/browserNotifications";
import { playRingtone, stopRingtone, unlockRingtone } from "@/lib/callRingtone";
import { invalidateNotifications } from "@/lib/query/invalidate";
import { queryKeys } from "@/lib/query/queryKeys";
import { onSocketEvent, subscribeSocketStatus, isSocketConnected } from "@/lib/socket";

const TOAST_DURATION_MS = 30_000;

/** Already looking at that group's call, so there is nothing to tell. */
const isOnCallView = (groupId) =>
  window.location.pathname === `/groups/${groupId}` &&
  new URLSearchParams(window.location.search).get("view") === "call";

/**
 * Group call start/end, pushed to every member (`call:started` / `call:ended`):
 * keeps the green "in call" dot in the group list current and, unless the member muted
 * the group (`notify: false`), shows a silent toast with a Join button (on every page,
 * the group's chat included, except its call view), plus a system notification when
 * Loopi is in the background, and a short ring (not while the user is in a call). The backend also saves a notification
 * (the bell), which is marked as over when the call ends.
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

  // Browsers only allow sound after the user interacted with the page.
  useEffect(() => {
    const unlock = () => unlockRingtone();
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated || isMockEnabled()) return undefined;

    const refreshCall = (groupId) =>
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.call(groupId), exact: true });

    const offStarted = onSocketEvent("call:started", (event) => {
      const groupId = event?.groupId;
      if (!groupId) return;
      patchCachedGroup(queryClient, groupId, { callActive: true });
      refreshCall(groupId);
      if (event.notify) invalidateNotifications(queryClient);
      if (!event.notify || isOnCallView(groupId)) return;

      const who = event.startedBy?.fullName ?? "Someone";
      const title = `${who} started a call`;
      const description = event.groupName ? `in ${event.groupName}` : undefined;
      const join = () => navigateRef.current(`/groups/${groupId}?view=call`);
      toast(title, {
        id: `group-call-${groupId}`,
        description,
        icon: createElement(Phone, { className: "h-4 w-4 text-emerald-600" }),
        duration: TOAST_DURATION_MS,
        action: {
          label: "Join",
          onClick: () => {
            stopRingtone();
            // A click is the moment browsers allow asking for system notifications.
            askNotificationPermission().catch(() => {});
            join();
          },
        },
        cancel: { label: "Dismiss", onClick: stopRingtone },
        onDismiss: stopRingtone,
        onAutoClose: stopRingtone,
      });
      playRingtone();
      showSystemNotification(title, { body: description, tag: `group-call-${groupId}`, onClick: join });
    });

    const offEnded = onSocketEvent("call:ended", (event) => {
      const groupId = event?.groupId;
      if (!groupId) return;
      patchCachedGroup(queryClient, groupId, { callActive: false });
      refreshCall(groupId);
      invalidateNotifications(queryClient);
      toast.dismiss(`group-call-${groupId}`);
      stopRingtone();
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
