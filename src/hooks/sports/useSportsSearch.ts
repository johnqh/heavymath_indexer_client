/**
 * @fileoverview Cross-Sport Team Search Hook
 * @description Hook for searching teams across all sports via the indexer.
 */

import { useQuery } from '@tanstack/react-query';
import type { UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import type { IndexerClient } from '../../network/IndexerClient';
import type { ApiResponse } from '../../types';
import type { SportsSearchResponse } from '../../types/sports';

/**
 * Search teams across all sports.
 * Automatically disabled when query is shorter than 3 characters.
 *
 * @param client - IndexerClient instance
 * @param query - Search query string
 * @param options - React Query options overrides
 */
export function useSportsSearch(
  client: IndexerClient,
  query: string,
  options?: Omit<UseQueryOptions<ApiResponse<SportsSearchResponse>>, 'queryKey' | 'queryFn'>
): UseQueryResult<ApiResponse<SportsSearchResponse>> {
  return useQuery({
    queryKey: ['sports', 'search', query],
    queryFn: () => client.searchSports(query),
    staleTime: 60_000,
    retry: false,
    enabled: query.length >= 3,
    ...options,
  });
}
