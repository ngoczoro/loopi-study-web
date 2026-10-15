import { getAuthUser } from "@/lib/authSession";
import { MockApiError, requireText } from "./mockUtils";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const INDEXING_MS = 2500;
const TOP_K = 3;
const MAX_SCOPE_DOCUMENTS = 10;
const TITLE_FROM_QUESTION_MAX = 60;
const DEFAULT_TITLE = "New chat";
const NOT_FOUND_MESSAGE =
  "Mình không tìm thấy nội dung này trong tài liệu bạn đã chọn. Hãy thử hỏi cách khác, mở rộng phạm vi hoặc kiểm tra tài liệu đã được index chưa.";
const NO_SOURCES_MESSAGE =
  "Tài liệu trong phạm vi này đang được chuẩn bị để hỏi đáp. Bạn thử hỏi lại sau ít phút nhé.";

const STOPWORDS = new Set([
  "the", "and", "for", "what", "how", "why", "are", "is", "with", "does", "about", "that", "this",
  "la", "gi", "cua", "va", "cho", "trong", "nhu", "the", "nao", "khong", "co", "duoc", "mot",
  "nhung", "cac", "voi", "tai", "sao", "hay", "giai", "thich", "minh", "ban", "toi",
]);

const SUBJECTS = {
  oop: { id: "mock-subject-oop", name: "Object-Oriented Programming" },
  db: { id: "mock-subject-db", name: "Database Systems" },
  net: { id: "mock-subject-net", name: "Computer Networks" },
};

let db = null;
let idCounter = 0;

const nextId = (prefix) => `mock-${prefix}-${++idCounter}`;
const nowIso = () => new Date().toISOString();
const ago = (ms) => new Date(Date.now() - ms).toISOString();

