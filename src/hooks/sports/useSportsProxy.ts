/**
 * @fileoverview Generic Sports API Proxy Hook
 * @description Base hook that all sport-specific hooks wrap.
 */

import { useQuery } from '@tanstack/react-query';
import type { UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import type { IndexerClient } from '../../network/IndexerClient';
import type { SportsApiResponse, SportsQueryParams } from '../../types/sports';

/**
 * Generic hook for fetching sports data through the indexer proxy.
 * Server handles caching; client uses a short staleTime for navigation.
 *
 * @param client - IndexerClient instance
 * @param sport - Sport identifier
 * @param endpoint - API endpoint path (e.g., '/countries', '/fixtures')
 * @param params - Optional query parameters
 * @param options - React Query options (enabled, staleTime overrides, etc.)
 */
export function useSportsProxy<T = unknown>(
  client: IndexerClient,
  sport: string,
  endpoint: string,
  params?: SportsQueryParams,
  options?: Omit<UseQueryOptions<SportsApiResponse<T>>, 'queryKey' | 'queryFn'>
): UseQueryResult<SportsApiResponse<T>> {
  return useQuery({
    queryKey: ['sports', sport, endpoint, params ?? {}],
    queryFn: () => client.getSportsData<T>(sport, endpoint, params),
    staleTime: 30_000, // 30s client-side; server handles real caching
    retry: false,
    ...options,
  });
}
