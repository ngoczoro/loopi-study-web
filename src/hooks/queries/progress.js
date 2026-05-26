import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/queryKeys";
import { unwrapServiceResult } from "@/lib/query/unwrap";
import { useAuthQueryEnabled } from "@/lib/query/useAuthQueryEnabled";
import {
  getProgressMilestonesAPI,
  getProgressStreaksAPI,
  getProgressSummaryAPI,
} from "@/services/progressService";

export function progressSummaryQueryOptions() {
  return {
    queryKey: queryKeys.progress.summary,
    queryFn: async () =>
      unwrapServiceResult(
        await getProgressSummaryAPI(),
        "Failed to fetch progress summary",
      ),
  };
}

export function progressStreaksQueryOptions() {
  return {
    queryKey: queryKeys.progress.streaks,
    queryFn: async () =>
      unwrapServiceResult(
        await getProgressStreaksAPI(),
        "Failed to fetch progress streaks",
      ),
  };
}

export function progressMilestonesQueryOptions() {
  return {
    queryKey: queryKeys.progress.milestones,
    queryFn: async () =>
      unwrapServiceResult(
        await getProgressMilestonesAPI(),
        "Failed to fetch progress milestones",
      ),
  };
}

export function useProgressSummary(options = {}) {
  const { enabled: enabledOption = true } = options;
  const authEnabled = useAuthQueryEnabled();
  return useQuery({
    ...progressSummaryQueryOptions(),
    enabled: authEnabled && enabledOption,
  });
}

export function useProgressStreaks(options = {}) {
  const { enabled: enabledOption = true } = options;
  const authEnabled = useAuthQueryEnabled();
  return useQuery({
    ...progressStreaksQueryOptions(),
    enabled: authEnabled && enabledOption,
  });
}

export function useProgressMilestones(options = {}) {
  const { enabled: enabledOption = true } = options;
  const authEnabled = useAuthQueryEnabled();
  return useQuery({
    ...progressMilestonesQueryOptions(),
    enabled: authEnabled && enabledOption,
  });
}

export function useInvalidateProgress() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["progress"] });
}

