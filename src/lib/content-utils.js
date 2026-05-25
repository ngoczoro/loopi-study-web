export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export const ALLOWED_FILE_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-powerpoint",
  "text/plain",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
];

export const ALLOWED_FILE_EXTENSIONS = [
  "pdf",
  "doc",
  "docx",
  "ppt",
  "pptx",
  "xls",
  "xlsx",
  "txt",
  "png",
  "jpg",
  "jpeg",
  "webp",
  "gif",
];

export const FILE_INPUT_ACCEPT =
  ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.png,.jpg,.jpeg,.webp,.gif";

const URL_PATTERN =
  /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_+.~#?&/=]*)$/;

export const SUPPORTED_FILES_LABEL =
  "Supported files:\nPDF, DOC, DOCX,\nPPT, PPTX,\nXLS, XLSX,\nTXT,\nPNG, JPG, JPEG, WEBP, GIF";

export const normalizeSubjectId = (subjectId) => {
  if (!subjectId || subjectId === "null") return null;
  return subjectId;
};

export const isValidUrl = (url) => URL_PATTERN.test(String(url || "").trim());

const getExtension = (fileName) => {
  if (!fileName || !fileName.includes(".")) return "";
  return fileName.split(".").pop()?.toLowerCase() || "";
};

export const validateUploadFile = (file) => {
  if (!file) {
    return { ok: false, message: "Please select a file" };
  }

  const ext = getExtension(file.name);
  const mimeAllowed = ALLOWED_FILE_MIME_TYPES.includes(file.type);
  const extAllowed = ALLOWED_FILE_EXTENSIONS.includes(ext);

  if (!mimeAllowed && !extAllowed) {
    return {
      ok: false,
      message: SUPPORTED_FILES_LABEL,
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { ok: false, message: "File exceeds the 10MB size limit" };
  }

  return { ok: true };
};

export const mapContentItemForUI = (item) => {
  if (!item) return null;

  const created = item.createdAt ? new Date(item.createdAt) : new Date();

  return {
    ...item,
    subjectId: item.subjectId ?? null,
    date: created.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    createdAt: created.toLocaleString("en-US", {
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
};

export const mapContentListForUI = (items) => {
  if (!Array.isArray(items)) return [];
  return items.map(mapContentItemForUI).filter(Boolean);
};
