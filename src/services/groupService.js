import api from "./api";
import { callService } from "../lib/serviceRequest.js";
import * as groupsMock from "../mocks/groups.mock.js";
import * as contentMock from "../mocks/content.mock.js";

// ---------- Groups ----------

export const listGroups = () =>
  callService({
    mock: () => groupsMock.listGroups(),
    request: () => api.get("/groups"),
    fallback: "Failed to load groups",
  });

export const getGroup = (groupId) =>
  callService({
    mock: () => groupsMock.getGroup(groupId),
    request: () => api.get(`/groups/${groupId}`),
    fallback: "Failed to load group",
  });

export const createGroup = (payload) =>
  callService({
    mock: () => groupsMock.createGroup(payload),
    request: () => api.post("/groups", payload),
    fallback: "Failed to create group",
  });

export const updateGroup = (groupId, payload) =>
  callService({
    mock: () => groupsMock.updateGroup(groupId, payload),
    request: () => {
      const formData = new FormData();
      if (payload.name !== undefined) formData.append("name", payload.name);
      if (payload.description !== undefined) {
        formData.append("description", payload.description ?? "");
      }
      if (payload.avatarFile) formData.append("avatar", payload.avatarFile);
      if (payload.removeAvatar) formData.append("removeAvatar", "true");
      return api.patch(`/groups/${groupId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    fallback: "Failed to update group",
  });

export const deleteGroup = (groupId) =>
  callService({
    mock: () => groupsMock.deleteGroup(groupId),
    request: () => api.delete(`/groups/${groupId}`),
    fallback: "Failed to delete group",
  });

export const joinGroup = (inviteCode) =>
  callService({
    mock: () => groupsMock.joinGroup({ inviteCode }),
    request: () => api.post("/groups/join", { inviteCode }),
    fallback: "Failed to join group",
  });

export const leaveGroup = (groupId) =>
  callService({
    mock: () => groupsMock.leaveGroup(groupId),
    request: () => api.post(`/groups/${groupId}/leave`),
    fallback: "Failed to leave group",
  });

export const regenerateInviteCode = (groupId) =>
  callService({
    mock: () => groupsMock.regenerateInviteCode(groupId),
    request: () => api.post(`/groups/${groupId}/invite-code`),
    fallback: "Failed to regenerate invite code",
  });

export const updateMyGroupSettings = (groupId, payload) =>
  callService({
    mock: () => groupsMock.updateMyGroupSettings(groupId, payload),
    request: () => api.patch(`/groups/${groupId}/me`, payload),
    fallback: "Failed to update group settings",
  });

// ---------- Members ----------

export const listGroupMembers = (groupId) =>
  callService({
    mock: () => groupsMock.listMembers(groupId),
    request: () => api.get(`/groups/${groupId}/members`),
    fallback: "Failed to load members",
  });

export const removeGroupMember = (groupId, userId) =>
  callService({
    mock: () => groupsMock.removeMember(groupId, userId),
    request: () => api.delete(`/groups/${groupId}/members/${userId}`),
    fallback: "Failed to remove member",
  });

// ---------- Resources ----------

export const listGroupResources = (groupId) =>
  callService({
    mock: () => groupsMock.listResources(groupId),
    request: () => api.get(`/groups/${groupId}/resources`),
    fallback: "Failed to load resources",
  });

/** `refPreview` (the picked content item) is only used by the mock. */
export const createGroupResource = (groupId, { refPreview, ...payload }) =>
  callService({
    mock: () => groupsMock.createResource(groupId, { ...payload, refPreview }),
    request: () => api.post(`/groups/${groupId}/resources`, payload),
    fallback: "Failed to share resource",
  });

/** The caller's own notes/files (existing `/content` API) that can be shared to a group. */
export const listShareableContent = () =>
  callService({
    mock: () => contentMock.listMyContent(),
    request: () => api.get("/content"),
    fallback: "Failed to load your notes and files",
  });

export const deleteGroupResource = (groupId, resourceId) =>
  callService({
    mock: () => groupsMock.deleteResource(groupId, resourceId),
    request: () => api.delete(`/groups/${groupId}/resources/${resourceId}`),
    fallback: "Failed to remove resource",
  });

// ---------- Goals ----------

export const listGroupGoals = (groupId) =>
  callService({
    mock: () => groupsMock.listGoals(groupId),
    request: () => api.get(`/groups/${groupId}/goals`),
    fallback: "Failed to load group goals",
  });

export const createGroupGoal = (groupId, payload) =>
  callService({
    mock: () => groupsMock.createGoal(groupId, payload),
    request: () => api.post(`/groups/${groupId}/goals`, payload),
    fallback: "Failed to create group goal",
  });

export const updateGroupGoal = (groupId, goalId, payload) =>
  callService({
    mock: () => groupsMock.updateGoal(groupId, goalId, payload),
    request: () => api.patch(`/groups/${groupId}/goals/${goalId}`, payload),
    fallback: "Failed to update group goal",
  });

export const deleteGroupGoal = (groupId, goalId) =>
  callService({
    mock: () => groupsMock.deleteGoal(groupId, goalId),
    request: () => api.delete(`/groups/${groupId}/goals/${goalId}`),
    fallback: "Failed to delete group goal",
  });

// ---------- Tasks ----------

export const listGroupTasks = (groupId, filters = {}) =>
  callService({
    mock: () => groupsMock.listTasks(groupId, filters),
    request: () => api.get(`/groups/${groupId}/tasks`, { params: filters }),
    fallback: "Failed to load group tasks",
  });

export const createGroupTask = (groupId, payload) =>
  callService({
    mock: () => groupsMock.createTask(groupId, payload),
    request: () => api.post(`/groups/${groupId}/tasks`, payload),
    fallback: "Failed to create task",
  });

export const updateGroupTask = (groupId, taskId, payload) =>
  callService({
    mock: () => groupsMock.updateTask(groupId, taskId, payload),
    request: () => api.patch(`/groups/${groupId}/tasks/${taskId}`, payload),
    fallback: "Failed to update task",
  });

export const deleteGroupTask = (groupId, taskId) =>
  callService({
    mock: () => groupsMock.deleteTask(groupId, taskId),
    request: () => api.delete(`/groups/${groupId}/tasks/${taskId}`),
    fallback: "Failed to delete task",
  });

export const remindGroupTask = (groupId, taskId) =>
  callService({
    mock: () => groupsMock.remindTask(groupId, taskId),
    request: () => api.post(`/groups/${groupId}/tasks/${taskId}/remind`),
    fallback: "Failed to send reminder",
  });

// ---------- Progress ----------

export const getGroupProgress = (groupId) =>
  callService({
    mock: () => groupsMock.getProgress(groupId),
    request: () => api.get(`/groups/${groupId}/progress`),
    fallback: "Failed to load group progress",
  });
