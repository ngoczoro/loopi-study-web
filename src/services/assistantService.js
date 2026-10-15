import api from "./api";
import { callService } from "../lib/serviceRequest.js";
import * as assistantMock from "../mocks/assistant.mock.js";

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
