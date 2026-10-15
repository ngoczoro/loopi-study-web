import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/queryKeys";
import { unwrapServiceResult } from "@/lib/query/unwrap";
import { useAuthQueryEnabled } from "@/lib/query/useAuthQueryEnabled";
import {
  askAssistant,
  createAssistantConversation,
  deleteAssistantConversation,
  listAssistantConversations,
  listAssistantMessages,
  listAssistantSources,
  updateAssistantConversation,
} from "@/services/assistantService";

export function useAssistantSources() {
  const authEnabled = useAuthQueryEnabled();
  const query = useQuery({
    queryKey: queryKeys.assistant.sources,
    queryFn: async () =>
      unwrapServiceResult(await listAssistantSources(), "Failed to load documents"),
    enabled: authEnabled,
  });

  return {
    sources: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error?.message ?? null,
    refetch: query.refetch,
  };
}

export function useAssistantConversations() {
  const authEnabled = useAuthQueryEnabled();
  const query = useQuery({
    queryKey: queryKeys.assistant.conversations,
    queryFn: async () =>
      unwrapServiceResult(
        await listAssistantConversations(),
        "Failed to load conversations",
      ),
    enabled: authEnabled,
  });

  return {
    conversations: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error?.message ?? null,
    refetch: query.refetch,
  };
}

function upsertConversation(queryClient, conversation) {
  queryClient.setQueryData(queryKeys.assistant.conversations, (conversations) => {
    if (!Array.isArray(conversations)) return conversations;
    const rest = conversations.filter((item) => item.id !== conversation.id);
    return [conversation, ...rest];
  });
}

export function useCreateAssistantConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) =>
      unwrapServiceResult(
        await createAssistantConversation(payload),
        "Failed to create conversation",
      ),
    onSuccess: (conversation) => {
      upsertConversation(queryClient, conversation);
      queryClient.setQueryData(queryKeys.assistant.messages(conversation.id), []);
    },
  });
}

export function useUpdateAssistantConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ conversationId, payload }) =>
      unwrapServiceResult(
        await updateAssistantConversation(conversationId, payload),
        "Failed to update conversation",
      ),
    onSuccess: (conversation) => {
      queryClient.setQueryData(queryKeys.assistant.conversations, (conversations) =>
        Array.isArray(conversations)
          ? conversations.map((item) => (item.id === conversation.id ? conversation : item))
          : conversations,
      );
    },
  });
}

export function useDeleteAssistantConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (conversationId) =>
      unwrapServiceResult(
        await deleteAssistantConversation(conversationId),
        "Failed to delete conversation",
      ),
    onSuccess: (_data, conversationId) => {
      queryClient.setQueryData(queryKeys.assistant.conversations, (conversations) =>
        Array.isArray(conversations)
          ? conversations.filter((item) => item.id !== conversationId)
          : conversations,
      );
      queryClient.removeQueries({ queryKey: queryKeys.assistant.messages(conversationId) });
    },
  });
}

export function useAssistantMessages(conversationId) {
  const authEnabled = useAuthQueryEnabled();
  const query = useQuery({
    queryKey: queryKeys.assistant.messages(conversationId),
    queryFn: async () =>
      unwrapServiceResult(
        await listAssistantMessages(conversationId),
        "Failed to load messages",
      ),
    enabled: authEnabled && Boolean(conversationId),
  });

  return {
    messages: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error?.message ?? null,
    refetch: query.refetch,
  };
}

export function useAskAssistant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ conversationId, content }) =>
      unwrapServiceResult(
        await askAssistant(conversationId, content),
        "The assistant could not answer. Please try again.",
      ),
    onSuccess: ({ userMessage, assistantMessage, conversation }, { conversationId }) => {
      queryClient.setQueryData(queryKeys.assistant.messages(conversationId), (messages = []) => [
        ...messages.filter(
          (item) => item.id !== userMessage.id && item.id !== assistantMessage.id,
        ),
        userMessage,
        assistantMessage,
      ]);
      upsertConversation(queryClient, conversation);
    },
    // The server keeps the question even when the answer fails, so resync.
    onError: (_error, { conversationId }) =>
      queryClient.invalidateQueries({ queryKey: queryKeys.assistant.messages(conversationId) }),
  });
}
