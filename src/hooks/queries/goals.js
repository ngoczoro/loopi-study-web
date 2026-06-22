import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/queryKeys";
import { unwrapServiceResult } from "@/lib/query/unwrap";
import { useAuthQueryEnabled } from "@/lib/query/useAuthQueryEnabled";
import {
  createGoal,
  deleteGoal,
  listGoals,
  updateGoal,
} from "@/services/goalService";

export const DEFAULT_GOALS_LIST_PARAMS = {
  includeInactive: true,
};

async function fetchGoals(params) {
  const result = await listGoals(params);
  if (!result.success) {
    throw new Error(result.message || "Failed to load goals");
  }
  return result.data;
}

export function goalsListQueryOptions(params = DEFAULT_GOALS_LIST_PARAMS) {
  return {
    queryKey: queryKeys.goals.all(params),
    queryFn: () => fetchGoals(params),
  };
}

export function useGoals(params = DEFAULT_GOALS_LIST_PARAMS, options = {}) {
  const { enabled: enabledOption = true } = options;
  const authEnabled = useAuthQueryEnabled();

  const query = useQuery({
    ...goalsListQueryOptions(params),
    enabled: authEnabled && enabledOption,
  });

  return {
    goals: query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error?.message ?? null,
    refetch: query.refetch,
    query,
  };
}

function invalidateGoalsAndProgress(queryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ["goals"] }),
    queryClient.invalidateQueries({ queryKey: ["progress"] }),
  ]);
}

export function useCreateGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) =>
      unwrapServiceResult(await createGoal(payload), "Failed to create goal"),
    onSuccess: () => invalidateGoalsAndProgress(queryClient),
  });
}

export function useUpdateGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }) =>
      unwrapServiceResult(
        await updateGoal(id, payload),
        "Failed to update goal",
      ),
    onSuccess: () => invalidateGoalsAndProgress(queryClient),
  });
}

export function useDeleteGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) =>
      unwrapServiceResult(await deleteGoal(id), "Failed to delete goal"),
    onSuccess: () => invalidateGoalsAndProgress(queryClient),
  });
}
