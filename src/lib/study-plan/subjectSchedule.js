import { EXAM_BUFFER_DAYS } from "./types";

const parseDateOnly = (value) => new Date(`${String(value).slice(0, 10)}T12:00:00`);

/** Last date (inclusive) the planner may schedule sessions for this exam. */
export const getSubjectPlanEndDate = (
  examDate,
  bufferDays = EXAM_BUFFER_DAYS,
) => {
  const end = parseDateOnly(examDate);
  end.setDate(end.getDate() - bufferDays);
  return end;
};

/**
 * @param {{ examDate?: string|null }} subject
 * @param {Date} [planStart]
 * @returns {{ schedulable: boolean, reason?: "missing_exam_date" | "exam_passed" | "exam_too_soon" }}
 */
export const getSubjectScheduleStatus = (subject, planStart = new Date()) => {
  if (!subject.examDate) {
    return { schedulable: false, reason: "missing_exam_date" };
  }

  const start = new Date(planStart);
  start.setHours(12, 0, 0, 0);

  const exam = parseDateOnly(subject.examDate);
  const planEnd = getSubjectPlanEndDate(subject.examDate);

  if (planEnd < start) {
    return {
      schedulable: false,
      reason: exam < start ? "exam_passed" : "exam_too_soon",
    };
  }

  return { schedulable: true };
};

export const getSubjectScheduleMessage = (reason) => {
  switch (reason) {
    case "missing_exam_date":
      return "Add an exam date in Subjects first.";
    case "exam_passed":
      return "Exam date has passed — update the exam date to generate a plan.";
    case "exam_too_soon":
      return `Exam is within ${EXAM_BUFFER_DAYS} days — no study weeks left to schedule.`;
    default:
      return "Cannot schedule this subject.";
  }
};

/**
 * Map current subject rows into AI plan scheduling overrides.
 * @param {Array<{ id: string, difficulty?: string|null, requiredHoursPerWeek?: number|null, credits?: number|null, priority?: string|null, examDate?: string|null }>} subjects
 * @param {string[]} subjectIds
 */
export const buildSchedulingOverridesFromSubjects = (subjects, subjectIds) =>
  subjectIds.flatMap((subjectId) => {
    const subject = subjects.find((item) => item.id === subjectId);
    if (!subject) return [];

    const hoursPerWeek =
      subject.requiredHoursPerWeek ?? subject.credits ?? undefined;

    return [
      {
        subjectId,
        ...(subject.difficulty ? { difficulty: subject.difficulty } : {}),
        ...(hoursPerWeek != null ? { hoursPerWeek: Number(hoursPerWeek) } : {}),
        ...(subject.priority ? { priority: subject.priority } : {}),
        ...(subject.examDate ? { examDate: subject.examDate } : {}),
      },
    ];
  });
