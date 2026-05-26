import api from "./api";

const handleResponse = (response, fallbackMessage) => ({
  success: true,
  data: response.data.data,
  message: response.data.message,
});

const handleError = (error, fallbackMessage) => ({
  success: false,
  message: error.response?.data?.message || fallbackMessage,
  error: error.response?.data,
});

export const getProgressSummaryAPI = async () => {
  try {
    const response = await api.get("/progress/summary");
    return handleResponse(response, "Failed to fetch progress summary");
  } catch (error) {
    return handleError(error, "Failed to fetch progress summary");
  }
};

export const getProgressStreaksAPI = async () => {
  try {
    const response = await api.get("/progress/streaks");
    return handleResponse(response, "Failed to fetch progress streaks");
  } catch (error) {
    return handleError(error, "Failed to fetch progress streaks");
  }
};

export const getProgressMilestonesAPI = async () => {
  try {
    const response = await api.get("/progress/milestones");
    return handleResponse(response, "Failed to fetch progress milestones");
  } catch (error) {
    return handleError(error, "Failed to fetch progress milestones");
  }
};

