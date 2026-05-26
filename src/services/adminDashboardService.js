import api from "./api";
import { getApiErrorMessage } from "../lib/apiErrorUtils.js";

const handleError = (error, fallback) => ({
  success: false,
  message: getApiErrorMessage(error, fallback),
  error: error.response?.data,
});

export const getDashboardStats = async () => {
  try {
    const response = await api.get("/admin/dashboard/stats");
    return {
      success: true,
      data: response.data.data,
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return handleError(error, "Failed to load dashboard stats");
  }
};

export const getRecentContent = async (params = {}) => {
  try {
    const response = await api.get("/admin/dashboard/recent-content", {
      params,
    });
    return {
      success: true,
      data: response.data.data ?? [],
    };
  } catch (error) {
    console.error("Error fetching recent content:", error);
    return handleError(error, "Failed to load recent content");
  }
};

export const getAdminContentDetail = async (id) => {
  try {
    const response = await api.get(`/admin/content/${id}`);
    return {
      success: true,
      data: response.data.data,
    };
  } catch (error) {
    console.error("Error fetching admin content detail:", error);
    return handleError(error, "Failed to load content");
  }
};

export const getAdminTextPreview = async (id) => {
  const response = await api.get(`/admin/content/${id}/text-preview`);
  return response.data.data;
};

export const getAdminDocPreview = async (id) => {
  const response = await api.get(`/admin/content/${id}/doc-preview`);
  return response.data.data;
};

export const getAdminExcelPreview = async (id) => {
  const response = await api.get(`/admin/content/${id}/excel-preview`);
  return response.data.data;
};
