import api from "./api";
import { getApiErrorMessage } from "../lib/apiErrorUtils.js";

const handleError = (error, fallback) => ({
  success: false,
  message: getApiErrorMessage(error, fallback),
  error: error.response?.data,
});

export const getAdminSubjects = async (params = {}) => {
  try {
    const response = await api.get("/admin/subjects", { params });
    return {
      success: true,
      subjects: response.data.data?.subjects ?? [],
      pagination: response.data.data?.pagination ?? null,
    };
  } catch (error) {
    console.error("Error fetching admin subjects:", error);
    return handleError(error, "Failed to fetch subjects");
  }
};

export const deleteAdminSubject = async (id) => {
  try {
    const response = await api.delete(`/admin/subjects/${id}`);
    return {
      success: true,
      message: response.data.message,
    };
  } catch (error) {
    console.error("Error deleting admin subject:", error);
    return handleError(error, "Failed to delete subject");
  }
};

export const getAdminContent = async (params = {}) => {
  try {
    const response = await api.get("/admin/content", { params });
    return {
      success: true,
      content: response.data.data?.content ?? [],
      pagination: response.data.data?.pagination ?? null,
    };
  } catch (error) {
    console.error("Error fetching admin content:", error);
    return handleError(error, "Failed to fetch content");
  }
};

export const deleteAdminContent = async (id) => {
  try {
    const response = await api.delete(`/admin/content/${id}`);
    return {
      success: true,
      message: response.data.message,
    };
  } catch (error) {
    console.error("Error deleting admin content:", error);
    return handleError(error, "Failed to delete content");
  }
};
