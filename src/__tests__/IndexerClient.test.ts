/**
 * Tests for IndexerClient - verifies all API endpoint methods
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { NetworkClient, NetworkResponse } from '@sudobility/types';
import { IndexerClient } from '../network/IndexerClient';

// Helper to create a mock NetworkClient
const createMockNetworkClient = (): NetworkClient => ({
  request: vi.fn(),
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
});

// Helper to create a successful mock response
function mockSuccess<T>(data: T): NetworkResponse<T> {
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    data,
    headers: {},
  };
}

// Helper to create a failed mock response
function mockError(status: number, error?: string): NetworkResponse<unknown> {
  return {
    ok: false,
    status,
    statusText: 'Error',
    data: error ? { error } : undefined,
    headers: {},
  };
}

describe('IndexerClient', () => {
  let client: IndexerClient;
  let mockNetworkClient: NetworkClient;
  const BASE_URL = 'http://localhost:42069';

  beforeEach(() => {
    mockNetworkClient = createMockNetworkClient();
    client = new IndexerClient(BASE_URL, mockNetworkClient);
  });

  // =====================================================================
  // MARKET ENDPOINTS
  // =====================================================================

  describe('getMarkets', () => {
    it('should fetch markets without filters', async () => {
      const mockData = { success: true, data: [], pagination: { totalCount: 0 } };
      vi.mocked(mockNetworkClient.get).mockResolvedValue(mockSuccess(mockData));

      const result = await client.getMarkets();

      expect(mockNetworkClient.get).toHaveBeenCalledWith(`${BASE_URL}/api/markets/list`);
      expect(result).toEqual(mockData);
    });

    it('should append filter query parameters', async () => {
      const mockData = { success: true, data: [], pagination: { totalCount: 0 } };
      vi.mocked(mockNetworkClient.get).mockResolvedValue(mockSuccess(mockData));

      await client.getMarkets({
        status: 'Active',
        dealer: '0xdealer',
        category: 'sports',
        limit: 10,
        offset: 5,
      });

      const calledUrl = vi.mocked(mockNetworkClient.get).mock.calls[0][0];
      expect(calledUrl).toContain('status=Active');
      expect(calledUrl).toContain('dealer=0xdealer');
      expect(calledUrl).toContain('category=sports');
      expect(calledUrl).toContain('limit=10');
      expect(calledUrl).toContain('offset=5');
    });

    it('should omit undefined filters', async () => {
      const mockData = { success: true, data: [], pagination: { totalCount: 0 } };
      vi.mocked(mockNetworkClient.get).mockResolvedValue(mockSuccess(mockData));

      await client.getMarkets({ status: 'Active' });

      const calledUrl = vi.mocked(mockNetworkClient.get).mock.calls[0][0];
      expect(calledUrl).toContain('status=Active');
      expect(calledUrl).not.toContain('dealer=');
      expect(calledUrl).not.toContain('category=');
    });

    it('should throw on API error', async () => {
      vi.mocked(mockNetworkClient.get).mockResolvedValue(mockError(500, 'Internal error'));

      await expect(client.getMarkets()).rejects.toThrow('API Error (500): Internal error');
    });

    it('should throw when response has no data', async () => {
      vi.mocked(mockNetworkClient.get).mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        data: undefined,
        headers: {},
      });

      await expect(client.getMarkets()).rejects.toThrow('API Error');
    });
  });

  describe('getMarket', () => {
    it('should fetch a market by ID', async () => {
      const mockData = { success: true, data: { id: '1-market-123' } };
      vi.mocked(mockNetworkClient.get).mockResolvedValue(mockSuccess(mockData));

      const result = await client.getMarket('1-market-123');

      expect(mockNetworkClient.get).toHaveBeenCalledWith(`${BASE_URL}/api/markets/1-market-123`);
      expect(result).toEqual(mockData);
    });

    it('should URL-encode the market ID', async () => {
      const mockData = { success: true, data: { id: 'test/special' } };
      vi.mocked(mockNetworkClient.get).mockResolvedValue(mockSuccess(mockData));

      await client.getMarket('test/special');

      expect(mockNetworkClient.get).toHaveBeenCalledWith(`${BASE_URL}/api/markets/test%2Fspecial`);
    });

    it('should throw on 404', async () => {
      vi.mocked(mockNetworkClient.get).mockResolvedValue(mockError(404, 'Market not found'));

      await expect(client.getMarket('nonexistent')).rejects.toThrow(
        'API Error (404): Market not found'
      );
    });
  });

  describe('getMarketPredictions', () => {
    it('should fetch predictions for a market', async () => {
      const mockData = { success: true, data: [] };
      vi.mocked(mockNetworkClient.get).mockResolvedValue(mockSuccess(mockData));

      const result = await client.getMarketPredictions('1-market-123');

      expect(mockNetworkClient.get).toHaveBeenCalledWith(
        `${BASE_URL}/api/markets/1-market-123/predictions`
      );
      expect(result).toEqual(mockData);
    });
  });

  describe('getMarketHistory', () => {
    it('should fetch history for a market', async () => {
      const mockData = { success: true, data: [] };
      vi.mocked(mockNetworkClient.get).mockResolvedValue(mockSuccess(mockData));

      const result = await client.getMarketHistory('1-market-123');

      expect(mockNetworkClient.get).toHaveBeenCalledWith(
        `${BASE_URL}/api/markets/1-market-123/history`
      );
      expect(result).toEqual(mockData);
    });
  });

  // =====================================================================
  // PREDICTION ENDPOINTS
  // =====================================================================

  describe('getPredictions', () => {
    it('should fetch predictions without filters', async () => {
      const mockData = { success: true, data: [], pagination: { totalCount: 0 } };
      vi.mocked(mockNetworkClient.get).mockResolvedValue(mockSuccess(mockData));

      await client.getPredictions();

      expect(mockNetworkClient.get).toHaveBeenCalledWith(`${BASE_URL}/api/predictions`);
    });

    it('should handle boolean claimed filter', async () => {
      const mockData = { success: true, data: [], pagination: { totalCount: 0 } };
      vi.mocked(mockNetworkClient.get).mockResolvedValue(mockSuccess(mockData));

      await client.getPredictions({ claimed: false });

      const calledUrl = vi.mocked(mockNetworkClient.get).mock.calls[0][0];
      expect(calledUrl).toContain('claimed=false');
    });

    it('should append all filters', async () => {
      const mockData = { success: true, data: [], pagination: { totalCount: 0 } };
      vi.mocked(mockNetworkClient.get).mockResolvedValue(mockSuccess(mockData));

      await client.getPredictions({
        user: '0xuser',
        market: '1-market-123',
        claimed: true,
        limit: 25,
        offset: 10,
      });

      const calledUrl = vi.mocked(mockNetworkClient.get).mock.calls[0][0];
      expect(calledUrl).toContain('user=0xuser');
      expect(calledUrl).toContain('market=1-market-123');
      expect(calledUrl).toContain('claimed=true');
      expect(calledUrl).toContain('limit=25');
      expect(calledUrl).toContain('offset=10');
    });
  });

  describe('getPrediction', () => {
    it('should fetch a prediction by ID', async () => {
      const mockData = { success: true, data: { id: '1-market-123-0xuser' } };
      vi.mocked(mockNetworkClient.get).mockResolvedValue(mockSuccess(mockData));

      const result = await client.getPrediction('1-market-123-0xuser');

      expect(mockNetworkClient.get).toHaveBeenCalledWith(
        `${BASE_URL}/api/predictions/1-market-123-0xuser`
      );
      expect(result).toEqual(mockData);
    });
  });

  // =====================================================================
  // DEALER ENDPOINTS
  // =====================================================================

  describe('getDealers', () => {
    it('should fetch dealers without filters', async () => {
      const mockData = { success: true, data: [], pagination: { totalCount: 0 } };
      vi.mocked(mockNetworkClient.get).mockResolvedValue(mockSuccess(mockData));

      await client.getDealers();

      expect(mockNetworkClient.get).toHaveBeenCalledWith(`${BASE_URL}/api/dealers/list`);
    });

    it('should filter by owner', async () => {
      const mockData = { success: true, data: [], pagination: { totalCount: 0 } };
      vi.mocked(mockNetworkClient.get).mockResolvedValue(mockSuccess(mockData));

      await client.getDealers({ owner: '0xowner' });

      const calledUrl = vi.mocked(mockNetworkClient.get).mock.calls[0][0];
      expect(calledUrl).toContain('owner=0xowner');
    });
  });

  describe('getDealer', () => {
    it('should fetch a dealer by ID', async () => {
      const mockData = { success: true, data: { id: '1-1' } };
      vi.mocked(mockNetworkClient.get).mockResolvedValue(mockSuccess(mockData));

      const result = await client.getDealer('1-1');

      expect(mockNetworkClient.get).toHaveBeenCalledWith(`${BASE_URL}/api/dealers/1-1`);
      expect(result).toEqual(mockData);
    });
  });

  describe('getDealerPermissions', () => {
    it('should fetch permissions for a dealer', async () => {
      const mockData = { success: true, data: [] };
      vi.mocked(mockNetworkClient.get).mockResolvedValue(mockSuccess(mockData));

      await client.getDealerPermissions('1-1');

      expect(mockNetworkClient.get).toHaveBeenCalledWith(`${BASE_URL}/api/dealers/1-1/permissions`);
    });
  });

  describe('getDealerMarkets', () => {
    it('should fetch markets for a dealer', async () => {
      const mockData = { success: true, data: [] };
      vi.mocked(mockNetworkClient.get).mockResolvedValue(mockSuccess(mockData));

      await client.getDealerMarkets('1-1');

      expect(mockNetworkClient.get).toHaveBeenCalledWith(`${BASE_URL}/api/dealers/1-1/markets`);
    });
  });

  // =====================================================================
  // WITHDRAWAL ENDPOINTS
  // =====================================================================

  describe('getWithdrawals', () => {
    it('should fetch withdrawals without filters', async () => {
      const mockData = { success: true, data: [], pagination: { totalCount: 0 } };
      vi.mocked(mockNetworkClient.get).mockResolvedValue(mockSuccess(mockData));

      await client.getWithdrawals();

      expect(mockNetworkClient.get).toHaveBeenCalledWith(`${BASE_URL}/api/withdrawals`);
    });

    it('should append all withdrawal filters', async () => {
      const mockData = { success: true, data: [], pagination: { totalCount: 0 } };
      vi.mocked(mockNetworkClient.get).mockResolvedValue(mockSuccess(mockData));

      await client.getWithdrawals({
        withdrawer: '0xwithdrawer',
        type: 'dealer',
        market: '1-market-123',
        limit: 20,
        offset: 5,
      });

      const calledUrl = vi.mocked(mockNetworkClient.get).mock.calls[0][0];
      expect(calledUrl).toContain('withdrawer=0xwithdrawer');
      expect(calledUrl).toContain('type=dealer');
      expect(calledUrl).toContain('market=1-market-123');
      expect(calledUrl).toContain('limit=20');
      expect(calledUrl).toContain('offset=5');
    });
  });

  // =====================================================================
  // ORACLE ENDPOINTS
  // =====================================================================

  describe('getOracleRequests', () => {
    it('should fetch oracle requests without filters', async () => {
      const mockData = { success: true, data: [], pagination: { totalCount: 0 } };
      vi.mocked(mockNetworkClient.get).mockResolvedValue(mockSuccess(mockData));

      await client.getOracleRequests();

      expect(mockNetworkClient.get).toHaveBeenCalledWith(`${BASE_URL}/api/oracle/requests`);
    });

    it('should handle boolean timedOut filter', async () => {
      const mockData = { success: true, data: [], pagination: { totalCount: 0 } };
      vi.mocked(mockNetworkClient.get).mockResolvedValue(mockSuccess(mockData));

      await client.getOracleRequests({ timedOut: true });

      const calledUrl = vi.mocked(mockNetworkClient.get).mock.calls[0][0];
      expect(calledUrl).toContain('timedOut=true');
    });
  });

  describe('getOracleRequest', () => {
    it('should fetch an oracle request by ID', async () => {
      const mockData = { success: true, data: { id: 'oracle-1' } };
      vi.mocked(mockNetworkClient.get).mockResolvedValue(mockSuccess(mockData));

      const result = await client.getOracleRequest('oracle-1');

      expect(mockNetworkClient.get).toHaveBeenCalledWith(
        `${BASE_URL}/api/oracle/requests/oracle-1`
      );
      expect(result).toEqual(mockData);
    });
  });

  // =====================================================================
  // FAVORITES ENDPOINTS
  // =====================================================================

  describe('getFavorites', () => {
    it('should fetch favorites for a wallet', async () => {
      const mockData = { success: true, data: [], pagination: { totalCount: 0 } };
      vi.mocked(mockNetworkClient.get).mockResolvedValue(mockSuccess(mockData));

      await client.getFavorites('0xwallet');

      expect(mockNetworkClient.get).toHaveBeenCalledWith(
        `${BASE_URL}/api/wallet/0xwallet/favorites`
      );
    });

    it('should append wallet favorites filters', async () => {
      const mockData = { success: true, data: [], pagination: { totalCount: 0 } };
      vi.mocked(mockNetworkClient.get).mockResolvedValue(mockSuccess(mockData));

      await client.getFavorites('0xwallet', {
        category: 'sports',
        subcategory: 'soccer',
        type: 'team',
        limit: 10,
        offset: 5,
      });

      const calledUrl = vi.mocked(mockNetworkClient.get).mock.calls[0][0];
      expect(calledUrl).toContain('category=sports');
      expect(calledUrl).toContain('subcategory=soccer');
      expect(calledUrl).toContain('type=team');
      expect(calledUrl).toContain('limit=10');
      expect(calledUrl).toContain('offset=5');
    });
  });

  describe('addFavorite', () => {
    it('should POST a new favorite', async () => {
      const mockData = {
        success: true,
        data: { id: 1, walletAddress: '0xwallet', category: 'sports' },
      };
      vi.mocked(mockNetworkClient.post).mockResolvedValue(mockSuccess(mockData));

      const favorite = {
        category: 'sports',
        subcategory: 'soccer',
        type: 'team',
        id: 'team-123',
      };
      const result = await client.addFavorite('0xwallet', favorite);

      expect(mockNetworkClient.post).toHaveBeenCalledWith(
        `${BASE_URL}/api/wallet/0xwallet/favorites`,
        favorite
      );
      expect(result).toEqual(mockData);
    });

    it('should throw on API error', async () => {
      vi.mocked(mockNetworkClient.post).mockResolvedValue(mockError(400, 'Invalid favorite data'));

      await expect(
        client.addFavorite('0xwallet', {
          category: 'sports',
          subcategory: 'soccer',
          type: 'team',
          id: 'team-123',
        })
      ).rejects.toThrow('API Error (400): Invalid favorite data');
    });
  });

  describe('removeFavorite', () => {
    it('should DELETE a favorite by ID', async () => {
      const mockData = { success: true };
      vi.mocked(mockNetworkClient.delete).mockResolvedValue(mockSuccess(mockData));

      await client.removeFavorite('0xwallet', 42);

      expect(mockNetworkClient.delete).toHaveBeenCalledWith(
        `${BASE_URL}/api/wallet/0xwallet/favorites/42`
      );
    });
  });

  // =====================================================================
  // ANALYTICS ENDPOINTS
  // =====================================================================

  describe('getMarketStats', () => {
    it('should fetch market statistics', async () => {
      const mockData = { success: true, data: { total: 100 } };
      vi.mocked(mockNetworkClient.get).mockResolvedValue(mockSuccess(mockData));

      const result = await client.getMarketStats();

      expect(mockNetworkClient.get).toHaveBeenCalledWith(`${BASE_URL}/api/stats/markets`);
      expect(result).toEqual(mockData);
    });
  });

  describe('getHealth', () => {
    it('should fetch health status', async () => {
      const mockData = { success: true, data: { status: 'healthy' } };
      vi.mocked(mockNetworkClient.get).mockResolvedValue(mockSuccess(mockData));

      const result = await client.getHealth();

      expect(mockNetworkClient.get).toHaveBeenCalledWith(`${BASE_URL}/api/health`);
      expect(result).toEqual(mockData);
    });
  });

  // =====================================================================
  // URL BUILDING
  // =====================================================================

  describe('URL building', () => {
    it('should handle base URL with trailing slash', async () => {
      const clientWithSlash = new IndexerClient(`${BASE_URL}/`, mockNetworkClient);
      const mockData = { success: true, data: [] };
      vi.mocked(mockNetworkClient.get).mockResolvedValue(mockSuccess(mockData));

      await clientWithSlash.getMarkets();

      expect(mockNetworkClient.get).toHaveBeenCalledWith(`${BASE_URL}/api/markets/list`);
    });
  });

  // =====================================================================
  // ERROR HANDLING
  // =====================================================================

  describe('error handling', () => {
    it('should use statusText when no error in response body', async () => {
      vi.mocked(mockNetworkClient.get).mockResolvedValue({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
        data: undefined,
        headers: {},
      });

      await expect(client.getMarkets()).rejects.toThrow('API Error (503): Service Unavailable');
    });

    it('should prefer error message from response body', async () => {
      vi.mocked(mockNetworkClient.get).mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        data: { error: 'Specific error message' },
        headers: {},
      });

      await expect(client.getMarkets()).rejects.toThrow('API Error (400): Specific error message');
    });
  });
});