function seedSources() {
  return [
    {
      id: "mock-doc-solid",
      title: "OOP summary — SOLID principles",
      type: "note",
      subject: SUBJECTS.oop,
      indexStatus: "indexed",
      updatedAt: ago(3 * DAY_MS),
      indexedAt: ago(3 * DAY_MS),
      chunks: [
        "Single Responsibility Principle: mỗi lớp chỉ nên có một lý do để thay đổi, tức là chỉ đảm nhận một trách nhiệm.",
        "Open/Closed Principle: lớp nên mở để mở rộng nhưng đóng để sửa đổi; thêm hành vi mới bằng kế thừa hoặc interface thay vì sửa code cũ.",
        "Liskov Substitution Principle: đối tượng của lớp con phải thay thế được lớp cha mà không làm sai chương trình.",
        "Interface Segregation Principle: không ép client phụ thuộc vào những method nó không dùng; nên tách interface lớn thành nhiều interface nhỏ.",
        "Dependency Inversion Principle: module cấp cao không phụ thuộc module cấp thấp, cả hai phụ thuộc vào abstraction (interface).",
      ],
    },
    {
      id: "mock-doc-oop-pillars",
      title: "Bốn tính chất của OOP",
      type: "file",
      subject: SUBJECTS.oop,
      indexStatus: "indexed",
      updatedAt: ago(6 * DAY_MS),
      indexedAt: ago(6 * DAY_MS),
      chunks: [
        "Encapsulation (đóng gói): ẩn dữ liệu bên trong đối tượng, chỉ cho truy cập qua method public như getter/setter.",
        "Inheritance (kế thừa): lớp con dùng lại thuộc tính và method của lớp cha, có thể override để thay đổi hành vi.",
        "Polymorphism (đa hình): cùng một lời gọi method nhưng hành vi khác nhau tùy đối tượng thực tế lúc chạy.",
        "Abstraction (trừu tượng): chỉ lộ ra những gì cần thiết, che giấu chi tiết cài đặt qua abstract class hoặc interface.",
      ],
      fileName: "oop-pillars.pdf",
    },
    {
      id: "mock-doc-sql-joins",
      title: "SQL joins cheat notes",
      type: "note",
      subject: SUBJECTS.db,
      indexStatus: "stale",
      updatedAt: ago(2 * HOUR_MS),
      indexedAt: ago(5 * DAY_MS),
      chunks: [
        "INNER JOIN chỉ giữ các dòng khớp điều kiện ở cả hai bảng.",
        "LEFT JOIN giữ mọi dòng của bảng bên trái; cột của bảng phải là NULL nếu không có dòng khớp.",
        "FULL OUTER JOIN giữ mọi dòng của cả hai bảng, bổ sung NULL ở phía không khớp.",
      ],
    },
    {
      id: "mock-doc-normalization",
      title: "Chuẩn hóa cơ sở dữ liệu (1NF–3NF)",
      type: "file",
      subject: SUBJECTS.db,
      indexStatus: "not_indexed",
      updatedAt: ago(DAY_MS),
      indexedAt: null,
      chunks: [
        "1NF: mỗi ô chỉ chứa một giá trị nguyên tử, không có nhóm lặp.",
        "2NF: đạt 1NF và mọi thuộc tính không khóa phụ thuộc đầy đủ vào toàn bộ khóa chính.",
        "3NF: đạt 2NF và không có phụ thuộc bắc cầu giữa các thuộc tính không khóa.",
      ],
      fileName: "normalization.docx",
    },
    {
      id: "mock-doc-tcp",
      title: "Computer networks — chapter 3: Transport layer",
      type: "file",
      subject: SUBJECTS.net,
      indexStatus: "indexed",
      updatedAt: ago(4 * DAY_MS),
      indexedAt: ago(4 * DAY_MS),
      chunks: [
        "TCP là giao thức hướng kết nối, đảm bảo tin cậy bằng bắt tay ba bước (SYN, SYN-ACK, ACK), đánh số thứ tự và gửi lại gói bị mất.",
        "UDP không hướng kết nối, không đảm bảo thứ tự hay gửi lại, nhưng độ trễ thấp nên hợp với video call, game, DNS.",
        "Điều khiển tắc nghẽn của TCP dùng slow start và congestion avoidance để điều chỉnh cửa sổ gửi.",
      ],
      fileName: "networks-chapter-3.pdf",
    },
    {
      id: "mock-doc-whiteboard",
      title: "Ảnh chụp bảng buổi 5",
      type: "file",
      subject: SUBJECTS.net,
      indexStatus: "unsupported",
      updatedAt: ago(8 * DAY_MS),
      indexedAt: null,
      chunks: [],
      fileName: "whiteboard.jpg",
    },
  ];
}

function seed(userId) {
  const sources = seedSources();
  const conversationId = "mock-conv-solid";
  const askedAt = ago(DAY_MS);
  const answeredAt = new Date(Date.parse(askedAt) + 4000).toISOString();
  const solid = sources[0];

  return {
    userId,
    sources,
    conversations: [
      {
        id: conversationId,
        title: "Nguyên lý SOLID là gì?",
        titleEdited: false,
        scope: { type: "subject", subjectId: SUBJECTS.oop.id },
        createdAt: askedAt,
        updatedAt: answeredAt,
      },
    ],
    messages: [
      {
        id: "mock-msg-solid-q",
        conversationId,
        role: "user",
        content: "Nguyên lý SOLID là gì?",
        answerStatus: null,
        citations: [],
        createdAt: askedAt,
      },
      {
        id: "mock-msg-solid-a",
        conversationId,
        role: "assistant",
        content:
          "Theo tài liệu của bạn, SOLID gồm 5 nguyên lý thiết kế hướng đối tượng:\n- **Single Responsibility**: mỗi lớp chỉ có một lý do để thay đổi [1].\n- **Open/Closed**: mở để mở rộng, đóng để sửa đổi [2].\n- **Dependency Inversion**: module cấp cao và cấp thấp cùng phụ thuộc vào abstraction [3].",
        answerStatus: "answered",
        citations: [0, 1, 4].map((chunkIndex, i) => toCitation(solid, chunkIndex, i + 1, 0.9 - i * 0.05)),
        createdAt: answeredAt,
      },
    ],
  };
}

function getStore() {
  const userId = getAuthUser()?.id ?? "mock-me";
  if (!db || db.userId !== userId) db = seed(userId);
  return db;
}

