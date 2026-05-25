import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import AuthLoadingScreen from "@/components/AuthLoadingScreen";
import {
  prefetchAdminBootstrap,
  prefetchStudentBootstrap,
} from "@/lib/query/bootstrap";

/**
 * After authReady, prefetch essential server queries before rendering app shells.
 * Uses the same query keys as page hooks — no duplicate fetches when cache is warm.
 */
export default function AppBootstrap({ children }) {
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();
  const [bootstrapReady, setBootstrapReady] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setBootstrapReady(true);
      return;
    }

    let cancelled = false;

    const run = async () => {
      try {
        if (user?.role === "admin") {
          await prefetchAdminBootstrap(queryClient);
        } else {
          await prefetchStudentBootstrap(queryClient);
        }
      } finally {
        if (!cancelled) {
          setBootstrapReady(true);
        }
      }
    };

    setBootstrapReady(false);
    run();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user?.role, queryClient]);

  if (!bootstrapReady) {
    return (
      <AuthLoadingScreen message="Loading your study data…" />
    );
  }

  return children;
}
