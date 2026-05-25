import { create } from "zustand";
import {
  registerAPI,
  verifyOTPAPI,
  resendOTPAPI,
  loginAPI,
  logoutAPI,
  forgotPasswordAPI,
  resetPasswordAPI,
  verifyResetOTPAPI,
} from "../services/authService.js";
import {
  clearAuthSession,
  migrateLegacyAuthStorage,
  readAuthSession,
  writeAuthSession,
  isAuthSessionValid,
} from "./authSession.js";
import { performTokenRefresh } from "./authTokenRefresh.js";

let initializePromise = null;

/** Derived auth — never persist a separate isAuthenticated flag. */
export const selectIsAuthenticated = (state) =>
  Boolean(state.authReady && state.accessToken && state.user);

export const useAuthStore = create((set, get) => ({
  authReady: false,
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: false,
  error: null,
  email: null,

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  syncFromSession: (session) => {
    if (!session || !isAuthSessionValid(session)) {
      set({
        user: null,
        accessToken: null,
        refreshToken: null,
      });
      return;
    }

    set({
      user: session.user,
      accessToken: session.accessToken,
      refreshToken: session.refreshToken ?? null,
    });
  },

  applySession: (session) => {
    writeAuthSession(session);
    get().syncFromSession(session);
  },

  /**
   * Hydrate auth from canonical storage once per app load (StrictMode-safe).
   */
  initialize: () => {
    if (get().authReady) {
      return Promise.resolve();
    }

    if (!initializePromise) {
      initializePromise = Promise.resolve().then(() => {
        migrateLegacyAuthStorage();
        const session = readAuthSession();

        if (session && isAuthSessionValid(session)) {
          get().syncFromSession(session);
        } else if (session) {
          clearAuthSession();
          get().syncFromSession(null);
        }

        set({ authReady: true });
      });
    }

    return initializePromise;
  },

  setUser: (user) => {
    const session = readAuthSession();
    if (!session?.accessToken) {
      set({ user });
      return;
    }

    const next = { ...session, user };
    writeAuthSession(next);
    set({ user });
  },

  register: async (email, password, confirmPassword, fullName) => {
    set({ isLoading: true, error: null });
    try {
      const result = await registerAPI(
        email,
        password,
        confirmPassword,
        fullName,
      );
      if (result.success) {
        set({ email, error: null });
      } else {
        set({ error: result.message });
      }
      return result;
    } catch {
      const message = "Registration failed";
      set({ error: message });
      return { success: false, message };
    } finally {
      set({ isLoading: false });
    }
  },

  verifyOTP: async (email, otp) => {
    set({ isLoading: true, error: null });
    try {
      const result = await verifyOTPAPI(email, otp);
      if (result.success) {
        set({ email: null, error: null });
      } else {
        set({ error: result.message });
      }
      return result;
    } catch {
      const message = "OTP verification failed";
      set({ error: message });
      return { success: false, message };
    } finally {
      set({ isLoading: false });
    }
  },

  resendOTP: async (email, type) => {
    set({ isLoading: true, error: null });
    try {
      const result = await resendOTPAPI(email, type);
      if (result.success) {
        set({ error: null });
      } else {
        set({ error: result.message });
      }
      return result;
    } catch {
      const message = "Resend OTP failed";
      set({ error: message });
      return { success: false, message };
    } finally {
      set({ isLoading: false });
    }
  },

  forgotPassword: async (email) => {
    set({ isLoading: true, error: null });
    try {
      const result = await forgotPasswordAPI(email);
      if (result.success) {
        set({ email, error: null });
      } else {
        set({ error: result.message });
      }
      return result;
    } catch {
      const message = "Forgot password request failed";
      set({ error: message });
      return { success: false, message };
    } finally {
      set({ isLoading: false });
    }
  },

  resetPassword: async (email, otp, newPassword, confirmPassword) => {
    set({ isLoading: true, error: null });
    try {
      const result = await resetPasswordAPI(
        email,
        otp,
        newPassword,
        confirmPassword,
      );
      if (result.success) {
        set({ email: null, error: null });
      } else {
        set({ error: result.message });
      }
      return result;
    } catch {
      const message = "Password reset failed";
      set({ error: message });
      return { success: false, message };
    } finally {
      set({ isLoading: false });
    }
  },

  verifyResetOTP: async (email, otp) => {
    set({ isLoading: true, error: null });
    try {
      const result = await verifyResetOTPAPI(email, otp);
      if (result.success) {
        set({ error: null });
      } else {
        set({ error: result.message });
      }
      return result;
    } catch {
      const message = "OTP verification failed";
      set({ error: message });
      return { success: false, message };
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const result = await loginAPI(email, password);
      if (result.success) {
        const { user, accessToken, refreshToken } = result.data;
        get().applySession({ user, accessToken, refreshToken });
        set({ email: null, error: null });
      } else {
        set({ error: result.message });
      }
      return result;
    } catch {
      const message = "Login failed";
      set({ error: message });
      return { success: false, message };
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    set({ isLoading: true, error: null });
    try {
      await logoutAPI();
    } catch (error) {
      console.error("Logout API error:", error);
    } finally {
      clearAuthSession();
      const { queryClient } = await import("./query/queryClient.js");
      queryClient.clear();
      get().syncFromSession(null);
      set({
        email: null,
        error: null,
        isLoading: false,
      });
    }
  },

  refreshAccessToken: async () => {
    const refreshed = await performTokenRefresh();
    if (!refreshed) {
      return { success: false };
    }

    const session = readAuthSession();
    get().syncFromSession(session);
    return { success: true, data: refreshed };
  },

  /** @deprecated Use initialize() — kept for compatibility during migration */
  restoreAuth: () => {
    return get().initialize();
  },
}));
