import { getAuthUser } from "@/lib/authSession";
import { MockApiError, requireText } from "./mockUtils";

const DAY_MS = 24 * 60 * 60 * 1000;
const REMIND_COOLDOWN_MS = DAY_MS;
const INVITE_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const TASK_STATUSES = ["todo", "doing", "done"];
const RESOURCE_TYPES = ["link", "note", "file"];
const NOTE_EXCERPT_MAX = 5000;

const GROUP_CAPSTONE = "mock-group-capstone";
const GROUP_DSA = "mock-group-dsa";
const GROUP_ENGLISH = "mock-group-english";

const PEERS = [
  {
    userId: "mock-user-quynh",
    fullName: "Đỗ Như Quỳnh",
    email: "quynh@example.com",
    avatarUrl: null,
  },
  {
    userId: "mock-user-minh",
    fullName: "Trần Minh",
    email: "minh@example.com",
    avatarUrl: null,
  },
];

let db = null;
let idCounter = 0;

const nextId = (prefix) => `mock-${prefix}-${++idCounter}`;
const daysFromNow = (days) => new Date(Date.now() + days * DAY_MS).toISOString();
const nowIso = () => new Date().toISOString();

function mockImageUrl(label, color) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="320"><rect width="100%" height="100%" fill="${color}"/><text x="50%" y="50%" fill="#fff" font-family="sans-serif" font-size="28" text-anchor="middle" dominant-baseline="middle">${label}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function mockFileUrl(text) {
  return `data:text/plain;charset=utf-8,${encodeURIComponent(text)}`;
}

function generateInviteCode() {
  const pick = () =>
    INVITE_CODE_ALPHABET[Math.floor(Math.random() * INVITE_CODE_ALPHABET.length)];
  const block = () => Array.from({ length: 4 }, pick).join("");
  return `${block()}-${block()}`;
}

function currentUser() {
  const user = getAuthUser();
  return {
    userId: user?.id ?? "mock-me",
    fullName: user?.fullName ?? "You",
    email: user?.email ?? "you@example.com",
    avatarUrl: user?.avatarUrl ?? null,
  };
}

