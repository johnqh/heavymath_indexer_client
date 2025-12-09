/**
 * React hooks for analytics and statistics operations
 * Uses React Query for caching and data fetching
 */

import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import type { MarketStats, HealthStatus, ApiResponse } from '../types';
import { IndexerClient } from '../network/IndexerClient';

/**
 * Get market statistics
 * GET /api/stats/markets
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useMarketStats(client);
 * if (data?.success) {
 *   // data.data.total, data.data.byStatus, etc.
 * }
 * ```
 */
export function useMarketStats(
  client: IndexerClient,
  options?: Omit<UseQueryOptions<ApiResponse<MarketStats>>, 'queryKey' | 'queryFn'>
): UseQueryResult<ApiResponse<MarketStats>> {
  return useQuery({
    queryKey: ['heavymath', 'market-stats'],
    queryFn: async () => {
      return await client.getMarketStats();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - stats don't change frequently
    retry: false,
    ...options,
  });
}

/**
 * Get health status of the indexer
 * GET /api/health
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useHealth(client);
 * if (data?.success) {
 *   // data.data.status, data.data.timestamp
 * }
 * ```
 */
export function useHealth(
  client: IndexerClient,
  options?: Omit<UseQueryOptions<ApiResponse<HealthStatus>>, 'queryKey' | 'queryFn'>
): UseQueryResult<ApiResponse<HealthStatus>> {
  return useQuery({
    queryKey: ['heavymath', 'health'],
    queryFn: async () => {
      return await client.getHealth();
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    retry: false,
    ...options,
  });
}
