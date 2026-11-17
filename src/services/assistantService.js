import api from "./api";
import { callService } from "../lib/serviceRequest.js";
import * as assistantMock from "../mocks/assistant.mock.js";
import { getAccessToken, readAuthSession } from "../lib/authSession.js";
import { performTokenRefresh } from "../lib/authTokenRefresh.js";

// ---------- Sources ----------

export const listAssistantSources = () =>
  callService({
    mock: () => assistantMock.listSources(),
    request: () => api.get("/assistant/sources"),
    fallback: "Failed to load documents",
  });

// ---------- Conversations ----------

export const listAssistantConversations = () =>
  callService({
    mock: () => assistantMock.listConversations(),
    request: () => api.get("/assistant/conversations"),
    fallback: "Failed to load conversations",
  });

export const createAssistantConversation = (payload) =>
  callService({
    mock: () => assistantMock.createConversation(payload),
    request: () => api.post("/assistant/conversations", payload),
    fallback: "Failed to create conversation",
  });

export const updateAssistantConversation = (conversationId, payload) =>
  callService({
    mock: () => assistantMock.updateConversation(conversationId, payload),
    request: () => api.patch(`/assistant/conversations/${conversationId}`, payload),
    fallback: "Failed to update conversation",
  });

export const deleteAssistantConversation = (conversationId) =>
  callService({
    mock: () => assistantMock.deleteConversation(conversationId),
    request: () => api.delete(`/assistant/conversations/${conversationId}`),
    fallback: "Failed to delete conversation",
  });

export const listAssistantMessages = (conversationId) =>
  callService({
    mock: () => assistantMock.listMessages(conversationId),
    request: () => api.get(`/assistant/conversations/${conversationId}/messages`),
    fallback: "Failed to load messages",
  });

export const askAssistant = (conversationId, content) =>
  callService({
    mock: () => assistantMock.sendMessage(conversationId, { content }),
    request: () =>
      api.post(`/assistant/conversations/${conversationId}/messages`, { content }),
    fallback: "The assistant could not answer. Please try again.",
  });

// ---------- Streaming answer ----------

const STREAM_FALLBACK = "The assistant could not answer. Please try again.";

/** Error from the stream call. `canRetryWithoutStream` is false for answers like 400/429. */
class AssistantStreamError extends Error {
  constructor(message, { status = null, receivedText = false } = {}) {
    super(message);
    this.status = status;
    this.canRetryWithoutStream = !receivedText && !(status >= 400 && status < 500);
  }
}

const openAnswerStream = (conversationId, content, signal) =>
  fetch(`${api.defaults.baseURL}/assistant/conversations/${conversationId}/messages/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      ...(getAccessToken() ? { Authorization: `Bearer ${getAccessToken()}` } : {}),
    },
    body: JSON.stringify({ content }),
    signal,
  });

/**
 * Ask and stream the answer (Server-Sent Events). axios cannot read a stream in the browser,
 * so this uses fetch and refreshes the access token once on 401 like the axios client does.
 * `onEvent(name, data)` gets: sources, token, reset (clear streamed text), done.
 * Resolves with the `done` payload: { userMessage, assistantMessage, conversation }.
 */
export const streamAssistantAnswer = async (conversationId, content, { onEvent, signal } = {}) => {
  let response = await openAnswerStream(conversationId, content, signal);
  if (response.status === 401 && (await performTokenRefresh())?.accessToken) {
    // Same as the axios interceptor: keep the auth store in step with the new token.
    const { useAuthStore } = await import("../lib/authStore.js");
    useAuthStore.getState().syncFromSession(readAuthSession());
    response = await openAnswerStream(conversationId, content, signal);
  }
  if (!response.ok || !response.body) {
    const body = await response.json().catch(() => null);
    throw new AssistantStreamError(body?.message || STREAM_FALLBACK, { status: response.status });
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let receivedText = false;
  let done = null;

  try {
    for (;;) {
      const { done: ended, value } = await reader.read();
      if (ended) break;
      buffer += decoder.decode(value, { stream: true });

      let boundary;
      while ((boundary = buffer.indexOf("\n\n")) >= 0) {
        const raw = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);
        const name = raw.match(/^event: (.+)$/m)?.[1];
        const dataLine = raw.match(/^data: (.*)$/m)?.[1];
        if (!name || dataLine === undefined) continue;
        const data = JSON.parse(dataLine);

        if (name === "error") throw new AssistantStreamError(data.message || STREAM_FALLBACK, { receivedText });
        if (name === "token") receivedText = true;
        if (name === "done") done = data;
        onEvent?.(name, data);
      }
    }
  } catch (error) {
    if (error instanceof AssistantStreamError || error.name === "AbortError") throw error;
    throw new AssistantStreamError(STREAM_FALLBACK, { receivedText });
  }

  if (!done) throw new AssistantStreamError(STREAM_FALLBACK, { receivedText });
  return done;
};
