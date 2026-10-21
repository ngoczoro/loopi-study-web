const DAY_MS = 24 * 60 * 60 * 1000;
const MIN_EASE = 1.3;

export function isDue(card, now = Date.now()) {
  if (!card?.dueAt) return true;
  return new Date(card.dueAt).getTime() <= now;
}

export function dueLabel(card, now = Date.now()) {
  if (!card?.dueAt) return "New";
  const time = new Date(card.dueAt).getTime();
  if (time <= now) return "Due";
  return `Due ${new Date(card.dueAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })}`;
}

/**
 * Lightweight review schedule. Again stays due immediately so the card
 * can return at the end of the current session. The other ratings push
 * the next review at least one day out.
 */
export function scheduleReview(card, rating, now = Date.now()) {
  const ease = card.ease ?? 2.5;
  const interval = card.intervalDays ?? 0;
  let nextEase = ease;
  let nextInterval = interval;

  if (rating === "again") {
    nextEase = Math.max(MIN_EASE, ease - 0.2);
    nextInterval = 0;
  } else if (rating === "hard") {
    nextEase = Math.max(MIN_EASE, ease - 0.15);
    nextInterval = interval === 0 ? 1 : Math.max(1, Math.round(interval * 1.2));
  } else if (rating === "good") {
    nextInterval = interval === 0 ? 1 : Math.max(1, Math.round(interval * ease));
  } else {
    nextEase = ease + 0.15;
    nextInterval = interval === 0 ? 3 : Math.max(1, Math.round(interval * ease * 1.3));
  }

  const dueAt =
    rating === "again"
      ? new Date(now).toISOString()
      : new Date(now + nextInterval * DAY_MS).toISOString();

  return {
    ...card,
    ease: Math.round(nextEase * 100) / 100,
    intervalDays: nextInterval,
    repetitions: rating === "again" ? 0 : (card.repetitions ?? 0) + 1,
    lastRating: rating,
    dueAt,
    updatedAt: new Date(now).toISOString(),
  };
}
