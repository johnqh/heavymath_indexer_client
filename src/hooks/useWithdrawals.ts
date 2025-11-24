/**
 * React hooks for fee withdrawal operations
 * Uses React Query for caching and data fetching
 */

import { useMemo } from 'react';
import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import type { FeeWithdrawal, PaginatedResponse, WithdrawalFilters } from '../types';
import { IndexerClient } from '../network/IndexerClient';
import { FetchNetworkClient } from '../network/FetchNetworkClient';

/**
 * Get fee withdrawals with optional filtering
 * GET /api/withdrawals
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useWithdrawals(
 *   'http://localhost:42069',
 *   { withdrawer: '0x123...', type: 'dealer' }
 * );
 * ```
 */
export function useWithdrawals(
  endpointUrl: string,
  filters?: WithdrawalFilters,
  options?: Omit<UseQueryOptions<PaginatedResponse<FeeWithdrawal>>, 'queryKey' | 'queryFn'>
): UseQueryResult<PaginatedResponse<FeeWithdrawal>> {
  const client = useMemo(
    () => new IndexerClient(endpointUrl, new FetchNetworkClient()),
    [endpointUrl]
  );

  return useQuery({
    queryKey: ['heavymath', 'withdrawals', filters],
    queryFn: async () => {
      return await client.getWithdrawals(filters);
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: false,
    ...options,
  });
}

/**
 * Get dealer withdrawals for a specific address
 * Convenience hook for dealer's withdrawal history
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useDealerWithdrawals(
 *   'http://localhost:42069',
 *   '0x123...'
 * );
 * ```
 */
export function useDealerWithdrawals(
  endpointUrl: string,
  dealerAddress: string | undefined,
  options?: Omit<UseQueryOptions<PaginatedResponse<FeeWithdrawal>>, 'queryKey' | 'queryFn'>
): UseQueryResult<PaginatedResponse<FeeWithdrawal>> {
  return useWithdrawals(
    endpointUrl,
    {
      withdrawer: dealerAddress,
      type: 'dealer',
    },
    {
      ...options,
      enabled: !!dealerAddress && (options?.enabled ?? true),
    }
  );
}

/**
 * Get system withdrawals
 * Convenience hook for system fee withdrawals
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useSystemWithdrawals('http://localhost:42069');
 * ```
 */
export function useSystemWithdrawals(
  endpointUrl: string,
  options?: Omit<UseQueryOptions<PaginatedResponse<FeeWithdrawal>>, 'queryKey' | 'queryFn'>
): UseQueryResult<PaginatedResponse<FeeWithdrawal>> {
  return useWithdrawals(
    endpointUrl,
    {
      type: 'system',
    },
    options
  );
}

/**
 * Get withdrawals for a specific market
 * Convenience hook for market-specific withdrawals
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useMarketWithdrawals(
 *   'http://localhost:42069',
 *   '1-market-123'
 * );
 * ```
 */
export function useMarketWithdrawals(
  endpointUrl: string,
  marketId: string | undefined,
  options?: Omit<UseQueryOptions<PaginatedResponse<FeeWithdrawal>>, 'queryKey' | 'queryFn'>
): UseQueryResult<PaginatedResponse<FeeWithdrawal>> {
  return useWithdrawals(
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
