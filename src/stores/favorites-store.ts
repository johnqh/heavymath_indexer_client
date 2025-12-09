/**
 * Zustand store for wallet favorites
 * Provides local persistence and optimistic updates
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { WalletFavoriteData, CreateFavoriteRequest } from '../types';

/**
 * Favorites state for a single wallet
 */
interface WalletFavoritesState {
  favorites: WalletFavoriteData[];
  lastFetched: number | null;
}

/**
 * Favorites store state
 */
export interface FavoritesState {
  /** Map of wallet address to their favorites state */
  walletFavorites: Record<string, WalletFavoritesState>;

  /** Get favorites for a wallet */
  getFavorites: (walletAddress: string) => WalletFavoriteData[];

  /** Set favorites for a wallet (from API response) */
  setFavorites: (walletAddress: string, favorites: WalletFavoriteData[]) => void;

  /** Add a favorite optimistically */
  addFavoriteOptimistic: (walletAddress: string, favorite: CreateFavoriteRequest) => void;

  /** Update a favorite with server response (after successful POST) */
  updateFavoriteFromServer: (walletAddress: string, favorite: WalletFavoriteData) => void;

  /** Remove a favorite optimistically */
  removeFavoriteOptimistic: (walletAddress: string, favoriteId: number) => void;

  /** Rollback an optimistic add (on error) */
  rollbackAdd: (walletAddress: string, itemId: string) => void;

  /** Rollback an optimistic remove (on error) */
  rollbackRemove: (walletAddress: string, favorite: WalletFavoriteData) => void;

  /** Check if an item is favorited */
  isFavorite: (walletAddress: string, itemId: string) => boolean;

  /** Find a favorite by item ID */
  findFavorite: (walletAddress: string, itemId: string) => WalletFavoriteData | undefined;

  /** Clear favorites for a wallet */
  clearFavorites: (walletAddress: string) => void;

  /** Clear all favorites data */
  clearAll: () => void;

  /** Check if favorites need refresh (stale data) */
  needsRefresh: (walletAddress: string, maxAge?: number) => boolean;
}

/** Default max age for favorites cache (5 minutes) */
const DEFAULT_MAX_AGE = 5 * 60 * 1000;

/**
 * Create a temporary ID for optimistic updates
 */
function createTempId(): number {
  return -Date.now();
}

/**
 * Zustand store for favorites with persistence
 */
export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      walletFavorites: {},

      getFavorites: (walletAddress: string) => {
        const normalized = walletAddress.toLowerCase();
        return get().walletFavorites[normalized]?.favorites ?? [];
      },

      setFavorites: (walletAddress: string, favorites: WalletFavoriteData[]) => {
        const normalized = walletAddress.toLowerCase();
        set(state => ({
          walletFavorites: {
            ...state.walletFavorites,
            [normalized]: {
              favorites,
              lastFetched: Date.now(),
            },
          },
        }));
      },

      addFavoriteOptimistic: (walletAddress: string, favorite: CreateFavoriteRequest) => {
        const normalized = walletAddress.toLowerCase();
        const tempFavorite: WalletFavoriteData = {
          id: createTempId(),
          walletAddress: normalized,
          category: favorite.category,
          subcategory: favorite.subcategory,
          type: favorite.type,
          itemId: favorite.id,
          createdAt: BigInt(Math.floor(Date.now() / 1000)),
        };

        set(state => {
          const current = state.walletFavorites[normalized] ?? {
            favorites: [],
            lastFetched: null,
          };
          return {
            walletFavorites: {
              ...state.walletFavorites,
              [normalized]: {
                ...current,
                favorites: [...current.favorites, tempFavorite],
              },
            },
          };
        });
      },

      updateFavoriteFromServer: (walletAddress: string, favorite: WalletFavoriteData) => {
        const normalized = walletAddress.toLowerCase();
        set(state => {
          const current = state.walletFavorites[normalized];
          if (!current) return state;

          // Replace temp favorite with server response
          const favorites = current.favorites.map(f =>
            f.id < 0 && f.itemId === favorite.itemId ? favorite : f
          );

          return {
            walletFavorites: {
              ...state.walletFavorites,
              [normalized]: {
                ...current,
                favorites,
              },
            },
          };
        });
      },

      removeFavoriteOptimistic: (walletAddress: string, favoriteId: number) => {
        const normalized = walletAddress.toLowerCase();
        set(state => {
          const current = state.walletFavorites[normalized];
          if (!current) return state;

          return {
            walletFavorites: {
              ...state.walletFavorites,
              [normalized]: {
                ...current,
                favorites: current.favorites.filter(f => f.id !== favoriteId),
              },
            },
          };
        });
      },

      rollbackAdd: (walletAddress: string, itemId: string) => {
        const normalized = walletAddress.toLowerCase();
        set(state => {
          const current = state.walletFavorites[normalized];
          if (!current) return state;

          return {
            walletFavorites: {
              ...state.walletFavorites,
              [normalized]: {
                ...current,
                favorites: current.favorites.filter(f => f.itemId !== itemId),
              },
            },
          };
        });
      },

      rollbackRemove: (walletAddress: string, favorite: WalletFavoriteData) => {
        const normalized = walletAddress.toLowerCase();
        set(state => {
          const current = state.walletFavorites[normalized] ?? {
            favorites: [],
            lastFetched: null,
          };

          return {
            walletFavorites: {
              ...state.walletFavorites,
              [normalized]: {
                ...current,
                favorites: [...current.favorites, favorite],
              },
            },
          };
        });
      },

      isFavorite: (walletAddress: string, itemId: string) => {
        const normalized = walletAddress.toLowerCase();
        const favorites = get().walletFavorites[normalized]?.favorites ?? [];
        return favorites.some(f => f.itemId === itemId);
      },

      findFavorite: (walletAddress: string, itemId: string) => {
        const normalized = walletAddress.toLowerCase();
        const favorites = get().walletFavorites[normalized]?.favorites ?? [];
        return favorites.find(f => f.itemId === itemId);
      },

      clearFavorites: (walletAddress: string) => {
        const normalized = walletAddress.toLowerCase();
        set(state => {
          const { [normalized]: _, ...rest } = state.walletFavorites;
          return { walletFavorites: rest };
        });
      },

      clearAll: () => {
        set({ walletFavorites: {} });
      },

      needsRefresh: (walletAddress: string, maxAge = DEFAULT_MAX_AGE) => {
        const normalized = walletAddress.toLowerCase();
        const state = get().walletFavorites[normalized];
        if (!state || state.lastFetched === null) return true;
        return Date.now() - state.lastFetched > maxAge;
      },
    }),
    {
      name: 'heavymath-favorites',
      storage: createJSONStorage(() => {
        // Use localStorage in browser, or a no-op storage for SSR/React Native
        if (typeof window !== 'undefined' && window.localStorage) {
          return window.localStorage;
        }
        // No-op storage for non-browser environments
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        };
      }),
      partialize: state => ({
        walletFavorites: state.walletFavorites,
      }),
    }
  )
);
