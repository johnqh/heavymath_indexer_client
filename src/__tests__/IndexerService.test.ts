/**
 * Tests for IndexerService - verifies business layer caching and aggregation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { NetworkClient, NetworkResponse } from '@sudobility/types';
import { IndexerService } from '../business/indexer-service';

const createMockNetworkClient = (): NetworkClient => ({
  request: vi.fn(),
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
});

function mockSuccess<T>(data: T): NetworkResponse<T> {
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    data,
    headers: {},
  };
}

function mockError(status: number, error?: string): NetworkResponse<unknown> {
  return {
    ok: false,
    status,
    statusText: 'Error',
    data: error ? { error } : undefined,
    headers: {},
  };
}

describe('IndexerService', () => {
  let service: IndexerService;
  let mockNetworkClient: NetworkClient;
  const BASE_URL = 'http://localhost:42069';

  beforeEach(() => {
    mockNetworkClient = createMockNetworkClient();
    service = new IndexerService({
      indexerUrl: BASE_URL,
      networkClient: mockNetworkClient,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // =====================================================================
  // CONSTRUCTOR VALIDATION
  // =====================================================================

  describe('constructor', () => {
    it('should throw if indexerUrl is empty', () => {
      expect(
        () =>
          new IndexerService({
            indexerUrl: '',
            networkClient: mockNetworkClient,
          })
      ).toThrow('indexerUrl is required');
    });

    it('should throw if networkClient is missing', () => {
      expect(
        () =>
          new IndexerService({
            indexerUrl: BASE_URL,
            networkClient: undefined as unknown as NetworkClient,
          })
      ).toThrow('networkClient is required');
    });

    it('should accept custom cacheTTL', () => {
      const customService = new IndexerService({
        indexerUrl: BASE_URL,
        networkClient: mockNetworkClient,
        cacheTTL: 1000,
      });
      expect(customService).toBeInstanceOf(IndexerService);
    });
  });

  // =====================================================================
  // CACHING BEHAVIOR
  // =====================================================================

  describe('caching', () => {
    it('should return cached data on second call', async () => {
      const mockData = {
        success: true,
        data: [{ id: '1-market-1' }],
        pagination: { totalCount: 1 },
      };
      vi.mocked(mockNetworkClient.get).mockResolvedValue(mockSuccess(mockData));

      const result1 = await service.getActiveMarkets();
      const result2 = await service.getActiveMarkets();

      // Should only call the API once
      expect(mockNetworkClient.get).toHaveBeenCalledTimes(1);
      expect(result1).toEqual(result2);
    });

    it('should refetch after cache is cleared', async () => {
      const mockData = {
        success: true,
        data: [],
        pagination: { totalCount: 0 },
      };
      vi.mocked(mockNetworkClient.get).mockResolvedValue(mockSuccess(mockData));

      await service.getActiveMarkets();
      service.clearCache();
      await service.getActiveMarkets();

      expect(mockNetworkClient.get).toHaveBeenCalledTimes(2);
    });

    it('should expire cached data after TTL', async () => {
      const shortTTLService = new IndexerService({
        indexerUrl: BASE_URL,
        networkClient: mockNetworkClient,
        cacheTTL: 50, // 50ms
      });

      const mockData = {
        success: true,
        data: [],
        pagination: { totalCount: 0 },
      };
      vi.mocked(mockNetworkClient.get).mockResolvedValue(mockSuccess(mockData));

      await shortTTLService.getActiveMarkets();

      // Wait for cache to expire
      await new Promise(resolve => setTimeout(resolve, 60));

      await shortTTLService.getActiveMarkets();

      expect(mockNetworkClient.get).toHaveBeenCalledTimes(2);
    });

    it('should cache different parameter calls separately', async () => {
      const mockData = {
        success: true,
        data: [],
        pagination: { totalCount: 0 },
      };
      vi.mocked(mockNetworkClient.get).mockResolvedValue(mockSuccess(mockData));

      await service.getActiveMarkets(10);
      await service.getActiveMarkets(20);

      expect(mockNetworkClient.get).toHaveBeenCalledTimes(2);
    });
  });

  // =====================================================================
  // INVALIDATE CACHE
  // =====================================================================

  describe('invalidateCache', () => {
    it('should invalidate matching cache entries', async () => {
      const mockData = {
        success: true,
        data: [],
        pagination: { totalCount: 0 },
      };
      vi.mocked(mockNetworkClient.get).mockResolvedValue(mockSuccess(mockData));

      // Populate two different caches
      await service.getActiveMarkets(10);
      await service.getActiveMarkets(20);

      // Invalidate just the active-markets caches
      const count = service.invalidateCache('active-markets');
      expect(count).toBe(2);

      // Should refetch
      await service.getActiveMarkets(10);
      expect(mockNetworkClient.get).toHaveBeenCalledTimes(3);
    });

    it('should return 0 for non-matching prefix', async () => {
      const mockData = {
        success: true,
        data: [],
        pagination: { totalCount: 0 },
      };
      vi.mocked(mockNetworkClient.get).mockResolvedValue(mockSuccess(mockData));

      await service.getActiveMarkets();

      const count = service.invalidateCache('nonexistent');
      expect(count).toBe(0);
    });
  });

  // =====================================================================
  // BUSINESS METHODS
  // =====================================================================

  describe('getActiveMarkets', () => {
    it('should fetch active markets with default limit', async () => {
      const mockData = { success: true, data: [], pagination: { totalCount: 0 } };
      vi.mocked(mockNetworkClient.get).mockResolvedValue(mockSuccess(mockData));

      await service.getActiveMarkets();

      const calledUrl = vi.mocked(mockNetworkClient.get).mock.calls[0][0];
      expect(calledUrl).toContain('status=Active');
      expect(calledUrl).toContain('limit=50');
    });

    it('should fetch active markets with custom limit', async () => {
      const mockData = { success: true, data: [], pagination: { totalCount: 0 } };
      vi.mocked(mockNetworkClient.get).mockResolvedValue(mockSuccess(mockData));

      await service.getActiveMarkets(25);

      const calledUrl = vi.mocked(mockNetworkClient.get).mock.calls[0][0];
      expect(calledUrl).toContain('limit=25');
    });

    it('should throw a descriptive error on failure', async () => {
      vi.mocked(mockNetworkClient.get).mockResolvedValue(mockError(500, 'Server down'));

      await expect(service.getActiveMarkets()).rejects.toThrow('Failed to get active markets');
    });
  });

  describe('getUserPredictions', () => {
    it('should set user filter automatically', async () => {
      const mockData = { success: true, data: [], pagination: { totalCount: 0 } };
      vi.mocked(mockNetworkClient.get).mockResolvedValue(mockSuccess(mockData));

      await service.getUserPredictions('0xuser');

      const calledUrl = vi.mocked(mockNetworkClient.get).mock.calls[0][0];
      expect(calledUrl).toContain('user=0xuser');
    });

    it('should merge additional filters', async () => {
      const mockData = { success: true, data: [], pagination: { totalCount: 0 } };
      vi.mocked(mockNetworkClient.get).mockResolvedValue(mockSuccess(mockData));

      await service.getUserPredictions('0xuser', { claimed: true, limit: 10 });

      const calledUrl = vi.mocked(mockNetworkClient.get).mock.calls[0][0];
      expect(calledUrl).toContain('user=0xuser');
      expect(calledUrl).toContain('claimed=true');
      expect(calledUrl).toContain('limit=10');
    });
  });

  describe('getDealerNFTs', () => {
    it('should return empty array when no NFTs found', async () => {
      const mockData = { success: true, data: [], pagination: { totalCount: 0 } };
      vi.mocked(mockNetworkClient.get).mockResolvedValue(mockSuccess(mockData));

      const result = await service.getDealerNFTs('0xnotdealer');

      expect(result).toEqual([]);
    });

    it('should return dealer NFTs', async () => {
      const nfts = [{ id: '1-1', owner: '0xdealer' }];
      const mockData = { success: true, data: nfts, pagination: { totalCount: 1 } };
      vi.mocked(mockNetworkClient.get).mockResolvedValue(mockSuccess(mockData));

      const result = await service.getDealerNFTs('0xdealer');

      expect(result).toEqual(nfts);
    });
  });

  describe('getMarketDetails', () => {
    it('should fetch market, predictions, and history in parallel', async () => {
      const market = { id: '1-market-1', status: 'Active' };
      const predictions = [{ id: 'pred-1' }];
      const history = [{ id: 'hist-1' }];

      vi.mocked(mockNetworkClient.get)
        .mockResolvedValueOnce(mockSuccess({ success: true, data: market }))
        .mockResolvedValueOnce(mockSuccess({ success: true, data: predictions }))
        .mockResolvedValueOnce(mockSuccess({ success: true, data: history }));

      const result = await service.getMarketDetails('1-market-1');

      expect(result.market).toEqual(market);
      expect(result.predictions).toEqual(predictions);
      expect(result.history).toEqual(history);
      expect(mockNetworkClient.get).toHaveBeenCalledTimes(3);
    });

    it('should throw when market is not found', async () => {
      vi.mocked(mockNetworkClient.get)
        .mockResolvedValueOnce(mockSuccess({ success: true, data: null }))
        .mockResolvedValueOnce(mockSuccess({ success: true, data: [] }))
        .mockResolvedValueOnce(mockSuccess({ success: true, data: [] }));

      await expect(service.getMarketDetails('nonexistent')).rejects.toThrow(
        'Failed to get market details'
      );
    });
  });

  describe('getUserBettingHistory', () => {
    it('should fetch active and claimed predictions', async () => {
      const active = [{ id: 'active-1' }];
      const claimed = [{ id: 'claimed-1' }];

      vi.mocked(mockNetworkClient.get)
        .mockResolvedValueOnce(
          mockSuccess({ success: true, data: active, pagination: { totalCount: 1 } })
        )
        .mockResolvedValueOnce(
          mockSuccess({ success: true, data: claimed, pagination: { totalCount: 1 } })
        );

      const result = await service.getUserBettingHistory('0xuser');

      expect(result.active).toEqual(active);
      expect(result.claimed).toEqual(claimed);
    });
  });

  describe('getMarketFromPrediction', () => {
    it('should return the market for a prediction', async () => {
      const prediction = { id: 'pred-1', marketId: '1-market-1' };
      const market = { id: '1-market-1', status: 'Active' };

      vi.mocked(mockNetworkClient.get)
        .mockResolvedValueOnce(mockSuccess({ success: true, data: prediction }))
        .mockResolvedValueOnce(mockSuccess({ success: true, data: market }));

      const result = await service.getMarketFromPrediction('pred-1');

      expect(result).toEqual(market);
    });

    it('should return null when prediction has no data', async () => {
      vi.mocked(mockNetworkClient.get).mockResolvedValueOnce(
        mockSuccess({ success: true, data: null })
      );

      const result = await service.getMarketFromPrediction('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getMarketStats', () => {
    it('should fetch and cache market stats', async () => {
      const stats = { total: 100, active: 50 };
      vi.mocked(mockNetworkClient.get).mockResolvedValue(
        mockSuccess({ success: true, data: stats })
      );

      const result1 = await service.getMarketStats();
      const result2 = await service.getMarketStats();

      expect(result1.data).toEqual(stats);
      expect(mockNetworkClient.get).toHaveBeenCalledTimes(1);
      expect(result1).toEqual(result2);
    });
  });

  // =====================================================================
  // SINGLETON
  // =====================================================================

  describe('getInstance', () => {
    it('should return the same instance', () => {
      // Reset the singleton by accessing via a different approach
      const instance1 = IndexerService.getInstance({
        indexerUrl: BASE_URL,
        networkClient: mockNetworkClient,
      });
      const instance2 = IndexerService.getInstance({
        indexerUrl: 'http://different-url',
        networkClient: mockNetworkClient,
      });

      expect(instance1).toBe(instance2);
    });
  });

  // =====================================================================
  // CLIENT ACCESS
  // =====================================================================

  describe('getClient', () => {
    it('should return the underlying IndexerClient', () => {
      const client = service.getClient();
      expect(client).toBeDefined();
    });
  });
});
