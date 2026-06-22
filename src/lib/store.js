import { create } from "zustand";
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
import { getApiErrorMessage } from "./apiErrorUtils.js";
import {
  getTasks,
  getTaskSummary,
  createTask as createTaskAPI,
  updateTask as updateTaskAPI,
  toggleTaskComplete as toggleTaskCompleteAPI,
  deleteTask as deleteTaskAPI,
} from "../services/taskService";
import {
  getQuizzes,
  createQuiz as createQuizAPI,
  deleteQuiz as deleteQuizAPI,
  updateQuiz as updateQuizAPI,
} from "../services/quizService";

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

const uid = () => Math.random().toString(36).slice(2, 10);

export const useAppStore = create((set, get) => ({
  subjects: [],
  subjectsLoading: false,
  subjectsError: null,

  content: [],
  contentLoading: false,
  contentUploading: false,
  contentError: null,

  quizzes: [],
  quizzesLoading: false,
  quizzesError: null,

  tasks: [],
  tasksLoading: false,
  tasksError: null,
  tasksPagination: null,
  lastTaskQuery: {},
  taskSummary: null,
  taskSummaryLoading: false,
  taskSummaryError: null,

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
      return { content: next };
    });
  },

  setContentState: (items) => {
    const mapped = mapContentListForUI(Array.isArray(items) ? items : []);
    set({ content: mapped });
  },

  fetchContent: async () => {
    set({ contentLoading: true, contentError: null });
    try {
      const result = await getContent();
      if (result.ok) {
        get().setContentState(result.data);
        set({ contentLoading: false, contentError: null });
        return { ok: true, data: result.data };
      }
      set({ contentLoading: false, contentError: result.message });
      return { ok: false, message: result.message };
    } catch (error) {
      set({ contentLoading: false, contentError: getApiErrorMessage(error, "Failed to fetch content") });
      return { ok: false, message: getApiErrorMessage(error, "Failed to fetch content") };
    }
  },

  fetchContentBySubject: async (subjectId) => {
    set({ contentLoading: true, contentError: null });
    try {
      const result = await getContentBySubject(subjectId);
      if (result.ok) {
        const mapped = mapContentListForUI(result.data);
        set((state) => {
          const other = state.content.filter((item) => item.subjectId !== subjectId);
          const merged = [...mapped, ...other];
          return {
            content: merged,
            contentLoading: false,
            contentError: null,
          };
        });
        return { ok: true, data: result.data };
      }

      return get().fetchContent();
    } catch (error) {
      set({ contentLoading: false, contentError: getApiErrorMessage(error, "Failed to fetch subject content") });
      return { ok: false, message: getApiErrorMessage(error, "Failed to fetch subject content") };
    }
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
    try {
      const result = await uploadFileAPI(formData);
      if (result.ok) {
        const item = mapContentItemForUI(result.data);
        get().upsertContentInState(item);
        await get().fetchContent();
        set({ contentError: null });
        return { ok: true, data: item };
      }
      set({ contentError: result.message });
      return { ok: false, message: result.message };
    } catch (error) {
      const message = getApiErrorMessage(error, "Failed to upload file");
      set({ contentError: message });
      return { ok: false, message };
    } finally {
      set({ contentUploading: false });
    }
  },

  updateContentItem: async (id, payload, replacementFile = null) => {
    set({ contentError: null });
    if (replacementFile) {
      set({ contentUploading: true });
    }

    try {
      const result = await updateContentAPI(id, payload, replacementFile);
      if (result.ok) {
        const item = mapContentItemForUI(result.data);
        get().upsertContentInState(item);
        await get().fetchContent();
        return { ok: true, data: item };
      }
      set({ contentError: result.message });
      return { ok: false, message: result.message };
    } catch (error) {
      const message = getApiErrorMessage(error, "Failed to update content");
      set({ contentError: message });
      return { ok: false, message };
    } finally {
      if (replacementFile) {
        set({ contentUploading: false });
      }
    }
  },

  deleteContentItem: async (id) => {
    set({ contentError: null });
    const result = await deleteContentAPI(id);
    if (result.ok) {
      set((state) => {
        const next = state.content.filter((c) => c.id !== id);
        return { content: next };
      });
      await get().fetchContent();
      return { ok: true };
    }
    set({ contentError: result.message });
    return { ok: false, message: result.message };
  },

  // Quizzes
  fetchQuizzes: async (options = {}) => {
    set({ quizzesLoading: true, quizzesError: null });
    const result = await getQuizzes(options);

    if (result.success) {
      set({
        quizzes: result.data,
        quizzesLoading: false,
        quizzesError: null,
      });
      return { ok: true, data: result.data };
    }

    set({ quizzesLoading: false, quizzesError: result.message });
    return { ok: false, message: result.message };
  },

  upsertQuiz: (quiz) =>
    set((state) => {
      const normalized = { ...quiz, id: quiz.id || uid() };
      const exists = state.quizzes.some((item) => item.id === normalized.id);

      if (exists) {
        return {
          quizzes: state.quizzes.map((item) =>
            item.id === normalized.id ? { ...item, ...normalized } : item,
          ),
        };
      }

      return { quizzes: [normalized, ...state.quizzes] };
    }),

  addQuiz: (quiz) => {
    get().upsertQuiz(quiz);
  },

  createQuiz: async (payload) => {
    const result = await createQuizAPI(payload);

    if (result.success) {
      get().upsertQuiz(result.data);
      return { ok: true, data: result.data };
    }

    return { ok: false, message: result.message };
  },

  updateQuiz: async (id, title) => {
    const result = await updateQuizAPI(id, { title });

    if (result.success) {
      set((state) => ({
        quizzes: state.quizzes.map((quiz) =>
          quiz.id === id ? { ...quiz, ...result.data } : quiz,
        ),
      }));
      return { ok: true, data: result.data };
    }

    return { ok: false, message: result.message };
  },

  deleteQuiz: async (id) => {
    const result = await deleteQuizAPI(id);

    if (result.success) {
      set((state) => ({
        quizzes: state.quizzes.filter((quiz) => quiz.id !== id),
      }));
      return { ok: true };
    }

    return { ok: false, message: result.message };
  },

  // Tasks
  fetchTasks: async (params = {}) => {
    const query = { ...get().lastTaskQuery, ...params };
    set({ tasksLoading: true, tasksError: null, lastTaskQuery: query });

    try {
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
    } catch (error) {
      const message = getApiErrorMessage(error, "Failed to fetch tasks");
      set({ tasksLoading: false, tasksError: message });
      return { ok: false, message };
    }
  },

  fetchTaskSummary: async (params = {}) => {
    set({ taskSummaryLoading: true, taskSummaryError: null });
    try {
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
    } catch (error) {
      const message = getApiErrorMessage(error, "Failed to fetch task summary");
      set({ taskSummaryLoading: false, taskSummaryError: message });
      return { ok: false, message };
    }
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
      await get().refreshTasksAndSummary();
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
    await get().refreshTasksAndSummary();
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
      await get().refreshTasksAndSummary();
      return { ok: true, message: result.message };
    }

    set({ tasks: previousTasks, taskSummary: previousSummary });
    return { ok: false, message: result.message };
  },
}));
