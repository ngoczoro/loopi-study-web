import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createGroup,
  createGroupResource,
  deleteGroup,
  deleteGroupResource,
  listShareableContent,
  getGroup,
  joinGroup,
  leaveGroup,
  listGroupMembers,
  listGroupResources,
  listGroups,
  regenerateInviteCode,
  removeGroupMember,
  updateGroup,
  updateMyGroupSettings,
} from "@/services/groupService";
import { queryKeys } from "@/lib/query/queryKeys";
import { unwrapServiceResult } from "@/lib/query/unwrap";
import { useAuthQueryEnabled } from "@/lib/query/useAuthQueryEnabled";

// Keeps last message / unread badges fresh until realtime arrives (FE-G5).
const GROUPS_POLL_MS = 15000;

export function groupsListQueryOptions() {
  return {
    queryKey: queryKeys.groups.all,
    queryFn: async () =>
      unwrapServiceResult(await listGroups(), "Failed to load groups"),
  };
}

export function groupDetailQueryOptions(groupId) {
  return {
    queryKey: queryKeys.groups.detail(groupId),
    queryFn: async () =>
      unwrapServiceResult(await getGroup(groupId), "Failed to load group"),
  };
}

export function useGroups(options = {}) {
  const { enabled: enabledOption = true } = options;
  const authEnabled = useAuthQueryEnabled();

  const query = useQuery({
    ...groupsListQueryOptions(),
    enabled: authEnabled && enabledOption,
    refetchInterval: GROUPS_POLL_MS,
  });

  return {
    groups: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error?.message ?? null,
    refetch: query.refetch,
  };
}

export function useGroup(groupId, options = {}) {
  const { enabled: enabledOption = true } = options;
  const authEnabled = useAuthQueryEnabled();

  const query = useQuery({
    ...groupDetailQueryOptions(groupId),
    enabled: authEnabled && enabledOption && Boolean(groupId),
  });

  return {
    group: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error?.message ?? null,
    refetch: query.refetch,
  };
}

function cacheGroupAndRefreshList(queryClient, group) {
  if (group?.id) {
    queryClient.setQueryData(queryKeys.groups.detail(group.id), group);
  }
  return queryClient.invalidateQueries({
    queryKey: queryKeys.groups.all,
    exact: true,
  });
}

function dropGroupFromCache(queryClient, groupId) {
  queryClient.setQueryData(queryKeys.groups.all, (groups) =>
    Array.isArray(groups) ? groups.filter((g) => g.id !== groupId) : groups,
  );
  return queryClient.invalidateQueries({
    queryKey: queryKeys.groups.all,
    exact: true,
  });
}

export function useCreateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) =>
      unwrapServiceResult(await createGroup(payload), "Failed to create group"),
    onSuccess: (group) => cacheGroupAndRefreshList(queryClient, group),
  });
}

export function useJoinGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (inviteCode) =>
      unwrapServiceResult(await joinGroup(inviteCode), "Failed to join group"),
    onSuccess: (group) => cacheGroupAndRefreshList(queryClient, group),
  });
}

export function useLeaveGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (groupId) =>
      unwrapServiceResult(await leaveGroup(groupId), "Failed to leave group"),
    onSuccess: (_data, groupId) => dropGroupFromCache(queryClient, groupId),
  });
}

export function useUpdateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ groupId, payload }) =>
      unwrapServiceResult(
        await updateGroup(groupId, payload),
        "Failed to update group",
      ),
    onSuccess: (group) => cacheGroupAndRefreshList(queryClient, group),
  });
}

/** Applies a partial Group patch to both the list and the detail cache. */
export function patchCachedGroup(queryClient, groupId, patch) {
  queryClient.setQueryData(queryKeys.groups.all, (groups) =>
    Array.isArray(groups)
      ? groups.map((group) => (group.id === groupId ? { ...group, ...patch } : group))
      : groups,
  );
  queryClient.setQueryData(queryKeys.groups.detail(groupId), (group) =>
    group ? { ...group, ...patch } : group,
  );
}

