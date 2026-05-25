/** @typedef {Record<string, unknown>} QueryParams */

export const queryKeys = {
  subjects: {
    all: ["subjects"],
    detail: (id) => ["subjects", id],
  },
  planner: {
    week: (weekStartDate) => ["planner", weekStartDate],
  },
  focus: {
    active: ["focus", "active"],
    history: (filters = {}) => ["focus", "history", filters],
    analytics: {
      summary: (params = {}) => ["focus", "analytics", "summary", params],
      trends: (params = {}) => ["focus", "analytics", "trends", params],
      subjects: (params = {}) => ["focus", "analytics", "subjects", params],
      streak: ["focus", "analytics", "streak"],
      planner: (params = {}) => ["focus", "analytics", "planner", params],
    },
  },
  notes: {
    all: ["notes"],
  },
  user: {
    profile: ["user", "profile"],
    blockedSlots: ["user", "blocked-slots"],
    preferences: ["user", "preferences"],
  },
};
