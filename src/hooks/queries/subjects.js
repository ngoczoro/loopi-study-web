import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject,
} from "@/services/subjectService";
import { queryKeys } from "@/lib/query/queryKeys";
import { unwrapServiceResult } from "@/lib/query/unwrap";
import { useAuthQueryEnabled } from "@/lib/query/useAuthQueryEnabled";
import { invalidateSubjects } from "@/lib/query/invalidate";

export function subjectsQueryOptions() {
  return {
    queryKey: queryKeys.subjects.all,
    queryFn: async () => unwrapServiceResult(await getSubjects(), "Failed to fetch subjects"),
  };
}

export function useSubjectsQuery(options = {}) {
  const { enabled: enabledOption = true } = options;
  const authEnabled = useAuthQueryEnabled();
  const query = useQuery({
    ...subjectsQueryOptions(),
    enabled: authEnabled && enabledOption,
  });

  return {
    subjects: query.data ?? [],
    subjectsLoading: query.isLoading,
    subjectsError: query.error?.message ?? null,
    isFetching: query.isFetching,
    refetch: query.refetch,
    query,
  };
}

/** Back-compat alias used across the app. */
export function useSubjects(options = {}) {
  const { enabled: enabledOption = true } = options;
  const result = useSubjectsQuery({ enabled: enabledOption });
  return {
    subjects: result.subjects,
    subjectsLoading: result.subjectsLoading,
    subjectsError: result.subjectsError,
    fetchSubjects: result.refetch,
    refetch: result.refetch,
  };
}

export function useSubjectMutations() {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (payload) =>
      unwrapServiceResult(await createSubject(payload), "Failed to create subject"),
    onSuccess: () => invalidateSubjects(queryClient),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }) =>
      unwrapServiceResult(
        await updateSubject(id, updates),
        "Failed to update subject",
      ),
    onSuccess: () => invalidateSubjects(queryClient),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) =>
      unwrapServiceResult(await deleteSubject(id), "Failed to delete subject"),
    onSuccess: () => invalidateSubjects(queryClient),
  });

  const prefetchSubject = async (id) => {
    const result = await getSubjectById(id);
    if (!result.success) {
      return { ok: false, message: result.message };
    }
    queryClient.setQueryData(queryKeys.subjects.all, (old) => {
      const list = old ?? [];
      if (list.some((s) => s.id === id)) {
        return list.map((s) => (s.id === id ? result.data : s));
      }
      return [...list, result.data];
    });
    return { ok: true, data: result.data };
  };

  const addSubject = async (payload) => {
    try {
      const data = await createMutation.mutateAsync(payload);
      return { ok: true, data };
    } catch (e) {
      return { ok: false, message: e.message };
    }
  };

  const updateSubjectAction = async (id, updates) => {
    try {
      const data = await updateMutation.mutateAsync({ id, updates });
      return { ok: true, data };
    } catch (e) {
      return { ok: false, message: e.message };
    }
  };

  const deleteSubjectAction = async (id) => {
    try {
      await deleteMutation.mutateAsync(id);
      return { ok: true };
    } catch (e) {
      return { ok: false, message: e.message };
    }
  };

  return {
    addSubject,
    updateSubject: updateSubjectAction,
    deleteSubject: deleteSubjectAction,
    fetchSubjectById: prefetchSubject,
    isPending:
      createMutation.isPending ||
      updateMutation.isPending ||
      deleteMutation.isPending,
  };
}
