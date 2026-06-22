import api from "./api";
import { getApiErrorMessage } from "../lib/apiErrorUtils.js";

const handleError = (error, fallback) => ({
  success: false,
  message: getApiErrorMessage(error, fallback),
  error: error.response?.data,
});

export const reportViolation = async ({
  type,
  severity = "medium",
  contentTitle,
  contentType,
  contentItemId = null,
}) => {
  try {
    const response = await api.post("/violations", {
      type,
      severity,
      contentTitle,
      contentType,
      contentItemId,
    });
    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    console.error("Error reporting violation:", error);
    return handleError(error, "Failed to report violation");
  }
};
