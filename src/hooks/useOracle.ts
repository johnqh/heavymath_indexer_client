/**
 * React hooks for oracle request operations
 * Uses React Query for caching and data fetching
 */

import { useMemo } from 'react';
import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import type { OracleRequest, PaginatedResponse, ApiResponse, OracleFilters } from '../types';
import { IndexerClient } from '../network/IndexerClient';
import { FetchNetworkClient } from '../network/FetchNetworkClient';

/**
 * Get oracle requests with optional filtering
 * GET /api/oracle/requests
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useOracleRequests(
 *   'http://localhost:42069',
 *   { market: '1-market-123' }
 * );
 * ```
 */
export function useOracleRequests(
  endpointUrl: string,
  filters?: OracleFilters,
  options?: Omit<UseQueryOptions<PaginatedResponse<OracleRequest>>, 'queryKey' | 'queryFn'>
): UseQueryResult<PaginatedResponse<OracleRequest>> {
  const client = useMemo(
    () => new IndexerClient(endpointUrl, new FetchNetworkClient()),
    [endpointUrl]
  );

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
 * const { data, isLoading } = useOracleRequest(
 *   'http://localhost:42069',
 *   '1-market-123-request-0'
 * );
 * ```
 */
export function useOracleRequest(
  endpointUrl: string,
  requestId: string | undefined,
  options?: Omit<UseQueryOptions<ApiResponse<OracleRequest>>, 'queryKey' | 'queryFn'>
): UseQueryResult<ApiResponse<OracleRequest>> {
  const client = useMemo(
    () => new IndexerClient(endpointUrl, new FetchNetworkClient()),
    [endpointUrl]
  );

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
 * const { data, isLoading } = useMarketOracle(
 *   'http://localhost:42069',
 *   '1-market-123'
 * );
 * ```
 */
export function useMarketOracle(
  endpointUrl: string,
  marketId: string | undefined,
  options?: Omit<UseQueryOptions<PaginatedResponse<OracleRequest>>, 'queryKey' | 'queryFn'>
): UseQueryResult<PaginatedResponse<OracleRequest>> {
  return useOracleRequests(
    endpointUrl,
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
 * const { data, isLoading } = useTimedOutOracleRequests('http://localhost:42069');
 * ```
 */
export function useTimedOutOracleRequests(
  endpointUrl: string,
  options?: Omit<UseQueryOptions<PaginatedResponse<OracleRequest>>, 'queryKey' | 'queryFn'>
): UseQueryResult<PaginatedResponse<OracleRequest>> {
  return useOracleRequests(
    endpointUrl,
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
 * const { data, isLoading } = usePendingOracleRequests('http://localhost:42069');
 * ```
 */
export function usePendingOracleRequests(
  endpointUrl: string,
  options?: Omit<UseQueryOptions<PaginatedResponse<OracleRequest>>, 'queryKey' | 'queryFn'>
): UseQueryResult<PaginatedResponse<OracleRequest>> {
  return useOracleRequests(
    endpointUrl,
    {
      timedOut: false,
    },
    options
  );
}
