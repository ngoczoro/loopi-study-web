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
import {
  getSubjects,
  getSubjectById,
  createSubject as createSubjectAPI,
  updateSubject as updateSubjectAPI,
  deleteSubject as deleteSubjectAPI,
} from "../services/subjectService";
import {
  getContent,
  getContentBySubject,
  createNote as createNoteAPI,
  createLink as createLinkAPI,
  uploadFile as uploadFileAPI,
  updateContent as updateContentAPI,
  deleteContent as deleteContentAPI,
} from "../services/contentService";
import {
  mapContentItemForUI,
  mapContentListForUI,
} from "./content-utils";
import {
  getTasks,
  getTaskSummary,
  createTask as createTaskAPI,
  updateTask as updateTaskAPI,
  toggleTaskComplete as toggleTaskCompleteAPI,
  deleteTask as deleteTaskAPI,
} from "../services/taskService";

/**
 * @typedef {Object} Subject
 * @property {string} id
 * @property {string} name
 * @property {number|null} credits
 * @property {"Easy"|"Medium"|"Hard"|null} difficulty
 * @property {string|null} examDate
 * @property {string|null} color
 * @property {number} progress
 * @property {"low"|"medium"|"high"|null} priority
 * @property {number|null} requiredHoursPerWeek
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
  subjects: [],
  subjectsLoading: false,
  subjectsError: null,

  content: [],
  documents: [],
  contentLoading: false,
  contentUploading: false,
  contentError: null,

  quizzes: [],

  tasks: [],
  tasksLoading: false,
  tasksError: null,
  tasksPagination: null,
  lastTaskQuery: {},
  taskSummary: null,
  taskSummaryLoading: false,
  taskSummaryError: null,

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
      resolved: false,
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
  fetchSubjects: async () => {
    set({ subjectsLoading: true, subjectsError: null });
    const result = await getSubjects();
    if (result.success) {
      set({ subjects: result.data, subjectsLoading: false, subjectsError: null });
      return { ok: true, data: result.data };
    }
    set({ subjectsLoading: false, subjectsError: result.message });
    return { ok: false, message: result.message };
  },

  fetchSubjectById: async (id) => {
    const result = await getSubjectById(id);
    if (result.success) {
      set((state) => ({
        subjects: state.subjects.some((s) => s.id === id)
          ? state.subjects.map((s) => (s.id === id ? result.data : s))
          : [...state.subjects, result.data],
      }));
      return { ok: true, data: result.data };
    }
    return { ok: false, message: result.message };
  },

  addSubject: async (payload) => {
    set({ subjectsLoading: true, subjectsError: null });
    const result = await createSubjectAPI(payload);
    if (result.success) {
      set((state) => ({
        subjects: [result.data, ...state.subjects],
        subjectsLoading: false,
        subjectsError: null,
      }));
      return { ok: true, data: result.data };
    }
    set({ subjectsLoading: false, subjectsError: result.message });
    return { ok: false, message: result.message };
  },

  updateSubject: async (id, updates) => {
    set({ subjectsLoading: true, subjectsError: null });
    const result = await updateSubjectAPI(id, updates);
    if (result.success) {
      set((state) => ({
        subjects: state.subjects.map((s) =>
          s.id === id ? result.data : s,
        ),
        subjectsLoading: false,
        subjectsError: null,
      }));
      return { ok: true, data: result.data };
    }
    set({ subjectsLoading: false, subjectsError: result.message });
    return { ok: false, message: result.message };
  },

  deleteSubject: async (id) => {
    set({ subjectsLoading: true, subjectsError: null });
    const result = await deleteSubjectAPI(id);
    if (result.success) {
      set((state) => ({
        subjects: state.subjects.filter((s) => s.id !== id),
        subjectsLoading: false,
        subjectsError: null,
      }));
      return { ok: true };
    }
    set({ subjectsLoading: false, subjectsError: result.message });
    return { ok: false, message: result.message };
  },

  // Content
  upsertContentInState: (item) => {
    if (!item?.id) return;

    set((state) => {
      const next = [
        item,
        ...state.content.filter((existing) => existing.id !== item.id),
      ];
      return { content: next, documents: next };
    });
  },

  setContentState: (items) => {
    const mapped = mapContentListForUI(Array.isArray(items) ? items : []);
    set({ content: mapped, documents: mapped });
  },

  fetchContent: async () => {
    set({ contentLoading: true, contentError: null });
    const result = await getContent();
    if (result.ok) {
      get().setContentState(result.data);
      set({ contentLoading: false, contentError: null });
      return { ok: true, data: result.data };
    }
    set({ contentLoading: false, contentError: result.message });
    return { ok: false, message: result.message };
  },

  fetchContentBySubject: async (subjectId) => {
    set({ contentLoading: true, contentError: null });
    const result = await getContentBySubject(subjectId);
    if (result.ok) {
      const mapped = mapContentListForUI(result.data);
      set((state) => {
        const other = state.content.filter((item) => item.subjectId !== subjectId);
        const merged = [...mapped, ...other];
        return {
          content: merged,
          documents: merged,
          contentLoading: false,
          contentError: null,
        };
      });
      return { ok: true, data: result.data };
    }

    return get().fetchContent();
  },

  createContentNote: async (payload) => {
    set({ contentError: null });
    const result = await createNoteAPI(payload);
    if (result.ok) {
      const item = mapContentItemForUI(result.data);
      get().upsertContentInState(item);
      await get().fetchContent();
      return { ok: true, data: item };
    }
    set({ contentError: result.message });
    return { ok: false, message: result.message };
  },

  createContentLink: async (payload) => {
    set({ contentError: null });
    const result = await createLinkAPI(payload);
    if (result.ok) {
      const item = mapContentItemForUI(result.data);
      get().upsertContentInState(item);
      await get().fetchContent();
      return { ok: true, data: item };
    }
    set({ contentError: result.message });
    return { ok: false, message: result.message };
  },

  uploadContentFile: async (formData) => {
    set({ contentUploading: true, contentError: null });
    const result = await uploadFileAPI(formData);
    if (result.ok) {
      const item = mapContentItemForUI(result.data);
      get().upsertContentInState(item);
      await get().fetchContent();
      set({ contentUploading: false, contentError: null });
      return { ok: true, data: item };
    }
    set({ contentUploading: false, contentError: result.message });
    return { ok: false, message: result.message };
  },

  updateContentItem: async (id, payload) => {
    set({ contentError: null });
    const result = await updateContentAPI(id, payload);
    if (result.ok) {
      const item = mapContentItemForUI(result.data);
      get().upsertContentInState(item);
      await get().fetchContent();
      return { ok: true, data: item };
    }
    set({ contentError: result.message });
    return { ok: false, message: result.message };
  },

  deleteContentItem: async (id) => {
    set({ contentError: null });
    const result = await deleteContentAPI(id);
    if (result.ok) {
      set((state) => {
        const next = state.content.filter((c) => c.id !== id);
        return { content: next, documents: next };
      });
      await get().fetchContent();
      return { ok: true };
    }
    set({ contentError: result.message });
    return { ok: false, message: result.message };
  },

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

  // Sessions (planner sync — API-backed sessions replace mock list when loaded)
  replaceSessions: (sessions) => set({ sessions }),
  addSession: (s) =>
    set((state) => ({ sessions: [...state.sessions, { ...s, id: uid() }] })),
  addSessions: (newSessions) =>
    set((state) => ({
      sessions: [
        ...state.sessions,
        ...newSessions.map((s) => ({ ...s, id: uid() })),
      ],
    })),
  updateSession: (id, updates) =>
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === id ? { ...s, ...updates } : s,
      ),
    })),
  deleteSession: (id) =>
    set((state) => ({
      sessions: state.sessions.filter((s) => s.id !== id),
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
  fetchTasks: async (params = {}) => {
    const query = { ...get().lastTaskQuery, ...params };
    set({ tasksLoading: true, tasksError: null, lastTaskQuery: query });

    const result = await getTasks(query);
    if (result.success) {
      set({
        tasks: result.data ?? [],
        tasksPagination: result.pagination,
        tasksLoading: false,
        tasksError: null,
      });
      return { ok: true, data: result.data, pagination: result.pagination };
    }

    set({
      tasksLoading: false,
      tasksError: result.message,
    });
    return { ok: false, message: result.message };
  },

  fetchTaskSummary: async (params = {}) => {
    set({ taskSummaryLoading: true, taskSummaryError: null });
    const result = await getTaskSummary(params);

    if (result.success) {
      set({
        taskSummary: result.data,
        taskSummaryLoading: false,
        taskSummaryError: null,
      });
      return { ok: true, data: result.data };
    }

    set({
      taskSummaryLoading: false,
      taskSummaryError: result.message,
    });
    return { ok: false, message: result.message };
  },

  refreshTasksAndSummary: async () => {
    const { lastTaskQuery } = get();
    await Promise.all([
      get().fetchTasks(lastTaskQuery),
      get().fetchTaskSummary(),
    ]);
  },

  createTask: async (payload) => {
    const result = await createTaskAPI(payload);
    if (result.success) {
      set((state) => {
        const withoutDuplicate = state.tasks.filter(
          (task) => task.id !== result.data.id,
        );
        return { tasks: [...withoutDuplicate, result.data] };
      });
      get().fetchTaskSummary();
      return { ok: true, data: result.data, message: result.message };
    }
    return { ok: false, message: result.message };
  },

  updateTask: async (id, payload) => {
    const previousTasks = get().tasks;

    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === id ? { ...task, ...payload } : task,
      ),
    }));

    const result = await updateTaskAPI(id, payload);
    if (result.success) {
      set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === id ? result.data : task,
        ),
      }));
      return { ok: true, data: result.data, message: result.message };
    }

    set({ tasks: previousTasks });
    return { ok: false, message: result.message };
  },

  toggleTaskComplete: async (id) => {
    const task = get().tasks.find((item) => item.id === id);
    if (!task) return { ok: false, message: "Task not found" };

    const completed = !task.completed;
    const previousTasks = get().tasks;
    const previousSummary = get().taskSummary;

    set((state) => ({
      tasks: state.tasks.map((item) =>
        item.id === id
          ? {
              ...item,
              completed,
              status: completed ? "completed" : "pending",
            }
          : item,
      ),
      taskSummary: previousSummary
        ? {
            ...previousSummary,
            pendingCount: completed
              ? Math.max(0, previousSummary.pendingCount - 1)
              : previousSummary.pendingCount + 1,
            completedCount: completed
              ? previousSummary.completedCount + 1
              : Math.max(0, previousSummary.completedCount - 1),
          }
        : null,
    }));

    const result = await toggleTaskCompleteAPI(id, completed);
    if (!result.success) {
      set({ tasks: previousTasks, taskSummary: previousSummary });
      return { ok: false, message: result.message };
    }

    set((state) => ({
      tasks: state.tasks.map((item) =>
        item.id === id ? result.data : item,
      ),
    }));
    await get().fetchTaskSummary();
    return { ok: true, data: result.data };
  },

  deleteTask: async (id) => {
    const previousTasks = get().tasks;
    const previousSummary = get().taskSummary;
    const removed = previousTasks.find((task) => task.id === id);

    set((state) => ({
      tasks: state.tasks.filter((task) => task.id !== id),
      taskSummary: previousSummary && removed
        ? {
            ...previousSummary,
            pendingCount: removed.completed
              ? previousSummary.pendingCount
              : Math.max(0, previousSummary.pendingCount - 1),
            completedCount: removed.completed
              ? Math.max(0, previousSummary.completedCount - 1)
              : previousSummary.completedCount,
          }
        : previousSummary,
    }));

    const result = await deleteTaskAPI(id);
    if (result.success) {
      get().fetchTaskSummary();
      return { ok: true, message: result.message };
    }

    set({ tasks: previousTasks, taskSummary: previousSummary });
    return { ok: false, message: result.message };
  },
}));
