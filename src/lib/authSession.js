/**
 * Canonical persisted auth session — single localStorage shape, single read/write path.
 * All tokens and user cache must flow through this module (not standalone keys).
 */

export const AUTH_SESSION_STORAGE_KEY = "loopi_auth_session";

const LEGACY_STORAGE_KEYS = [
  "accessToken",
  "refreshToken",
  "user",
  "auth-store",
];

const safeParse = (raw) => {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

/**
 * @typedef {{ user: object, accessToken: string, refreshToken: string | null }} AuthSession
 */

export const isAuthSessionValid = (session) =>
  Boolean(
    session?.accessToken &&
      session?.user &&
      typeof session.user === "object",
  );

/**
 * One-time migration from legacy dual-storage layout into loopi_auth_session.
 */
export const migrateLegacyAuthStorage = () => {
  const existing = readAuthSession();
  if (existing && isAuthSessionValid(existing)) {
    clearLegacyAuthStorageKeys();
    return existing;
  }

  let user = null;
  let accessToken = null;
  let refreshToken = null;

  const legacyUserRaw = localStorage.getItem("user");
  if (legacyUserRaw) {
    try {
      user = JSON.parse(legacyUserRaw);
    } catch {
      user = null;
    }
  }

  accessToken = localStorage.getItem("accessToken") || null;
  refreshToken = localStorage.getItem("refreshToken") || null;

  const legacyPersist = safeParse(localStorage.getItem("auth-store"));
  const legacyState = legacyPersist?.state ?? legacyPersist;

  if (legacyState) {
    user = user ?? legacyState.user ?? null;
    accessToken = accessToken ?? legacyState.accessToken ?? null;
    refreshToken = refreshToken ?? legacyState.refreshToken ?? null;
  }

  const migrated = isAuthSessionValid({ user, accessToken, refreshToken })
    ? { user, accessToken, refreshToken }
    : null;

  if (migrated) {
    writeAuthSession(migrated);
  }

  clearLegacyAuthStorageKeys();
  return migrated ?? readAuthSession();
};

export const clearLegacyAuthStorageKeys = () => {
  for (const key of LEGACY_STORAGE_KEYS) {
    localStorage.removeItem(key);
  }
};

/** @returns {AuthSession | null} */
export const readAuthSession = () => {
  const parsed = safeParse(localStorage.getItem(AUTH_SESSION_STORAGE_KEY));
  if (!parsed || typeof parsed !== "object") {
    return null;
  }

  return {
    user: parsed.user ?? null,
    accessToken: parsed.accessToken ?? null,
    refreshToken: parsed.refreshToken ?? null,
  };
};

/** @param {AuthSession | null} session */
export const writeAuthSession = (session) => {
  if (!session || !isAuthSessionValid(session)) {
    clearAuthSession();
    return;
  }

  localStorage.setItem(
    AUTH_SESSION_STORAGE_KEY,
    JSON.stringify({
      user: session.user,
      accessToken: session.accessToken,
      refreshToken: session.refreshToken ?? null,
    }),
  );
};

export const clearAuthSession = () => {
  localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
  clearLegacyAuthStorageKeys();
};

export const getAccessToken = () => readAuthSession()?.accessToken ?? null;

export const getRefreshToken = () => readAuthSession()?.refreshToken ?? null;

export const getAuthUser = () => readAuthSession()?.user ?? null;
