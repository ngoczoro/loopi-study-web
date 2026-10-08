import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/queryKeys";
import { unwrapServiceResult } from "@/lib/query/unwrap";
import { useAuthQueryEnabled } from "@/lib/query/useAuthQueryEnabled";
import {
  createGroupGoal,
  createGroupTask,
  deleteGroupGoal,
  deleteGroupTask,
  getGroupProgress,
  listGroupGoals,
  listGroupTasks,
  remindGroupTask,
  updateGroupGoal,
  updateGroupTask,
} from "@/services/groupService";

const PROGRESS_POLL_MS = 30_000;

function invalidateProgress(queryClient, groupId) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.groups.goals(groupId) }),
    queryClient.invalidateQueries({ queryKey: ["groups", groupId, "tasks"] }),
    queryClient.invalidateQueries({ queryKey: queryKeys.groups.progress(groupId) }),
    queryClient.invalidateQueries({ queryKey: queryKeys.groups.detail(groupId) }),
    queryClient.invalidateQueries({ queryKey: queryKeys.groups.all, exact: true }),
  ]);
}

export function useGroupGoals(groupId) {
  const authEnabled = useAuthQueryEnabled();
  const query = useQuery({
    queryKey: queryKeys.groups.goals(groupId),
    queryFn: async () =>
      unwrapServiceResult(await listGroupGoals(groupId), "Failed to load goals"),
    enabled: authEnabled && Boolean(groupId),
  });
  return {
    goals: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error?.message ?? null,
    refetch: query.refetch,
  };
}

export function useGroupTasks(groupId) {
  const authEnabled = useAuthQueryEnabled();
  const query = useQuery({
    queryKey: queryKeys.groups.tasks(groupId),
    queryFn: async () =>
      unwrapServiceResult(await listGroupTasks(groupId), "Failed to load tasks"),
    enabled: authEnabled && Boolean(groupId),
    refetchInterval: PROGRESS_POLL_MS,
  });
  return {
    tasks: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error?.message ?? null,
    refetch: query.refetch,
  };
}

export function useGroupProgress(groupId) {
  const authEnabled = useAuthQueryEnabled();
  const query = useQuery({
    queryKey: queryKeys.groups.progress(groupId),
    queryFn: async () =>
      unwrapServiceResult(
        await getGroupProgress(groupId),
        "Failed to load group progress",
      ),
    enabled: authEnabled && Boolean(groupId),
    refetchInterval: PROGRESS_POLL_MS,
  });
  return {
    progress: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error?.message ?? null,
    refetch: query.refetch,
  };
}

function mutation(queryClient, groupId, mutationFn) {
  return {
    mutationFn,
    onSuccess: () => invalidateProgress(queryClient, groupId),
  };
}

export function useCreateGroupGoal(groupId) {
  const queryClient = useQueryClient();
  return useMutation(
    mutation(queryClient, groupId, async (payload) =>
      unwrapServiceResult(
        await createGroupGoal(groupId, payload),
        "Failed to create goal",
      ),
    ),
  );
}

export function useUpdateGroupGoal(groupId) {
  const queryClient = useQueryClient();
  return useMutation(
    mutation(queryClient, groupId, async ({ goalId, payload }) =>
      unwrapServiceResult(
        await updateGroupGoal(groupId, goalId, payload),
        "Failed to update goal",
      ),
    ),
  );
}

export function useDeleteGroupGoal(groupId) {
  const queryClient = useQueryClient();
  return useMutation(
    mutation(queryClient, groupId, async (goalId) =>
      unwrapServiceResult(
        await deleteGroupGoal(groupId, goalId),
        "Failed to delete goal",
      ),
    ),
  );
}

export function useCreateGroupTask(groupId) {
  const queryClient = useQueryClient();
  return useMutation(
    mutation(queryClient, groupId, async (payload) =>
      unwrapServiceResult(
        await createGroupTask(groupId, payload),
        "Failed to create task",
      ),
    ),
  );
}

export function useUpdateGroupTask(groupId) {
  const queryClient = useQueryClient();
  return useMutation(
    mutation(queryClient, groupId, async ({ taskId, payload }) =>
      unwrapServiceResult(
        await updateGroupTask(groupId, taskId, payload),
        "Failed to update task",
      ),
    ),
  );
}

export function useDeleteGroupTask(groupId) {
  const queryClient = useQueryClient();
  return useMutation(
    mutation(queryClient, groupId, async (taskId) =>
      unwrapServiceResult(
        await deleteGroupTask(groupId, taskId),
        "Failed to delete task",
      ),
    ),
  );
}

export function useRemindGroupTask(groupId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (taskId) =>
      unwrapServiceResult(
        await remindGroupTask(groupId, taskId),
        "Failed to send reminder",
      ),
    onSuccess: ({ remindedAt }, taskId) => {
      queryClient.setQueryData(queryKeys.groups.tasks(groupId), (tasks) =>
        Array.isArray(tasks)
          ? tasks.map((task) =>
              task.id === taskId ? { ...task, lastRemindedAt: remindedAt } : task,
            )
          : tasks,
      );
    },
  });
}
