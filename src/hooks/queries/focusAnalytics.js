import { useQuery } from "@tanstack/react-query";
import {
  getFocusAnalyticsSummaryAPI,
  getFocusAnalyticsTrendsAPI,
  getFocusSubjectStatsAPI,
  getFocusStreakAPI,
} from "@/services/focusAnalyticsService";
import { queryKeys } from "@/lib/query/queryKeys";
import { unwrapServiceResult } from "@/lib/query/unwrap";
import { useAuthQueryEnabled } from "@/lib/query/useAuthQueryEnabled";

export function focusAnalyticsSummaryQueryOptions(params = {}) {
  return {
    queryKey: queryKeys.focus.analytics.summary(params),
    queryFn: async () =>
      unwrapServiceResult(
        await getFocusAnalyticsSummaryAPI(params),
        "Failed to fetch analytics summary",
      ),
  };
}

export function focusStreakQueryOptions() {
  return {
    queryKey: queryKeys.focus.analytics.streak,
    queryFn: async () =>
      unwrapServiceResult(
        await getFocusStreakAPI(),
        "Failed to fetch study streak",
      ),
  };
}

function focusTrendsQueryOptions(params = {}) {
  return {
    queryKey: queryKeys.focus.analytics.trends(params),
    queryFn: async () =>
      unwrapServiceResult(
        await getFocusAnalyticsTrendsAPI(params),
        "Failed to fetch analytics trends",
      ),
  };
}

function focusSubjectStatsQueryOptions(params = {}) {
  return {
    queryKey: queryKeys.focus.analytics.subjects(params),
    queryFn: async () =>
      unwrapServiceResult(
        await getFocusSubjectStatsAPI(params),
        "Failed to fetch subject statistics",
      ),
  };
}

export function useFocusAnalyticsSummary(params = {}, options = {}) {
  const authEnabled = useAuthQueryEnabled();
  return useQuery({
    ...focusAnalyticsSummaryQueryOptions(params),
    enabled: authEnabled && (options.enabled ?? true),
  });
}

export function useFocusStreak(options = {}) {
  const authEnabled = useAuthQueryEnabled();
  return useQuery({
    ...focusStreakQueryOptions(),
    enabled: authEnabled && (options.enabled ?? true),
  });
}

/**
 * Composed analytics for Dashboard / Progress (parallel queries, shared cache).
 */
export function useFocusAnalytics(options = {}) {
  const { days = 30, enabled: enabledOption = true } = options;
  const authEnabled = useAuthQueryEnabled();
  const enabled = authEnabled && enabledOption;
  const trendParams = { days };

  const summaryQuery = useQuery({
    ...focusAnalyticsSummaryQueryOptions({}),
    enabled,
  });

  const trendsQuery = useQuery({
    ...focusTrendsQueryOptions(trendParams),
    enabled,
  });

  const subjectStatsQuery = useQuery({
    ...focusSubjectStatsQueryOptions({}),
    enabled,
  });

  const streakQuery = useQuery({
    ...focusStreakQueryOptions(),
    enabled,
  });

  const loading =
    summaryQuery.isLoading ||
    trendsQuery.isLoading ||
    subjectStatsQuery.isLoading ||
    streakQuery.isLoading;

  const error =
    summaryQuery.error?.message ||
    trendsQuery.error?.message ||
    subjectStatsQuery.error?.message ||
    streakQuery.error?.message ||
    null;

  const reload = async () => {
    await Promise.all([
      summaryQuery.refetch(),
      trendsQuery.refetch(),
      subjectStatsQuery.refetch(),
      streakQuery.refetch(),
    ]);
  };

  return {
    summary: summaryQuery.data ?? null,
    trends: trendsQuery.data ?? null,
    subjects: subjectStatsQuery.data ?? [],
    streak: streakQuery.data ?? null,
    loading,
    error,
    reload,
  };
}
