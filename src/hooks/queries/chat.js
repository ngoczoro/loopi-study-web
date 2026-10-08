import { useMemo } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { getAuthUser } from "@/lib/authSession";
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
// REST polling until the Socket.IO channel lands (FE-G5).
const MESSAGES_POLL_MS = 5000;

/**
 * Pages are fetched newest-first (page 0 = latest messages) and each page is
 * ordered old → new, so `messages` reverses the pages before flattening.
 */
export function useGroupMessages(groupId, options = {}) {
  const { enabled: enabledOption = true } = options;
  const authEnabled = useAuthQueryEnabled();

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
    enabled: authEnabled && enabledOption && Boolean(groupId),
    refetchInterval: MESSAGES_POLL_MS,
  });

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
      updateNewestPage(queryClient, groupId, (items) => [
        ...items.filter((item) => item.id !== message.id),
        message,
      ]);
      patchCachedGroup(queryClient, groupId, {
        lastMessage: {
          id: message.id,
          content: message.content,
          attachmentCount: message.attachments?.length ?? 0,
          sender: message.sender,
          createdAt: message.createdAt,
        },
        unreadCount: 0,
      });
      if (message.attachments?.length || /https?:\/\//i.test(message.content ?? "")) {
        queryClient.invalidateQueries({ queryKey: ["chat", groupId, "shared"] });
      }
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
