import api from "./api";
import { getApiErrorMessage } from "../lib/apiErrorUtils.js";

const handleError = (error, fallback) => ({
  success: false,
  message: getApiErrorMessage(error, fallback),
  error: error.response?.data,
});

export const getAdminViolationStats = async (params = {}) => {
  try {
    const response = await api.get("/admin/violations/stats", { params });
    return {
      success: true,
      data: response.data.data ?? {},
    };
  } catch (error) {
    console.error("Error fetching violation stats:", error);
    return handleError(error, "Failed to load violation stats");
  }
};

export const getAdminViolations = async (params = {}) => {
  try {
    const response = await api.get("/admin/violations", { params });
    return {
      success: true,
      flaggedUsers: response.data.data?.flaggedUsers ?? [],
      pagination: response.data.data?.pagination ?? null,
    };
  } catch (error) {
    console.error("Error fetching violations:", error);
    return handleError(error, "Failed to load violations");
  }
};

export const resolveAdminViolation = async (id) => {
  try {
    const response = await api.patch(`/admin/violations/${id}/resolve`);
    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    console.error("Error resolving violation:", error);
    return handleError(error, "Failed to resolve violation");
  }
};
