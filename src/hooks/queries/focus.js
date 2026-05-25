import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getActiveFocusSessionAPI } from "@/services/focusSessionService";
import { getFocusSessionHistoryFilteredAPI } from "@/services/focusAnalyticsService";
import { queryKeys } from "@/lib/query/queryKeys";
import { unwrapServiceResult } from "@/lib/query/unwrap";
import { useAuthQueryEnabled } from "@/lib/query/useAuthQueryEnabled";
import { invalidateFocusDomain } from "@/lib/query/invalidate";

export function focusActiveQueryOptions() {
  return {
    queryKey: queryKeys.focus.active,
    queryFn: async () => {
      const result = await getActiveFocusSessionAPI();
      if (!result.success) {
        throw new Error(result.message || "Failed to fetch active focus session");
      }
      return result.data ?? null;
    },
  };
}

export function useFocusActiveQuery(options = {}) {
  const { enabled: enabledOption = true } = options;
  const authEnabled = useAuthQueryEnabled();
  const query = useQuery({
    ...focusActiveQueryOptions(),
    enabled: authEnabled && enabledOption,
    staleTime: 15 * 1000,
  });

  return {
    activeSession: query.data ?? null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error?.message ?? null,
    refetch: query.refetch,
    query,
  };
}

export function focusHistoryQueryOptions(filters = {}) {
  return {
    queryKey: queryKeys.focus.history(filters),
    queryFn: async () => {
      const result = await getFocusSessionHistoryFilteredAPI(filters);
      if (!result.success) {
        throw new Error(result.message || "Failed to fetch session history");
      }
      return result.data;
    },
  };
}

export function useFocusHistoryQuery(filters = {}, options = {}) {
  const { enabled: enabledOption = true } = options;
  const authEnabled = useAuthQueryEnabled();
  const query = useQuery({
    ...focusHistoryQueryOptions(filters),
    enabled: authEnabled && enabledOption,
  });

  const payload = query.data;
  const sessions =
    payload?.sessions ?? (Array.isArray(payload) ? payload : []);

  return {
    sessions,
    pagination: payload?.pagination ?? null,
    isLoading: query.isLoading,
    error: query.error?.message ?? null,
    refetch: query.refetch,
    query,
  };
}

export function useInvalidateFocus() {
  const queryClient = useQueryClient();
  return () => invalidateFocusDomain(queryClient);
}