/** Mirrors the backend background worker: pending documents get indexed on their own. */
function settleIndexing(source) {
  if (["not_indexed", "stale", "failed"].includes(source.indexStatus)) {
    source.indexStatus = "indexing";
    source.indexStartedAt = Date.now();
  }
  if (source.indexStatus === "indexing" && Date.now() - source.indexStartedAt >= INDEXING_MS) {
    source.indexStatus = "indexed";
    source.indexedAt = nowIso();
  }
}

function toSourceView(source) {
  settleIndexing(source);
  return {
    id: source.id,
    title: source.title,
    type: source.type,
    subject: source.subject,
    indexStatus: source.indexStatus,
    chunkCount: ["indexed", "stale"].includes(source.indexStatus) ? source.chunks.length : 0,
    indexedAt: source.indexedAt,
    updatedAt: source.updatedAt,
  };
}

function toCitation(source, chunkIndex, index, score) {
  return {
    index,
    documentId: source.id,
    documentTitle: source.title,
    subjectName: source.subject?.name ?? null,
    chunkId: `${source.id}-chunk-${chunkIndex}`,
    excerpt: source.chunks[chunkIndex],
    location: `Đoạn ${chunkIndex + 1}`,
    score: Math.round(score * 100) / 100,
  };
}

function conversationMessages(d, conversationId) {
  return d.messages.filter((message) => message.conversationId === conversationId);
}

function toConversationView(d, conversation) {
  const messages = conversationMessages(d, conversation.id);
  return {
    id: conversation.id,
    title: conversation.title,
    scope: conversation.scope,
    messageCount: messages.length,
    lastMessageAt: messages[messages.length - 1]?.createdAt ?? null,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
  };
}

function findConversation(d, conversationId) {
  const conversation = d.conversations.find((item) => item.id === conversationId);
  if (!conversation) throw new MockApiError(404, "Conversation not found");
  return conversation;
}

function validateScope(d, scope) {
  if (!scope || typeof scope !== "object") return { type: "all" };
  if (scope.type === "all") return { type: "all" };
  if (scope.type === "subject") {
    const exists = d.sources.some((source) => source.subject?.id === scope.subjectId);
    if (!exists) throw new MockApiError(400, "Subject has no documents");
    return { type: "subject", subjectId: scope.subjectId };
  }
  if (scope.type === "documents") {
    const ids = [...new Set(scope.documentIds ?? [])];
    if (ids.length === 0) throw new MockApiError(400, "Choose at least one document");
    if (ids.length > MAX_SCOPE_DOCUMENTS) {
      throw new MockApiError(400, `Choose at most ${MAX_SCOPE_DOCUMENTS} documents`);
    }
    // Real Notes ids are unknown to this mock, so register them as not-yet-indexed sources.
    ids
      .filter((id) => !d.sources.some((source) => source.id === id))
      .forEach((id) =>
        d.sources.push({
          id,
          title: "Document from Notes",
          type: "note",
          subject: null,
          indexStatus: "not_indexed",
          updatedAt: nowIso(),
          indexedAt: null,
          chunks: [],
        }),
      );
    return { type: "documents", documentIds: ids };
  }
  throw new MockApiError(400, "Invalid scope");
}

function sourcesInScope(d, scope) {
  return d.sources.filter((source) => {
    if (scope.type === "subject") return source.subject?.id === scope.subjectId;
    if (scope.type === "documents") return scope.documentIds.includes(source.id);
    return true;
  });
}

function tokenize(text) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 3 && !STOPWORDS.has(token));
}

function retrieve(sources, question) {
  const queryTokens = new Set(tokenize(question));
  if (queryTokens.size === 0) return [];

  const hits = [];
  sources.forEach((source) => {
    const titleTokens = new Set(tokenize(source.title));
    let titleOverlap = 0;
    queryTokens.forEach((token) => {
      if (titleTokens.has(token)) titleOverlap += 0.5;
    });
    source.chunks.forEach((chunk, chunkIndex) => {
      const chunkTokens = new Set(tokenize(chunk));
      let overlap = titleOverlap;
      queryTokens.forEach((token) => {
        if (chunkTokens.has(token)) overlap += 1;
      });
      if (overlap > 0) {
        hits.push({ source, chunkIndex, score: Math.min(0.95, 0.45 + overlap / (queryTokens.size + 1)) });
      }
    });
  });
  return hits.sort((a, b) => b.score - a.score).slice(0, TOP_K);
}

