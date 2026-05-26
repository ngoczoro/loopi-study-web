import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/queryKeys";
import { unwrapServiceResult } from "@/lib/query/unwrap";
import { useAuthQueryEnabled } from "@/lib/query/useAuthQueryEnabled";
import {
  invalidateAdminContentItems,
  invalidateAdminContentSubjects,
} from "@/lib/query/invalidate";
import {
  deleteAdminContent,
  deleteAdminSubject,
  getAdminContent,
  getAdminSubjects,
} from "@/services/adminContentManagementService";

export const DEFAULT_ADMIN_LIST_PARAMS = { page: 1, limit: 100 };

async function fetchAdminSubjects(params) {
  const result = await getAdminSubjects(params);
  if (!result.success) {
    throw new Error(result.message || "Failed to fetch subjects");
  }
  return {
    subjects: result.subjects,
    pagination: result.pagination,
  };
}

async function fetchAdminContent(params) {
  const result = await getAdminContent(params);
  if (!result.success) {
    throw new Error(result.message || "Failed to fetch content");
  }
  return {
    content: result.content,
    pagination: result.pagination,
  };
}

export function adminSubjectsQueryOptions(params = DEFAULT_ADMIN_LIST_PARAMS) {
  return {
    queryKey: queryKeys.adminContent.subjects(params),
    queryFn: () => fetchAdminSubjects(params),
  };
}

export function adminContentQueryOptions(params = DEFAULT_ADMIN_LIST_PARAMS) {
  return {
    queryKey: queryKeys.adminContent.items(params),
    queryFn: () => fetchAdminContent(params),
  };
}

export function useAdminSubjects(params = DEFAULT_ADMIN_LIST_PARAMS, options = {}) {
  const { enabled: enabledOption = true } = options;
  const authEnabled = useAuthQueryEnabled();

  const query = useQuery({
    ...adminSubjectsQueryOptions(params),
    enabled: authEnabled && enabledOption,
  });

  return {
    subjects: query.data?.subjects ?? [],
    pagination: query.data?.pagination ?? null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error?.message ?? null,
    refetch: query.refetch,
    query,
  };
}

export function useAdminContent(params = DEFAULT_ADMIN_LIST_PARAMS, options = {}) {
  const { enabled: enabledOption = true } = options;
  const authEnabled = useAuthQueryEnabled();

  const query = useQuery({
    ...adminContentQueryOptions(params),
    enabled: authEnabled && enabledOption,
  });

  return {
    content: query.data?.content ?? [],
    pagination: query.data?.pagination ?? null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error?.message ?? null,
    refetch: query.refetch,
    query,
  };
}

export function useAdminDeleteSubject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) =>
      unwrapServiceResult(
        await deleteAdminSubject(id),
        "Failed to delete subject",
      ),
    onSuccess: () => invalidateAdminContentSubjects(queryClient),
  });
}

export function useAdminDeleteContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) =>
      unwrapServiceResult(
        await deleteAdminContent(id),
        "Failed to delete content",
      ),
    onSuccess: () => invalidateAdminContentItems(queryClient),
  });
}
