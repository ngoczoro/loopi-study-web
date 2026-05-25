import axios from "axios";
import {
  readAuthSession,
  writeAuthSession,
} from "./authSession.js";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";

/** Axios instance without auth interceptors — avoids circular imports during refresh. */
const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

let inFlightRefresh = null;

/**
 * Refresh access token using refresh token from canonical session.
 * @returns {Promise<{ accessToken: string, refreshToken: string } | null>}
 */
export const performTokenRefresh = async () => {
  if (inFlightRefresh) {
    return inFlightRefresh;
  }

  inFlightRefresh = (async () => {
    const session = readAuthSession();
    if (!session?.refreshToken) {
      return null;
    }

    try {
      const response = await refreshClient.post("/auth/refresh-token", {
        refreshToken: session.refreshToken,
      });

      const { accessToken, refreshToken: newRefreshToken } =
        response.data.data ?? {};

      if (!accessToken) {
        return null;
      }

      const nextSession = {
        user: session.user,
        accessToken,
        refreshToken: newRefreshToken ?? session.refreshToken,
      };

      writeAuthSession(nextSession);
      return {
        accessToken: nextSession.accessToken,
        refreshToken: nextSession.refreshToken,
      };
    } catch {
      return null;
    } finally {
      inFlightRefresh = null;
    }
  })();

  return inFlightRefresh;
};
