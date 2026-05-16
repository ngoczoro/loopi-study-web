import { useEffect } from "react";
import { useAuthStore } from "../lib/authStore";

/**
 * Custom hook for authentication
 */
export const useAuth = () => {
  const {
    user,
    accessToken,
    refreshToken,
    isLoading,
    error,
    register,
    verifyOTP,
    resendOTP,
    login,
    logout,
    forgotPassword,
    resetPassword,
    verifyResetOTP,
    refreshToken: refreshTokenFn,
    isAuthenticated,
    restoreAuth,
  } = useAuthStore();

  // Restore auth on app load
  useEffect(() => {
    restoreAuth();
  }, [restoreAuth]);

  return {
    user,
    accessToken,
    refreshToken,
    isLoading,
    error,
    isAuthenticated: isAuthenticated(),
    register,
    verifyOTP,
    resendOTP,
    login,
    logout,
    forgotPassword,
    resetPassword,
    verifyResetOTP,
    refreshToken: refreshTokenFn,
  };
};