function buildAnswer(hits) {
  const citations = hits.map((hit, i) => toCitation(hit.source, hit.chunkIndex, i + 1, hit.score));
  const lines = citations.map((citation) => `- ${citation.excerpt} [${citation.index}]`);
  return {
    content: `Dựa trên tài liệu của bạn:\n${lines.join("\n")}`,
    citations,
  };
}

// ---------- Sources ----------

export function listSources() {
  const d = getStore();
  return d.sources
    .map(toSourceView)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

// ---------- Conversations ----------

export function listConversations() {
  const d = getStore();
  return d.conversations
    .map((conversation) => toConversationView(d, conversation))
    .sort((a, b) =>
      (b.lastMessageAt ?? b.createdAt).localeCompare(a.lastMessageAt ?? a.createdAt),
    );
}

export function createConversation(input = {}) {
  const d = getStore();
  const timestamp = nowIso();
  const conversation = {
    id: nextId("conv"),
    title: input.title ? requireText(input.title, "Title", 100) : DEFAULT_TITLE,
    titleEdited: Boolean(input.title),
    scope: validateScope(d, input.scope),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  d.conversations.push(conversation);
  return toConversationView(d, conversation);
}

export function updateConversation(conversationId, input = {}) {
  const d = getStore();
  const conversation = findConversation(d, conversationId);
  if (input.title !== undefined) {
    conversation.title = requireText(input.title, "Title", 100);
    conversation.titleEdited = true;
  }
  if (input.scope !== undefined) conversation.scope = validateScope(d, input.scope);
  conversation.updatedAt = nowIso();
  return toConversationView(d, conversation);
}

export function deleteConversation(conversationId) {
  const d = getStore();
  findConversation(d, conversationId);
  d.conversations = d.conversations.filter((item) => item.id !== conversationId);
  d.messages = d.messages.filter((item) => item.conversationId !== conversationId);
  return null;
}

export function listMessages(conversationId) {
  const d = getStore();
  findConversation(d, conversationId);
  return conversationMessages(d, conversationId);
}

export function sendMessage(conversationId, input = {}) {
  const d = getStore();
  const conversation = findConversation(d, conversationId);
  const question = requireText(input.content, "Question", 2000);

  const userMessage = {
    id: nextId("msg"),
    conversationId,
    role: "user",
    content: question,
    answerStatus: null,
    citations: [],
    createdAt: nowIso(),
  };
  d.messages.push(userMessage);

  // A document being re-indexed still answers from its previous index.
  const searchable = sourcesInScope(d, conversation.scope).filter((source) => {
    settleIndexing(source);
    return source.indexStatus === "indexed" || Boolean(source.indexedAt);
  });
  const hits = searchable.length ? retrieve(searchable, question) : [];

  let reply;
  if (searchable.length === 0) {
    reply = { content: NO_SOURCES_MESSAGE, citations: [], answerStatus: "no_sources" };
  } else if (hits.length === 0) {
    reply = { content: NOT_FOUND_MESSAGE, citations: [], answerStatus: "not_found" };
  } else {
    reply = { ...buildAnswer(hits), answerStatus: "answered" };
  }

  const assistantMessage = {
    id: nextId("msg"),
    conversationId,
    role: "assistant",
    ...reply,
    createdAt: new Date(Date.now() + 1).toISOString(),
  };
  d.messages.push(assistantMessage);

  if (!conversation.titleEdited && conversation.title === DEFAULT_TITLE) {
    conversation.title = question.slice(0, TITLE_FROM_QUESTION_MAX);
  }
  conversation.updatedAt = assistantMessage.createdAt;

  return {
    userMessage,
    assistantMessage,
    conversation: toConversationView(d, conversation),
  };
}
