import { create } from "zustand";
import {
  getUsers,
  saveUsers,
  loginUser,
  registerUserAuth,
  resetPasswordAuth,
  getUserByEmail,
  generateOTP,
  saveOTP,
  getOTP,
  verifyOTP,
  clearOTP,
} from "./auth-utils";

/**
 * @typedef {Object} Subject
 * @property {string} id
 * @property {string} name
 * @property {number} credits
 * @property {"Easy" | "Medium" | "Hard"} difficulty
 * @property {string} examDate
 * @property {string} color
 * @property {number} progress
 */

/**
 * @typedef {Object} UserAccount
 * @property {string} id
 * @property {string} username
 * @property {string} email
 * @property {"student" | "admin"} role
 * @property {boolean} locked
 * @property {string} createdAt
 */

const uid = () => Math.random().toString(36).slice(2, 10);

const loadPreferencesFromStorage = () => {
  try {
    const stored = localStorage.getItem("loopi_preferences");
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Error loading preferences:", e);
  }
  return {
    pomodoroDuration: 25,
    breakDuration: 5,
    notifications: {
      taskReminders: true,
      sessionReminders: true,
      deadlineAlerts: true,
    },
  };
};

export const useAppStore = create((set, get) => ({
  // --- AUTH STATE ---
  currentUser: null,
  users: getUsers(),

  // --- AUTH ACTIONS ---

  login: (email, password) => {
    const result = loginUser(email, password);
    if (result.ok) {
      set({ currentUser: result.user });
      return result.user;
    }
    return null;
  },

  logout: () => set({ currentUser: null }),

  registerUser: (username, email, password) => {
    const result = registerUserAuth(username, email, password);
    if (result.ok) {
      set((state) => ({
        users: getUsers(),
        currentUser: result.user, // Auto-login sau khi register
      }));
      return { ok: true, user: result.user };
    }
    return { ok: false, reason: result.reason };
  },

  resetPassword: (email, newPassword) => {
    const result = resetPasswordAuth(email, newPassword);
    if (result.ok) {
      set((state) => ({ users: getUsers() }));
      return true;
    }
    return false;
  },

  getUserByEmail,

  // --- OTP ACTIONS ---

  generateAndSaveOTP: (email) => {
    const code = generateOTP();
    const otpData = saveOTP(email, code);
    return otpData ? { ok: true, code } : { ok: false };
  },

  verifyOTPCode: (email, inputCode) => {
    return verifyOTP(email, inputCode);
  },

  clearOTPCode: () => {
    return clearOTP();
  },

  toggleLockUser: (id) =>
    set((state) => ({
      users: state.users.map((u) =>
        u.id === id ? { ...u, locked: !u.locked } : u,
      ),
    })),

  // --- MAIN DATA STATE ---
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
      name: "History",
      credits: 3,
      difficulty: "Medium",
      examDate: "Apr 12",
      color: "280 60% 65%",
      progress: 55,
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

  quizzes: [],

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
      title: "Read biology notes (Genetics)",
      subjectId: "s3",
      completed: false,
      priority: "low",
      taskDate: new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString(),
    },
    {
      id: "t4",
      title: "Practice French vocabulary",
      subjectId: "s4",
      completed: false,
      priority: "medium",
      taskDate: new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString(),
    },
  ],

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

  blockedSlots: [],

  // --- USER PREFERENCES ---
  preferences: loadPreferencesFromStorage(),

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

  adminNotifications: [
    {
      id: "an1",
      title: "Spam detected",
      body: "Charlie may be spamming notes",
      time: "10 min ago",
      unread: true,
      violationId: "v1",
    },
    {
      id: "an2",
      title: "Irrelevant content",
      body: "Charlie posted irrelevant content in Mathematics",
      time: "1 hour ago",
      unread: true,
      violationId: "v2",
    },
    {
      id: "an3",
      title: "Content flagged",
      body: "Bob's file was flagged for review",
      time: "2 days ago",
      unread: false,
      violationId: "v3",
    },
  ],

  // --- ACTIONS ---

  // Subjects
  addSubject: (s) =>
    set((state) => ({ subjects: [...state.subjects, { ...s, id: uid() }] })),
  updateSubject: (id, updates) =>
    set((state) => ({
      subjects: state.subjects.map((s) =>
        s.id === id ? { ...s, ...updates } : s,
      ),
    })),
  deleteSubject: (id) =>
    set((state) => ({ subjects: state.subjects.filter((s) => s.id !== id) })),

  // Documents
  addDocument: (d) =>
    set((state) => ({ documents: [...state.documents, { ...d, id: uid() }] })),
  updateDocument: (id, updates) =>
    set((state) => ({
      documents: state.documents.map((d) =>
        d.id === id ? { ...d, ...updates } : d,
      ),
    })),
  deleteDocument: (id) =>
    set((state) => ({ documents: state.documents.filter((d) => d.id !== id) })),

  // Users
  updateUser: (id, updates) => {
    const state = get();
    const updatedUsers = state.users.map((u) =>
      u.id === id ? { ...u, ...updates } : u,
    );
    // Persist to localStorage
    saveUsers(updatedUsers);
    set({
      users: updatedUsers,
      currentUser:
        state.currentUser?.id === id
          ? { ...state.currentUser, ...updates }
          : state.currentUser,
    });
  },

  changePassword: (oldPassword, newPassword) => {
    const state = get();
    if (!state.currentUser) return { ok: false, reason: "not-logged-in" };

    // Validate old password
    if (state.currentUser.password !== oldPassword) {
      return { ok: false, reason: "invalid-old-password" };
    }

    // Update password and persist
    const updatedUsers = state.users.map((u) =>
      u.id === state.currentUser.id ? { ...u, password: newPassword } : u,
    );
    saveUsers(updatedUsers);

    set({
      users: updatedUsers,
      currentUser: { ...state.currentUser, password: newPassword },
    });

    return { ok: true };
  },

  // Preferences
  updatePreferences: (updates) =>
    set((state) => {
      const newPreferences = { ...state.preferences, ...updates };
      // Persist to localStorage
      localStorage.setItem("loopi_preferences", JSON.stringify(newPreferences));
      return { preferences: newPreferences };
    }),

  // Quizzes
  addQuiz: (q) =>
    set((state) => ({ quizzes: [...state.quizzes, { ...q, id: uid() }] })),
  deleteQuiz: (id) =>
    set((state) => ({ quizzes: state.quizzes.filter((q) => q.id !== id) })),

  // Sessions
  addSession: (s) =>
    set((state) => ({ sessions: [...state.sessions, { ...s, id: uid() }] })),
  addSessions: (newSessions) =>
    set((state) => ({
      sessions: [
        ...state.sessions,
        ...newSessions.map((s) => ({ ...s, id: uid() })),
      ],
    })),

  // Blocked Slots (Lịch bận)
  toggleBlockedSlot: (day, hour) =>
    set((state) => {
      const exists = state.blockedSlots.some(
        (s) => s.day === day && s.hour === hour,
      );
      return {
        blockedSlots: exists
          ? state.blockedSlots.filter(
              (s) => !(s.day === day && s.hour === hour),
            )
          : [...state.blockedSlots, { day, hour }],
      };
    }),
  setBlockedSlots: (slots) => set({ blockedSlots: slots }),

  // Violations & Admin Notifications
  addViolation: (v) =>
    set((state) => {
      const newId = uid();
      const newViolation = { ...v, id: newId };
      const newNotification = {
        id: uid(),
        title: `${v.type.charAt(0).toUpperCase() + v.type.slice(1)} detected`,
        body: `${v.userName} posted flagged content: "${v.contentTitle.slice(0, 40)}"`,
        time: "Just now",
        unread: true,
        violationId: newId,
      };
      return {
        violations: [...state.violations, newViolation],
        adminNotifications: [newNotification, ...state.adminNotifications],
      };
    }),
  resolveViolation: (id) =>
    set((state) => ({
      violations: state.violations.map((v) =>
        v.id === id ? { ...v, resolved: true } : v,
      ),
    })),
  markAdminNotificationRead: (id) =>
    set((state) => ({
      adminNotifications: state.adminNotifications.map((n) =>
        n.id === id ? { ...n, unread: false } : n,
      ),
    })),

  // Tasks
  addTask: (t) =>
    set((state) => ({ tasks: [...state.tasks, { ...t, id: uid() }] })),
  toggleTask: (id) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id ? { ...t, completed: !t.completed } : t,
      ),
    })),
  deleteTask: (id) =>
    set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) })),
}));
