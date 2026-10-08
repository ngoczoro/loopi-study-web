import { extractUrls, getHostname } from "@/lib/chatLinks";
import {
  assertMockMember,
  getMockContext,
  mockUserSummary,
  visibleMessages,
} from "./groups.mock";
import { MockApiError } from "./mockUtils";

const DEFAULT_LIMIT = 30;
const MAX_LIMIT = 100;
const MAX_CONTENT_LENGTH = 2000;
const MAX_FILES = 5;
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const SHARED_TYPES = ["media", "file", "link"];

let idCounter = 0;

function toMessageView(d, message) {
  return {
    id: message.id,
    groupId: message.groupId,
    sender: mockUserSummary(d, message.senderId),
    content: message.content,
    attachments: message.attachments ?? [],
    createdAt: message.createdAt,
  };
}

export function listMessages(groupId, { before, limit = DEFAULT_LIMIT } = {}) {
  const { d, me } = getMockContext();
  const membership = assertMockMember(d, groupId, me.userId);

  const pageSize = Math.min(Math.max(Number(limit) || DEFAULT_LIMIT, 1), MAX_LIMIT);
  const all = visibleMessages(d, groupId, membership);

  let end = all.length;
  if (before) {
    const index = all.findIndex((message) => message.id === before);
    if (index >= 0) end = index;
  }
  const start = Math.max(0, end - pageSize);

  return {
    items: all.slice(start, end).map((message) => toMessageView(d, message)),
    nextCursor: start > 0 ? all[start].id : null,
  };
}

/** `files` are browser File objects; the mock serves them through object URLs. */
export function sendMessage(groupId, { content = "", files = [] } = {}) {
  const { d, me } = getMockContext();
  const membership = assertMockMember(d, groupId, me.userId);

  const text = String(content ?? "").trim();
  if (!text && files.length === 0) {
    throw new MockApiError(400, "Message must have text or at least one file");
  }
  if (text.length > MAX_CONTENT_LENGTH) {
    throw new MockApiError(400, `Message must be at most ${MAX_CONTENT_LENGTH} characters`);
  }
  if (files.length > MAX_FILES) {
    throw new MockApiError(400, `You can attach at most ${MAX_FILES} files`);
  }
  const tooLarge = files.find((file) => file.size > MAX_FILE_BYTES);
  if (tooLarge) {
    throw new MockApiError(400, `"${tooLarge.name}" is larger than 5 MB`);
  }

  const message = {
    id: `mock-chat-${++idCounter}`,
    groupId,
    senderId: me.userId,
    content: text,
    attachments: files.map((file, index) => ({
      id: `mock-chat-${idCounter}-file-${index}`,
      kind: file.type?.startsWith("image/") ? "image" : "file",
      name: file.name,
      mimeType: file.type || "application/octet-stream",
      size: file.size,
      url: URL.createObjectURL(file),
    })),
    createdAt: new Date().toISOString(),
  };
  d.messages.push(message);
  membership.lastReadAt = message.createdAt;
  return toMessageView(d, message);
}

export function markRead(groupId) {
  const { d, me } = getMockContext();
  const membership = assertMockMember(d, groupId, me.userId);
  membership.lastReadAt = new Date().toISOString();
  return { lastReadAt: membership.lastReadAt };
}

export function clearHistory(groupId) {
  const { d, me } = getMockContext();
  const membership = assertMockMember(d, groupId, me.userId);
  membership.clearedAt = new Date().toISOString();
  membership.lastReadAt = membership.clearedAt;
  return { clearedAt: membership.clearedAt };
}

export function listShared(groupId, { type, limit = 20 } = {}) {
  const { d, me } = getMockContext();
  const membership = assertMockMember(d, groupId, me.userId);
  if (!SHARED_TYPES.includes(type)) {
    throw new MockApiError(400, "type must be media, file or link");
  }

  const items = [];
  for (const message of visibleMessages(d, groupId, membership).reverse()) {
    const sender = mockUserSummary(d, message.senderId);
    if (type === "link") {
      extractUrls(message.content).forEach((url, index) => {
        items.push({
          id: `${message.id}-link-${index}`,
          messageId: message.id,
          kind: "link",
          name: getHostname(url),
          mimeType: null,
          size: null,
          url,
          sender,
          createdAt: message.createdAt,
        });
      });
      continue;
    }
    const wantedKind = type === "media" ? "image" : "file";
    (message.attachments ?? [])
      .filter((attachment) => attachment.kind === wantedKind)
      .forEach((attachment) => {
        items.push({ ...attachment, messageId: message.id, sender, createdAt: message.createdAt });
      });
  }
  return items.slice(0, Math.max(1, Number(limit) || 20));
}
