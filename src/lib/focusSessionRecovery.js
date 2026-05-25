const SNAPSHOT_KEY = "loopi_focus_session_snapshot";
const TAB_LOCK_KEY = "loopi_focus_tab_lock";
const TAB_LOCK_TTL_MS = 15_000;

const safeParse = (raw) => {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const saveRecoverySnapshot = (session) => {
  if (!session?.id) return;

  const snapshot = {
    sessionId: session.id,
    subjectId: session.subjectId,
    status: session.status,
    currentPhase: session.currentPhase,
    remainingSeconds: session.remainingSeconds,
    phaseEndsAt: session.phaseEndsAt,
    workElapsedSeconds: session.workElapsedSeconds ?? 0,
    plannedWorkMinutes: session.plannedWorkMinutes,
    plannedBreakMinutes: session.plannedBreakMinutes,
    subjectName: session.subjectName,
    updatedAt: Date.now(),
  };

  localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshot));
};

export const readRecoverySnapshot = () => safeParse(localStorage.getItem(SNAPSHOT_KEY));

export const clearRecoverySnapshot = () => {
  localStorage.removeItem(SNAPSHOT_KEY);
};

const readTabLock = () => safeParse(localStorage.getItem(TAB_LOCK_KEY));

export const claimTabLock = (sessionId) => {
  const tabId =
    sessionStorage.getItem("loopi_focus_tab_id") ||
    (() => {
      const id = crypto.randomUUID();
      sessionStorage.setItem("loopi_focus_tab_id", id);
      return id;
    })();

  const now = Date.now();
  const existing = readTabLock();

  if (
    existing &&
    existing.sessionId === sessionId &&
    existing.tabId !== tabId &&
    now - existing.heartbeatAt < TAB_LOCK_TTL_MS
  ) {
    return { isOwner: false, tabId };
  }

  const lock = { sessionId, tabId, heartbeatAt: now };
  localStorage.setItem(TAB_LOCK_KEY, JSON.stringify(lock));
  return { isOwner: true, tabId };
};

export const heartbeatTabLock = (sessionId) => {
  const tabId = sessionStorage.getItem("loopi_focus_tab_id");
  if (!tabId) return;

  const existing = readTabLock();
  if (existing?.tabId !== tabId || existing?.sessionId !== sessionId) {
    return;
  }

  localStorage.setItem(
    TAB_LOCK_KEY,
    JSON.stringify({ sessionId, tabId, heartbeatAt: Date.now() }),
  );
};

export const releaseTabLock = (sessionId) => {
  const tabId = sessionStorage.getItem("loopi_focus_tab_id");
  const existing = readTabLock();

  if (
    existing?.tabId === tabId &&
    (!sessionId || existing.sessionId === sessionId)
  ) {
    localStorage.removeItem(TAB_LOCK_KEY);
  }
};

export const isTabLockHeldByOther = (sessionId) => {
  const tabId = sessionStorage.getItem("loopi_focus_tab_id");
  const existing = readTabLock();
  const now = Date.now();

  return Boolean(
    existing &&
      existing.sessionId === sessionId &&
      existing.tabId !== tabId &&
      now - existing.heartbeatAt < TAB_LOCK_TTL_MS,
  );
};

export const reconcileWithBackend = (backendSession, snapshot) => {
  if (!backendSession) {
    return { session: null, source: "none" };
  }

  if (!snapshot || snapshot.sessionId !== backendSession.id) {
    return { session: backendSession, source: "backend" };
  }

  return { session: backendSession, source: "backend" };
};
