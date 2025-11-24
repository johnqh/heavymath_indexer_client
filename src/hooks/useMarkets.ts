/**
 * React hooks for market operations
 * Uses React Query for caching and data fetching
 */

import { useMemo } from 'react';
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
import { FetchNetworkClient } from '../network/FetchNetworkClient';

/**
 * Get all markets with optional filtering
 * GET /api/markets
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useMarkets(
 *   'http://localhost:42069',
 *   { status: 'Active', limit: 10 }
 * );
 * ```
 */
export function useMarkets(
  endpointUrl: string,
  filters?: MarketFilters,
  options?: Omit<UseQueryOptions<PaginatedResponse<Market>>, 'queryKey' | 'queryFn'>
): UseQueryResult<PaginatedResponse<Market>> {
  const client = useMemo(
    () => new IndexerClient(endpointUrl, new FetchNetworkClient()),
    [endpointUrl]
  );

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
 * const { data, isLoading } = useActiveMarkets('http://localhost:42069', 20);
 * ```
 */
export function useActiveMarkets(
  endpointUrl: string,
  limit: number = 50,
  options?: Omit<UseQueryOptions<PaginatedResponse<Market>>, 'queryKey' | 'queryFn'>
): UseQueryResult<PaginatedResponse<Market>> {
  return useMarkets(
    endpointUrl,
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
 * const { data, isLoading } = useMarket('http://localhost:42069', '1-market-123');
 * ```
 */
export function useMarket(
  endpointUrl: string,
  marketId: string | undefined,
  options?: Omit<UseQueryOptions<ApiResponse<Market>>, 'queryKey' | 'queryFn'>
): UseQueryResult<ApiResponse<Market>> {
  const client = useMemo(
    () => new IndexerClient(endpointUrl, new FetchNetworkClient()),
    [endpointUrl]
  );

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
 * const { data, isLoading } = useMarketPredictions('http://localhost:42069', '1-market-123');
 * ```
 */
export function useMarketPredictions(
  endpointUrl: string,
  marketId: string | undefined,
  options?: Omit<UseQueryOptions<ApiResponse<Prediction[]>>, 'queryKey' | 'queryFn'>
): UseQueryResult<ApiResponse<Prediction[]>> {
  const client = useMemo(
    () => new IndexerClient(endpointUrl, new FetchNetworkClient()),
    [endpointUrl]
  );

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
 * const { data, isLoading } = useMarketHistory('http://localhost:42069', '1-market-123');
 * ```
 */
export function useMarketHistory(
  endpointUrl: string,
  marketId: string | undefined,
  options?: Omit<UseQueryOptions<ApiResponse<StateHistory[]>>, 'queryKey' | 'queryFn'>
): UseQueryResult<ApiResponse<StateHistory[]>> {
  const client = useMemo(
    () => new IndexerClient(endpointUrl, new FetchNetworkClient()),
    [endpointUrl]
  );

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
 * const { data, isLoading } = useMarketDetails('http://localhost:42069', '1-market-123');
 * if (data) {
 *   // data.market, data.predictions, data.history
 * }
 * ```
 */
export function useMarketDetails(
  endpointUrl: string,
  marketId: string | undefined
): {
  market: UseQueryResult<ApiResponse<Market>>;
  predictions: UseQueryResult<ApiResponse<Prediction[]>>;
  history: UseQueryResult<ApiResponse<StateHistory[]>>;
  isLoading: boolean;
  isError: boolean;
} {
  const market = useMarket(endpointUrl, marketId);
  const predictions = useMarketPredictions(endpointUrl, marketId);
  const history = useMarketHistory(endpointUrl, marketId);

  return {
    market,
    predictions,
    history,
    isLoading: market.isLoading || predictions.isLoading || history.isLoading,
    isError: market.isError || predictions.isError || history.isError,
  };
}
