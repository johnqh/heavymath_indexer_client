/**
 * React hooks for analytics and statistics operations
 * Uses React Query for caching and data fetching
 */

import { useMemo } from 'react';
import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import type { MarketStats, HealthStatus, ApiResponse } from '../types';
import { IndexerClient } from '../network/IndexerClient';
import { FetchNetworkClient } from '../network/FetchNetworkClient';

/**
 * Get market statistics
 * GET /api/stats/markets
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useMarketStats('http://localhost:42069');
 * if (data?.success) {
 *   // data.data.totalMarkets, data.data.activeMarkets, etc.
 * }
 * ```
 */
export function useMarketStats(
  endpointUrl: string,
  options?: Omit<UseQueryOptions<ApiResponse<MarketStats>>, 'queryKey' | 'queryFn'>
): UseQueryResult<ApiResponse<MarketStats>> {
  const client = useMemo(
    () => new IndexerClient(endpointUrl, new FetchNetworkClient()),
    [endpointUrl]
  );

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
 * const { data, isLoading } = useHealth('http://localhost:42069');
 * if (data?.success) {
 *   // data.data.status, data.data.database
 * }
 * ```
 */
export function useHealth(
  endpointUrl: string,
  options?: Omit<UseQueryOptions<ApiResponse<HealthStatus>>, 'queryKey' | 'queryFn'>
): UseQueryResult<ApiResponse<HealthStatus>> {
  const client = useMemo(
    () => new IndexerClient(endpointUrl, new FetchNetworkClient()),
    [endpointUrl]
  );

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
