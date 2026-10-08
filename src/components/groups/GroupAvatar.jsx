import { cn } from "@/lib/utils";

const PALETTE = [
  "bg-indigo-500",
  "bg-sky-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-violet-500",
  "bg-teal-500",
];

const SIZE_CLASSES = {
  sm: "h-9 w-9 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-16 w-16 text-xl",
};

function hashString(value) {
  let hash = 0;
  for (const char of value ?? "") hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return Math.abs(hash);
}

function getGroupInitials(name) {
  const words = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  return words
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

export default function GroupAvatar({ group, size = "md", className }) {
  const color = PALETTE[hashString(group?.id) % PALETTE.length];
  if (group?.avatarUrl) {
    return (
      <img
        src={group.avatarUrl}
        alt={`${group.name} avatar`}
        className={cn(
          "rounded-full object-cover shrink-0",
          SIZE_CLASSES[size] ?? SIZE_CLASSES.md,
          className,
        )}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={cn(
        "rounded-full text-white font-semibold inline-flex items-center justify-center shrink-0",
        color,
        SIZE_CLASSES[size] ?? SIZE_CLASSES.md,
        className,
      )}
    >
      {getGroupInitials(group?.name)}
    </span>
  );
}
