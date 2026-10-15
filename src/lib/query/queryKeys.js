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
  goals: {
    all: (params = {}) => ["goals", params],
  },
  progress: {
    summary: ["progress", "summary"],
    streaks: ["progress", "streaks"],
    milestones: ["progress", "milestones"],
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
  groups: {
    all: ["groups"],
    detail: (groupId) => ["groups", groupId],
    members: (groupId) => ["groups", groupId, "members"],
    resources: (groupId) => ["groups", groupId, "resources"],
    goals: (groupId) => ["groups", groupId, "goals"],
    tasks: (groupId, filters = {}) => ["groups", groupId, "tasks", filters],
    progress: (groupId) => ["groups", groupId, "progress"],
  },
  chat: {
    messages: (groupId) => ["chat", groupId, "messages"],
    shared: (groupId, type) => ["chat", groupId, "shared", type],
  },
  assistant: {
    sources: ["assistant", "sources"],
    conversations: ["assistant", "conversations"],
    messages: (conversationId) => ["assistant", "conversations", conversationId, "messages"],
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
