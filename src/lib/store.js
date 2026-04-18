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
}));
