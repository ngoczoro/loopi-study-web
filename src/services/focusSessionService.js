import api from "./api";

export const createFocusSessionAPI = async (payload) => {
  try {
    const response = await api.post("/focus-sessions", payload);
    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error.response?.data?.message || "Failed to start focus session",
      error: error.response?.data,
    };
  }
};

export const getActiveFocusSessionAPI = async () => {
  try {
    const response = await api.get("/focus-sessions/active");
    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error.response?.data?.message || "Failed to fetch active focus session",
      error: error.response?.data,
    };
  }
};

export const pauseFocusSessionAPI = async (sessionId, payload) => {
  try {
    const response = await api.post(`/focus-sessions/${sessionId}/pause`, payload);
    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error.response?.data?.message || "Failed to pause focus session",
      error: error.response?.data,
    };
  }
};

export const resumeFocusSessionAPI = async (sessionId) => {
  try {
    const response = await api.post(`/focus-sessions/${sessionId}/resume`);
    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error.response?.data?.message || "Failed to resume focus session",
      error: error.response?.data,
    };
  }
};

export const syncFocusSessionAPI = async (sessionId, payload) => {
  try {
    const response = await api.post(`/focus-sessions/${sessionId}/sync`, payload);
    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error.response?.data?.message || "Failed to sync focus session",
      error: error.response?.data,
    };
  }
};

export const completeFocusSessionAPI = async (sessionId, payload = {}) => {
  try {
    const response = await api.post(`/focus-sessions/${sessionId}/complete`, payload);
    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error.response?.data?.message || "Failed to complete focus session",
      error: error.response?.data,
    };
  }
};

export const abandonFocusSessionAPI = async (sessionId, payload = {}) => {
  try {
    const response = await api.post(`/focus-sessions/${sessionId}/abandon`, payload);
    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error.response?.data?.message || "Failed to end focus session",
      error: error.response?.data,
    };
  }
};

export const getFocusSessionHistoryAPI = async () => {
  try {
    const response = await api.get("/focus-sessions/history");
    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error.response?.data?.message || "Failed to fetch session history",
      error: error.response?.data,
    };
  }
};
