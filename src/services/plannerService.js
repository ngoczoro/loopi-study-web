import api from "./api";

const toApiPayload = (session, weekStartDate) => ({
  title: session.title,
  subjectId: session.subjectId || null,
  dayOfWeek: session.dayOfWeek ?? session.day,
  startHour: session.startHour ?? session.start,
  durationHours: session.durationHours ?? session.duration,
  color: session.color ?? null,
  weekStartDate: session.weekStartDate ?? weekStartDate,
  ...(session.source ? { source: session.source } : {}),
});

const fromApiSession = (data) => ({
  id: data.id,
  subjectId: data.subjectId ?? null,
  title: data.title,
  day: data.day,
  start: Number(data.start),
  duration: Number(data.duration),
  color: data.color,
  weekStartDate: data.weekStartDate,
  source: data.source,
});

export const getPlannerSessions = async (weekStartDate) => {
  try {
    const response = await api.get("/planner/sessions", {
      params: { weekStartDate },
    });
    return {
      success: true,
      data: (response.data.data || []).map(fromApiSession),
      message: response.data.message,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error.response?.data?.message || "Failed to fetch planner sessions",
      error: error.response?.data,
    };
  }
};

export const createPlannerSession = async (session, weekStartDate) => {
  try {
    const response = await api.post(
      "/planner/sessions",
      toApiPayload(session, weekStartDate),
    );
    return {
      success: true,
      data: fromApiSession(response.data.data),
      message: response.data.message,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error.response?.data?.message || "Failed to create planner session",
      error: error.response?.data,
    };
  }
};

export const updatePlannerSession = async (id, updates, weekStartDate) => {
  try {
    const payload = {};

    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.subjectId !== undefined) {
      payload.subjectId = updates.subjectId || null;
    }
    if (updates.day !== undefined) payload.dayOfWeek = updates.day;
    if (updates.dayOfWeek !== undefined) payload.dayOfWeek = updates.dayOfWeek;
    if (updates.start !== undefined) payload.startHour = updates.start;
    if (updates.startHour !== undefined) payload.startHour = updates.startHour;
    if (updates.duration !== undefined) {
      payload.durationHours = updates.duration;
    }
    if (updates.durationHours !== undefined) {
      payload.durationHours = updates.durationHours;
    }
    if (updates.color !== undefined) payload.color = updates.color;
    if (updates.weekStartDate !== undefined) {
      payload.weekStartDate = updates.weekStartDate;
    } else if (weekStartDate) {
      payload.weekStartDate = weekStartDate;
    }
    if (updates.source !== undefined) payload.source = updates.source;

    const response = await api.patch(`/planner/sessions/${id}`, payload);
    return {
      success: true,
      data: fromApiSession(response.data.data),
      message: response.data.message,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error.response?.data?.message || "Failed to update planner session",
      error: error.response?.data,
    };
  }
};

export const deletePlannerSession = async (id) => {
  try {
    const response = await api.delete(`/planner/sessions/${id}`);
    return {
      success: true,
      message: response.data.message,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error.response?.data?.message || "Failed to delete planner session",
      error: error.response?.data,
    };
  }
};

export const clearAllPlannerSessions = async () => {
  try {
    const response = await api.delete("/planner/sessions/all");
    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error.response?.data?.message || "Failed to clear planner sessions",
      error: error.response?.data,
    };
  }
};
