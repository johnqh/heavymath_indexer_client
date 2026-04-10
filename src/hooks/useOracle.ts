/**
 * React hooks for oracle request operations
 * Uses React Query for caching and data fetching
 */

import {
  useQuery,
  useMutation,
  UseQueryOptions,
  UseQueryResult,
  UseMutationResult,
} from '@tanstack/react-query';
import type {
  OracleRequestData,
  PaginatedResponse,
  ApiResponse,
  OracleFilters,
  MarketResolutionCheck,
  MarketOracleConfigData,
} from '../types';
import { IndexerClient } from '../network/IndexerClient';

/**
 * Get oracle requests with optional filtering
 * GET /api/oracle/requests
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useOracleRequests(client, { market: '1-market-123' });
 * ```
 */
export function useOracleRequests(
  client: IndexerClient,
  filters?: OracleFilters,
  options?: Omit<UseQueryOptions<PaginatedResponse<OracleRequestData>>, 'queryKey' | 'queryFn'>
): UseQueryResult<PaginatedResponse<OracleRequestData>> {
  return useQuery({
    queryKey: ['heavymath', 'oracle-requests', filters],
    queryFn: async () => {
      return await client.getOracleRequests(filters);
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    retry: false,
    ...options,
  });
}

/**
 * Get a specific oracle request by ID
 * GET /api/oracle/requests/:id
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useOracleRequest(client, '1-market-123-request-0');
 * ```
 */
export function useOracleRequest(
  client: IndexerClient,
  requestId: string | undefined,
  options?: Omit<UseQueryOptions<ApiResponse<OracleRequestData>>, 'queryKey' | 'queryFn'>
): UseQueryResult<ApiResponse<OracleRequestData>> {
  return useQuery({
    queryKey: ['heavymath', 'oracle-request', requestId],
    queryFn: async () => {
      if (!requestId) throw new Error('Request ID is required');
      return await client.getOracleRequest(requestId);
    },
    enabled: !!requestId,
    staleTime: 2 * 60 * 1000,
    retry: false,
    ...options,
  });
}

/**
 * Get oracle request for a specific market
 * Convenience hook for market's oracle request
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useMarketOracle(client, '1-market-123');
 * ```
 */
export function useMarketOracle(
  client: IndexerClient,
  marketId: string | undefined,
  options?: Omit<UseQueryOptions<PaginatedResponse<OracleRequestData>>, 'queryKey' | 'queryFn'>
): UseQueryResult<PaginatedResponse<OracleRequestData>> {
  return useOracleRequests(
    client,
    {
      market: marketId,
    },
    {
      ...options,
      enabled: !!marketId && (options?.enabled ?? true),
    }
  );
}

/**
 * Get timed out oracle requests
 * Convenience hook for monitoring stale oracle requests
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useTimedOutOracleRequests(client);
 * ```
 */
export function useTimedOutOracleRequests(
  client: IndexerClient,
  options?: Omit<UseQueryOptions<PaginatedResponse<OracleRequestData>>, 'queryKey' | 'queryFn'>
): UseQueryResult<PaginatedResponse<OracleRequestData>> {
  return useOracleRequests(
    client,
    {
      timedOut: true,
    },
    options
  );
}

/**
 * Get pending oracle requests (not responded yet)
 * Convenience hook for monitoring active oracle requests
 *
 * @example
 * ```tsx
 * const { data, isLoading } = usePendingOracleRequests(client);
 * ```
 */
export function usePendingOracleRequests(
  client: IndexerClient,
  options?: Omit<UseQueryOptions<PaginatedResponse<OracleRequestData>>, 'queryKey' | 'queryFn'>
): UseQueryResult<PaginatedResponse<OracleRequestData>> {
  return useOracleRequests(
    client,
    {
      timedOut: false,
    },
    options
  );
}

/**
 * Check if a market can be resolved via oracle.
 * Calls GET /api/markets/:id/resolve to determine if the game has ended
 * and what the outcome would be.
 *
 * Unlike most hooks, this does NOT throw on 400 — it returns a structured
 * result with ok: false so the UI can display why resolution isn't available yet.
 *
 * @example
 * ```tsx
 * const { data } = useCheckMarketResolution(client, '11155111-5');
 * if (data?.ok) {
 *   console.log('Result:', data.data.result); // 0 or 1
 * } else if (data) {
 *   console.log('Not ready:', data.error.error);
 * }
 * ```
 */
export function useCheckMarketResolution(
  client: IndexerClient | null,
  marketId: string | undefined,
  options?: { enabled?: boolean }
): UseQueryResult<MarketResolutionCheck> {
  return useQuery({
    queryKey: ['heavymath', 'market-resolution-check', marketId],
    queryFn: async () => {
      if (!client || !marketId) throw new Error('Client and marketId are required');
      return await client.checkMarketResolution(marketId);
    },
    enabled: !!client && !!marketId && options?.enabled !== false,
    staleTime: 30 * 1000, // 30s - game status can change
    retry: false,
  });
}

/**
 * Get the oracle resolution config for a market.
 * GET /api/markets/:id/oracle-config
 *
 * @example
 * ```tsx
 * const { data } = useMarketOracleConfig(client, '11155111-5');
 * console.log(data?.data.positiveTeamName);
 * ```
 */
export function useMarketOracleConfig(
  client: IndexerClient | null,
  marketId: string | undefined,
  options?: Omit<UseQueryOptions<ApiResponse<MarketOracleConfigData>>, 'queryKey' | 'queryFn'>
): UseQueryResult<ApiResponse<MarketOracleConfigData>> {
  return useQuery({
    queryKey: ['heavymath', 'market-oracle-config', marketId],
    queryFn: async () => {
      if (!client || !marketId) throw new Error('Client and marketId are required');
      return await client.getMarketOracleConfig(marketId);
    },
    enabled: !!client && !!marketId && (options?.enabled ?? true),
    staleTime: 5 * 60 * 1000, // 5 minutes - config rarely changes
    retry: false,
    ...options,
  });
}

type TriggerLockResult = { success: boolean; transactionHash?: string; error?: string };

/**
 * Lock a market via the indexer's resolver wallet.
 * POST /api/markets/:id/trigger-lock
 *
 * Gas is paid by the resolver wallet, not the user.
 */
export function useTriggerLock(
  client: IndexerClient | null
): UseMutationResult<TriggerLockResult, Error, string> {
  return useMutation({
    mutationFn: async (marketId: string) => {
      if (!client) throw new Error('Client is required');
      return await client.triggerLock(marketId);
    },
  });
}

/**
 * Resolve a locked market via the indexer's resolver wallet.
 * POST /api/markets/:id/trigger-resolve
 *
 * Pushes oracle data on-chain and completes resolution.
 * Gas is paid by the resolver wallet, not the user.
 */
export function useTriggerResolve(
  client: IndexerClient | null
): UseMutationResult<MarketResolutionCheck, Error, string> {
  return useMutation({
    mutationFn: async (marketId: string) => {
      if (!client) throw new Error('Client is required');
      return await client.triggerResolve(marketId);
    },
  });
}