function seed(me) {
  const [quynh, minh] = PEERS;

  const tasks = [
    {
      id: "mock-task-design",
      groupId: GROUP_CAPSTONE,
      goalId: "mock-goal-prototype",
      title: "Design group pages",
      description: "Wireframes for list, detail and chat",
      assigneeId: me.userId,
      status: "done",
      dueAt: daysFromNow(-6),
      dependsOnTaskId: null,
      completedAt: daysFromNow(-7),
      createdBy: me.userId,
      createdAt: daysFromNow(-15),
      lastRemindedAt: null,
    },
    {
      id: "mock-task-contract",
      groupId: GROUP_CAPSTONE,
      goalId: "mock-goal-prototype",
      title: "Write API contract",
      description: "Agree on endpoints before building the backend",
      assigneeId: quynh.userId,
      status: "doing",
      dueAt: daysFromNow(-2),
      dependsOnTaskId: null,
      completedAt: null,
      createdBy: me.userId,
      createdAt: daysFromNow(-12),
      lastRemindedAt: null,
    },
    {
      id: "mock-task-chat-ui",
      groupId: GROUP_CAPSTONE,
      goalId: "mock-goal-prototype",
      title: "Implement chat UI",
      description: "",
      assigneeId: me.userId,
      status: "todo",
      dueAt: daysFromNow(5),
      dependsOnTaskId: "mock-task-contract",
      completedAt: null,
      createdBy: me.userId,
      createdAt: daysFromNow(-10),
      lastRemindedAt: null,
    },
    {
      id: "mock-task-demo-data",
      groupId: GROUP_CAPSTONE,
      goalId: null,
      title: "Prepare demo data",
      description: "",
      assigneeId: minh.userId,
      status: "todo",
      dueAt: daysFromNow(1),
      dependsOnTaskId: null,
      completedAt: null,
      createdBy: me.userId,
      createdAt: daysFromNow(-3),
      lastRemindedAt: null,
    },
    {
      id: "mock-task-sorting",
      groupId: GROUP_DSA,
      goalId: "mock-goal-problems",
      title: "Review sorting algorithms",
      description: "",
      assigneeId: me.userId,
      status: "todo",
      dueAt: daysFromNow(3),
      dependsOnTaskId: null,
      completedAt: null,
      createdBy: quynh.userId,
      createdAt: daysFromNow(-4),
      lastRemindedAt: null,
    },
  ];

  return {
    meId: me.userId,
    users: new Map([me, ...PEERS].map((user) => [user.userId, user])),
    groups: [
      {
        id: GROUP_CAPSTONE,
        name: "Capstone Project Team",
        description: "Weekly sync for the DA2 project",
        inviteCode: "CAPS-7KQ9",
        ownerId: me.userId,
        createdAt: daysFromNow(-20),
        updatedAt: daysFromNow(-1),
      },
      {
        id: GROUP_DSA,
        name: "Data Structures Study Group",
        description: "Practice problems together before the midterm",
        inviteCode: "DSAG-4XP2",
        ownerId: quynh.userId,
        createdAt: daysFromNow(-12),
        updatedAt: daysFromNow(-2),
      },
      {
        id: GROUP_ENGLISH,
        name: "English Speaking Club",
        description: "Speaking practice every Friday",
        inviteCode: "ENGL-2M8D",
        ownerId: minh.userId,
        createdAt: daysFromNow(-5),
        updatedAt: daysFromNow(-5),
      },
    ],
    members: [
      {
        groupId: GROUP_CAPSTONE,
        userId: me.userId,
        role: "owner",
        joinedAt: daysFromNow(-20),
        lastReadAt: daysFromNow(-0.7),
        pinned: true,
      },
      { groupId: GROUP_CAPSTONE, userId: quynh.userId, role: "member", joinedAt: daysFromNow(-19) },
      { groupId: GROUP_CAPSTONE, userId: minh.userId, role: "member", joinedAt: daysFromNow(-18) },
      { groupId: GROUP_DSA, userId: quynh.userId, role: "owner", joinedAt: daysFromNow(-12) },
      {
        groupId: GROUP_DSA,
        userId: me.userId,
        role: "member",
        joinedAt: daysFromNow(-10),
        lastReadAt: daysFromNow(-5),
      },
      { groupId: GROUP_ENGLISH, userId: minh.userId, role: "owner", joinedAt: daysFromNow(-5) },
      { groupId: GROUP_ENGLISH, userId: quynh.userId, role: "member", joinedAt: daysFromNow(-4) },
    ],
    resources: [
      {
        id: "mock-resource-requirements",
        groupId: GROUP_CAPSTONE,
        type: "link",
        title: "Project requirements",
        description: "Official DA2 requirements from the lecturer",
        url: "https://docs.google.com/document/d/example",
        refId: null,
        ref: null,
        sharedById: me.userId,
        createdAt: daysFromNow(-18),
      },
      {
        id: "mock-resource-sprint-notes",
        groupId: GROUP_CAPSTONE,
        type: "note",
        title: "Sprint 1 meeting notes",
        description: null,
        url: null,
        refId: "mock-content-sprint-notes",
        ref: {
          contentId: "mock-content-sprint-notes",
          title: "Sprint 1 meeting notes",
          excerpt:
            "Decisions\n- Only the AI module becomes a microservice (FastAPI).\n- Groups + chat FE first, with mocks.\n\nAction items\n- Quỳnh: API contract review\n- Minh: demo data\n- Everyone: update tasks before Friday",
          fileUrl: null,
          fileName: null,
          mimeType: null,
          fileSize: null,
        },
        sharedById: minh.userId,
        createdAt: daysFromNow(-4),
      },
      {
        id: "mock-resource-erd",
        groupId: GROUP_CAPSTONE,
        type: "file",
        title: "Database ERD",
        description: "Draft schema for groups, tasks and chat",
        url: null,
        refId: "mock-content-erd",
        ref: {
          contentId: "mock-content-erd",
          title: "Database ERD",
          excerpt: null,
          fileUrl: mockImageUrl("ERD draft", "#14b8a6"),
          fileName: "groups-erd.png",
          mimeType: "image/png",
          fileSize: 312_000,
        },
        sharedById: quynh.userId,
        createdAt: daysFromNow(-2.5),
      },
      {
        id: "mock-resource-bigo",
        groupId: GROUP_DSA,
        type: "link",
        title: "Big-O cheat sheet",
        description: null,
        url: "https://www.bigocheatsheet.com/",
        refId: null,
        ref: null,
        sharedById: quynh.userId,
        createdAt: daysFromNow(-9),
      },
    ],
    goals: [
      {
        id: "mock-goal-prototype",
        groupId: GROUP_CAPSTONE,
        title: "Finish UI prototype",
        description: "All group screens clickable with mock data",
        unit: "tasks",
        targetValue: 10,
        currentValue: 3,
        startDate: daysFromNow(-20),
        endDate: daysFromNow(10),
        createdBy: me.userId,
        createdAt: daysFromNow(-20),
      },
      {
        id: "mock-goal-problems",
        groupId: GROUP_DSA,
        title: "Solve 40 practice problems",
        description: "",
        unit: "tasks",
        targetValue: 0,
        currentValue: 0,
        startDate: daysFromNow(-10),
        endDate: daysFromNow(10),
        createdBy: quynh.userId,
        createdAt: daysFromNow(-10),
      },
    ],
    tasks,
    messages: [
      {
        id: "mock-message-1",
        groupId: GROUP_CAPSTONE,
        senderId: quynh.userId,
        content: "Hi team, I pushed the first draft of the API contract.",
        attachments: [
          {
            id: "mock-attachment-contract",
            kind: "file",
            name: "api-contract-groups.md",
            mimeType: "text/markdown",
            size: 14_336,
            url: mockFileUrl("# API contract — Study Groups & Chat (mock file)"),
          },
        ],
        createdAt: daysFromNow(-2),
      },
      {
        id: "mock-message-2",
        groupId: GROUP_CAPSTONE,
        senderId: me.userId,
        content: "Thanks! I'll review it tonight. Requirements doc: https://docs.google.com/document/d/example",
        attachments: [],
        createdAt: daysFromNow(-1.9),
      },
      {
        id: "mock-message-3",
        groupId: GROUP_CAPSTONE,
        senderId: quynh.userId,
        content: "Wireframes for the group pages 👇",
        attachments: [
          {
            id: "mock-attachment-wire-1",
            kind: "image",
            name: "group-list.svg",
            mimeType: "image/svg+xml",
            size: 48_000,
            url: mockImageUrl("Group list", "#6366f1"),
          },
          {
            id: "mock-attachment-wire-2",
            kind: "image",
            name: "group-chat.svg",
            mimeType: "image/svg+xml",
            size: 51_200,
            url: mockImageUrl("Group chat", "#0ea5e9"),
          },
        ],
        createdAt: daysFromNow(-0.8),
      },
      {
        id: "mock-message-4",
        groupId: GROUP_CAPSTONE,
        senderId: quynh.userId,
        content: "Figma link: https://www.figma.com/file/example",
        attachments: [],
        createdAt: daysFromNow(-0.79),
      },
      {
        id: "mock-message-5",
        groupId: GROUP_CAPSTONE,
        senderId: minh.userId,
        content: "Demo data will be ready tomorrow.",
        attachments: [],
        createdAt: daysFromNow(-0.5),
      },
      {
        id: "mock-message-6",
        groupId: GROUP_DSA,
        senderId: quynh.userId,
        content: "Big-O cheat sheet for tonight: https://www.bigocheatsheet.com/",
        attachments: [],
        createdAt: daysFromNow(-4),
      },
      {
        id: "mock-message-7",
        groupId: GROUP_DSA,
        senderId: quynh.userId,
        content: "Let's meet Thursday to go through graph problems.",
        attachments: [],
        createdAt: daysFromNow(-1),
      },
      {
        id: "mock-message-8",
        groupId: GROUP_ENGLISH,
        senderId: minh.userId,
        content: "Topic for Friday: describe your favourite place.",
        attachments: [],
        createdAt: daysFromNow(-2),
      },
    ],
  };
}

