import api from "./api";
import { getApiErrorMessage } from "../lib/apiErrorUtils.js";

const AI_SUMMARY_FALLBACK =
  "AI summary could not be generated. Please try again later.";

const handleError = (error, fallback) => ({
  success: false,
  message: getApiErrorMessage(error, fallback),
  status: error.response?.status,
  error: error.response?.data,
});

export const getDocumentSummary = async (documentId) => {
  try {
    const response = await api.get(`/ai/documents/${documentId}/summary`);
    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    if (error.response?.status === 404) {
      return {
        success: false,
        notFound: true,
        message: error.response?.data?.message || "AI summary not found",
      };
    }

    console.error("Error fetching AI document summary:", error);
    return handleError(error, "Failed to fetch AI summary");
  }
};

export const generateDocumentSummary = async (
  documentId,
  forceRegenerate = false,
) => {
  try {
    const response = await api.post(`/ai/documents/${documentId}/summary`, {
      forceRegenerate,
    });
    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    console.error("Error generating AI document summary:", error);
    const status = error.response?.status;

    if (status === 500) {
      return {
        success: false,
        status,
        message: AI_SUMMARY_FALLBACK,
        error: error.response?.data,
      };
    }

    return handleError(
      error,
      status === 400
        ? error.response?.data?.message ||
            "Unable to generate summary for this document."
        : AI_SUMMARY_FALLBACK,
    );
  }
};

export const isAiSummarySupported = (document) =>
  Boolean(document?.id) &&
  (document.type === "note" || document.type === "file");
