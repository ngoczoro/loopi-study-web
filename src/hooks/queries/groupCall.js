import { useCallback, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { joinGroupChat, onSocketEvent } from "@/lib/socket";
import { useSocketConnected } from "@/hooks/useSocket";
import { queryKeys } from "@/lib/query/queryKeys";
import { unwrapServiceResult } from "@/lib/query/unwrap";
import { useAuthQueryEnabled } from "@/lib/query/useAuthQueryEnabled";
import { fetchCallStatus } from "@/services/groupCallService";

const EMPTY_STATUS = Object.freeze({ active: false, count: 0, participants: [], meet: null });

/** Puts a Meet returned by a Meet request into the cached call status right away. */
export function patchCachedCallMeet(queryClient, groupId, meet) {
  queryClient.setQueryData(queryKeys.groups.call(groupId), (current) => ({
    ...EMPTY_STATUS,
    groupId,
    ...(current ?? {}),
    meet: meet ?? null,
  }));
}

/**
 * Who is in a group's video call.
 *
 * Loads `GET /groups/:id/call`, then follows the `call:status` socket event that the
 * backend sends to `group:{groupId}` when LiveKit reports someone joining or leaving.
 */
export function useGroupCallStatus(groupId, { enabled: enabledOption = true } = {}) {
  const authEnabled = useAuthQueryEnabled();
  const queryClient = useQueryClient();
  const socketConnected = useSocketConnected();
  const enabled = authEnabled && enabledOption && Boolean(groupId);

  useEffect(() => {
    if (!enabled) return undefined;
    const leave = joinGroupChat(groupId);
    const unsubscribe = onSocketEvent("call:status", (status) => {
      if (status?.groupId !== groupId) return;
      queryClient.setQueryData(queryKeys.groups.call(groupId), status);
    });
    return () => {
      unsubscribe();
      leave();
    };
  }, [enabled, groupId, queryClient]);

  const query = useQuery({
    queryKey: queryKeys.groups.call(groupId),
    queryFn: async () =>
      unwrapServiceResult(await fetchCallStatus(groupId), "Could not load the call status"),
    enabled,
    staleTime: 10_000,
    refetchOnWindowFocus: true,
    // 503 means calls are not configured; retrying will not help.
    retry: false,
  });

  // Catch up on anything missed while the socket was down.
  const { refetch } = query;
  const wasConnectedRef = useRef(socketConnected);
  useEffect(() => {
    if (socketConnected && !wasConnectedRef.current && enabled) refetch();
    wasConnectedRef.current = socketConnected;
  }, [socketConnected, enabled, refetch]);

  const refresh = useCallback(() => {
    if (enabled) refetch();
  }, [enabled, refetch]);

  const status = query.data ?? EMPTY_STATUS;
  return {
    status: { ...status, meet: status.meet ?? null },
    isLoading: query.isLoading,
    refresh,
  };
}
