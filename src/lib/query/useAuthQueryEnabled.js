import { useAuthStore, selectIsAuthenticated } from "@/lib/authStore";

/** Gate server queries until canonical auth hydration completes. */
export function useAuthQueryEnabled() {
  const authReady = useAuthStore((s) => s.authReady);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  return authReady && isAuthenticated;
}
