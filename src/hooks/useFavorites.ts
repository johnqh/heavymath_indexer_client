/**
 * React hooks for wallet favorites operations
 * Uses React Query for caching and data fetching with mutations
 */

import { useCallback } from 'react';
import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
  UseQueryResult,
  UseMutationResult,
} from '@tanstack/react-query';
import type {
  WalletFavoriteData,
  PaginatedResponse,
  ApiResponse,
  WalletFavoritesFilters,
  CreateFavoriteRequest,
} from '../types';
import { IndexerClient } from '../network/IndexerClient';

/**
 * Hook for managing wallet favorites
 * Returns favorites list, loading state, and mutation functions
 *
 * @example
 * ```tsx
 * const { favorites, isLoading, addFavorite, removeFavorite, refresh } = useFavorites(
 *   client,
 *   '0x123...'
 * );
 *
 * // Add a favorite
 * await addFavorite({ category: 'sports', subcategory: 'soccer', type: 'team', id: 'team-123' });
 *
 * // Remove a favorite
 * await removeFavorite(favoriteId);
 *
 * // Manually refresh
 * refresh();
 * ```
 */
export function useFavorites(
  client: IndexerClient,
  walletAddress: string | undefined,
  filters?: WalletFavoritesFilters,
  options?: Omit<UseQueryOptions<PaginatedResponse<WalletFavoriteData>>, 'queryKey' | 'queryFn'>
): {
  favorites: WalletFavoriteData[];
  query: UseQueryResult<PaginatedResponse<WalletFavoriteData>>;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  addFavorite: UseMutationResult<ApiResponse<WalletFavoriteData>, Error, CreateFavoriteRequest>;
  removeFavorite: UseMutationResult<ApiResponse<void>, Error, number>;
  refresh: () => void;
} {
  const queryClient = useQueryClient();
  const queryKey = ['heavymath', 'favorites', walletAddress, filters];

  // Query for fetching favorites
  const query = useQuery({
    queryKey,
    queryFn: async () => {
      if (!walletAddress) {
        // Return empty response if no wallet address
        return {
          success: true,
          data: [],
          pagination: {
            totalCount: 0,
            pageSize: filters?.limit ?? 50,
            hasNextPage: false,
            hasPreviousPage: false,
          },
          timestamp: new Date().toISOString(),
        } as PaginatedResponse<WalletFavoriteData>;
      }
      return await client.getFavorites(walletAddress, filters);
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: false,
    ...options,
  });

  // Refresh function
  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey });
  }, [queryClient, queryKey]);

  // Mutation for adding a favorite
  const addFavorite = useMutation({
    mutationFn: async (favorite: CreateFavoriteRequest) => {
      if (!walletAddress) {
        throw new Error('Wallet address is required to add favorites');
      }
      return await client.addFavorite(walletAddress, favorite);
    },
    onSuccess: () => {
      refresh();
    },
  });

  // Mutation for removing a favorite
  const removeFavorite = useMutation({
    mutationFn: async (favoriteId: number) => {
      if (!walletAddress) {
        throw new Error('Wallet address is required to remove favorites');
      }
      return await client.removeFavorite(walletAddress, favoriteId);
    },
    onSuccess: () => {
      refresh();
    },
  });

  return {
    favorites: query.data?.data ?? [],
    query,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    addFavorite,
    removeFavorite,
    refresh,
  };
}

/**
 * Get favorites for a specific category
 *
 * @example
 * ```tsx
 * const { favorites, addFavorite, removeFavorite } = useCategoryFavorites(
 *   client,
 *   '0x123...',
 *   'sports'
 * );
 * ```
 */
export function useCategoryFavorites(
  client: IndexerClient,
  walletAddress: string | undefined,
  category: string,
  options?: Omit<UseQueryOptions<PaginatedResponse<WalletFavoriteData>>, 'queryKey' | 'queryFn'>
) {
  return useFavorites(client, walletAddress, { category }, options);
}

/**
 * Check if an item is favorited
 *
 * @example
 * ```tsx
 * const { isFavorite, toggleFavorite } = useIsFavorite(
 *   client,
 *   '0x123...',
 *   { category: 'sports', subcategory: 'soccer', type: 'team', id: 'team-123' }
 * );
 * ```
 */
export function useIsFavorite(
  client: IndexerClient,
  walletAddress: string | undefined,
  item: CreateFavoriteRequest
): {
  isFavorite: boolean;
  favoriteId: number | undefined;
  isLoading: boolean;
  toggleFavorite: () => Promise<void>;
} {
  const { favorites, isLoading, addFavorite, removeFavorite } = useFavorites(
    client,
    walletAddress,
    {
      category: item.category,
      subcategory: item.subcategory,
      type: item.type,
    }
  );

  const existingFavorite = favorites.find(fav => fav.itemId === item.id);

  const toggleFavorite = useCallback(async () => {
    if (existingFavorite) {
      await removeFavorite.mutateAsync(existingFavorite.id);
    } else {
      await addFavorite.mutateAsync(item);
    }
  }, [existingFavorite, addFavorite, removeFavorite, item]);

  return {
    isFavorite: !!existingFavorite,
    favoriteId: existingFavorite?.id,
    isLoading: isLoading || addFavorite.isPending || removeFavorite.isPending,
    toggleFavorite,
  };
}
