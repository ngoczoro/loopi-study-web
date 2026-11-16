const DIFFICULTIES = new Set(["easy", "medium", "hard"]);

export const blankQuestion = () => ({
  question: "",
  options: ["", "", "", ""],
  correctIndex: 0,
  explanation: "",
  difficulty: "medium",
});

/** Map a saved quiz question to the editable shape (always 4 options). */
export const toDraftQuestion = (item) => {
  const options = (item.options ?? []).slice(0, 4).map((option) => String(option ?? ""));
  while (options.length < 4) options.push("");
  return {
    question: item.question ?? "",
    options,
    correctIndex: Number.isInteger(item.correctIndex) ? item.correctIndex : 0,
    explanation: item.explanation ?? "",
    difficulty: DIFFICULTIES.has(item.difficulty) ? item.difficulty : "medium",
    ...(item.sourceTopic ? { sourceTopic: item.sourceTopic } : {}),
  };
};

/** Returns an error message for the first invalid question, or null when the draft can be saved. */
export const validateQuizDraft = (title, questions) => {
  if (!title.trim()) return "Quiz title is required";
  if (!questions.length) return "A quiz needs at least one question";

  for (let index = 0; index < questions.length; index += 1) {
    const item = questions[index];
    const label = `Question ${index + 1}`;
    if (!item.question.trim()) return `${label} needs text`;
    const options = item.options.map((option) => option.trim().toLowerCase());
    if (options.some((option) => !option)) return `${label}: every option needs text`;
    if (new Set(options).size !== options.length) {
      return `${label}: answer options must be different`;
    }
  }
  return null;
};

/** Trimmed payload for PUT /quizzes/:id. */
export const toQuizContentPayload = (title, questions) => ({
  title: title.trim(),
  questions: questions.map((item) => ({
    ...item,
    question: item.question.trim(),
    options: item.options.map((option) => option.trim()),
    explanation: item.explanation.trim(),
  })),
});
