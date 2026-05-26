import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/queryKeys";
import { unwrapServiceResult } from "@/lib/query/unwrap";
import { useAuthQueryEnabled } from "@/lib/query/useAuthQueryEnabled";
import { invalidateAdminViolations } from "@/lib/query/invalidate";
import {
  getAdminViolations,
  getAdminViolationStats,
  resolveAdminViolation,
} from "@/services/adminViolationService";

export const DEFAULT_ADMIN_VIOLATIONS_LIST_PARAMS = {
  page: 1,
  limit: 100,
  resolved: "all",
};

async function fetchAdminViolationStats(params) {
  const result = await getAdminViolationStats(params);
  if (!result.success) {
    throw new Error(result.message || "Failed to load violation stats");
  }
  return result.data;
}

async function fetchAdminViolations(params) {
  const result = await getAdminViolations(params);
  if (!result.success) {
    throw new Error(result.message || "Failed to load violations");
  }
  return {
    flaggedUsers: result.flaggedUsers,
    pagination: result.pagination,
  };
}

export function adminViolationStatsQueryOptions(params = {}) {
  return {
    queryKey: queryKeys.adminViolations.stats(params),
    queryFn: () => fetchAdminViolationStats(params),
  };
}

export function adminViolationsListQueryOptions(
  params = DEFAULT_ADMIN_VIOLATIONS_LIST_PARAMS,
) {
  return {
    queryKey: queryKeys.adminViolations.list(params),
    queryFn: () => fetchAdminViolations(params),
  };
}

export function useAdminViolationStats(params = {}, options = {}) {
  const { enabled: enabledOption = true } = options;
  const authEnabled = useAuthQueryEnabled();

  const query = useQuery({
    ...adminViolationStatsQueryOptions(params),
    enabled: authEnabled && enabledOption,
  });

  return {
    stats: query.data ?? null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error?.message ?? null,
    refetch: query.refetch,
    query,
  };
}

export function useAdminViolations(
  params = DEFAULT_ADMIN_VIOLATIONS_LIST_PARAMS,
  options = {},
) {
  const { enabled: enabledOption = true } = options;
  const authEnabled = useAuthQueryEnabled();

  const query = useQuery({
    ...adminViolationsListQueryOptions(params),
    enabled: authEnabled && enabledOption,
  });

  return {
    flaggedUsers: query.data?.flaggedUsers ?? [],
    pagination: query.data?.pagination ?? null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error?.message ?? null,
    refetch: query.refetch,
    query,
  };
}

export function useAdminResolveViolation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) =>
      unwrapServiceResult(
        await resolveAdminViolation(id),
        "Failed to resolve violation",
      ),
    onSuccess: () => invalidateAdminViolations(queryClient),
  });
}
