import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  registerAPI,
  verifyOTPAPI,
  resendOTPAPI,
  loginAPI,
  logoutAPI,
  refreshTokenAPI,
  forgotPasswordAPI,
  resetPasswordAPI,
  verifyResetOTPAPI,
} from "../services/authService";

/**
 * Auth Store - Zustand with localStorage persistence
 */
export const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,
      error: null,
      email: null, // Temporary email for OTP flow
      isAuthenticated: false,

      // Actions
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),

      setUser: (user) => {
        set({ user });
        if (user) {
          localStorage.setItem("user", JSON.stringify(user));
        }
      },

      /**
       * Register user
       */
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
            // Store email temporarily for OTP verification
            set({ email, error: null });
            return result;
          } else {
            set({ error: result.message });
            return result;
          }
        } catch (error) {
          const message = "Registration failed";
          set({ error: message });
          return { success: false, message };
        } finally {
          set({ isLoading: false });
        }
      },

      /**
       * Verify OTP
       */
      verifyOTP: async (email, otp) => {
        set({ isLoading: true, error: null });
        try {
          const result = await verifyOTPAPI(email, otp);
          if (result.success) {
            set({ email: null, error: null }); // Clear temporary email
            return result;
          } else {
            set({ error: result.message });
            return result;
          }
        } catch (error) {
          const message = "OTP verification failed";
          set({ error: message });
          return { success: false, message };
        } finally {
          set({ isLoading: false });
        }
      },

      /**
       * Resend OTP
       */
      resendOTP: async (email, type) => {
        set({ isLoading: true, error: null });
        try {
          const result = await resendOTPAPI(email, type);
          if (result.success) {
            set({ error: null });
            return result;
          } else {
            set({ error: result.message });
            return result;
          }
        } catch (error) {
          const message = "Resend OTP failed";
          set({ error: message });
          return { success: false, message };
        } finally {
          set({ isLoading: false });
        }
      },

      /**
       * Forgot password - request OTP
       */
      forgotPassword: async (email) => {
        set({ isLoading: true, error: null });
        try {
          const result = await forgotPasswordAPI(email);
          if (result.success) {
            set({ email, error: null });
            return result;
          } else {
            set({ error: result.message });
            return result;
          }
        } catch (error) {
          const message = "Forgot password request failed";
          set({ error: message });
          return { success: false, message };
        } finally {
          set({ isLoading: false });
        }
      },

      /**
       * Reset password
       */
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
            return result;
          } else {
            set({ error: result.message });
            return result;
          }
        } catch (error) {
          const message = "Password reset failed";
          set({ error: message });
          return { success: false, message };
        } finally {
          set({ isLoading: false });
        }
      },

      /**
       * Verify OTP for reset (Check only)
       */
      verifyResetOTP: async (email, otp) => {
        set({ isLoading: true, error: null });
        try {
          const result = await verifyResetOTPAPI(email, otp);
          if (result.success) {
            set({ error: null });
            return result;
          } else {
            set({ error: result.message });
            return result;
          }
        } catch (error) {
          const message = "OTP verification failed";
          set({ error: message });
          return { success: false, message };
        } finally {
          set({ isLoading: false });
        }
      },

      /**
       * Login user
       */
      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const result = await loginAPI(email, password);
          if (result.success) {
            const { user, accessToken, refreshToken } = result.data;
            set({
              user,
              accessToken,
              refreshToken,
              email: null,
              error: null,
              isAuthenticated: true,
            });
            // Save tokens to localStorage (also handled by persist)
            localStorage.setItem("accessToken", accessToken);
            localStorage.setItem("refreshToken", refreshToken);
            localStorage.setItem("user", JSON.stringify(user));
            return result;
          } else {
            set({ error: result.message });
            return result;
          }
        } catch (error) {
          const message = "Login failed";
          set({ error: message });
          return { success: false, message };
        } finally {
          set({ isLoading: false });
        }
      },

      /**
       * Logout user
       */
      logout: async () => {
        set({ isLoading: true, error: null });
        try {
          // Call logout API (best effort, doesn't fail if it fails)
          await logoutAPI();
        } catch (error) {
          console.error("Logout API error:", error);
        } finally {
          // Clear all auth state regardless
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            email: null,
            error: null,
            isLoading: false,
            isAuthenticated: false,
          });
          // Clear localStorage
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("user");
          localStorage.removeItem("auth-store"); // Clear persisted state
        }
      },

      /**
       * Refresh access token
       */
      refreshToken: async () => {
        const refreshToken = get().refreshToken;
        if (!refreshToken) {
          set({ error: "No refresh token available" });
          return { success: false };
        }

        try {
          const result = await refreshTokenAPI(refreshToken);
          if (result.success) {
            const { accessToken, refreshToken: newRefreshToken } = result.data;
            set({
              accessToken,
              refreshToken: newRefreshToken,
              error: null,
            });
            localStorage.setItem("accessToken", accessToken);
            localStorage.setItem("refreshToken", newRefreshToken);
            return result;
          } else {
            set({ error: result.message });
            // Token refresh failed, logout
            get().logout();
            return result;
          }
        } catch (error) {
          set({ error: "Token refresh failed" });
          get().logout();
          return { success: false };
        }
      },

      // /**
      //  * Check if user is authenticated
      //  */
      // isAuthenticated: () => {
      //   const { user, accessToken } = get();
      //   return !!(user && accessToken);
      // },

      /**
       * Restore auth from localStorage on app load
       */
      restoreAuth: () => {
        const accessToken = localStorage.getItem("accessToken");
        const refreshToken = localStorage.getItem("refreshToken");
        const userStr = localStorage.getItem("user");

        if (accessToken && userStr) {
          try {
            const user = JSON.parse(userStr);
            set({ user, accessToken, refreshToken, isAuthenticated: true });
            return true;
          } catch (error) {
            console.error("Error restoring auth:", error);
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            localStorage.removeItem("user");
            return false;
          }
        }
        return false;
      },
    }),
    {
      name: "auth-store",
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
