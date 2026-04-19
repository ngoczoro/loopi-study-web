import { create } from "zustand";

const uid = () => Math.random().toString(36).slice(2, 10);

export const useAppStore = create((set) => ({
  subjects: [
    { id: "s1", name: "Mathematics", color: "340 82% 59%" },
    { id: "s2", name: "Computer Science", color: "210 80% 60%" },
    { id: "s3", name: "Biology", color: "142 45% 55%" },
    { id: "s4", name: "French", color: "35 90% 60%" },
  ],

  tasks: [
    {
      id: "t1",
      title: "Review Chapter 5 – Linear Algebra",
      subjectId: "s1",
      completed: false,
      priority: "high",
      taskDate: new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString(),
    },
    {
      id: "t2",
      title: "Complete React tutorial exercises",
      subjectId: "s2",
      completed: true,
      priority: "medium",
      taskDate: new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString(),
    },
    {
      id: "t3",
      title: "Read biology notes",
      subjectId: "s3",
      completed: false,
      priority: "low",
      taskDate: new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString(),
    },
  ],

  violations: [],

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

  addTask: (task) =>
    set((state) => ({
      tasks: [...state.tasks, { ...task, id: uid() }],
    })),

  toggleTask: (id) =>
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      ),
    })),

  deleteTask: (id) =>
    set((state) => ({
      tasks: state.tasks.filter((task) => task.id !== id),
    })),

  addViolation: (violation) =>
    set((state) => ({
      violations: [...state.violations, { ...violation, id: uid() }],
    })),

  addSession: (session) =>
    set((state) => ({
      sessions: [...state.sessions, { ...session, id: uid() }],
    })),

  addSessions: (newSessions) =>
    set((state) => ({
      sessions: [
        ...state.sessions,
        ...newSessions.map((session) => ({ ...session, id: uid() })),
      ],
    })),
}));