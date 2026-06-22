/** @typedef {"existing_subjects" | "document"} AiPlanMode */

/** @typedef {"Easy" | "Medium" | "Hard"} SubjectDifficulty */

/** @typedef {"low" | "medium" | "high"} SubjectPriority */

/**
 * @typedef {Object} SchedulingOverride
 * @property {string} subjectId
 * @property {SubjectDifficulty} [difficulty]
 * @property {number} [hoursPerWeek]
 * @property {string} [examDate]
 */

/**
 * @typedef {Object} ActiveConstraint
 * @property {string} type
 * @property {Record<string, unknown>} [key]
 */

/**
 * @typedef {Object} GenerateAiPlanRequest
 * @property {AiPlanMode} mode
 * @property {string[]} subjectIds
 * @property {string} [documentId]
 * @property {string} [examDate]
 * @property {SchedulingOverride[]} [schedulingOverrides]
 * @property {ActiveConstraint[]} [constraints]
 * @property {number} [maxStudyHoursPerDay] Max study hours per day (1–12, default 4)
 */

/**
 * @typedef {Object} PlanSessionPreview
 * @property {string} subjectId
 * @property {string} title
 * @property {number} dayOfWeek
 * @property {number} startHour
 * @property {number} durationHours
 * @property {string} weekStartDate
 * @property {string} [color]
 */

/**
 * @typedef {Object} WeekPlan
 * @property {string} weekStartDate
 * @property {string} label
 * @property {number} totalHours
 * @property {PlanSessionPreview[]} sessions
 */

/**
 * @typedef {Object} PlanSubjectSummary
 * @property {string} subjectId
 * @property {string} subjectName
 * @property {number} totalSessions
 * @property {number} totalHours
 */

/**
 * @typedef {Object} ReplacePreviewItem
 * @property {string} subjectId
 * @property {string} subjectName
 * @property {number} countToReplace
 */

/**
 * @typedef {Object} GenerateAiPlanResponse
 * @property {string} [planStart]
 * @property {string} [planEnd]
 * @property {string} [status]
 * @property {WeekPlan[]} weeks
 * @property {PlanSubjectSummary[]} summary
 * @property {ReplacePreviewItem[]} replacePreview
 * @property {string[]} warnings
 */

/**
 * @typedef {Object} ApplyAiPlanRequest
 * @property {string[]} subjectIds
 * @property {PlanSessionPreview[]} sessions
 */

/**
 * @typedef {Object} ApplyAiPlanResponse
 * @property {number} created
 * @property {{ subjectId: string, count: number }[]} replaced
 */

/**
 * @typedef {Object} AnalyzeDocumentRequest
 * @property {string} documentId
 */

/**
 * @typedef {Object} AnalyzeDocumentResponse
 * @property {string} documentId
 * @property {string} documentTitle
 * @property {string|null} linkedSubjectId
 * @property {string} suggestedName
 * @property {string|null} examDate
 * @property {SubjectDifficulty} difficulty
 * @property {number} hoursPerWeek
 * @property {string[]} topics
 * @property {string} rationale
 * @property {{ id: string, name: string, difficulty?: string|null, requiredHoursPerWeek?: number|null, credits?: number|null, examDate?: string|null }|null} [userSubject]
 * @property {string} [analyzedAt]
 */

export const AI_PLAN_MODES = {
  EXISTING_SUBJECTS: "existing_subjects",
  DOCUMENT: "document",
};

export const EXAM_BUFFER_DAYS = 7;
