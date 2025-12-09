/**
 * React hooks for wallet favorites operations
 * Uses Zustand for local persistence and React Query for API sync
 */

import { useCallback, useEffect } from 'react';
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
import { useFavoritesStore } from '../stores/favorites-store';

/**
 * Hook for managing wallet favorites
 * Uses Zustand for local persistence with optimistic updates
 *
 * @example
 * ```tsx
 * const { favorites, isLoading, addFavorite, removeFavorite, refresh } = useFavorites(
 *   client,
 *   '0x123...'
 * );
 *
 * // Add a favorite (optimistic update)
 * await addFavorite({ category: 'sports', subcategory: 'soccer', type: 'team', id: 'team-123' });
 *
 * // Remove a favorite (optimistic update)
 * await removeFavorite(favoriteId);
 *
 * // Manually refresh from server
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

  // Zustand store actions
  const {
    getFavorites,
    setFavorites,
    addFavoriteOptimistic,
    updateFavoriteFromServer,
    removeFavoriteOptimistic,
    rollbackAdd,
    rollbackRemove,
    findFavorite,
    needsRefresh,
  } = useFavoritesStore();

  // Get favorites from store (for optimistic UI)
  const storedFavorites = walletAddress ? getFavorites(walletAddress) : [];

  // Filter stored favorites if filters are provided
  const filteredFavorites = storedFavorites.filter(fav => {
    if (filters?.category && fav.category !== filters.category) return false;
    if (filters?.subcategory && fav.subcategory !== filters.subcategory) return false;
    if (filters?.type && fav.type !== filters.type) return false;
    return true;
  });

  // Query for fetching favorites from server
  const query = useQuery({
    queryKey,
    queryFn: async () => {
      if (!walletAddress) {
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
      const response = await client.getFavorites(walletAddress, filters);
      // Update store with server data (without filters to get all favorites)
      if (!filters) {
        setFavorites(walletAddress, response.data ?? []);
      }
      return response;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: false,
    // Only fetch if store needs refresh or no data
    enabled: walletAddress ? needsRefresh(walletAddress) || storedFavorites.length === 0 : false,
    ...options,
  });

  // Sync store when query succeeds (for filtered queries)
  useEffect(() => {
    if (query.data?.data && walletAddress && !filters) {
      setFavorites(walletAddress, query.data.data);
    }
  }, [query.data, walletAddress, filters, setFavorites]);

  // Refresh function - invalidates query and forces refetch
  const refresh = useCallback(() => {
    if (walletAddress) {
      // Clear the lastFetched to force refresh
      queryClient.invalidateQueries({ queryKey });
    }
  }, [queryClient, queryKey, walletAddress]);

  // Mutation for adding a favorite with optimistic update
  const addFavorite = useMutation({
    mutationFn: async (favorite: CreateFavoriteRequest) => {
      if (!walletAddress) {
        throw new Error('Wallet address is required to add favorites');
      }
      return await client.addFavorite(walletAddress, favorite);
    },
    onMutate: async (favorite: CreateFavoriteRequest) => {
      if (!walletAddress) return;
      // Optimistic update
      addFavoriteOptimistic(walletAddress, favorite);
      return { favorite };
    },
    onSuccess: (response, _favorite) => {
      if (!walletAddress || !response.data) return;
      // Update with server response (real ID)
      updateFavoriteFromServer(walletAddress, response.data);
    },
    onError: (_error, favorite) => {
      if (!walletAddress) return;
      // Rollback optimistic update
      rollbackAdd(walletAddress, favorite.id);
    },
  });

  // Mutation for removing a favorite with optimistic update
  const removeFavorite = useMutation({
    mutationFn: async (favoriteId: number) => {
      if (!walletAddress) {
        throw new Error('Wallet address is required to remove favorites');
      }
      return await client.removeFavorite(walletAddress, favoriteId);
    },
    onMutate: async (favoriteId: number) => {
      if (!walletAddress) return;
      // Save favorite for potential rollback
      const favorite = findFavorite(
        walletAddress,
        storedFavorites.find(f => f.id === favoriteId)?.itemId ?? ''
      );
      // Optimistic update
      removeFavoriteOptimistic(walletAddress, favoriteId);
      return { favorite };
    },
    onError: (_error, _favoriteId, context) => {
      if (!walletAddress || !context?.favorite) return;
      // Rollback optimistic update
      rollbackRemove(walletAddress, context.favorite);
    },
  });

  return {
    // Use filtered favorites from store for immediate UI updates
    favorites: filteredFavorites,
    query,
    isLoading: query.isLoading && storedFavorites.length === 0,
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
 * Uses Zustand store for immediate response
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
  const { isFavorite: checkIsFavorite, findFavorite } = useFavoritesStore();

  // Use store directly for immediate response
  const isFavorited = walletAddress ? checkIsFavorite(walletAddress, item.id) : false;
  const existingFavorite = walletAddress ? findFavorite(walletAddress, item.id) : undefined;

  const { addFavorite, removeFavorite, isLoading } = useFavorites(client, walletAddress, {
    category: item.category,
    subcategory: item.subcategory,
    type: item.type,
  });

  const toggleFavorite = useCallback(async () => {
    if (existingFavorite) {
      await removeFavorite.mutateAsync(existingFavorite.id);
    } else {
      await addFavorite.mutateAsync(item);
    }
  }, [existingFavorite, addFavorite, removeFavorite, item]);

  return {
    isFavorite: isFavorited,
    favoriteId: existingFavorite?.id,
    isLoading: isLoading || addFavorite.isPending || removeFavorite.isPending,
    toggleFavorite,
  };
}

/**
 * Hook to access the favorites store directly
 * Useful for reading favorites without API calls
 *
 * @example
 * ```tsx
 * const { getFavorites, isFavorite, clearAll } = useFavoritesStoreHook();
 * const favorites = getFavorites('0x123...');
 * ```
 */
export function useFavoritesStoreHook() {
  return useFavoritesStore();
}
