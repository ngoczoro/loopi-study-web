import { useFilePreviewStore } from "@/lib/filePreviewStore";

export const SUPPORTED_EXTENSIONS = new Set([
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
]);

export const PREVIEW_EXTENSIONS = new Set([
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "txt",
  "png",
  "jpg",
  "jpeg",
  "webp",
  "gif",
]);

export const DOWNLOAD_ONLY_EXTENSIONS = new Set(["ppt", "pptx"]);

const MIME_TO_EXTENSION = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "docx",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation":
    "pptx",
  "application/vnd.ms-powerpoint": "ppt",
  "text/plain": "txt",
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

const getExtensionFromString = (value = "") => {
  if (!value) return "";
  const path = String(value).split("?")[0].split("#")[0];
  const segment = path.split("/").pop() || path;
  if (!segment.includes(".")) return "";
  return segment.split(".").pop()?.toLowerCase() || "";
};

export const resolveFileExtension = (item) => {
  const fromName = getExtensionFromString(item?.fileName);
  if (fromName) return fromName;

  const mime = item?.mimeType?.toLowerCase()?.split(";")[0]?.trim();
  if (mime && mime !== "application/octet-stream") {
    return MIME_TO_EXTENSION[mime] || "";
  }

  return "";
};

export const isPreviewSupported = (item) => {
  const extension = resolveFileExtension(item);
  return PREVIEW_EXTENSIONS.has(extension);
};

export const downloadFile = async (item) => {
  if (!item?.fileUrl) return false;

  const fileName = item.fileName?.trim() || "download";

  const triggerDownload = (url, shouldRevoke = false) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (shouldRevoke) {
      URL.revokeObjectURL(url);
    }
  };

  try {
    const response = await fetch(item.fileUrl, { mode: "cors" });
    if (!response.ok) {
      throw new Error(`Download failed (${response.status})`);
    }

    const blob = await response.blob();
    triggerDownload(URL.createObjectURL(blob), true);
    return true;
  } catch (error) {
    console.error("Download via blob failed, falling back to direct link:", error);
    triggerDownload(item.fileUrl);
    return false;
  }
};

export const previewFile = (item) => {
  if (!item) return false;
  useFilePreviewStore.getState().openPreview(item);
  return true;
};
