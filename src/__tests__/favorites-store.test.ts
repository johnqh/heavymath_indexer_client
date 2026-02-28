/**
 * Tests for useFavoritesStore - verifies Zustand store operations
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useFavoritesStore } from '../stores/favorites-store';
import type { WalletFavoriteData } from '../types';

describe('useFavoritesStore', () => {
  beforeEach(() => {
    // Reset the store state before each test
    useFavoritesStore.getState().clearAll();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Helper to create mock favorite data
  // Note: createdAt uses number cast to bigint for JSON serialization compatibility
  // (matching how the store creates optimistic entries)
  const createFavorite = (overrides: Partial<WalletFavoriteData> = {}): WalletFavoriteData => ({
    id: 1,
    walletAddress: '0xwallet',
    category: 'sports',
    subcategory: 'soccer',
    type: 'team',
    itemId: 'item-1',
    createdAt: 1000 as unknown as bigint,
    ...overrides,
  });

  // =====================================================================
  // BASIC OPERATIONS
  // =====================================================================

  describe('getFavorites', () => {
    it('should return empty array for unknown wallet', () => {
      const result = useFavoritesStore.getState().getFavorites('0xunknown');
      expect(result).toEqual([]);
    });

    it('should normalize wallet address to lowercase', () => {
      const store = useFavoritesStore.getState();
      store.setFavorites('0xABC', [createFavorite()]);

      const result = store.getFavorites('0xabc');
      expect(result).toHaveLength(1);
    });
  });

  describe('setFavorites', () => {
    it('should set favorites for a wallet', () => {
      const store = useFavoritesStore.getState();
      const favorites = [createFavorite(), createFavorite({ id: 2, itemId: 'item-2' })];

      store.setFavorites('0xwallet', favorites);

      expect(store.getFavorites('0xwallet')).toEqual(favorites);
    });

    it('should update lastFetched timestamp', () => {
      const store = useFavoritesStore.getState();
      const before = Date.now();

      store.setFavorites('0xwallet', []);

      const state = useFavoritesStore.getState().walletFavorites['0xwallet'];
      expect(state.lastFetched).toBeGreaterThanOrEqual(before);
    });

    it('should overwrite existing favorites', () => {
      const store = useFavoritesStore.getState();
      store.setFavorites('0xwallet', [createFavorite({ id: 1 })]);
      store.setFavorites('0xwallet', [createFavorite({ id: 2 })]);

      const result = store.getFavorites('0xwallet');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(2);
    });
  });

  // =====================================================================
  // OPTIMISTIC UPDATES
  // =====================================================================

  describe('addFavoriteOptimistic', () => {
    it('should add a temporary favorite', () => {
      const store = useFavoritesStore.getState();
      store.addFavoriteOptimistic('0xwallet', {
        category: 'sports',
        subcategory: 'soccer',
        type: 'team',
        id: 'team-123',
      });

      const favorites = useFavoritesStore.getState().getFavorites('0xwallet');
      expect(favorites).toHaveLength(1);
      expect(favorites[0].itemId).toBe('team-123');
      expect(favorites[0].id).toBeLessThan(0); // Temp ID is negative
    });

    it('should normalize wallet address', () => {
      const store = useFavoritesStore.getState();
      store.addFavoriteOptimistic('0xABC', {
        category: 'sports',
        subcategory: 'soccer',
        type: 'team',
        id: 'team-123',
      });

      const favorites = useFavoritesStore.getState().getFavorites('0xabc');
      expect(favorites).toHaveLength(1);
    });

    it('should append to existing favorites', () => {
      const store = useFavoritesStore.getState();
      store.setFavorites('0xwallet', [createFavorite()]);
      store.addFavoriteOptimistic('0xwallet', {
        category: 'crypto',
        subcategory: 'bitcoin',
        type: 'market',
        id: 'market-1',
      });

      const favorites = useFavoritesStore.getState().getFavorites('0xwallet');
      expect(favorites).toHaveLength(2);
    });
  });

  describe('updateFavoriteFromServer', () => {
    it('should replace temp favorite with server data', () => {
      const store = useFavoritesStore.getState();
      store.addFavoriteOptimistic('0xwallet', {
        category: 'sports',
        subcategory: 'soccer',
        type: 'team',
        id: 'team-123',
      });

      const serverFavorite = createFavorite({ id: 42, itemId: 'team-123' });
      store.updateFavoriteFromServer('0xwallet', serverFavorite);

      const favorites = useFavoritesStore.getState().getFavorites('0xwallet');
      expect(favorites).toHaveLength(1);
      expect(favorites[0].id).toBe(42); // Real ID from server
    });

    it('should not modify unrelated favorites', () => {
      const store = useFavoritesStore.getState();
      store.setFavorites('0xwallet', [createFavorite({ id: 10, itemId: 'existing' })]);
      store.addFavoriteOptimistic('0xwallet', {
        category: 'sports',
        subcategory: 'soccer',
        type: 'team',
        id: 'new-item',
      });

      const serverFavorite = createFavorite({ id: 42, itemId: 'new-item' });
      store.updateFavoriteFromServer('0xwallet', serverFavorite);

      const favorites = useFavoritesStore.getState().getFavorites('0xwallet');
      expect(favorites).toHaveLength(2);
      expect(favorites[0].id).toBe(10); // Unchanged
      expect(favorites[1].id).toBe(42); // Updated
    });

    it('should do nothing for unknown wallet', () => {
      const store = useFavoritesStore.getState();
      store.updateFavoriteFromServer('0xunknown', createFavorite());

      expect(useFavoritesStore.getState().getFavorites('0xunknown')).toEqual([]);
    });
  });

  describe('removeFavoriteOptimistic', () => {
    it('should remove a favorite by ID', () => {
      const store = useFavoritesStore.getState();
      store.setFavorites('0xwallet', [
        createFavorite({ id: 1 }),
        createFavorite({ id: 2, itemId: 'item-2' }),
      ]);

      store.removeFavoriteOptimistic('0xwallet', 1);

      const favorites = useFavoritesStore.getState().getFavorites('0xwallet');
      expect(favorites).toHaveLength(1);
      expect(favorites[0].id).toBe(2);
    });

    it('should do nothing for unknown wallet', () => {
      const store = useFavoritesStore.getState();
      store.removeFavoriteOptimistic('0xunknown', 1);

      expect(useFavoritesStore.getState().getFavorites('0xunknown')).toEqual([]);
    });
  });

  // =====================================================================
  // ROLLBACK
  // =====================================================================

  describe('rollbackAdd', () => {
    it('should remove the optimistically added item by itemId', () => {
      const store = useFavoritesStore.getState();
      store.addFavoriteOptimistic('0xwallet', {
        category: 'sports',
        subcategory: 'soccer',
        type: 'team',
        id: 'team-123',
      });

      store.rollbackAdd('0xwallet', 'team-123');

      const favorites = useFavoritesStore.getState().getFavorites('0xwallet');
      expect(favorites).toHaveLength(0);
    });

    it('should not remove unrelated favorites', () => {
      const store = useFavoritesStore.getState();
      store.setFavorites('0xwallet', [createFavorite({ id: 1, itemId: 'keep-this' })]);
      store.addFavoriteOptimistic('0xwallet', {
        category: 'sports',
        subcategory: 'soccer',
        type: 'team',
        id: 'remove-this',
      });

      store.rollbackAdd('0xwallet', 'remove-this');

      const favorites = useFavoritesStore.getState().getFavorites('0xwallet');
      expect(favorites).toHaveLength(1);
      expect(favorites[0].itemId).toBe('keep-this');
    });
  });

  describe('rollbackRemove', () => {
    it('should restore a removed favorite', () => {
      const favorite = createFavorite({ id: 1 });
      const store = useFavoritesStore.getState();
      store.setFavorites('0xwallet', [favorite]);
      store.removeFavoriteOptimistic('0xwallet', 1);

      expect(useFavoritesStore.getState().getFavorites('0xwallet')).toHaveLength(0);

      store.rollbackRemove('0xwallet', favorite);

      expect(useFavoritesStore.getState().getFavorites('0xwallet')).toHaveLength(1);
    });

    it('should work even if wallet had no data', () => {
      const favorite = createFavorite();
      const store = useFavoritesStore.getState();
      store.rollbackRemove('0xnewwallet', favorite);

      expect(useFavoritesStore.getState().getFavorites('0xnewwallet')).toHaveLength(1);
    });
  });

  // =====================================================================
  // QUERY METHODS
  // =====================================================================

  describe('isFavorite', () => {
    it('should return true for existing favorite', () => {
      const store = useFavoritesStore.getState();
      store.setFavorites('0xwallet', [createFavorite({ itemId: 'item-1' })]);

      expect(store.isFavorite('0xwallet', 'item-1')).toBe(true);
    });

    it('should return false for non-existing favorite', () => {
      const store = useFavoritesStore.getState();
      store.setFavorites('0xwallet', [createFavorite({ itemId: 'item-1' })]);

      expect(store.isFavorite('0xwallet', 'item-999')).toBe(false);
    });

    it('should return false for unknown wallet', () => {
      expect(useFavoritesStore.getState().isFavorite('0xunknown', 'item-1')).toBe(false);
    });

    it('should normalize wallet address', () => {
      const store = useFavoritesStore.getState();
      store.setFavorites('0xABC', [createFavorite({ itemId: 'item-1' })]);

      expect(store.isFavorite('0xabc', 'item-1')).toBe(true);
    });
  });

  describe('findFavorite', () => {
    it('should find a favorite by itemId', () => {
      const store = useFavoritesStore.getState();
      const favorite = createFavorite({ itemId: 'find-me' });
      store.setFavorites('0xwallet', [favorite]);

      const result = store.findFavorite('0xwallet', 'find-me');
      expect(result).toEqual(favorite);
    });

    it('should return undefined for non-existing itemId', () => {
      const store = useFavoritesStore.getState();
      store.setFavorites('0xwallet', [createFavorite()]);

      expect(store.findFavorite('0xwallet', 'nonexistent')).toBeUndefined();
    });
  });

  // =====================================================================
  // CLEAR OPERATIONS
  // =====================================================================

  describe('clearFavorites', () => {
    it('should clear favorites for a specific wallet', () => {
      const store = useFavoritesStore.getState();
      store.setFavorites('0xwallet1', [createFavorite()]);
      store.setFavorites('0xwallet2', [createFavorite()]);

      store.clearFavorites('0xwallet1');

      expect(useFavoritesStore.getState().getFavorites('0xwallet1')).toEqual([]);
      expect(useFavoritesStore.getState().getFavorites('0xwallet2')).toHaveLength(1);
    });
  });

  describe('clearAll', () => {
    it('should clear all wallet data', () => {
      const store = useFavoritesStore.getState();
      store.setFavorites('0xwallet1', [createFavorite()]);
      store.setFavorites('0xwallet2', [createFavorite()]);

      store.clearAll();

      expect(useFavoritesStore.getState().getFavorites('0xwallet1')).toEqual([]);
      expect(useFavoritesStore.getState().getFavorites('0xwallet2')).toEqual([]);
      expect(useFavoritesStore.getState().walletFavorites).toEqual({});
    });
  });

  // =====================================================================
  // STALENESS CHECK
  // =====================================================================

  describe('needsRefresh', () => {
    it('should return true for unknown wallet', () => {
      expect(useFavoritesStore.getState().needsRefresh('0xunknown')).toBe(true);
    });

    it('should return true when lastFetched is null', () => {
      // This happens if the store was initialized but never fetched
      const store = useFavoritesStore.getState();
      store.addFavoriteOptimistic('0xwallet', {
        category: 'sports',
        subcategory: 'soccer',
        type: 'team',
        id: 'team-1',
      });

      // addFavoriteOptimistic sets lastFetched to null initially
      expect(store.needsRefresh('0xwallet')).toBe(true);
    });

    it('should return false for recently fetched data', () => {
      const store = useFavoritesStore.getState();
      store.setFavorites('0xwallet', []);

      expect(store.needsRefresh('0xwallet')).toBe(false);
    });

    it('should return true for stale data', async () => {
      const store = useFavoritesStore.getState();
      store.setFavorites('0xwallet', []);

      // Wait a small amount then check with a 1ms maxAge
      await new Promise(resolve => setTimeout(resolve, 5));
      expect(useFavoritesStore.getState().needsRefresh('0xwallet', 1)).toBe(true);
    });

    it('should accept custom maxAge', () => {
      const store = useFavoritesStore.getState();
      store.setFavorites('0xwallet', []);

      // Very large maxAge - data should not be stale
      expect(store.needsRefresh('0xwallet', 999999999)).toBe(false);
    });
  });
});
