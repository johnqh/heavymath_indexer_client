/**
 * React hooks for fee withdrawal operations
 * Uses React Query for caching and data fetching
 */

import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import type { FeeWithdrawal, PaginatedResponse, WithdrawalFilters } from '../types';
import { IndexerClient } from '../network/IndexerClient';

/**
 * Get fee withdrawals with optional filtering
 * GET /api/withdrawals
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useWithdrawals(
 *   client,
 *   { withdrawer: '0x123...', type: 'dealer' }
 * );
 * ```
 */
export function useWithdrawals(
  client: IndexerClient,
  filters?: WithdrawalFilters,
  options?: Omit<UseQueryOptions<PaginatedResponse<FeeWithdrawal>>, 'queryKey' | 'queryFn'>
): UseQueryResult<PaginatedResponse<FeeWithdrawal>> {
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
 * const { data, isLoading } = useDealerWithdrawals(client, '0x123...');
 * ```
 */
export function useDealerWithdrawals(
  client: IndexerClient,
  dealerAddress: string | undefined,
  options?: Omit<UseQueryOptions<PaginatedResponse<FeeWithdrawal>>, 'queryKey' | 'queryFn'>
): UseQueryResult<PaginatedResponse<FeeWithdrawal>> {
  return useWithdrawals(
    client,
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
 * const { data, isLoading } = useSystemWithdrawals(client);
 * ```
 */
export function useSystemWithdrawals(
  client: IndexerClient,
  options?: Omit<UseQueryOptions<PaginatedResponse<FeeWithdrawal>>, 'queryKey' | 'queryFn'>
): UseQueryResult<PaginatedResponse<FeeWithdrawal>> {
  return useWithdrawals(
    client,
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
 * const { data, isLoading } = useMarketWithdrawals(client, '1-market-123');
 * ```
 */
export function useMarketWithdrawals(
  client: IndexerClient,
  marketId: string | undefined,
  options?: Omit<UseQueryOptions<PaginatedResponse<FeeWithdrawal>>, 'queryKey' | 'queryFn'>
): UseQueryResult<PaginatedResponse<FeeWithdrawal>> {
  return useWithdrawals(
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
