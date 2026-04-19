import { create } from "zustand";

/**
 * @typedef {{
 *  question: string,
 *  options: string[],
 *  correctIndex: number,
 *  explanation?: string,
 *  difficulty?: "easy" | "medium" | "hard"
 * }} QuizQuestion
 */

/**
 * @typedef {{
 *  id: string,
 *  title: string,
 *  subjectId: string | null,
 *  questions: QuizQuestion[],
 *  createdAt: string
 * }} Quiz
 */

/**
 * @typedef {{
 *  id: string,
 *  name: string,
 *  credits: number,
 *  difficulty: "Easy" | "Medium" | "Hard",
 *  examDate: string,
 *  color: string,
 *  progress: number
 * }} Subject
 */

const uid = () => Math.random().toString(36).slice(2, 10);

export const useAppStore = create((set) => ({
  sessions: [
    {
      id: "ss1",
      day: 0,
      start: 9,
      duration: 2,
      title: "Linear Algebra",
      color: "340 82% 59%",
    },
    {
      id: "ss2",
      day: 1,
      start: 14,
      duration: 1.5,
      title: "React Tutorial",
      color: "210 80% 60%",
    },
    {
      id: "ss3",
      day: 2,
      start: 10,
      duration: 1,
      title: "Biology Reading",
      color: "142 45% 55%",
    },
    {
      id: "ss4",
      day: 3,
      start: 16,
      duration: 1,
      title: "French Practice",
      color: "35 90% 60%",
    },
    {
      id: "ss5",
      day: 4,
      start: 11,
      duration: 2,
      title: "CS Project",
      color: "210 80% 60%",
    },
  ],

  subjects: [
    {
      id: "s1",
      name: "Mathematics",
      credits: 4,
      difficulty: "Hard",
      examDate: "Mar 28",
      color: "340 82% 59%",
      progress: 65,
    },
    {
      id: "s2",
      name: "Computer Science",
      credits: 3,
      difficulty: "Medium",
      examDate: "Apr 02",
      color: "210 80% 60%",
      progress: 80,
    },
    {
      id: "s3",
      name: "Biology",
      credits: 3,
      difficulty: "Medium",
      examDate: "Apr 05",
      color: "142 45% 55%",
      progress: 45,
    },
    {
      id: "s4",
      name: "French",
      credits: 2,
      difficulty: "Easy",
      examDate: "Apr 10",
      color: "35 90% 60%",
      progress: 30,
    },
  ],

  addSession: (s) =>
    set((state) => ({
      sessions: [...state.sessions, { ...s, id: uid() }],
    })),

  addSessions: (newSessions) =>
    set((state) => ({
      sessions: [
        ...state.sessions,
        ...newSessions.map((s) => ({ ...s, id: uid() })),
      ],
    })),
  // ===== QUIZ (THÊM CHO QuizList) =====
  quizzes: [],

  addQuiz: (q) =>
    set((state) => ({
      quizzes: [
        ...state.quizzes,
        {
          ...q,
          id: uid(),
          createdAt: new Date().toISOString(),
        },
      ],
    })),

  deleteQuiz: (id) =>
    set((state) => ({
      quizzes: state.quizzes.filter((q) => q.id !== id),
    })),
}));
