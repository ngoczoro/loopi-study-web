import { useEffect } from "react";
import { useAuthStore, selectIsAuthenticated } from "../lib/authStore.js";

/**
 * Auth hook — waits for canonical session hydration before exposing route state.
 */
export const useAuth = () => {
  const authReady = useAuthStore((s) => s.authReady);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const email = useAuthStore((s) => s.email);
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const isLoading = useAuthStore((s) => s.isLoading);
  const error = useAuthStore((s) => s.error);
  const register = useAuthStore((s) => s.register);
  const verifyOTP = useAuthStore((s) => s.verifyOTP);
  const resendOTP = useAuthStore((s) => s.resendOTP);
  const login = useAuthStore((s) => s.login);
  const logout = useAuthStore((s) => s.logout);
  const forgotPassword = useAuthStore((s) => s.forgotPassword);
  const resetPassword = useAuthStore((s) => s.resetPassword);
  const verifyResetOTP = useAuthStore((s) => s.verifyResetOTP);
  const refreshAccessToken = useAuthStore((s) => s.refreshAccessToken);
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return {
    authReady,
    isAuthenticated,
    user,
    accessToken,
    refreshToken,
    isLoading,
    error,
    email,
    register,
    verifyOTP,
    resendOTP,
    login,
    logout,
    forgotPassword,
    resetPassword,
    verifyResetOTP,
    refreshToken: refreshAccessToken,
  };
};
