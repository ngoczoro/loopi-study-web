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

export const getFocusAnalyticsSummaryAPI = async (params = {}) => {
  try {
    const response = await api.get("/focus-sessions/analytics/summary", { params });
    return handleResponse(response, "Failed to fetch analytics summary");
  } catch (error) {
    return handleError(error, "Failed to fetch analytics summary");
  }
};

export const getFocusAnalyticsTrendsAPI = async (params = {}) => {
  try {
    const response = await api.get("/focus-sessions/analytics/trends", { params });
    return handleResponse(response, "Failed to fetch analytics trends");
  } catch (error) {
    return handleError(error, "Failed to fetch analytics trends");
  }
};

export const getFocusSubjectStatsAPI = async (params = {}) => {
  try {
    const response = await api.get("/focus-sessions/analytics/subjects", { params });
    return handleResponse(response, "Failed to fetch subject statistics");
  } catch (error) {
    return handleError(error, "Failed to fetch subject statistics");
  }
};

export const getFocusStreakAPI = async () => {
  try {
    const response = await api.get("/focus-sessions/analytics/streak");
    return handleResponse(response, "Failed to fetch study streak");
  } catch (error) {
    return handleError(error, "Failed to fetch study streak");
  }
};

export const getFocusPlannerInsightsAPI = async (params = {}) => {
  try {
    const response = await api.get("/focus-sessions/analytics/planner", { params });
    return handleResponse(response, "Failed to fetch planner insights");
  } catch (error) {
    return handleError(error, "Failed to fetch planner insights");
  }
};

export const getFocusSessionHistoryFilteredAPI = async (params = {}) => {
  try {
    const response = await api.get("/focus-sessions/history", { params });
    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    return handleError(error, "Failed to fetch session history");
  }
};

export const formatFocusMinutes = (seconds) => {
  const mins = Math.round((seconds ?? 0) / 60);
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem > 0 ? `${hours}h ${rem}m` : `${hours}h`;
};

export const formatFocusHours = (seconds) =>
  ((seconds ?? 0) / 3600).toFixed(1);
