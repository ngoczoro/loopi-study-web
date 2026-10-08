const timeFormatter = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
});

const dayFormatter = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const shortDateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const startOfDay = (date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

const DAY_MS = 24 * 60 * 60 * 1000;

export const formatMessageTime = (iso) => timeFormatter.format(new Date(iso));

export const isSameDay = (a, b) => startOfDay(new Date(a)) === startOfDay(new Date(b));

export function formatDayLabel(iso) {
  const diffDays = Math.round((startOfDay(new Date()) - startOfDay(new Date(iso))) / DAY_MS);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return dayFormatter.format(new Date(iso));
}

export function formatSharedDate(iso) {
  const label = formatDayLabel(iso);
  return label === "Today" || label === "Yesterday"
    ? label
    : shortDateFormatter.format(new Date(iso));
}

export function formatFileSize(bytes) {
  if (!Number.isFinite(bytes)) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function getFileExtension(name) {
  const match = /\.([a-z0-9]+)$/i.exec(name ?? "");
  return match ? match[1].toUpperCase() : "FILE";
}

const EXTENSION_COLORS = {
  PDF: "bg-red-500",
  DOC: "bg-blue-600",
  DOCX: "bg-blue-600",
  XLS: "bg-emerald-600",
  XLSX: "bg-emerald-600",
  PPT: "bg-orange-500",
  PPTX: "bg-orange-500",
  ZIP: "bg-amber-600",
  RAR: "bg-amber-600",
  MD: "bg-slate-600",
  TXT: "bg-slate-500",
};

export const getFileBadgeColor = (name) =>
  EXTENSION_COLORS[getFileExtension(name)] ?? "bg-primary";
