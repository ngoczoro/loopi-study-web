import api from "./api";
import { getApiErrorMessage } from "../lib/apiErrorUtils.js";

const handleSuccess = (response) => ({
  success: true,
  data: response.data.data,
  message: response.data.message,
});

const handleError = (error, fallback) => ({
  success: false,
  message: getApiErrorMessage(error, fallback),
  error: error.response?.data,
});

export const getAchievementBadgesAPI = async () => {
  try {
    const response = await api.get("/achievements/badges");
    return handleSuccess(response);
  } catch (error) {
    console.error("Error fetching achievement badges:", error);
    return handleError(error, "Failed to fetch badges");
  }
};
