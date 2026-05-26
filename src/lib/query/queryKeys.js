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
  progress: {
    summary: ["progress", "summary"],
    streaks: ["progress", "streaks"],
    milestones: ["progress", "milestones"],
  },
  notes: {
    all: ["notes"],
  },
  user: {
    profile: ["user", "profile"],
    blockedSlots: ["user", "blocked-slots"],
    preferences: ["user", "preferences"],
  },
  notifications: {
    all: ["notifications"],
  },
  achievements: {
    badges: ["achievements", "badges"],
  },
  adminContent: {
    subjects: (params = {}) => ["admin", "content-management", "subjects", params],
    items: (params = {}) => ["admin", "content-management", "items", params],
  },
  adminViolations: {
    stats: (params = {}) => ["admin", "violations", "stats", params],
    list: (params = {}) => ["admin", "violations", "list", params],
  },
};
