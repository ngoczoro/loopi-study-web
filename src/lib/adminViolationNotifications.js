const SEEN_STORAGE_KEY = "loopi_admin_seen_violations";

const TYPE_LABELS = {
  spam: "Spam content",
  inappropriate: "Inappropriate language",
  irrelevant: "Irrelevant content",
};

export function getViolationTypeLabel(type) {
  return TYPE_LABELS[type] ?? type ?? "Content";
}

export function getSeenViolationIds() {
  try {
    const raw = localStorage.getItem(SEEN_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

export function markViolationSeen(violationId) {
  if (!violationId) return;
  const seen = getSeenViolationIds();
  seen.add(violationId);
  localStorage.setItem(SEEN_STORAGE_KEY, JSON.stringify([...seen]));
}

export function formatViolationRelativeTime(iso) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(diff)) return "";

  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;

  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;

  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

export function mapPendingViolationsToNotifications(flaggedUsers = [], seenIds) {
  const seen = seenIds ?? getSeenViolationIds();
  const items = [];

  for (const user of flaggedUsers) {
    for (const violation of user.violations ?? []) {
      if (violation.resolved) continue;

      const title = violation.contentTitle ?? "";
      items.push({
        id: violation.id,
        title: `${violation.typeLabel || getViolationTypeLabel(violation.type)} detected`,
        body: `${user.userName ?? "User"} posted flagged content: "${title.slice(0, 40)}"`,
        time: formatViolationRelativeTime(violation.detectedAt),
        detectedAt: violation.detectedAt,
        unread: !seen.has(violation.id),
        violationId: violation.id,
      });
    }
  }

  return items.sort(
    (a, b) => new Date(b.detectedAt ?? 0) - new Date(a.detectedAt ?? 0),
  );
}
