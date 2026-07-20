import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getMe,
  getBlockedSlots,
  getPreferences,
  replaceBlockedSlots,
} from "@/services/userService";
import { queryKeys } from "@/lib/query/queryKeys";
import { unwrapServiceResult } from "@/lib/query/unwrap";
import { useAuthQueryEnabled } from "@/lib/query/useAuthQueryEnabled";

export function userProfileQueryOptions() {
  return {
    queryKey: queryKeys.user.profile,
    queryFn: async () =>
      unwrapServiceResult(await getMe(), "Failed to fetch profile"),
  };
}

export function blockedSlotsQueryOptions() {
  return {
    queryKey: queryKeys.user.blockedSlots,
    queryFn: async () =>
      unwrapServiceResult(
        await getBlockedSlots(),
        "Failed to fetch blocked slots",
      ),
  };
}

export function userPreferencesQueryOptions() {
  return {
    queryKey: queryKeys.user.preferences,
    queryFn: async () =>
      unwrapServiceResult(await getPreferences(), "Failed to fetch preferences"),
  };
}

export function useUserProfileQuery(options = {}) {
  const authEnabled = useAuthQueryEnabled();
  return useQuery({
    ...userProfileQueryOptions(),
    enabled: authEnabled && (options.enabled ?? true),
  });
}

export function useBlockedSlotsQuery(options = {}) {
  const authEnabled = useAuthQueryEnabled();
  const query = useQuery({
    ...blockedSlotsQueryOptions(),
    enabled: authEnabled && (options.enabled ?? true),
  });

  return {
    blockedSlots: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error?.message ?? null,
    refetch: query.refetch,
    query,
  };
}

export function useUserPreferencesQuery(options = {}) {
  const authEnabled = useAuthQueryEnabled();
  return useQuery({
    ...userPreferencesQueryOptions(),
    enabled: authEnabled && (options.enabled ?? true),
  });
}

export function useBlockedSlotsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (slots) =>
      unwrapServiceResult(
        await replaceBlockedSlots(slots),
        "Failed to update blocked slots",
      ),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.user.blockedSlots, data);
    },
  });
}
