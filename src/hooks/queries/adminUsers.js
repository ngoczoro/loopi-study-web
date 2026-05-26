import { useMutation, useQueryClient } from "@tanstack/react-query";
import { invalidateAdminViolations } from "@/lib/query/invalidate";
import { lockAdminUser, unlockAdminUser } from "@/services/adminUserService";

async function assertSuccess(result, fallbackMessage) {
  if (!result?.success) {
    throw new Error(result?.message || fallbackMessage);
  }
  return result;
}

export function useAdminLockUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reason }) =>
      assertSuccess(
        await lockAdminUser(id, { reason }),
        "Failed to lock account",
      ),
    onSuccess: () => invalidateAdminViolations(queryClient),
  });
}

export function useAdminUnlockUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) =>
      assertSuccess(await unlockAdminUser(id), "Failed to unlock account"),
    onSuccess: () => invalidateAdminViolations(queryClient),
  });
}
