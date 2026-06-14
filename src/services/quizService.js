import api from "./api";
import { getApiErrorMessage } from "../lib/apiErrorUtils.js";
import {
  computeWeakTopics,
  normalizeDurationSeconds,
} from "../lib/quizReviewUtils.js";

const mapQuizForUI = (quiz) => ({
  id: quiz.id,
  title: quiz.title,
  subjectId: quiz.subjectId ?? null,
  subjectName: quiz.subjectName ?? null,
  description: quiz.description ?? null,
  questions: Array.isArray(quiz.questions) ? quiz.questions : [],
  source: quiz.source ?? "manual",
  sourceDocumentId: quiz.sourceDocumentId ?? null,
  sourceDocumentTitle: quiz.sourceDocumentTitle ?? null,
  createdAt: quiz.createdAt ?? new Date().toISOString(),
});

export const getQuizzes = async ({ subjectId, limit = 100 } = {}) => {
  try {
    const params = { limit };
    if (subjectId) {
      params.subjectId = subjectId;
    }

    const response = await api.get("/quizzes", { params });
    const items = Array.isArray(response.data.data) ? response.data.data : [];

    return {
      success: true,
      data: items.map(mapQuizForUI),
      message: response.data.message,
      pagination: response.data.pagination ?? null,
    };
  } catch (error) {
    console.error("Error fetching quizzes:", error);
    return {
      success: false,
      message: getApiErrorMessage(error, "Failed to fetch quizzes"),
      error: error.response?.data,
    };
  }
};

export const getQuizById = async (quizId) => {
  try {
    const response = await api.get(`/quizzes/${quizId}`);
    return {
      success: true,
      data: mapQuizForUI(response.data.data),
      message: response.data.message,
    };
  } catch (error) {
    console.error("Error fetching quiz:", error);
    return {
      success: false,
      message: getApiErrorMessage(error, "Failed to fetch quiz"),
      error: error.response?.data,
    };
  }
};

export const createQuiz = async (payload) => {
  try {
    const response = await api.post("/quizzes", payload);
    return {
      success: true,
      data: mapQuizForUI(response.data.data),
      message: response.data.message,
    };
  } catch (error) {
    console.error("Error creating quiz:", error);
    return {
      success: false,
      message: getApiErrorMessage(error, "Failed to create quiz"),
      error: error.response?.data,
    };
  }
};

export const updateQuiz = async (quizId, payload) => {
  try {
    const response = await api.patch(`/quizzes/${quizId}`, payload);
    return {
      success: true,
      data: mapQuizForUI(response.data.data),
      message: response.data.message,
    };
  } catch (error) {
    console.error("Error updating quiz:", error);
    return {
      success: false,
      message: getApiErrorMessage(error, "Failed to rename quiz"),
      error: error.response?.data,
    };
  }
};

export const deleteQuiz = async (quizId) => {
  try {
    const response = await api.delete(`/quizzes/${quizId}`);
    return {
      success: true,
      message: response.data.message,
    };
  } catch (error) {
    console.error("Error deleting quiz:", error);
    return {
      success: false,
      message: getApiErrorMessage(error, "Failed to delete quiz"),
      error: error.response?.data,
    };
  }
};

export const mapAttemptForUI = (attempt) => {
  if (!attempt) return null;

  const answersArray = Array.isArray(attempt.answers) ? attempt.answers : [];
  const answersMap = answersArray.reduce((acc, item) => {
    acc[item.questionIndex] = item.selectedIndex;
    return acc;
  }, {});

  return {
    id: attempt.id,
    quizId: attempt.quizId,
    score: attempt.correctCount ?? 0,
    total: attempt.totalQuestions ?? 0,
    correctCount: attempt.correctCount ?? 0,
    totalQuestions: attempt.totalQuestions ?? 0,
    scorePercentage: Number(attempt.scorePercentage ?? 0),
    timeSpent: normalizeDurationSeconds(attempt.durationSeconds),
    durationSeconds: normalizeDurationSeconds(attempt.durationSeconds),
    submittedAt: attempt.submittedAt ?? attempt.createdAt ?? null,
    date: attempt.submittedAt ?? attempt.createdAt ?? null,
    answers: answersMap,
    answerDetails: answersArray,
    weakTopics: attempt.weakTopics ?? computeWeakTopics(answersArray),
  };
};

export const submitQuizAttempt = async (quizId, payload) => {
  try {
    const response = await api.post(`/quizzes/${quizId}/attempts`, payload);
    return {
      success: true,
      data: mapAttemptForUI(response.data.data),
      raw: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    console.error("Error submitting quiz attempt:", error);
    return {
      success: false,
      message: getApiErrorMessage(error, "Failed to submit quiz"),
      error: error.response?.data,
    };
  }
};

export const getQuizAttempts = async (quizId) => {
  try {
    const response = await api.get(`/quizzes/${quizId}/attempts`);
    const items = Array.isArray(response.data.data) ? response.data.data : [];

    return {
      success: true,
      data: items.map(mapAttemptForUI),
      message: response.data.message,
    };
  } catch (error) {
    console.error("Error fetching quiz attempts:", error);
    return {
      success: false,
      message: getApiErrorMessage(error, "Failed to fetch quiz attempts"),
      error: error.response?.data,
    };
  }
};

export const getLatestQuizAttempt = async (quizId) => {
  try {
    const response = await api.get(`/quizzes/${quizId}/attempts/latest`);
    return {
      success: true,
      data: mapAttemptForUI(response.data.data),
      raw: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    if (error.response?.status === 404) {
      return {
        success: false,
        notFound: true,
        message: error.response?.data?.message || "No quiz attempts found",
      };
    }

    console.error("Error fetching latest quiz attempt:", error);
    return {
      success: false,
      message: getApiErrorMessage(error, "Failed to fetch latest quiz attempt"),
      error: error.response?.data,
    };
  }
};

export const getQuizAttemptById = async (attemptId) => {
  try {
    const response = await api.get(`/quiz-attempts/${attemptId}`);
    return {
      success: true,
      data: mapAttemptForUI(response.data.data),
      raw: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    console.error("Error fetching quiz attempt:", error);
    return {
      success: false,
      message: getApiErrorMessage(error, "Failed to fetch quiz attempt"),
      error: error.response?.data,
    };
  }
};

export { mapQuizForUI };
