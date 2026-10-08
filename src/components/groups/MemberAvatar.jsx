import { cn } from "@/lib/utils";

const SIZE_CLASSES = {
  sm: "h-7 w-7 text-[11px]",
  md: "h-9 w-9 text-xs",
};

function getInitials(fullName) {
  const parts = (fullName ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export default function MemberAvatar({ user, size = "md", className }) {
  const sizeClass = SIZE_CLASSES[size] ?? SIZE_CLASSES.md;

  if (user?.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={user.fullName ?? ""}
        className={cn("rounded-full object-cover shrink-0", sizeClass, className)}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={cn(
        "rounded-full bg-primary/10 text-primary font-semibold inline-flex items-center justify-center shrink-0",
        sizeClass,
        className,
      )}
    >
      {getInitials(user?.fullName)}
    </span>
  );
}
