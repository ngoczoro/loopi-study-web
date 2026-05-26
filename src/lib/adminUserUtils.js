export const LOCK_REASON_MAX_LENGTH = 500;

export const DEFAULT_LOCK_REASON = "Violation of community standards";

export const formatAdminUserDate = (value) => {
  if (!value) return "—";
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "—";
  }
};

export const mapAdminUserForUI = (user) => {
  if (!user) return null;

  const status = String(user.status || "ACTIVE").toUpperCase();
  const name = user.name?.trim() || user.email?.split("@")[0] || "Unknown";

  return {
    id: user.id,
    username: name,
    email: user.email ?? "",
    role: user.role ?? "student",
    status,
    locked: status === "LOCKED",
    createdAt: formatAdminUserDate(user.createdAt),
    avatarUrl: user.avatarUrl ?? null,
  };
};

export const mapAdminUserListForUI = (users) => {
  if (!Array.isArray(users)) return [];
  return users.map(mapAdminUserForUI).filter(Boolean);
};

export const getStatusBadgeLabel = (user) => {
  if (user?.locked) return "Locked";
  if (user?.status === "PENDING") return "Pending";
  if (user?.status === "BANNED") return "Banned";
  return "Active";
};