/** Shared by chat.mock.js. Reseeds when a different account logs in. */
export function getMockContext() {
  const me = currentUser();
  if (!db || db.meId !== me.userId) {
    db = seed(me);
  }
  return { d: db, me };
}

export function mockUserSummary(d, userId) {
  const user = d.users.get(userId);
  return user
    ? { userId: user.userId, fullName: user.fullName, avatarUrl: user.avatarUrl }
    : null;
}

function findGroup(d, groupId) {
  const group = d.groups.find((item) => item.id === groupId);
  if (!group) throw new MockApiError(404, "Group not found");
  return group;
}

function findMembership(d, groupId, userId) {
  return d.members.find((m) => m.groupId === groupId && m.userId === userId) ?? null;
}

export function assertMockMember(d, groupId, userId) {
  findGroup(d, groupId);
  const membership = findMembership(d, groupId, userId);
  if (!membership) {
    throw new MockApiError(403, "You are not a member of this group");
  }
  return membership;
}

function assertOwner(d, groupId, userId) {
  const membership = assertMockMember(d, groupId, userId);
  if (membership.role !== "owner") {
    throw new MockApiError(403, "Only the group owner can do this");
  }
  return membership;
}

function optionalText(value, field, maxLength) {
  if (value === undefined || value === null || value === "") return "";
  return requireText(value, field, maxLength);
}

