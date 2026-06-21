import api from "./api";
import { getApiErrorMessage } from "../lib/apiErrorUtils.js";

const AI_SUMMARY_FALLBACK =
  "AI summary could not be generated. Please try again later.";

const AI_QUIZ_FALLBACK =
  "Không thể tạo quiz bằng AI. Vui lòng thử lại sau.";

const handleError = (error, fallback) => ({
  success: false,
  message: getApiErrorMessage(error, fallback),
  status: error.response?.status,
  error: error.response?.data,
});

const defaultQuizOptions = {
  difficulty: "mixed",
  numberOfQuestions: 5,
  forceRegenerate: true,
};

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

export const generateDocumentQuiz = async (
  documentId,
  {
    difficulty = defaultQuizOptions.difficulty,
    numberOfQuestions = defaultQuizOptions.numberOfQuestions,
    forceRegenerate = defaultQuizOptions.forceRegenerate,
  } = {},
) => {
  try {
    const response = await api.post(
      `/ai/documents/${documentId}/generate-quiz`,
      {
        difficulty,
        numberOfQuestions,
        forceRegenerate,
      },
    );
    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    console.error("Error generating AI quiz:", error);
    const status = error.response?.status;

    if (status === 500) {
      return {
        success: false,
        status,
        message: AI_QUIZ_FALLBACK,
        error: error.response?.data,
      };
    }

    return handleError(
      error,
      status === 400
        ? error.response?.data?.message ||
            "Không thể tạo quiz từ tài liệu này."
        : AI_QUIZ_FALLBACK,
    );
  }
};

export const generateSubjectQuiz = async (
  subjectId,
  {
    topic = "",
    difficulty = defaultQuizOptions.difficulty,
    numberOfQuestions = defaultQuizOptions.numberOfQuestions,
    forceRegenerate = defaultQuizOptions.forceRegenerate,
  } = {},
) => {
  try {
    const response = await api.post(`/ai/subjects/${subjectId}/generate-quiz`, {
      topic,
      difficulty,
      numberOfQuestions,
      forceRegenerate,
    });
    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    console.error("Error generating subject AI quiz:", error);
    const status = error.response?.status;

    if (status === 500) {
      return {
        success: false,
        status,
        message: AI_QUIZ_FALLBACK,
        error: error.response?.data,
      };
    }

    return handleError(error, AI_QUIZ_FALLBACK);
  }
};

export const generatePracticeQuiz = async ({
  topic,
  subjectId = null,
  difficulty = defaultQuizOptions.difficulty,
  numberOfQuestions = defaultQuizOptions.numberOfQuestions,
  forceRegenerate = defaultQuizOptions.forceRegenerate,
} = {}) => {
  try {
    const response = await api.post("/ai/generate-quiz", {
      topic,
      subjectId: subjectId || undefined,
      difficulty,
      numberOfQuestions,
      forceRegenerate,
    });
    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    console.error("Error generating practice AI quiz:", error);
    const status = error.response?.status;

    if (status === 500) {
      return {
        success: false,
        status,
        message: AI_QUIZ_FALLBACK,
        error: error.response?.data,
      };
    }

    return handleError(error, AI_QUIZ_FALLBACK);
  }
};

export const isAiQuizSupported = isAiSummarySupported;

export const mapGeneratedQuizForStore = (data, overrides = {}) => ({
  id: data.id,
  title: data.title,
  subjectId: data.subjectId ?? overrides.subjectId ?? null,
  subjectName: data.subjectName ?? overrides.subjectName ?? null,
  questions: data.questions ?? [],
  source: data.source ?? "ai_generated",
  sourceDocumentId: data.sourceDocumentId ?? overrides.sourceDocumentId ?? null,
  sourceDocumentTitle:
    data.sourceDocumentTitle ?? overrides.sourceDocumentTitle ?? null,
  createdAt: data.createdAt ?? new Date().toISOString(),
});

const RESOURCE_FALLBACK =
  "Không thể tìm nguồn học lúc này. Vui lòng thử lại.";

const normalizeOptionalSubjectId = (subjectId) => {
  if (subjectId == null || subjectId === "") {
    return undefined;
  }

  if (typeof subjectId === "object") {
    return undefined;
  }

  const value = String(subjectId).trim();
  return value || undefined;
};

