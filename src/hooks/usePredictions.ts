/**
 * React hooks for prediction operations
 * Uses React Query for caching and data fetching
 */

import { useMemo } from 'react';
import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import type { Prediction, PaginatedResponse, ApiResponse, PredictionFilters } from '../types';
import { IndexerClient } from '../network/IndexerClient';
import { FetchNetworkClient } from '../network/FetchNetworkClient';

/**
 * Get predictions with optional filtering
 * GET /api/predictions
 *
 * @example
 * ```tsx
 * const { data, isLoading } = usePredictions(
 *   'http://localhost:42069',
 *   { user: '0x123...', claimed: false }
 * );
 * ```
 */
export function usePredictions(
  endpointUrl: string,
  filters?: PredictionFilters,
  options?: Omit<UseQueryOptions<PaginatedResponse<Prediction>>, 'queryKey' | 'queryFn'>
): UseQueryResult<PaginatedResponse<Prediction>> {
  const client = useMemo(
    () => new IndexerClient(endpointUrl, new FetchNetworkClient()),
    [endpointUrl]
  );

  return useQuery({
    queryKey: ['heavymath', 'predictions', filters],
    queryFn: async () => {
      return await client.getPredictions(filters);
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    retry: false,
    ...options,
  });
}

/**
 * Get user's predictions
 * Convenience hook for user's betting history
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useUserPredictions(
 *   'http://localhost:42069',
 *   '0x123...'
 * );
 * ```
 */
export function useUserPredictions(
  endpointUrl: string,
  walletAddress: string | undefined,
  filters?: Omit<PredictionFilters, 'user'>,
  options?: Omit<UseQueryOptions<PaginatedResponse<Prediction>>, 'queryKey' | 'queryFn'>
): UseQueryResult<PaginatedResponse<Prediction>> {
  return usePredictions(
    endpointUrl,
    {
      user: walletAddress,
      ...filters,
    },
    {
      ...options,
      enabled: !!walletAddress && (options?.enabled ?? true),
    }
  );
}

/**
 * Get user's active bets (unclaimed predictions)
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useActiveBets('http://localhost:42069', '0x123...');
 * ```
 */
export function useActiveBets(
  endpointUrl: string,
  walletAddress: string | undefined,
  options?: Omit<UseQueryOptions<PaginatedResponse<Prediction>>, 'queryKey' | 'queryFn'>
): UseQueryResult<PaginatedResponse<Prediction>> {
  return useUserPredictions(
    endpointUrl,
    walletAddress,
    {
      claimed: false,
      limit: 100,
    },
    options
  );
}

/**
 * Get user's past bets (claimed predictions)
 *
 * @example
 * ```tsx
 * const { data, isLoading } = usePastBets('http://localhost:42069', '0x123...');
 * ```
 */
export function usePastBets(
  endpointUrl: string,
  walletAddress: string | undefined,
  options?: Omit<UseQueryOptions<PaginatedResponse<Prediction>>, 'queryKey' | 'queryFn'>
): UseQueryResult<PaginatedResponse<Prediction>> {
  return useUserPredictions(
    endpointUrl,
    walletAddress,
    {
      claimed: true,
      limit: 100,
    },
    options
  );
}

/**
 * Get a specific prediction by ID
 * GET /api/predictions/:id
 *
 * @example
 * ```tsx
 * const { data, isLoading } = usePrediction(
 *   'http://localhost:42069',
 *   '1-market-123-0xuser...'
 * );
 * ```
 */
export function usePrediction(
  endpointUrl: string,
  predictionId: string | undefined,
  options?: Omit<UseQueryOptions<ApiResponse<Prediction>>, 'queryKey' | 'queryFn'>
): UseQueryResult<ApiResponse<Prediction>> {
  const client = useMemo(
    () => new IndexerClient(endpointUrl, new FetchNetworkClient()),
    [endpointUrl]
  );

  return useQuery({
    queryKey: ['heavymath', 'prediction', predictionId],
    queryFn: async () => {
      if (!predictionId) throw new Error('Prediction ID is required');
      return await client.getPrediction(predictionId);
    },
    enabled: !!predictionId,
    staleTime: 2 * 60 * 1000,
    retry: false,
    ...options,
  });
}

/**
 * Get complete betting history for a user (active + claimed)
 * Convenience hook that combines active and past bets
 *
 * @example
 * ```tsx
 * const { active, claimed, isLoading } = useUserBettingHistory(
 *   'http://localhost:42069',
 *   '0x123...'
 * );
 * ```
 */
export function useUserBettingHistory(
  endpointUrl: string,
  walletAddress: string | undefined
): {
  active: UseQueryResult<PaginatedResponse<Prediction>>;
  claimed: UseQueryResult<PaginatedResponse<Prediction>>;
  isLoading: boolean;
  isError: boolean;
} {
  const active = useActiveBets(endpointUrl, walletAddress);
  const claimed = usePastBets(endpointUrl, walletAddress);

  return {
    active,
    claimed,
    isLoading: active.isLoading || claimed.isLoading,
    isError: active.isError || claimed.isError,
  };
}