export function useUpdateMyGroupSettings(groupId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) =>
      unwrapServiceResult(
        await updateMyGroupSettings(groupId, payload),
        "Failed to update group settings",
      ),
    onMutate: ({ pinned, muted }) => {
      patchCachedGroup(queryClient, groupId, {
        ...(pinned !== undefined ? { isPinned: pinned } : {}),
        ...(muted !== undefined ? { isMuted: muted } : {}),
      });
    },
    onError: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.detail(groupId), exact: true }),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.all, exact: true }),
  });
}

export function useRegenerateInviteCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (groupId) =>
      unwrapServiceResult(
        await regenerateInviteCode(groupId),
        "Failed to regenerate invite code",
      ),
    onSuccess: ({ inviteCode }, groupId) => {
      queryClient.setQueryData(queryKeys.groups.detail(groupId), (group) =>
        group ? { ...group, inviteCode } : group,
      );
    },
  });
}

export function groupMembersQueryOptions(groupId) {
  return {
    queryKey: queryKeys.groups.members(groupId),
    queryFn: async () =>
      unwrapServiceResult(
        await listGroupMembers(groupId),
        "Failed to load members",
      ),
  };
}

export function useGroupMembers(groupId, options = {}) {
  const { enabled: enabledOption = true } = options;
  const authEnabled = useAuthQueryEnabled();

  const query = useQuery({
    ...groupMembersQueryOptions(groupId),
    enabled: authEnabled && enabledOption && Boolean(groupId),
  });

  return {
    members: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error?.message ?? null,
    refetch: query.refetch,
  };
}

export function useGroupResources(groupId, options = {}) {
  const { enabled: enabledOption = true } = options;
  const authEnabled = useAuthQueryEnabled();

  const query = useQuery({
    queryKey: queryKeys.groups.resources(groupId),
    queryFn: async () =>
      unwrapServiceResult(
        await listGroupResources(groupId),
        "Failed to load resources",
      ),
    enabled: authEnabled && enabledOption && Boolean(groupId),
  });

  return {
    resources: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error?.message ?? null,
    refetch: query.refetch,
  };
}

export function useCreateGroupResource(groupId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) =>
      unwrapServiceResult(
        await createGroupResource(groupId, payload),
        "Failed to share resource",
      ),
    onSuccess: (resource) => {
      queryClient.setQueryData(queryKeys.groups.resources(groupId), (resources) =>
        Array.isArray(resources)
          ? [resource, ...resources.filter((item) => item.id !== resource.id)]
          : resources,
      );
      return queryClient.invalidateQueries({ queryKey: queryKeys.groups.resources(groupId) });
    },
  });
}

export function useDeleteGroupResource(groupId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (resourceId) =>
      unwrapServiceResult(
        await deleteGroupResource(groupId, resourceId),
        "Failed to remove resource",
      ),
    onSuccess: (_data, resourceId) => {
      queryClient.setQueryData(queryKeys.groups.resources(groupId), (resources) =>
        Array.isArray(resources)
          ? resources.filter((item) => item.id !== resourceId)
          : resources,
      );
    },
  });
}

/** Own notes/files for the share picker; fetched only while the picker is open. */
export function useShareableContent(options = {}) {
  const { enabled: enabledOption = true } = options;
  const authEnabled = useAuthQueryEnabled();

  const query = useQuery({
    queryKey: ["content", "group-share-picker"],
    queryFn: async () =>
      unwrapServiceResult(
        await listShareableContent(),
        "Failed to load your notes and files",
      ),
    enabled: authEnabled && enabledOption,
    staleTime: 60_000,
  });

  return {
    items: Array.isArray(query.data) ? query.data : [],
    isLoading: query.isLoading,
    error: query.error?.message ?? null,
    refetch: query.refetch,
  };
}

export function useRemoveGroupMember(groupId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId) =>
      unwrapServiceResult(
        await removeGroupMember(groupId, userId),
        "Failed to remove member",
      ),
    onSuccess: (_data, userId) => {
      queryClient.setQueryData(queryKeys.groups.members(groupId), (members) =>
        Array.isArray(members)
          ? members.filter((member) => member.userId !== userId)
          : members,
      );
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.groups.detail(groupId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.groups.all, exact: true }),
      ]);
    },
  });
}

export function useDeleteGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (groupId) =>
      unwrapServiceResult(await deleteGroup(groupId), "Failed to delete group"),
    onSuccess: (_data, groupId) => dropGroupFromCache(queryClient, groupId),
  });
}
