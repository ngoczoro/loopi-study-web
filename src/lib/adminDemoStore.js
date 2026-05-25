import { create } from "zustand";
import { getUsers, saveUsers } from "./auth-utils";

const uid = () => Math.random().toString(36).slice(2, 10);

/** Demo documents for admin content moderation UI only — not used in student flows. */
const DEMO_DOCUMENTS = [
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
];

const INITIAL_VIOLATIONS = [
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
];

const INITIAL_ADMIN_NOTIFICATIONS = [
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
];

/**
 * Admin / moderation demo state — isolated from student useAppStore.
 * Replace with server-backed admin APIs when available.
 */
export const useAdminDemoStore = create((set) => ({
  users: getUsers(),
  documents: DEMO_DOCUMENTS,
  violations: INITIAL_VIOLATIONS,
  adminNotifications: INITIAL_ADMIN_NOTIFICATIONS,

  toggleLockUser: (id) =>
    set((state) => {
      const updated = state.users.map((u) =>
        u.id === id ? { ...u, locked: !u.locked } : u,
      );
      saveUsers(updated);
      return { users: updated };
    }),

  deleteDocument: (id) =>
    set((state) => ({
      documents: state.documents.filter((d) => d.id !== id),
    })),

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
}));
