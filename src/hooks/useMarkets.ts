/**
 * React hooks for market operations
 * Uses React Query for caching and data fetching
 */

import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import type {
  MarketData,
  PredictionData,
  MarketStateHistoryData,
  PaginatedResponse,
  ApiResponse,
  MarketFilters,
} from '../types';
import { IndexerClient } from '../network/IndexerClient';

/**
 * Get all markets with optional filtering.
 * GET /api/markets
 *
 * @param client - IndexerClient instance (from useIndexer() context)
 * @param filters - Optional market filters (status, dealer, category, limit, offset)
 * @param options - Additional React Query options (excluding queryKey and queryFn)
 * @returns React Query result with paginated market data
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
  options?: Omit<UseQueryOptions<PaginatedResponse<MarketData>>, 'queryKey' | 'queryFn'>
): UseQueryResult<PaginatedResponse<MarketData>> {
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
 * Get active markets only.
 * Convenience hook for the most common use case.
 *
 * @param client - IndexerClient instance
 * @param limit - Maximum number of markets to return (default: 50)
 * @param options - Additional React Query options
 * @returns React Query result with paginated active market data
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useActiveMarkets(client, 20);
 * ```
 */
export function useActiveMarkets(
  client: IndexerClient,
  limit: number = 50,
  options?: Omit<UseQueryOptions<PaginatedResponse<MarketData>>, 'queryKey' | 'queryFn'>
): UseQueryResult<PaginatedResponse<MarketData>> {
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
 * Get a specific market by ID.
 * GET /api/markets/:id
 *
 * @param client - IndexerClient instance
 * @param marketId - The chain-prefixed market ID, or undefined to disable the query
 * @param options - Additional React Query options
 * @returns React Query result with the market data
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useMarket(client, '1-market-123');
 * ```
 */
export function useMarket(
  client: IndexerClient,
  marketId: string | undefined,
  options?: Omit<UseQueryOptions<ApiResponse<MarketData>>, 'queryKey' | 'queryFn'>
): UseQueryResult<ApiResponse<MarketData>> {
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
 * Get all predictions for a specific market.
 * GET /api/markets/:id/predictions
 *
 * @param client - IndexerClient instance
 * @param marketId - The chain-prefixed market ID, or undefined to disable the query
 * @param options - Additional React Query options
 * @returns React Query result with the market's predictions
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useMarketPredictions(client, '1-market-123');
 * ```
 */
export function useMarketPredictions(
  client: IndexerClient,
  marketId: string | undefined,
  options?: Omit<UseQueryOptions<ApiResponse<PredictionData[]>>, 'queryKey' | 'queryFn'>
): UseQueryResult<ApiResponse<PredictionData[]>> {
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
 * Get state transition history for a market.
 * GET /api/markets/:id/history
 *
 * @param client - IndexerClient instance
 * @param marketId - The chain-prefixed market ID, or undefined to disable the query
 * @param options - Additional React Query options
 * @returns React Query result with the market's state history entries
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useMarketHistory(client, '1-market-123');
 * ```
 */
export function useMarketHistory(
  client: IndexerClient,
  marketId: string | undefined,
  options?: Omit<UseQueryOptions<ApiResponse<MarketStateHistoryData[]>>, 'queryKey' | 'queryFn'>
): UseQueryResult<ApiResponse<MarketStateHistoryData[]>> {
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
 * Get complete market details (market + predictions + history).
 * Convenience hook that combines multiple parallel requests.
 *
 * @param client - IndexerClient instance
 * @param marketId - The chain-prefixed market ID, or undefined to disable all queries
 * @returns An object containing separate query results for market, predictions, and history, plus aggregate isLoading and isError flags
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
  market: UseQueryResult<ApiResponse<MarketData>>;
  predictions: UseQueryResult<ApiResponse<PredictionData[]>>;
  history: UseQueryResult<ApiResponse<MarketStateHistoryData[]>>;
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
