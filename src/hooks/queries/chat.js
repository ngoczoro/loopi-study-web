import { useEffect, useMemo, useRef } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { getAuthUser } from "@/lib/authSession";
import { joinGroupChat, onSocketEvent } from "@/lib/socket";
import { useSocketConnected } from "@/hooks/useSocket";
import { queryKeys } from "@/lib/query/queryKeys";
import { unwrapServiceResult } from "@/lib/query/unwrap";
import { useAuthQueryEnabled } from "@/lib/query/useAuthQueryEnabled";
import {
  clearGroupHistory,
  listGroupMessages,
  listGroupShared,
  markGroupRead,
  sendGroupMessage,
} from "@/services/chatService";
import { patchCachedGroup } from "./groups";

const PAGE_SIZE = 30;
// Fallback while the socket is disconnected (or in mock mode).
const MESSAGES_POLL_MS = 5000;

function toLastMessage(message) {
  return {
    id: message.id,
    content: message.content,
    attachmentCount: message.attachments?.length ?? 0,
    sender: message.sender,
    createdAt: message.createdAt,
  };
}

function hasSharedContent(message) {
  return Boolean(message.attachments?.length) || /https?:\/\//i.test(message.content ?? "");
}

function appendMessage(queryClient, message) {
  updateNewestPage(queryClient, message.groupId, (items) => [
    ...items.filter((item) => item.id !== message.id),
    message,
  ]);
  if (hasSharedContent(message)) {
    queryClient.invalidateQueries({ queryKey: ["chat", message.groupId, "shared"] });
  }
}

/**
 * Pages are fetched newest-first (page 0 = latest messages) and each page is
 * ordered old → new, so `messages` reverses the pages before flattening.
 *
 * Live updates come from the `chat:message` socket event; REST polling only
 * runs while the socket is disconnected.
 */
export function useGroupMessages(groupId, options = {}) {
  const { enabled: enabledOption = true } = options;
  const authEnabled = useAuthQueryEnabled();
  const queryClient = useQueryClient();
  const socketConnected = useSocketConnected();
  const enabled = authEnabled && enabledOption && Boolean(groupId);

  useEffect(() => {
    if (!enabled) return undefined;
    const leave = joinGroupChat(groupId);
    const unsubscribe = onSocketEvent("chat:message", (message) => {
      if (message?.groupId !== groupId) return;
      // Before the first page loads, the initial fetch will include it anyway.
      if (!queryClient.getQueryData(queryKeys.chat.messages(groupId))) return;
      appendMessage(queryClient, message);
      patchCachedGroup(queryClient, groupId, { lastMessage: toLastMessage(message) });
    });
    return () => {
      unsubscribe();
      leave();
    };
  }, [enabled, groupId, queryClient]);

  const query = useInfiniteQuery({
    queryKey: queryKeys.chat.messages(groupId),
    queryFn: async ({ pageParam }) =>
      unwrapServiceResult(
        await listGroupMessages(groupId, {
          limit: PAGE_SIZE,
          ...(pageParam ? { before: pageParam } : {}),
        }),
        "Failed to load messages",
      ),
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage?.nextCursor ?? undefined,
    enabled,
    refetchInterval: socketConnected ? false : MESSAGES_POLL_MS,
  });

  // Catch up on anything sent while the socket was down.
  const { refetch } = query;
  const wasConnectedRef = useRef(socketConnected);
  useEffect(() => {
    if (socketConnected && !wasConnectedRef.current && enabled) refetch();
    wasConnectedRef.current = socketConnected;
  }, [socketConnected, enabled, refetch]);

  const messages = useMemo(
    () =>
      (query.data?.pages ?? [])
        .slice()
        .reverse()
        .flatMap((page) => page.items),
    [query.data],
  );

  return {
    messages,
    isLoading: query.isLoading,
    error: query.error?.message ?? null,
    refetch: query.refetch,
    hasOlder: Boolean(query.hasNextPage),
    loadOlder: query.fetchNextPage,
    isLoadingOlder: query.isFetchingNextPage,
  };
}

function updateNewestPage(queryClient, groupId, updater) {
  queryClient.setQueryData(queryKeys.chat.messages(groupId), (data) => {
    if (!data?.pages?.length) {
      return { pages: [{ items: updater([]), nextCursor: null }], pageParams: [null] };
    }
    const [newest, ...rest] = data.pages;
    return { ...data, pages: [{ ...newest, items: updater(newest.items) }, ...rest] };
  });
}

/**
 * Builds the local placeholder shown while a message is being sent. It lives
 * in component state (not the query cache) so polling refetches can't drop it.
 */
export function createOutgoingMessage(groupId, { content, files = [] }) {
  const user = getAuthUser();
  const tempId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    id: tempId,
    groupId,
    sender: {
      userId: user?.id ?? null,
      fullName: user?.fullName ?? "You",
      avatarUrl: user?.avatarUrl ?? null,
    },
    content,
    files,
    attachments: files.map((file, index) => ({
      id: `${tempId}-${index}`,
      kind: file.type?.startsWith("image/") ? "image" : "file",
      name: file.name,
      mimeType: file.type,
      size: file.size,
      url: URL.createObjectURL(file),
    })),
    createdAt: new Date().toISOString(),
    status: "sending",
  };
}

export function useSendGroupMessage(groupId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ content, files }) =>
      unwrapServiceResult(
        await sendGroupMessage(groupId, { content, files }),
        "Failed to send message",
      ),
    onSuccess: (message) => {
      appendMessage(queryClient, { ...message, groupId: message.groupId ?? groupId });
      patchCachedGroup(queryClient, groupId, {
        lastMessage: toLastMessage(message),
        unreadCount: 0,
      });
    },
  });
}

export function useMarkGroupRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (groupId) =>
      unwrapServiceResult(await markGroupRead(groupId), "Failed to mark as read"),
    onMutate: (groupId) => patchCachedGroup(queryClient, groupId, { unreadCount: 0 }),
  });
}

export function useClearGroupHistory(groupId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () =>
      unwrapServiceResult(await clearGroupHistory(groupId), "Failed to clear chat history"),
    onSuccess: () => {
      queryClient.setQueryData(queryKeys.chat.messages(groupId), {
        pages: [{ items: [], nextCursor: null }],
        pageParams: [null],
      });
      patchCachedGroup(queryClient, groupId, { lastMessage: null, unreadCount: 0 });
      return queryClient.invalidateQueries({ queryKey: ["chat", groupId, "shared"] });
    },
  });
}

export function useGroupShared(groupId, type, options = {}) {
  const { enabled: enabledOption = true, limit = 20 } = options;
  const authEnabled = useAuthQueryEnabled();

  const query = useQuery({
    queryKey: [...queryKeys.chat.shared(groupId, type), limit],
    queryFn: async () =>
      unwrapServiceResult(
        await listGroupShared(groupId, { type, limit }),
        "Failed to load shared items",
      ),
    enabled: authEnabled && enabledOption && Boolean(groupId),
  });

  return {
    items: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error?.message ?? null,
  };
}
