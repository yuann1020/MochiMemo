import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { generateInsights } from '@/services/ai/insights';
import { useAuth } from '@/hooks/use-auth';

export const MIN_INSIGHTS_EXPENSE_COUNT = 3;

/**
 * Fetches AI-generated spending insights for the current user.
 *
 * @param monthlyExpenseCount - derived from useExpenseStats(). When < MIN_INSIGHTS_EXPENSE_COUNT
 *   the query is disabled to avoid wasting API calls.
 *
 * staleTime is Infinity so insights are never auto-refetched. The user taps
 * "Refresh Insights" which calls useRefreshInsights() to invalidate the cache.
 */
export function useAIInsights(monthlyExpenseCount: number) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['ai-insights', user?.id],
    queryFn: generateInsights,
    enabled: Boolean(user) && monthlyExpenseCount >= MIN_INSIGHTS_EXPENSE_COUNT,
    staleTime: Infinity,
    gcTime: 10 * 60 * 1000,
    retry: 1,
  });
}

/** Returns a stable callback that invalidates the AI insights cache, triggering a re-fetch. */
export function useRefreshInsights() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['ai-insights', user?.id] });
  }, [queryClient, user?.id]);
}
