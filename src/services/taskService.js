import api from "./api";
import { getApiErrorMessage } from "../lib/apiErrorUtils.js";

const handleSuccess = (response) => ({
  success: true,
  data: response.data.data,
  message: response.data.message,
  pagination: response.data.pagination ?? null,
});

const handleError = (error, fallback) => ({
  success: false,
  message: getApiErrorMessage(error, fallback),
  error: error.response?.data,
});

export const getTasks = async (params = {}) => {
  try {
    const response = await api.get("/tasks", { params });
    return handleSuccess(response);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return handleError(error, "Failed to fetch tasks");
  }
};

export const getTaskById = async (id) => {
  try {
    const response = await api.get(`/tasks/${id}`);
    return handleSuccess(response);
  } catch (error) {
    console.error("Error fetching task:", error);
    return handleError(error, "Failed to fetch task");
  }
};

export const getTaskSummary = async (params = {}) => {
  try {
    const response = await api.get("/tasks/summary", { params });
    return handleSuccess(response);
  } catch (error) {
    console.error("Error fetching task summary:", error);
    return handleError(error, "Failed to fetch task summary");
  }
};

export const createTask = async (payload) => {
  try {
    const response = await api.post("/tasks", payload);
    return handleSuccess(response);
  } catch (error) {
    console.error("Error creating task:", error);
    return handleError(error, "Failed to create task");
  }
};

export const updateTask = async (id, payload) => {
  try {
    const response = await api.patch(`/tasks/${id}`, payload);
    return handleSuccess(response);
  } catch (error) {
    console.error("Error updating task:", error);
    return handleError(error, "Failed to update task");
  }
};

export const toggleTaskComplete = async (id, completed) => {
  try {
    const response = await api.patch(`/tasks/${id}/complete`, { completed });
    return handleSuccess(response);
  } catch (error) {
    console.error("Error updating task completion:", error);
    return handleError(error, "Failed to update task");
  }
};

export const deleteTask = async (id) => {
  try {
    const response = await api.delete(`/tasks/${id}`);
    return handleSuccess(response);
  } catch (error) {
    console.error("Error deleting task:", error);
    return handleError(error, "Failed to delete task");
  }
};