function toTaskView(d, task, now) {
  const dependsOn = task.dependsOnTaskId
    ? d.tasks.find((item) => item.id === task.dependsOnTaskId)
    : null;
  const isBlocked = Boolean(
    task.status !== "done" &&
      dependsOn &&
      dependsOn.status !== "done" &&
      dependsOn.dueAt &&
      new Date(dependsOn.dueAt).getTime() < now,
  );

  return {
    id: task.id,
    groupId: task.groupId,
    goalId: task.goalId,
    title: task.title,
    description: task.description,
    assignee: task.assigneeId ? mockUserSummary(d, task.assigneeId) : null,
    status: task.status,
    effectiveStatus: isBlocked ? "blocked" : task.status,
    dueAt: task.dueAt,
    dependsOnTaskId: task.dependsOnTaskId,
    isOverdue:
      task.status !== "done" &&
      Boolean(task.dueAt) &&
      new Date(task.dueAt).getTime() < now,
    isBlocked,
    blockedBy: isBlocked ? { id: dependsOn.id, title: dependsOn.title } : null,
    completedAt: task.completedAt,
    createdBy: mockUserSummary(d, task.createdBy),
    createdAt: task.createdAt,
    lastRemindedAt: task.lastRemindedAt,
  };
}

function toGoalView(d, goal, now) {
  const linkedTasks = d.tasks.filter(
    (task) => task.groupId === goal.groupId && task.goalId === goal.id,
  );
  const targetValue = linkedTasks.length;
  const currentValue = linkedTasks.filter((task) => task.status === "done").length;
  const percentComplete =
    targetValue > 0
      ? Math.min(100, Math.round((currentValue / targetValue) * 100))
      : 0;
  const start = new Date(goal.startDate).getTime();
  const end = new Date(goal.endDate).getTime();
  const timeElapsedPercent =
    end > start
      ? Math.min(100, Math.max(0, Math.round(((now - start) / (end - start)) * 100)))
      : 100;

  return {
    ...goal,
    targetValue,
    currentValue,
    createdBy: mockUserSummary(d, goal.createdBy),
    percentComplete,
    timeElapsedPercent,
    isBehind: percentComplete < 100 && percentComplete < timeElapsedPercent,
  };
}

function buildProgress(d, groupId) {
  const now = Date.now();
  const goals = d.goals
    .filter((goal) => goal.groupId === groupId)
    .map((goal) => toGoalView(d, goal, now));
  const tasks = d.tasks
    .filter((task) => task.groupId === groupId)
    .map((task) => toTaskView(d, task, now));
  const overdue = tasks.filter((task) => task.isOverdue).length;

  return {
    groupId,
    goals: goals.map(({ id, title, percentComplete, timeElapsedPercent, isBehind }) => ({
      id,
      title,
      percentComplete,
      timeElapsedPercent,
      isBehind,
    })),
    tasks: {
      total: tasks.length,
      done: tasks.filter((task) => task.status === "done").length,
      overdue,
      blocked: tasks.filter((task) => task.isBlocked).length,
    },
    members: d.members
      .filter((m) => m.groupId === groupId)
      .map((m) => {
        const assigned = tasks.filter((task) => task.assignee?.userId === m.userId);
        return {
          ...mockUserSummary(d, m.userId),
          assigned: assigned.length,
          done: assigned.filter((task) => task.status === "done").length,
          overdue: assigned.filter((task) => task.isOverdue).length,
        };
      }),
    isBehind: goals.some((goal) => goal.isBehind) || overdue > 0,
  };
}

