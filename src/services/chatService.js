import api from "./api";
import { callService } from "../lib/serviceRequest.js";
import * as chatMock from "../mocks/chat.mock.js";

export const listGroupMessages = (groupId, params = {}) =>
  callService({
    mock: () => chatMock.listMessages(groupId, params),
    request: () => api.get(`/groups/${groupId}/messages`, { params }),
    fallback: "Failed to load messages",
  });

export const sendGroupMessage = (groupId, { content = "", files = [] } = {}) =>
  callService({
    mock: () => chatMock.sendMessage(groupId, { content, files }),
    request: () => {
      const formData = new FormData();
      if (content) formData.append("content", content);
      files.forEach((file) => formData.append("files", file));
      return api.post(`/groups/${groupId}/messages`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    fallback: "Failed to send message",
  });

export const markGroupRead = (groupId) =>
  callService({
    mock: () => chatMock.markRead(groupId),
    request: () => api.post(`/groups/${groupId}/read`),
    fallback: "Failed to mark messages as read",
  });

export const clearGroupHistory = (groupId) =>
  callService({
    mock: () => chatMock.clearHistory(groupId),
    request: () => api.post(`/groups/${groupId}/messages/clear`),
    fallback: "Failed to clear chat history",
  });

export const listGroupShared = (groupId, params) =>
  callService({
    mock: () => chatMock.listShared(groupId, params),
    request: () => api.get(`/groups/${groupId}/shared`, { params }),
    fallback: "Failed to load shared items",
  });
