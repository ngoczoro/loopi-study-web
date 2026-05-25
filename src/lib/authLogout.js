import { clearAuthSession } from "./authSession.js";

/**
 * Hard logout used by API layer when refresh fails. Clears all auth storage
 * and syncs Zustand memory state without calling the logout API.
 */
export const forceAuthLogout = async (redirectToLogin = true) => {
  clearAuthSession();

  const { queryClient } = await import("./query/queryClient.js");
  queryClient.clear();

  const { useAuthStore } = await import("./authStore.js");
  useAuthStore.getState().syncFromSession(null);

  if (redirectToLogin && window.location.pathname !== "/login") {
    window.location.replace("/login");
  }
};
