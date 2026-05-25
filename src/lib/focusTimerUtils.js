export const FOCUS_SYNC_INTERVAL_MS = 30_000;
export const FOCUS_TICK_MS = 250;
export const FOCUS_MAX_WORK_MINUTES = 45;

export function workMinutesFromSeconds(seconds) {
  return Math.max(0, Math.ceil(seconds / 60));
}

export function computeSecondsLeft(session) {
  if (!session) return 0;

  if (session.status === "paused") {
    return Math.max(0, session.remainingSeconds ?? 0);
  }

  if (session.status === "running" && session.phaseEndsAt) {
    const ms = new Date(session.phaseEndsAt).getTime() - Date.now();
    return Math.max(0, Math.ceil(ms / 1000));
  }

  return Math.max(0, session.remainingSeconds ?? 0);
}

export function suggestWorkMinutes(priority) {
  if (priority === "high") return 45;
  if (priority === "low") return 20;
  return 30;
}
