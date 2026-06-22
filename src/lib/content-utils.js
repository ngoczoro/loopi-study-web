export const MAX_FILE_SIZE = 5 * 1024 * 1024;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE;

export const FILE_SIZE_LIMIT_MESSAGE =
  "File exceeds 5MB and cannot be uploaded.";

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
  "Supported files:\nPDF, DOC, DOCX,\nPPT, PPTX,\nXLS, XLSX,\nTXT,\nPNG, JPG, JPEG, WEBP, GIF\nMax size: 5MB";

export const normalizeSubjectId = (subjectId) => {
  if (!subjectId || subjectId === "null") return null;
  return subjectId;
};

export const isValidUrl = (url) => URL_PATTERN.test(String(url || "").trim());

export const formatFileSize = (bytes) => {
  if (bytes == null || Number.isNaN(Number(bytes))) return "0 B";
  const size = Number(bytes);
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
};

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

  if (file.size > MAX_FILE_SIZE) {
    console.warn(
      "Rejected file size:",
      file.size,
      formatFileSize(file.size),
      file.name,
    );
    return { ok: false, message: FILE_SIZE_LIMIT_MESSAGE };
  }

  console.log(
    "Validated file size:",
    file.size,
    formatFileSize(file.size),
    file.name,
  );

  return { ok: true };
};

export const validateUploadFiles = (files = []) => {
  const list = Array.from(files).filter(Boolean);
  if (list.length === 0) {
    return { ok: false, message: "Please select a file" };
  }

  for (const file of list) {
    const result = validateUploadFile(file);
    if (!result.ok) {
      return result;
    }
  }

  return { ok: true, file: list[0] };
};

export const handleUploadFileSelection = (
  files,
  { setSelectedFile, clearInput, toastError },
) => {
  const list = Array.from(files || []).filter(Boolean);
  if (list.length === 0) return;

  const check = validateUploadFiles(list);
  if (!check.ok) {
    toastError(check.message);
    setSelectedFile(null);
    if (clearInput) clearInput();
    return;
  }

  setSelectedFile(check.file);
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
