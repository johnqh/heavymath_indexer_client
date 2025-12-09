/**
 * React hooks for oracle request operations
 * Uses React Query for caching and data fetching
 */

import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import type { OracleRequest, PaginatedResponse, ApiResponse, OracleFilters } from '../types';
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
  options?: Omit<UseQueryOptions<PaginatedResponse<OracleRequest>>, 'queryKey' | 'queryFn'>
): UseQueryResult<PaginatedResponse<OracleRequest>> {
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
  options?: Omit<UseQueryOptions<ApiResponse<OracleRequest>>, 'queryKey' | 'queryFn'>
): UseQueryResult<ApiResponse<OracleRequest>> {
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
  options?: Omit<UseQueryOptions<PaginatedResponse<OracleRequest>>, 'queryKey' | 'queryFn'>
): UseQueryResult<PaginatedResponse<OracleRequest>> {
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
  options?: Omit<UseQueryOptions<PaginatedResponse<OracleRequest>>, 'queryKey' | 'queryFn'>
): UseQueryResult<PaginatedResponse<OracleRequest>> {
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
  options?: Omit<UseQueryOptions<PaginatedResponse<OracleRequest>>, 'queryKey' | 'queryFn'>
): UseQueryResult<PaginatedResponse<OracleRequest>> {
  return useOracleRequests(
    client,
    {
      timedOut: false,
    },
    options
  );
}
