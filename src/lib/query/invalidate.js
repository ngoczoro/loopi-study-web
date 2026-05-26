import { queryKeys } from "./queryKeys";

/** @param {import('@tanstack/react-query').QueryClient} queryClient */
export function invalidateFocusDomain(queryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ["focus"] }),
  ]);
}

/** @param {import('@tanstack/react-query').QueryClient} queryClient */
export function invalidatePlannerWeek(queryClient, weekStartDate) {
  if (weekStartDate) {
    return queryClient.invalidateQueries({
      queryKey: queryKeys.planner.week(weekStartDate),
    });
  }
  return queryClient.invalidateQueries({ queryKey: ["planner"] });
}

/** @param {import('@tanstack/react-query').QueryClient} queryClient */
export function invalidateNotes(queryClient) {
  return queryClient.invalidateQueries({ queryKey: queryKeys.notes.all });
}

/** @param {import('@tanstack/react-query').QueryClient} queryClient */
export function invalidateSubjects(queryClient) {
  return queryClient.invalidateQueries({ queryKey: queryKeys.subjects.all });
}

/** @param {import('@tanstack/react-query').QueryClient} queryClient */
export function invalidateNotifications(queryClient) {
  return queryClient.invalidateQueries({
    queryKey: queryKeys.notifications.all,
  });
}

/** @param {import('@tanstack/react-query').QueryClient} queryClient */
export function invalidateAchievements(queryClient) {
  return queryClient.invalidateQueries({ queryKey: ["achievements"] });
}

/** @param {import('@tanstack/react-query').QueryClient} queryClient */
export function invalidateAdminContentSubjects(queryClient) {
  return queryClient.invalidateQueries({
    queryKey: ["admin", "content-management", "subjects"],
  });
}

/** @param {import('@tanstack/react-query').QueryClient} queryClient */
export function invalidateAdminContentItems(queryClient) {
  return queryClient.invalidateQueries({
    queryKey: ["admin", "content-management", "items"],
  });
}

/** @param {import('@tanstack/react-query').QueryClient} queryClient */
export function invalidateAdminViolations(queryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ["admin", "violations", "stats"] }),
    queryClient.invalidateQueries({ queryKey: ["admin", "violations", "list"] }),
  ]);
}