/** Messages the member can still see (respects their "clear history"), old → new. */
export function visibleMessages(d, groupId, membership) {
  const clearedAt = membership?.clearedAt ?? "";
  return d.messages
    .filter((message) => message.groupId === groupId && message.createdAt > clearedAt)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

function lastActivityAt(d, group) {
  const lastMessageAt = d.messages
    .filter((message) => message.groupId === group.id)
    .reduce((latest, message) => (message.createdAt > latest ? message.createdAt : latest), "");
  return lastMessageAt > group.updatedAt ? lastMessageAt : group.updatedAt;
}

function toGroupView(d, group, meId) {
  const membership = findMembership(d, group.id, meId);
  const messages = visibleMessages(d, group.id, membership);
  const last = messages[messages.length - 1] ?? null;
  const readAt = membership?.lastReadAt ?? membership?.joinedAt ?? "";
  const progress = buildProgress(d, group.id);
  const goalPercent = progress.goals.length
    ? Math.round(
        progress.goals.reduce((sum, goal) => sum + goal.percentComplete, 0) /
          progress.goals.length,
      )
    : null;

  return {
    id: group.id,
    name: group.name,
    description: group.description,
    avatarUrl: group.avatarUrl ?? null,
    inviteCode: group.inviteCode,
    owner: mockUserSummary(d, group.ownerId),
    myRole: membership?.role ?? null,
    memberCount: d.members.filter((m) => m.groupId === group.id).length,
    progress: {
      goalPercent,
      overdueTaskCount: progress.tasks.overdue,
      blockedTaskCount: progress.tasks.blocked,
      isBehind: progress.isBehind,
    },
    lastMessage: last
      ? {
          id: last.id,
          content: last.content,
          attachmentCount: last.attachments?.length ?? 0,
          sender: mockUserSummary(d, last.senderId),
          createdAt: last.createdAt,
        }
      : null,
    unreadCount: membership
      ? messages.filter((m) => m.senderId !== meId && m.createdAt > readAt).length
      : 0,
    isPinned: Boolean(membership?.pinned),
    isMuted: Boolean(membership?.muted),
    createdAt: group.createdAt,
    updatedAt: group.updatedAt,
  };
}

function toResourceView(d, resource) {
  const { sharedById, ...rest } = resource;
  return { ...rest, sharedBy: mockUserSummary(d, sharedById) };
}

function findTask(d, groupId, taskId) {
  const task = d.tasks.find((item) => item.id === taskId && item.groupId === groupId);
  if (!task) throw new MockApiError(404, "Task not found");
  return task;
}

function findGoal(d, groupId, goalId) {
  const goal = d.goals.find((item) => item.id === goalId && item.groupId === groupId);
  if (!goal) throw new MockApiError(404, "Goal not found");
  return goal;
}

function validateTaskRefs(d, groupId, taskId, input) {
  const existingTask = taskId ? findTask(d, groupId, taskId) : null;
  if (input.assigneeId && !findMembership(d, groupId, input.assigneeId)) {
    throw new MockApiError(400, "Assignee must be a group member");
  }
  if (input.dependsOnTaskId) {
    if (input.dependsOnTaskId === taskId) {
      throw new MockApiError(400, "A task cannot depend on itself");
    }
    findTask(d, groupId, input.dependsOnTaskId);
    let cursorId = input.dependsOnTaskId;
    const visited = new Set();
    while (cursorId) {
      if (cursorId === taskId) {
        throw new MockApiError(400, "Task dependency would create a cycle");
      }
      if (visited.has(cursorId)) break;
      visited.add(cursorId);
      cursorId =
        d.tasks.find((item) => item.id === cursorId && item.groupId === groupId)
          ?.dependsOnTaskId ?? null;
    }
  }
  const effectiveGoalId =
    input.goalId !== undefined ? input.goalId || null : existingTask?.goalId ?? null;
  const effectiveDueAt =
    input.dueAt !== undefined ? input.dueAt || null : existingTask?.dueAt ?? null;
  if (effectiveGoalId) {
    const goal = findGoal(d, groupId, effectiveGoalId);
    if (
      effectiveDueAt &&
      (new Date(effectiveDueAt) < new Date(goal.startDate) ||
        new Date(effectiveDueAt) > new Date(goal.endDate))
    ) {
      throw new MockApiError(
        400,
        "Task deadline must be within the related goal date range",
      );
    }
  }
}

// ---------- Groups ----------

export function listGroups() {
  const { d, me } = getMockContext();
  const myMemberships = new Map(
    d.members.filter((m) => m.userId === me.userId).map((m) => [m.groupId, m]),
  );
  const isPinned = (group) => Boolean(myMemberships.get(group.id)?.pinned);
  return d.groups
    .filter((group) => myMemberships.has(group.id))
    .sort(
      (a, b) =>
        Number(isPinned(b)) - Number(isPinned(a)) ||
        lastActivityAt(d, b).localeCompare(lastActivityAt(d, a)),
    )
    .map((group) => toGroupView(d, group, me.userId));
}

export function updateMyGroupSettings(groupId, input = {}) {
  const { d, me } = getMockContext();
  const membership = assertMockMember(d, groupId, me.userId);
  if (input.pinned !== undefined) membership.pinned = Boolean(input.pinned);
  if (input.muted !== undefined) membership.muted = Boolean(input.muted);
  return toGroupView(d, findGroup(d, groupId), me.userId);
}

export function getGroup(groupId) {
  const { d, me } = getMockContext();
  assertMockMember(d, groupId, me.userId);
  return toGroupView(d, findGroup(d, groupId), me.userId);
}

export function createGroup(input = {}) {
  const { d, me } = getMockContext();
  const timestamp = nowIso();
  const group = {
    id: nextId("group"),
    name: requireText(input.name, "Group name", 100),
    description: optionalText(input.description, "Description", 500),
    avatarUrl: null,
    inviteCode: generateInviteCode(),
    ownerId: me.userId,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  d.groups.push(group);
  d.members.push({
    groupId: group.id,
    userId: me.userId,
    role: "owner",
    joinedAt: timestamp,
    lastReadAt: timestamp,
  });
  return toGroupView(d, group, me.userId);
}

export function updateGroup(groupId, input = {}) {
  const { d, me } = getMockContext();
  assertOwner(d, groupId, me.userId);
  const group = findGroup(d, groupId);
  if (input.name !== undefined) group.name = requireText(input.name, "Group name", 100);
  if (input.description !== undefined) {
    group.description = optionalText(input.description, "Description", 500);
  }
  if (input.removeAvatar) group.avatarUrl = null;
  else if (input.avatarPreview) group.avatarUrl = input.avatarPreview;
  group.updatedAt = nowIso();
  return toGroupView(d, group, me.userId);
}

export function deleteGroup(groupId) {
  const { d, me } = getMockContext();
  assertOwner(d, groupId, me.userId);
  const keep = (item) => item.groupId !== groupId;
  d.groups = d.groups.filter((group) => group.id !== groupId);
  d.members = d.members.filter(keep);
  d.resources = d.resources.filter(keep);
  d.goals = d.goals.filter(keep);
  d.tasks = d.tasks.filter(keep);
  d.messages = d.messages.filter(keep);
  return null;
}

export function joinGroup(input = {}) {
  const { d, me } = getMockContext();
  const code = requireText(input.inviteCode, "Invite code", 20).toUpperCase();
  const group = d.groups.find((item) => item.inviteCode.toUpperCase() === code);
  if (!group) throw new MockApiError(404, "Invalid invite code");
  if (findMembership(d, group.id, me.userId)) {
    throw new MockApiError(409, "You are already a member of this group");
  }
  const joinedAt = nowIso();
  d.members.push({
    groupId: group.id,
    userId: me.userId,
    role: "member",
    joinedAt,
    lastReadAt: joinedAt,
  });
  return toGroupView(d, group, me.userId);
}

export function leaveGroup(groupId) {
  const { d, me } = getMockContext();
  const membership = assertMockMember(d, groupId, me.userId);
  if (membership.role === "owner") {
    throw new MockApiError(409, "Group owner cannot leave. Delete the group instead.");
  }
  d.members = d.members.filter((m) => m !== membership);
  d.tasks.forEach((task) => {
    if (task.groupId === groupId && task.assigneeId === me.userId) task.assigneeId = null;
  });
  return null;
}

export function regenerateInviteCode(groupId) {
  const { d, me } = getMockContext();
  assertOwner(d, groupId, me.userId);
  const group = findGroup(d, groupId);
  group.inviteCode = generateInviteCode();
  group.updatedAt = nowIso();
  return { inviteCode: group.inviteCode };
}

// ---------- Members ----------

export function listMembers(groupId) {
  const { d, me } = getMockContext();
  assertMockMember(d, groupId, me.userId);
  return d.members
    .filter((m) => m.groupId === groupId)
    .map((m) => ({
      ...mockUserSummary(d, m.userId),
      email: d.users.get(m.userId)?.email ?? null,
      role: m.role,
      joinedAt: m.joinedAt,
    }));
}

export function removeMember(groupId, userId) {
  const { d, me } = getMockContext();
  assertOwner(d, groupId, me.userId);
  if (userId === me.userId) {
    throw new MockApiError(400, "You cannot remove yourself");
  }
  const membership = findMembership(d, groupId, userId);
  if (!membership) throw new MockApiError(404, "Member not found");
  d.members = d.members.filter((m) => m !== membership);
  d.tasks.forEach((task) => {
    if (task.groupId === groupId && task.assigneeId === userId) task.assigneeId = null;
  });
  return null;
}

// ---------- Resources ----------

export function listResources(groupId) {
  const { d, me } = getMockContext();
  assertMockMember(d, groupId, me.userId);
  return d.resources
    .filter((resource) => resource.groupId === groupId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((resource) => toResourceView(d, resource));
}

/**
 * The real API snapshots the content item from `refId`. The mock cannot read
 * real content, so the caller passes the picked item as `refPreview`.
 */
function buildMockRef(type, refId, refPreview) {
  const item = refPreview ?? {};
  if (type === "note") {
    return {
      contentId: refId,
      title: item.title ?? "Untitled note",
      excerpt: String(item.content ?? "").slice(0, NOTE_EXCERPT_MAX),
      fileUrl: null,
      fileName: null,
      mimeType: null,
      fileSize: null,
    };
  }
  if (!item.fileUrl) throw new MockApiError(400, "This content item has no file");
  return {
    contentId: refId,
    title: item.title ?? item.fileName ?? "Untitled file",
    excerpt: null,
    fileUrl: item.fileUrl,
    fileName: item.fileName ?? null,
    mimeType: item.mimeType ?? null,
    fileSize: item.fileSize ?? null,
  };
}

export function createResource(groupId, input = {}) {
  const { d, me } = getMockContext();
  assertMockMember(d, groupId, me.userId);
  if (!RESOURCE_TYPES.includes(input.type)) {
    throw new MockApiError(400, "Resource type must be link, note or file");
  }
  const isLink = input.type === "link";
  const url = isLink ? requireText(input.url, "URL", 2000) : null;
  if (isLink && !/^https?:\/\//i.test(url)) {
    throw new MockApiError(400, "URL must start with http:// or https://");
  }
  const refId = isLink ? null : requireText(input.refId, "Reference", 100);
  const resource = {
    id: nextId("resource"),
    groupId,
    type: input.type,
    title: requireText(input.title, "Title", 200),
    description: optionalText(input.description, "Description", 500) || null,
    url,
    refId,
    ref: isLink ? null : buildMockRef(input.type, refId, input.refPreview),
    sharedById: me.userId,
    createdAt: nowIso(),
  };
  d.resources.push(resource);
  return toResourceView(d, resource);
}

export function deleteResource(groupId, resourceId) {
  const { d, me } = getMockContext();
  const membership = assertMockMember(d, groupId, me.userId);
  const resource = d.resources.find(
    (item) => item.id === resourceId && item.groupId === groupId,
  );
  if (!resource) throw new MockApiError(404, "Resource not found");
  if (membership.role !== "owner" && resource.sharedById !== me.userId) {
    throw new MockApiError(403, "You can only remove resources you shared");
  }
  d.resources = d.resources.filter((item) => item !== resource);
  return null;
}

// ---------- Goals ----------

function applyGoalInput(goal, input) {
  if (input.title !== undefined) goal.title = requireText(input.title, "Title", 200);
  if (input.description !== undefined) {
    goal.description = optionalText(input.description, "Description", 1000);
  }
  goal.unit = "tasks";
  goal.targetValue = 0;
  goal.currentValue = 0;
  if (input.startDate !== undefined) goal.startDate = input.startDate;
  if (input.endDate !== undefined) goal.endDate = input.endDate;

  if (!goal.startDate || !goal.endDate) {
    throw new MockApiError(400, "Start date and end date are required");
  }
  if (new Date(goal.endDate) <= new Date(goal.startDate)) {
    throw new MockApiError(400, "End date must be after start date");
  }
}

export function listGoals(groupId) {
  const { d, me } = getMockContext();
  assertMockMember(d, groupId, me.userId);
  const now = Date.now();
  return d.goals
    .filter((goal) => goal.groupId === groupId)
    .map((goal) => toGoalView(d, goal, now));
}

export function createGoal(groupId, input = {}) {
  const { d, me } = getMockContext();
  assertOwner(d, groupId, me.userId);
  const goal = {
    id: nextId("goal"),
    groupId,
    title: "",
    description: "",
    unit: "",
    targetValue: 0,
    currentValue: 0,
    startDate: null,
    endDate: null,
    createdBy: me.userId,
    createdAt: nowIso(),
  };
  applyGoalInput(goal, input);
  d.goals.push(goal);
  return toGoalView(d, goal, Date.now());
}

export function updateGoal(groupId, goalId, input = {}) {
  const { d, me } = getMockContext();
  assertOwner(d, groupId, me.userId);
  const goal = findGoal(d, groupId, goalId);
  const draft = { ...goal };
  applyGoalInput(draft, input);
  const outsideRange = d.tasks.find(
    (task) =>
      task.groupId === groupId &&
      task.goalId === goalId &&
      task.dueAt &&
      (new Date(task.dueAt) < new Date(draft.startDate) ||
        new Date(task.dueAt) > new Date(draft.endDate)),
  );
  if (outsideRange) {
    throw new MockApiError(
      400,
      `Goal dates do not include task deadline: ${outsideRange.title}`,
    );
  }
  Object.assign(goal, draft);
  return toGoalView(d, goal, Date.now());
}

export function deleteGoal(groupId, goalId) {
  const { d, me } = getMockContext();
  assertOwner(d, groupId, me.userId);
  const goal = findGoal(d, groupId, goalId);
  d.goals = d.goals.filter((item) => item !== goal);
  d.tasks.forEach((task) => {
    if (task.goalId === goalId) task.goalId = null;
  });
  return null;
}

// ---------- Tasks ----------

export function listTasks(groupId, filters = {}) {
  const { d, me } = getMockContext();
  assertMockMember(d, groupId, me.userId);
  const now = Date.now();
  return d.tasks
    .filter((task) => task.groupId === groupId)
    .filter((task) => !filters.status || task.status === filters.status)
    .filter((task) => !filters.assigneeId || task.assigneeId === filters.assigneeId)
    .map((task) => toTaskView(d, task, now));
}

export function createTask(groupId, input = {}) {
  const { d, me } = getMockContext();
  assertMockMember(d, groupId, me.userId);
  validateTaskRefs(d, groupId, null, input);
  const task = {
    id: nextId("task"),
    groupId,
    goalId: input.goalId ?? null,
    title: requireText(input.title, "Title", 200),
    description: optionalText(input.description, "Description", 2000),
    assigneeId: input.assigneeId ?? null,
    status: "todo",
    dueAt: input.dueAt ?? null,
    dependsOnTaskId: input.dependsOnTaskId ?? null,
    completedAt: null,
    createdBy: me.userId,
    createdAt: nowIso(),
    lastRemindedAt: null,
  };
  d.tasks.push(task);
  return toTaskView(d, task, Date.now());
}

export function updateTask(groupId, taskId, input = {}) {
  const { d, me } = getMockContext();
  const membership = assertMockMember(d, groupId, me.userId);
  const task = findTask(d, groupId, taskId);
  validateTaskRefs(d, groupId, taskId, input);
  const isOwner = membership.role === "owner";
  const isCreator = task.createdBy === me.userId;
  const isAssignee = task.assigneeId === me.userId;
  const contentFields = [
    "title",
    "description",
    "assigneeId",
    "dueAt",
    "dependsOnTaskId",
    "goalId",
  ];
  if (!isOwner && contentFields.some((field) => input[field] !== undefined) && !isCreator) {
    throw new MockApiError(403, "You can only edit tasks you created");
  }
  if (input.status !== undefined && !isOwner && !isAssignee) {
    throw new MockApiError(403, "Only the owner or assignee can change task status");
  }

  if (input.status !== undefined) {
    if (!TASK_STATUSES.includes(input.status)) {
      throw new MockApiError(400, "Status must be todo, doing or done");
    }
    task.completedAt = input.status === "done" ? task.completedAt ?? nowIso() : null;
    task.status = input.status;
  }
  if (input.title !== undefined) task.title = requireText(input.title, "Title", 200);
  if (input.description !== undefined) {
    task.description = optionalText(input.description, "Description", 2000);
  }
  if (input.assigneeId !== undefined) task.assigneeId = input.assigneeId || null;
  if (input.dueAt !== undefined) task.dueAt = input.dueAt || null;
  if (input.dependsOnTaskId !== undefined) task.dependsOnTaskId = input.dependsOnTaskId || null;
  if (input.goalId !== undefined) task.goalId = input.goalId || null;

  return toTaskView(d, task, Date.now());
}

export function deleteTask(groupId, taskId) {
  const { d, me } = getMockContext();
  const membership = assertMockMember(d, groupId, me.userId);
  const task = findTask(d, groupId, taskId);
  if (membership.role !== "owner" && task.createdBy !== me.userId) {
    throw new MockApiError(403, "You can only delete tasks you created");
  }
  d.tasks = d.tasks.filter((item) => item !== task);
  d.tasks.forEach((item) => {
    if (item.dependsOnTaskId === taskId) item.dependsOnTaskId = null;
  });
  return null;
}

export function remindTask(groupId, taskId) {
  const { d, me } = getMockContext();
  assertOwner(d, groupId, me.userId);
  const task = findTask(d, groupId, taskId);
  if (!task.assigneeId) throw new MockApiError(400, "Task has no assignee");
  if (task.status === "done") throw new MockApiError(400, "Task is already done");

  const now = Date.now();
  if (task.lastRemindedAt && now - new Date(task.lastRemindedAt).getTime() < REMIND_COOLDOWN_MS) {
    throw new MockApiError(429, "This task was already reminded in the last 24 hours");
  }
  task.lastRemindedAt = new Date(now).toISOString();
  return {
    remindedAt: task.lastRemindedAt,
    nextAllowedAt: new Date(now + REMIND_COOLDOWN_MS).toISOString(),
  };
}

// ---------- Progress ----------

export function getProgress(groupId) {
  const { d, me } = getMockContext();
  assertMockMember(d, groupId, me.userId);
  return buildProgress(d, groupId);
}