const buildSaveLearningResourcePayload = (payload = {}) => {
  const { subjectId, ...rest } = payload;
  const normalizedSubjectId = normalizeOptionalSubjectId(subjectId);

  return {
    ...rest,
    ...(normalizedSubjectId ? { subjectId: normalizedSubjectId } : {}),
  };
};

export const getResourceRecommendations = async ({
  q,
  limit = 5,
  subjectId = null,
} = {}) => {
  try {
    const response = await api.get("/ai/resource-recommendations", {
      params: {
        q,
        limit,
        ...(subjectId ? { subjectId } : {}),
      },
    });
    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    console.error("Error fetching resource recommendations:", error);
    return handleError(error, RESOURCE_FALLBACK);
  }
};

export const regenerateResourceRecommendations = async ({
  q,
  limit = 5,
  subjectId = null,
} = {}) => {
  try {
    const response = await api.post("/ai/resource-recommendations/regenerate", {
      q,
      limit,
      ...(subjectId ? { subjectId } : {}),
    });
    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    console.error("Error regenerating resource recommendations:", error);
    return handleError(error, RESOURCE_FALLBACK);
  }
};

export const getResourceRecommendationHistory = async ({
  limit = 5,
  subjectId = null,
} = {}) => {
  try {
    const response = await api.get("/ai/resource-recommendations/history", {
      params: {
        limit,
        ...(subjectId ? { subjectId } : {}),
      },
    });
    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    console.error("Error fetching recommendation history:", error);
    return handleError(error, "Failed to fetch recommendation history");
  }
};

export const getResourceRecommendationHistoryById = async (id) => {
  try {
    const response = await api.get(
      `/ai/resource-recommendations/history/${id}`,
    );
    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    console.error("Error fetching recommendation history detail:", error);
    return handleError(error, "Failed to fetch recommendation history");
  }
};

export const saveLearningResource = async (payload) => {
  try {
    const response = await api.post(
      "/ai/saved-learning-resources",
      buildSaveLearningResourcePayload(payload),
    );
    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    console.error("Error saving learning resource:", error);
    return handleError(error, "Failed to save learning resource");
  }
};

export const getSavedLearningResources = async ({ subjectId = null } = {}) => {
  try {
    const response = await api.get("/ai/saved-learning-resources", {
      params: subjectId ? { subjectId } : {},
    });
    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    console.error("Error fetching saved learning resources:", error);
    return handleError(error, "Failed to fetch saved learning resources");
  }
};

export const deleteSavedLearningResource = async (id) => {
  try {
    const response = await api.delete(`/ai/saved-learning-resources/${id}`);
    return {
      success: true,
      message: response.data.message,
    };
  } catch (error) {
    console.error("Error deleting saved learning resource:", error);
    return handleError(error, "Failed to delete saved learning resource");
  }
};

const DOCUMENT_SEARCH_FALLBACK =
  "Không thể tìm kiếm trong tài liệu. Vui lòng thử lại sau.";

export const searchInsideDocument = async ({
  query,
  documentId = null,
  subjectId = null,
  limit = 5,
} = {}) => {
  try {
    const payload = {
      query: String(query ?? "").trim(),
      limit,
    };

    if (documentId) payload.documentId = documentId;
    if (subjectId) payload.subjectId = subjectId;

    const response = await api.post("/ai/document-search", payload);
    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    console.error("Error searching inside document:", error);
    const status = error.response?.status;

    if (status === 400) {
      return handleError(
        error,
        error.response?.data?.message ||
          "Không thể tìm kiếm với yêu cầu này.",
      );
    }

    if (status === 500) {
      return {
        success: false,
        status,
        message: DOCUMENT_SEARCH_FALLBACK,
        error: error.response?.data,
      };
    }

    return handleError(error, DOCUMENT_SEARCH_FALLBACK);
  }
};

export const explainDocumentSearch = async ({ query, passages } = {}) => {
  try {
    const response = await api.post("/ai/document-search/explain", {
      query: String(query ?? "").trim(),
      passages,
    });
    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    console.error("Error explaining document search:", error);
    const status = error.response?.status;

    if (status === 500) {
      return {
        success: false,
        status,
        message: "Không thể tạo giải thích AI. Vui lòng thử lại sau.",
        error: error.response?.data,
      };
    }

    return handleError(
      error,
      "Không thể tạo giải thích AI. Vui lòng thử lại sau.",
    );
  }
};

export const isAiDocumentSearchSupported = isAiSummarySupported;
