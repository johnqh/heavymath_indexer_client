/**
 * React hooks for stadium data
 * Uses React Query for caching and data fetching
 */

import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import type { StadiumData } from '../types';
import { IndexerClient } from '../network/IndexerClient';

/**
 * Get all World Cup 2026 stadiums.
 * GET /api/stadiums
 */
export function useStadiums(
  client: IndexerClient,
  options?: Omit<UseQueryOptions<StadiumData[]>, 'queryKey' | 'queryFn'>
): UseQueryResult<StadiumData[]> {
  return useQuery({
    queryKey: ['heavymath', 'stadiums'],
    queryFn: async () => {
      return await client.getStadiums();
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 hours (static data)
    retry: false,
    ...options,
  });
}

/**
 * Get a single stadium by ID.
 * GET /api/stadiums/:id
 */
export function useStadium(
  client: IndexerClient,
  stadiumId: number,
  options?: Omit<UseQueryOptions<StadiumData>, 'queryKey' | 'queryFn'>
): UseQueryResult<StadiumData> {
  return useQuery({
    queryKey: ['heavymath', 'stadium', stadiumId],
    queryFn: async () => {
      return await client.getStadium(stadiumId);
    },
    staleTime: 24 * 60 * 60 * 1000,
    retry: false,
    enabled: stadiumId > 0,
    ...options,
  });
}
