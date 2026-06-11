import api from "./api";

/**
 * @param {import("@/lib/study-plan/types").GenerateAiPlanRequest} payload
 * @returns {Promise<{ success: boolean, data?: import("@/lib/study-plan/types").GenerateAiPlanResponse, message?: string, error?: unknown }>}
 */
export const generateAiPlan = async (payload) => {
  try {
    const response = await api.post("/planner/ai-plan/generate", payload);
    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error.response?.data?.message || "Failed to generate AI study plan",
      error: error.response?.data,
    };
  }
};

/**
 * @param {import("@/lib/study-plan/types").ApplyAiPlanRequest} payload
 */
export const applyAiPlan = async (payload) => {
  try {
    const response = await api.post("/planner/ai-plan/apply", payload);
    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    const detail = error.response?.data?.errors;
    return {
      success: false,
      message:
        (typeof detail === "string" ? detail : null) ||
        error.response?.data?.message ||
        "Failed to apply AI study plan",
      error: error.response?.data,
    };
  }
};

/**
 * @param {{ message: string, subjectIds: string[], schedulingOverrides?: unknown[], constraints?: unknown[], planContext?: unknown }} payload
 */
export const chatAiPlan = async (payload) => {
  try {
    const response = await api.post("/planner/ai-plan/chat", payload);
    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error.response?.data?.message || "Failed to update plan from chat",
      error: error.response?.data,
    };
  }
};

/**
 * @param {import("@/lib/study-plan/types").AnalyzeDocumentRequest} payload
 */
export const analyzeDocumentForPlan = async (payload) => {
  try {
    const response = await api.post("/planner/ai-plan/analyze-document", payload);
    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error.response?.data?.message || "Failed to analyze document",
      error: error.response?.data,
    };
  }
};
