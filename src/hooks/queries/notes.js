import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getNotesAPI,
  createNoteAPI,
  updateNoteAPI,
  deleteNoteAPI,
} from "@/services/noteService";
import { queryKeys } from "@/lib/query/queryKeys";
import { unwrapServiceResult } from "@/lib/query/unwrap";
import { useAuthQueryEnabled } from "@/lib/query/useAuthQueryEnabled";
import { invalidateNotes } from "@/lib/query/invalidate";

export function notesQueryOptions() {
  return {
    queryKey: queryKeys.notes.all,
    queryFn: async () =>
      unwrapServiceResult(await getNotesAPI(), "Failed to fetch notes"),
  };
}

export function useNotesQuery(options = {}) {
  const { enabled: enabledOption = true } = options;
  const authEnabled = useAuthQueryEnabled();
  const query = useQuery({
    ...notesQueryOptions(),
    enabled: authEnabled && enabledOption,
  });

  return {
    notes: query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error?.message ?? null,
    refetch: query.refetch,
    query,
  };
}

export function useNoteMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => invalidateNotes(queryClient);

  const createMutation = useMutation({
    mutationFn: async ({ title, content, subjectId }) =>
      unwrapServiceResult(
        await createNoteAPI(title, content, subjectId),
        "Failed to create note",
      ),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) =>
      unwrapServiceResult(
        await updateNoteAPI(id, data),
        "Failed to update note",
      ),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) =>
      unwrapServiceResult(await deleteNoteAPI(id), "Failed to delete note"),
    onSuccess: invalidate,
  });

  return {
    createNote: createMutation.mutateAsync,
    updateNote: updateMutation.mutateAsync,
    deleteNote: deleteMutation.mutateAsync,
    isPending:
      createMutation.isPending ||
      updateMutation.isPending ||
      deleteMutation.isPending,
  };
}
