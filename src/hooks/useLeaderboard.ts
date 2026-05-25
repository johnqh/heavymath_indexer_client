/**
 * React hook for leaderboard data
 * Uses React Query for caching and data fetching
 */

import { useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Optional } from '@sudobility/types';
import type { LeaderboardEntry, LeaderboardFilters, LeaderboardResponse } from '../types';
import { IndexerClient } from '../network/IndexerClient';

// Stable empty array to prevent unnecessary re-renders
const EMPTY_ENTRIES: LeaderboardEntry[] = [];

/**
 * Return type for the {@link useLeaderboard} hook.
 */
export interface UseLeaderboardReturn {
  /** Array of leaderboard entries (empty array while loading or on error) */
  entries: LeaderboardEntry[];
  /** Total count of entries matching the query */
  count: number;
  /** True while the leaderboard query is loading */
  isLoading: boolean;
  /** Error message from the most recent failed fetch, or null */
  error: Optional<string>;

  /** Trigger a refetch of the leaderboard data from the server */
  refetch: () => void;
  /** Reset the leaderboard query cache */
  reset: () => void;
}

/**
 * Hook for fetching the wallet leaderboard.
 * Uses TanStack Query for caching.
 *
 * @param client - IndexerClient instance, or undefined to disable fetching
 * @param filters - Optional filters for sorting, chain filtering, and pagination
 * @param options - Optional configuration
 * @param options.enabled - When false, disables automatic fetching (default: true)
 * @returns {@link UseLeaderboardReturn} with leaderboard entries, loading/error state, and refetch
 *
 * @example
 * ```tsx
 * const { entries, isLoading } = useLeaderboard(client, {
 *   chainId: 421614,
 *   sortBy: 'net_profit',
 *   limit: 10,
 * });
 * ```
 */
export const useLeaderboard = (
  client: IndexerClient | undefined,
  filters?: LeaderboardFilters,
  options?: { enabled?: boolean }
): UseLeaderboardReturn => {
  const enabled = (options?.enabled ?? true) && !!client;

  const queryClient = useQueryClient();

  const queryKey = useMemo(() => ['heavymath', 'leaderboard', filters] as const, [filters]);

  const {
    data,
    isLoading,
    error: queryError,
    refetch: queryRefetch,
  } = useQuery<LeaderboardResponse>({
    queryKey,
    queryFn: async () => {
      return await client!.getLeaderboard(filters);
    },
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const error = queryError instanceof Error ? queryError.message : null;

  const refetch = useCallback(() => {
    queryRefetch();
  }, [queryRefetch]);

  const reset = useCallback(() => {
    queryClient.resetQueries({ queryKey });
  }, [queryClient, queryKey]);

  return useMemo(
    () => ({
      entries: data?.data ?? EMPTY_ENTRIES,
      count: data?.count ?? 0,
      isLoading,
      error,
      refetch,
      reset,
    }),
    [data, isLoading, error, refetch, reset]
  );
};
