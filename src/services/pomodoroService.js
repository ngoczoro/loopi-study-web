import api from "./api";

/**
 * Start a pomodoro session
 * @param {string} studySessionId - ID of the study session
 * @param {number} sessionNumber - Pomodoro session number (default: 1)
 * @returns {Promise}
 */
export const startPomodoroSessionAPI = async (
  studySessionId,
  sessionNumber = 1,
) => {
  try {
    const response = await api.post("/pomodoro/start", {
      studySessionId,
      sessionNumber,
    });

    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    console.error("Error starting pomodoro session:", error);
    return {
      success: false,
      message:
        error.response?.data?.message || "Failed to start pomodoro session",
      error: error.response?.data,
    };
  }
};

/**
 * Pause a pomodoro session
 * @param {string} pomodoroSessionId - ID of the pomodoro session
 * @returns {Promise}
 */
export const pausePomodoroSessionAPI = async (pomodoroSessionId) => {
  try {
    const response = await api.post(`/pomodoro/${pomodoroSessionId}/pause`);

    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    console.error("Error pausing pomodoro session:", error);
    return {
      success: false,
      message:
        error.response?.data?.message || "Failed to pause pomodoro session",
      error: error.response?.data,
    };
  }
};

/**
 * Resume a pomodoro session
 * @param {string} pomodoroSessionId - ID of the pomodoro session
 * @returns {Promise}
 */
export const resumePomodoroSessionAPI = async (pomodoroSessionId) => {
  try {
    const response = await api.post(`/pomodoro/${pomodoroSessionId}/resume`);

    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    console.error("Error resuming pomodoro session:", error);
    return {
      success: false,
      message:
        error.response?.data?.message || "Failed to resume pomodoro session",
      error: error.response?.data,
    };
  }
};

/**
 * Complete a pomodoro session
 * @param {string} pomodoroSessionId - ID of the pomodoro session
 * @param {number} actualWorkTimeMinutes - Actual work time in minutes (optional)
 * @returns {Promise}
 */
export const completePomodoroSessionAPI = async (
  pomodoroSessionId,
  actualWorkTimeMinutes,
) => {
  try {
    const response = await api.post(`/pomodoro/${pomodoroSessionId}/complete`, {
      actualWorkTimeMinutes,
    });

    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    console.error("Error completing pomodoro session:", error);
    return {
      success: false,
      message:
        error.response?.data?.message || "Failed to complete pomodoro session",
      error: error.response?.data,
    };
  }
};

/**
 * Get pomodoro stats
 * @param {string} fromDate - Start date (ISO format, optional)
 * @param {string} toDate - End date (ISO format, optional)
 * @returns {Promise}
 */
export const getPomodoroStatsAPI = async (fromDate, toDate) => {
  try {
    const params = {};
    if (fromDate) params.fromDate = fromDate;
    if (toDate) params.toDate = toDate;

    const response = await api.get("/pomodoro/stats", { params });

    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    console.error("Error fetching pomodoro stats:", error);
    return {
      success: false,
      message:
        error.response?.data?.message || "Failed to fetch pomodoro stats",
      error: error.response?.data,
    };
  }
};
