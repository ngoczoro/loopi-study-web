import { subjectsQueryOptions } from "@/hooks/queries/subjects";
import { focusActiveQueryOptions } from "@/hooks/queries/focus";
import {
  focusAnalyticsSummaryQueryOptions,
  focusStreakQueryOptions,
} from "@/hooks/queries/focusAnalytics";
import { userProfileQueryOptions } from "@/hooks/queries/user";

/**
 * Prefetch critical student data after authReady (deduped with page useQuery).
 * @param {import('@tanstack/react-query').QueryClient} queryClient
 */
export async function prefetchStudentBootstrap(queryClient) {
  await Promise.all([
    queryClient.prefetchQuery(subjectsQueryOptions()),
    queryClient.prefetchQuery(focusActiveQueryOptions()),
    queryClient.prefetchQuery(focusAnalyticsSummaryQueryOptions({})),
    queryClient.prefetchQuery(focusStreakQueryOptions()),
    queryClient.prefetchQuery(userProfileQueryOptions()),
  ]);
}

/**
 * @param {import('@tanstack/react-query').QueryClient} queryClient
 */
export async function prefetchAdminBootstrap(queryClient) {
  await queryClient.prefetchQuery(subjectsQueryOptions());
}
