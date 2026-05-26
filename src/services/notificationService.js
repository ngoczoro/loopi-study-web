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

export const getNotificationsAPI = async (params = {}) => {
  try {
    const response = await api.get("/notifications", { params });
    return handleSuccess(response);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return handleError(error, "Failed to fetch notifications");
  }
};

export const markNotificationReadAPI = async (id) => {
  try {
    const response = await api.patch(`/notifications/${id}/read`);
    return handleSuccess(response);
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return handleError(error, "Failed to mark notification as read");
  }
};

export const deleteNotificationAPI = async (id) => {
  try {
    const response = await api.delete(`/notifications/${id}`);
    return handleSuccess(response);
  } catch (error) {
    console.error("Error deleting notification:", error);
    return handleError(error, "Failed to delete notification");
  }
};
