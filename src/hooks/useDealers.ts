/**
 * React hooks for dealer NFT operations
 * Uses React Query for caching and data fetching
 */

import { useMemo } from 'react';
import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import type {
  DealerNFT,
  DealerPermission,
  Market,
  PaginatedResponse,
  ApiResponse,
  DealerFilters,
} from '../types';
import { IndexerClient } from '../network/IndexerClient';
import { FetchNetworkClient } from '../network/FetchNetworkClient';

/**
 * Get all dealer NFTs with optional filtering
 * GET /api/dealers
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useDealers(
 *   'http://localhost:42069',
 *   { owner: '0x123...' }
 * );
 * ```
 */
export function useDealers(
  endpointUrl: string,
  filters?: DealerFilters,
  options?: Omit<UseQueryOptions<PaginatedResponse<DealerNFT>>, 'queryKey' | 'queryFn'>
): UseQueryResult<PaginatedResponse<DealerNFT>> {
  const client = useMemo(
    () => new IndexerClient(endpointUrl, new FetchNetworkClient()),
    [endpointUrl]
  );

  return useQuery({
    queryKey: ['heavymath', 'dealers', filters],
    queryFn: async () => {
      return await client.getDealers(filters);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - NFT ownership doesn't change often
    retry: false,
    ...options,
  });
}

/**
 * Check if wallet is a dealer (owns dealer NFTs)
 * Convenience hook for checking dealer status
 *
 * @example
 * ```tsx
 * const { data: isDealer, isLoading } = useIsDealer(
 *   'http://localhost:42069',
 *   '0x123...'
 * );
 * ```
 */
export function useIsDealer(
  endpointUrl: string,
  walletAddress: string | undefined,
  options?: Omit<UseQueryOptions<boolean>, 'queryKey' | 'queryFn'>
): UseQueryResult<boolean> {
  const client = useMemo(
    () => new IndexerClient(endpointUrl, new FetchNetworkClient()),
    [endpointUrl]
  );

  return useQuery({
    queryKey: ['heavymath', 'is-dealer', walletAddress],
    queryFn: async () => {
      if (!walletAddress) return false;
      const result = await client.getDealers({ owner: walletAddress });
      return result.data.length > 0;
    },
    enabled: !!walletAddress,
    staleTime: 5 * 60 * 1000,
    retry: false,
    ...options,
  });
}

/**
 * Get dealer NFTs owned by a wallet
 * Convenience hook for getting user's dealer NFTs
 *
 * @example
 * ```tsx
 * const { data: nfts, isLoading } = useDealerNFTs(
 *   'http://localhost:42069',
 *   '0x123...'
 * );
 * ```
 */
export function useDealerNFTs(
  endpointUrl: string,
  walletAddress: string | undefined,
  options?: Omit<UseQueryOptions<DealerNFT[]>, 'queryKey' | 'queryFn'>
): UseQueryResult<DealerNFT[]> {
  const client = useMemo(
    () => new IndexerClient(endpointUrl, new FetchNetworkClient()),
    [endpointUrl]
  );

  return useQuery({
    queryKey: ['heavymath', 'dealer-nfts', walletAddress],
    queryFn: async () => {
      if (!walletAddress) return [];
      const result = await client.getDealers({ owner: walletAddress });
      return result.data;
    },
    enabled: !!walletAddress,
    staleTime: 5 * 60 * 1000,
    retry: false,
    ...options,
  });
}

/**
 * Get a specific dealer NFT by ID
 * GET /api/dealers/:id
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useDealer('http://localhost:42069', '1-1');
 * ```
 */
export function useDealer(
  endpointUrl: string,
  dealerId: string | undefined,
  options?: Omit<UseQueryOptions<ApiResponse<DealerNFT>>, 'queryKey' | 'queryFn'>
): UseQueryResult<ApiResponse<DealerNFT>> {
  const client = useMemo(
    () => new IndexerClient(endpointUrl, new FetchNetworkClient()),
    [endpointUrl]
  );

  return useQuery({
    queryKey: ['heavymath', 'dealer', dealerId],
    queryFn: async () => {
      if (!dealerId) throw new Error('Dealer ID is required');
      return await client.getDealer(dealerId);
    },
    enabled: !!dealerId,
    staleTime: 5 * 60 * 1000,
    retry: false,
    ...options,
  });
}

/**
 * Get permissions for a specific dealer NFT
 * GET /api/dealers/:id/permissions
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useDealerPermissions('http://localhost:42069', '1-1');
 * ```
 */
export function useDealerPermissions(
  endpointUrl: string,
  dealerId: string | undefined,
  options?: Omit<UseQueryOptions<ApiResponse<DealerPermission[]>>, 'queryKey' | 'queryFn'>
): UseQueryResult<ApiResponse<DealerPermission[]>> {
  const client = useMemo(
    () => new IndexerClient(endpointUrl, new FetchNetworkClient()),
    [endpointUrl]
  );

  return useQuery({
    queryKey: ['heavymath', 'dealer-permissions', dealerId],
    queryFn: async () => {
      if (!dealerId) throw new Error('Dealer ID is required');
      return await client.getDealerPermissions(dealerId);
    },
    enabled: !!dealerId,
    staleTime: 10 * 60 * 1000, // 10 minutes - permissions rarely change
    retry: false,
    ...options,
  });
}

/**
 * Get all markets created by a specific dealer NFT
 * GET /api/dealers/:id/markets
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useDealerMarkets('http://localhost:42069', '1-1');
 * ```
 */
export function useDealerMarkets(
  endpointUrl: string,
  dealerId: string | undefined,
  options?: Omit<UseQueryOptions<ApiResponse<Market[]>>, 'queryKey' | 'queryFn'>
): UseQueryResult<ApiResponse<Market[]>> {
  const client = useMemo(
    () => new IndexerClient(endpointUrl, new FetchNetworkClient()),
    [endpointUrl]
  );

  return useQuery({
    queryKey: ['heavymath', 'dealer-markets', dealerId],
    queryFn: async () => {
      if (!dealerId) throw new Error('Dealer ID is required');
      return await client.getDealerMarkets(dealerId);
    },
    enabled: !!dealerId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: false,
    ...options,
  });
}

/**
 * Get complete dealer dashboard (NFTs + all markets)
 * Convenience hook that combines NFTs and their markets
 *
 * @example
 * ```tsx
 * const { nfts, markets, isLoading } = useDealerDashboard(
 *   'http://localhost:42069',
 *   '0x123...'
 * );
 * ```
 */
export function useDealerDashboard(
  endpointUrl: string,
  walletAddress: string | undefined
): {
  nfts: UseQueryResult<DealerNFT[]>;
  markets: UseQueryResult<Market[]>;
  isLoading: boolean;
  isError: boolean;
} {
  const nfts = useDealerNFTs(endpointUrl, walletAddress);

  const client = useMemo(
    () => new IndexerClient(endpointUrl, new FetchNetworkClient()),
    [endpointUrl]
  );

  const markets = useQuery({
    queryKey: ['heavymath', 'dealer-dashboard-markets', walletAddress],
    queryFn: async () => {
      if (!nfts.data || nfts.data.length === 0) return [];

      const marketPromises = nfts.data.map(nft => client.getDealerMarkets(nft.id));
      const marketResults = await Promise.all(marketPromises);

      // Flatten markets and remove duplicates
      const marketsMap = new Map<string, Market>();
      marketResults.forEach(result => {
        if (result.data) {
          result.data.forEach(market => marketsMap.set(market.id, market));
        }
      });

      return Array.from(marketsMap.values());
    },
    enabled: !!walletAddress && !!nfts.data && nfts.data.length > 0,
    staleTime: 2 * 60 * 1000,
    retry: false,
  });

  return {
    nfts,
    markets,
    isLoading: nfts.isLoading || markets.isLoading,
    isError: nfts.isError || markets.isError,
  };
}
