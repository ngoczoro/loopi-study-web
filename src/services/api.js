import axios from "axios";
import { getAccessToken } from "../lib/authSession.js";
import { performTokenRefresh } from "../lib/authTokenRefresh.js";
import { forceAuthLogout } from "../lib/authLogout.js";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

let rateLimitToastAt = 0;
const RATE_LIMIT_TOAST_MS = 5000;

const maybeShowRateLimitToast = async () => {
  const now = Date.now();
  if (now - rateLimitToastAt < RATE_LIMIT_TOAST_MS) return;
  rateLimitToastAt = now;

  const { toast } = await import("sonner");
  toast.error("Too many requests. Please wait a moment.");
};

api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;

    if (status === 429) {
      await maybeShowRateLimitToast();
      return Promise.reject(error);
    }

    const originalRequest = error.config;

    if (status !== 401 || !originalRequest || originalRequest._retry) {
      return Promise.reject(error);
    }

    const requestUrl = originalRequest.url ?? "";
    if (
      requestUrl.includes("/auth/refresh-token") ||
      requestUrl.includes("/auth/login")
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    const refreshed = await performTokenRefresh();

    if (!refreshed?.accessToken) {
      await forceAuthLogout(true);
      return Promise.reject(error);
    }

    originalRequest.headers.Authorization = `Bearer ${refreshed.accessToken}`;

    const { useAuthStore } = await import("../lib/authStore.js");
    const session = (await import("../lib/authSession.js")).readAuthSession();
    useAuthStore.getState().syncFromSession(session);

    return api(originalRequest);
  },
);

export default api;
