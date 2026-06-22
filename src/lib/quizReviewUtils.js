const computeWeakTopics = (answers = []) => {
  const topics = new Set();

  for (const item of answers) {
    if (item?.isCorrect === false) {
      const topic = String(item?.sourceTopic ?? "").trim();
      if (topic) {
        topics.add(topic);
      }
    }
  }

  return [...topics];
};

const MAX_DISPLAY_DURATION_SECONDS = 86400;

export const normalizeDurationSeconds = (rawSeconds) => {
  if (rawSeconds == null || rawSeconds === "") {
    return null;
  }

  const num = Math.round(Number(rawSeconds));
  if (!Number.isFinite(num) || num < 0) {
    return null;
  }

  if (num <= MAX_DISPLAY_DURATION_SECONDS) {
    return num;
  }

  const fromMilliseconds = Math.round(num / 1000);
  if (
    fromMilliseconds >= 0 &&
    fromMilliseconds <= MAX_DISPLAY_DURATION_SECONDS
  ) {
    return fromMilliseconds;
  }

  return null;
};

export const getScoreLabel = (percentage) => {
  if (percentage >= 80) return "Excellent";
  if (percentage >= 50) return "Pass";
  return "Needs review";
};

export const getScoreBadgeClass = (percentage) => {
  if (percentage >= 80) return "bg-accent/20 text-accent-foreground";
  if (percentage >= 50) return "bg-warning/20 text-warning-foreground";
  return "bg-destructive/10 text-destructive";
};

export const formatDurationVi = (seconds) => {
  const normalized = normalizeDurationSeconds(seconds);
  if (normalized == null) {
    return "No time data";
  }

  const hours = Math.floor(normalized / 3600);
  const minutes = Math.floor((normalized % 3600) / 60);
  const remainSeconds = normalized % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (minutes === 0) {
    return `${remainSeconds}s`;
  }

  return `${minutes}m${remainSeconds > 0 ? ` ${remainSeconds}s` : ""}`;
};

export const formatSubmittedAtVi = (value) => {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-US", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const getOptionText = (options, index) => {
  if (index == null || index < 0 || !Array.isArray(options)) {
    return null;
  }

  return options[index] ?? null;
};

export const formatAnswerLine = (letter, optionText) => {
  if (!letter && optionText == null) {
    return "Not answered";
  }

  if (optionText == null || optionText === "") {
    return letter ? `${letter}. —` : "Not answered";
  }

  return `${letter}. ${optionText}`;
};

export const filterReviewAnswers = (answers, filter) => {
  const list = Array.isArray(answers) ? answers : [];

  if (filter === "correct") {
    return list.filter((item) => item.isCorrect === true);
  }

  if (filter === "incorrect") {
    return list.filter((item) => item.isCorrect === false);
  }

  return list;
};

export { computeWeakTopics };
