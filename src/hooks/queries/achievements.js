import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/queryKeys";
import { unwrapServiceResult } from "@/lib/query/unwrap";
import { useAuthQueryEnabled } from "@/lib/query/useAuthQueryEnabled";
import { getAchievementBadgesAPI } from "@/services/achievementsService";

export function achievementBadgesQueryOptions() {
  return {
    queryKey: queryKeys.achievements.badges,
    queryFn: async () =>
      unwrapServiceResult(
        await getAchievementBadgesAPI(),
        "Failed to fetch badges",
      ),
  };
}

export function useAchievementBadges(options = {}) {
  const { enabled: enabledOption = true } = options;
  const authEnabled = useAuthQueryEnabled();

  const query = useQuery({
    ...achievementBadgesQueryOptions(),
    enabled: authEnabled && enabledOption,
  });

  return {
    badges: Array.isArray(query.data) ? query.data : [],
    isLoading: query.isLoading,
    error: query.error?.message ?? null,
    refetch: query.refetch,
    query,
  };
}
