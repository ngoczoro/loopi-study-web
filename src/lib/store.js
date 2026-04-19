import { create } from "zustand";

/**
 * @typedef {"spam" | "inappropriate" | "irrelevant"} ViolationType
 */

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
    {
      id: "ss6",
      day: 5,
      start: 11,
      duration: 2,
      title: "Hoc Ngoc",
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
    {
      id: "s5",
      name: "Ngoc",
      credits: 2,
      difficulty: "Easy",
      examDate: "Apr 10",
      color: "35 90% 60%",
      progress: 30,
    },
  ],

  documents: [
    {
      id: "d1",
      title: "Linear Algebra – Ch.5 Summary",
      subjectId: "s1",
      type: "note",
      date: "Mar 15",
      content: "Summary of eigenvalues and eigenvectors...",
      ownerId: "u1",
      ownerName: "Alice",
      createdAt: "Mar 15 09:30",
    },
    {
      id: "d2",
      title: "React Hooks Cheatsheet",
      subjectId: "s2",
      type: "note",
      date: "Mar 14",
      content: "useState, useEffect, useCallback...",
      ownerId: "u1",
      ownerName: "Alice",
      createdAt: "Mar 14 14:20",
    },
    {
      id: "d3",
      title: "Genetics Diagram.pdf",
      subjectId: "s3",
      type: "file",
      date: "Mar 13",
      ownerId: "u2",
      ownerName: "Bob",
      createdAt: "Mar 13 11:00",
    },
    {
      id: "d4",
      title: "French Vocab List",
      subjectId: "s4",
      type: "note",
      date: "Mar 12",
      content: "Bonjour, merci, s'il vous plaît...",
      ownerId: "u2",
      ownerName: "Bob",
      createdAt: "Mar 12 16:45",
    },
    {
      id: "d5",
      title: "Lecture Recording Link",
      subjectId: "s5",
      type: "link",
      date: "Mar 11",
      ownerId: "u3",
      ownerName: "Charlie",
      createdAt: "Mar 11 08:15",
    },
    {
      id: "d6",
      title: "BUY CHEAP STUFF NOW!!!",
      subjectId: null,
      type: "note",
      date: "Mar 20",
      content: "spam spam spam",
      ownerId: "u3",
      ownerName: "Charlie",
      createdAt: "Mar 20 02:10",
    },
    {
      id: "d7",
      title: "Totally not studying lol",
      subjectId: "s1",
      type: "note",
      date: "Mar 19",
      content: "irrelevant random content",
      ownerId: "u3",
      ownerName: "Charlie",
      createdAt: "Mar 19 23:50",
    },
  ],

  violations: [
    {
      id: "v1",
      userId: "u3",
      userName: "Charlie",
      userEmail: "charlie@example.com",
      type: "spam",
      contentId: "d6",
      contentTitle: "BUY CHEAP STUFF NOW!!!",
      contentType: "note",
      detectedAt: "Mar 20 02:15",
      resolved: false,
    },
    {
      id: "v2",
      userId: "u3",
      userName: "Charlie",
      userEmail: "charlie@example.com",
      type: "irrelevant",
      contentId: "d7",
      contentTitle: "Totally not studying lol",
      contentType: "note",
      detectedAt: "Mar 19 23:55",
      resolved: false,
    },
    {
      id: "v3",
      userId: "u2",
      userName: "Bob",
      userEmail: "bob@example.com",
      type: "inappropriate",
      contentId: "d3",
      contentTitle: "Genetics Diagram.pdf",
      contentType: "file",
      detectedAt: "Mar 13 12:00",
      resolved: true,
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

  //page Notes
  addDocument: (d) =>
    set((state) => ({
      documents: [...state.documents, d],
    })),

  deleteDocument: (id) =>
    set((state) => ({
      documents: state.documents.filter((d) => d.id !== id),
    })),

  updateDocument: (id, updates) =>
    set((state) => ({
      documents: state.documents.map((d) =>
        d.id === id ? { ...d, ...updates } : d,
      ),
    })),

  addViolation: (v) =>
    set((state) => ({
      violations: [...state.violations, v],
    })),
}));
