import api from "./api";
import { getApiErrorMessage } from "../lib/apiErrorUtils.js";

const handleError = (error, fallback) => ({
  success: false,
  message: getApiErrorMessage(error, fallback),
  error: error.response?.data,
});

export const getAdminUsers = async (params = {}) => {
  try {
    const response = await api.get("/admin/users", { params });
    return {
      success: true,
      users: response.data.data?.users ?? [],
      pagination: response.data.data?.pagination ?? null,
    };
  } catch (error) {
    console.error("Error fetching admin users:", error);
    return handleError(error, "Failed to fetch users");
  }
};

export const getAdminUserById = async (id) => {
  try {
    const response = await api.get(`/admin/users/${id}`);
    return {
      success: true,
      data: response.data.data,
    };
  } catch (error) {
    console.error("Error fetching admin user:", error);
    return handleError(error, "Failed to fetch user");
  }
};

export const lockAdminUser = async (id, payload = {}) => {
  try {
    const response = await api.patch(`/admin/users/${id}/lock`, payload);
    return {
      success: true,
      message: response.data.message,
    };
  } catch (error) {
    console.error("Error locking user:", error);
    return handleError(error, "Failed to lock user");
  }
};

export const unlockAdminUser = async (id) => {
  try {
    const response = await api.patch(`/admin/users/${id}/unlock`);
    return {
      success: true,
      message: response.data.message,
    };
  } catch (error) {
    console.error("Error unlocking user:", error);
    return handleError(error, "Failed to unlock user");
  }
};
