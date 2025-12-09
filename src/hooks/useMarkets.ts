/**
 * React hooks for market operations
 * Uses React Query for caching and data fetching
 */

import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import type {
  Market,
  Prediction,
  StateHistory,
  PaginatedResponse,
  ApiResponse,
  MarketFilters,
} from '../types';
import { IndexerClient } from '../network/IndexerClient';

/**
 * Get all markets with optional filtering
 * GET /api/markets
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useMarkets(
 *   client,
 *   { status: 'Active', limit: 10 }
 * );
 * ```
 */
export function useMarkets(
  client: IndexerClient,
  filters?: MarketFilters,
  options?: Omit<UseQueryOptions<PaginatedResponse<Market>>, 'queryKey' | 'queryFn'>
): UseQueryResult<PaginatedResponse<Market>> {
  return useQuery({
    queryKey: ['heavymath', 'markets', filters],
    queryFn: async () => {
      return await client.getMarkets(filters);
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: false,
    ...options,
  });
}

/**
 * Get active markets only
 * Convenience hook for the most common use case
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useActiveMarkets(client, 20);
 * ```
 */
export function useActiveMarkets(
  client: IndexerClient,
  limit: number = 50,
  options?: Omit<UseQueryOptions<PaginatedResponse<Market>>, 'queryKey' | 'queryFn'>
): UseQueryResult<PaginatedResponse<Market>> {
  return useMarkets(
    client,
    {
      status: 'Active',
      limit,
    },
    options
  );
}

/**
 * Get a specific market by ID
 * GET /api/markets/:id
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useMarket(client, '1-market-123');
 * ```
 */
export function useMarket(
  client: IndexerClient,
  marketId: string | undefined,
  options?: Omit<UseQueryOptions<ApiResponse<Market>>, 'queryKey' | 'queryFn'>
): UseQueryResult<ApiResponse<Market>> {
  return useQuery({
    queryKey: ['heavymath', 'market', marketId],
    queryFn: async () => {
      if (!marketId) throw new Error('Market ID is required');
      return await client.getMarket(marketId);
    },
    enabled: !!marketId,
    staleTime: 2 * 60 * 1000,
    retry: false,
    ...options,
  });
}

/**
 * Get all predictions for a specific market
 * GET /api/markets/:id/predictions
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useMarketPredictions(client, '1-market-123');
 * ```
 */
export function useMarketPredictions(
  client: IndexerClient,
  marketId: string | undefined,
  options?: Omit<UseQueryOptions<ApiResponse<Prediction[]>>, 'queryKey' | 'queryFn'>
): UseQueryResult<ApiResponse<Prediction[]>> {
  return useQuery({
    queryKey: ['heavymath', 'market-predictions', marketId],
    queryFn: async () => {
      if (!marketId) throw new Error('Market ID is required');
      return await client.getMarketPredictions(marketId);
    },
    enabled: !!marketId,
    staleTime: 1 * 60 * 1000, // 1 minute - predictions update frequently
    retry: false,
    ...options,
  });
}

/**
 * Get state transition history for a market
 * GET /api/markets/:id/history
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useMarketHistory(client, '1-market-123');
 * ```
 */
export function useMarketHistory(
  client: IndexerClient,
  marketId: string | undefined,
  options?: Omit<UseQueryOptions<ApiResponse<StateHistory[]>>, 'queryKey' | 'queryFn'>
): UseQueryResult<ApiResponse<StateHistory[]>> {
  return useQuery({
    queryKey: ['heavymath', 'market-history', marketId],
    queryFn: async () => {
      if (!marketId) throw new Error('Market ID is required');
      return await client.getMarketHistory(marketId);
    },
    enabled: !!marketId,
    staleTime: 5 * 60 * 1000, // 5 minutes - history doesn't change often
    retry: false,
    ...options,
  });
}

/**
 * Get complete market details (market + predictions + history)
 * Convenience hook that combines multiple requests
 *
 * @example
 * ```tsx
 * const { market, predictions, history, isLoading } = useMarketDetails(client, '1-market-123');
 * ```
 */
export function useMarketDetails(
  client: IndexerClient,
  marketId: string | undefined
): {
  market: UseQueryResult<ApiResponse<Market>>;
  predictions: UseQueryResult<ApiResponse<Prediction[]>>;
  history: UseQueryResult<ApiResponse<StateHistory[]>>;
  isLoading: boolean;
  isError: boolean;
} {
  const market = useMarket(client, marketId);
  const predictions = useMarketPredictions(client, marketId);
  const history = useMarketHistory(client, marketId);

  return {
    market,
    predictions,
    history,
    isLoading: market.isLoading || predictions.isLoading || history.isLoading,
    isError: market.isError || predictions.isError || history.isError,
  };
}
