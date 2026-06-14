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
