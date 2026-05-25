import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getPlannerSessions } from "@/services/plannerService";
import { queryKeys } from "@/lib/query/queryKeys";
import { unwrapServiceResult } from "@/lib/query/unwrap";
import { useAuthQueryEnabled } from "@/lib/query/useAuthQueryEnabled";

export function plannerWeekQueryOptions(weekStartDate) {
  return {
    queryKey: queryKeys.planner.week(weekStartDate),
    queryFn: async () =>
      unwrapServiceResult(
        await getPlannerSessions(weekStartDate),
        "Failed to fetch planner sessions",
      ),
  };
}

export function usePlannerWeek(weekStartDate, options = {}) {
  const { enabled: enabledOption = true } = options;
  const authEnabled = useAuthQueryEnabled();
  const query = useQuery({
    ...plannerWeekQueryOptions(weekStartDate),
    enabled: authEnabled && enabledOption && Boolean(weekStartDate),
  });

  return {
    sessions: query.data ?? [],
    loading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error?.message ?? null,
    refetch: query.refetch,
    query,
  };
}

export function usePlannerWeekCache(weekStartDate) {
  const queryClient = useQueryClient();

  const setSessions = (updater) => {
    queryClient.setQueryData(queryKeys.planner.week(weekStartDate), (old) => {
      const current = old ?? [];
      return typeof updater === "function" ? updater(current) : updater;
    });
  };

  return { setSessions };
}
