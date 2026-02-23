/**
 * @fileoverview Indexer API Client
 * @description Low-level HTTP client for all Heavymath Indexer REST endpoints.
 * Each public method maps 1:1 to a REST API endpoint. Uses an injected
 * NetworkClient for transport, making it environment-agnostic (browser, Node, React Native).
 */

import type { NetworkClient, NetworkResponse } from '@sudobility/types';
import type {
  ApiResponse,
  PaginatedResponse,
  MarketData,
  PredictionData,
  DealerNftData,
  DealerPermissionData,
  MarketStateHistoryData,
  FeeWithdrawalData,
  OracleRequestData,
  MarketStatsData,
  HealthData,
  MarketFilters,
  PredictionFilters,
  DealerFilters,
  WithdrawalFilters,
  OracleFilters,
  WalletFavoriteData,
  WalletFavoritesFilters,
  CreateFavoriteRequest,
} from '../types';

/**
 * Build a full URL by joining a base URL and path.
 *
 * @param baseUrl - The base URL (trailing slash is stripped)
 * @param path - The path to append (leading slash is ensured)
 * @returns The combined URL string
 */
function buildUrl(baseUrl: string, path: string): string {
  const base = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const fullPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${fullPath}`;
}

/**
 * Create a standardized Error from an API response failure.
 * Includes the HTTP status code, endpoint URL, and error details for easier debugging.
 *
 * @param response - The failed network response
 * @param operation - A description of the operation that failed (used in error message)
 * @param url - Optional request URL to include in the error message for debugging
 * @returns An Error with a formatted message including the HTTP status code
 */
function handleApiError(
  response: NetworkResponse<unknown>,
  operation: string,
  url?: string
): Error {
  const data = response.data as { error?: string } | undefined;
  const errorMessage = data?.error || response.statusText || `Failed to ${operation}`;
  const urlSuffix = url ? ` [${url}]` : '';
  return new Error(`API Error (${response.status}): ${errorMessage}${urlSuffix}`);
}

/**
 * Indexer API client for Heavymath Prediction Market.
 * Provides type-safe methods for all REST endpoints exposed by the heavymath_indexer.
 * Requires a `NetworkClient` instance (from `@sudobility/di`) for HTTP transport.
 */
export class IndexerClient {
  private readonly baseUrl: string;
  private readonly networkClient: NetworkClient;

  /**
   * Create an IndexerClient instance
   * @param endpointUrl - The base URL for the indexer API
   * @param networkClient - A NetworkClient instance from @sudobility/di
   */
  constructor(endpointUrl: string, networkClient: NetworkClient) {
    this.baseUrl = endpointUrl;
    this.networkClient = networkClient;
  }

  // =============================================================================
  // MARKET ENDPOINTS
  // =============================================================================

  /**
   * Get all markets with optional filtering.
   * GET /api/markets
   *
   * @param filters - Optional query parameters (status, dealer, category, limit, offset)
   * @returns Paginated list of markets
   * @throws Error if the API request fails
   */
  async getMarkets(filters?: MarketFilters): Promise<PaginatedResponse<MarketData>> {
    const params = new URLSearchParams();

    if (filters?.status) params.append('status', filters.status);
    if (filters?.dealer) params.append('dealer', filters.dealer);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    const queryString = params.toString();
    const path = `/api/markets${queryString ? `?${queryString}` : ''}`;

    const response = await this.networkClient.get<PaginatedResponse<MarketData>>(
      buildUrl(this.baseUrl, path)
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'get markets');
    }

    return response.data;
  }

  /**
   * Get a specific market by ID.
   * GET /api/markets/:id
   *
   * @param id - The chain-prefixed market ID (e.g., "1-market-123")
   * @returns The market data wrapped in an API response
   * @throws Error if the market is not found or the request fails
   */
  async getMarket(id: string): Promise<ApiResponse<MarketData>> {
    const response = await this.networkClient.get<ApiResponse<MarketData>>(
      buildUrl(this.baseUrl, `/api/markets/${encodeURIComponent(id)}`)
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'get market');
    }

    return response.data;
  }

  /**
   * Get all predictions for a specific market.
   * GET /api/markets/:id/predictions
   *
   * @param marketId - The chain-prefixed market ID
   * @returns Array of predictions for the market
   * @throws Error if the request fails
   */
  async getMarketPredictions(marketId: string): Promise<ApiResponse<PredictionData[]>> {
    const response = await this.networkClient.get<ApiResponse<PredictionData[]>>(
      buildUrl(this.baseUrl, `/api/markets/${encodeURIComponent(marketId)}/predictions`)
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'get market predictions');
    }

    return response.data;
  }

  /**
   * Get state transition history for a market.
   * GET /api/markets/:id/history
   *
   * @param marketId - The chain-prefixed market ID
   * @returns Array of state history entries for the market
   * @throws Error if the request fails
   */
  async getMarketHistory(marketId: string): Promise<ApiResponse<MarketStateHistoryData[]>> {
    const response = await this.networkClient.get<ApiResponse<MarketStateHistoryData[]>>(
      buildUrl(this.baseUrl, `/api/markets/${encodeURIComponent(marketId)}/history`)
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'get market history');
    }

    return response.data;
  }

  // =============================================================================
  // PREDICTION ENDPOINTS
  // =============================================================================

  /**
   * Get predictions with optional filtering.
   * GET /api/predictions
   *
   * @param filters - Optional query parameters (user, market, claimed, limit, offset)
   * @returns Paginated list of predictions
   * @throws Error if the request fails
   */
  async getPredictions(filters?: PredictionFilters): Promise<PaginatedResponse<PredictionData>> {
    const params = new URLSearchParams();

    if (filters?.user) params.append('user', filters.user);
    if (filters?.market) params.append('market', filters.market);
    if (filters?.claimed !== undefined) params.append('claimed', filters.claimed.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    const queryString = params.toString();
    const path = `/api/predictions${queryString ? `?${queryString}` : ''}`;

    const response = await this.networkClient.get<PaginatedResponse<PredictionData>>(
      buildUrl(this.baseUrl, path)
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'get predictions');
    }

    return response.data;
  }

  /**
   * Get a specific prediction by ID.
   * GET /api/predictions/:id
   *
   * @param id - The chain-prefixed prediction ID (e.g., "1-market-123-0xuser...")
   * @returns The prediction data wrapped in an API response
   * @throws Error if the prediction is not found or the request fails
   */
  async getPrediction(id: string): Promise<ApiResponse<PredictionData>> {
    const response = await this.networkClient.get<ApiResponse<PredictionData>>(
      buildUrl(this.baseUrl, `/api/predictions/${encodeURIComponent(id)}`)
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'get prediction');
    }

    return response.data;
  }

  // =============================================================================
  // DEALER NFT ENDPOINTS
  // =============================================================================

  /**
   * Get all dealer NFTs with optional filtering.
   * GET /api/dealers
   *
   * @param filters - Optional query parameters (owner, limit, offset)
   * @returns Paginated list of dealer NFTs
   * @throws Error if the request fails
   */
  async getDealers(filters?: DealerFilters): Promise<PaginatedResponse<DealerNftData>> {
    const params = new URLSearchParams();

    if (filters?.owner) params.append('owner', filters.owner);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    const queryString = params.toString();
    const path = `/api/dealers${queryString ? `?${queryString}` : ''}`;

    const response = await this.networkClient.get<PaginatedResponse<DealerNftData>>(
      buildUrl(this.baseUrl, path)
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'get dealers');
    }

    return response.data;
  }

  /**
   * Get a specific dealer NFT by ID.
   * GET /api/dealers/:id
   *
   * @param id - The chain-prefixed dealer ID (e.g., "1-1")
   * @returns The dealer NFT data wrapped in an API response
   * @throws Error if the dealer is not found or the request fails
   */
  async getDealer(id: string): Promise<ApiResponse<DealerNftData>> {
    const response = await this.networkClient.get<ApiResponse<DealerNftData>>(
      buildUrl(this.baseUrl, `/api/dealers/${encodeURIComponent(id)}`)
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'get dealer');
    }

    return response.data;
  }

  /**
   * Get permissions for a specific dealer NFT.
   * GET /api/dealers/:id/permissions
   *
   * @param dealerId - The chain-prefixed dealer ID
   * @returns Array of permission entries for the dealer
   * @throws Error if the request fails
   */
  async getDealerPermissions(dealerId: string): Promise<ApiResponse<DealerPermissionData[]>> {
    const response = await this.networkClient.get<ApiResponse<DealerPermissionData[]>>(
      buildUrl(this.baseUrl, `/api/dealers/${encodeURIComponent(dealerId)}/permissions`)
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'get dealer permissions');
    }

    return response.data;
  }

  /**
   * Get all markets created by a specific dealer NFT.
   * GET /api/dealers/:id/markets
   *
   * @param dealerId - The chain-prefixed dealer ID
   * @returns Array of markets created by this dealer
   * @throws Error if the request fails
   */
  async getDealerMarkets(dealerId: string): Promise<ApiResponse<MarketData[]>> {
    const response = await this.networkClient.get<ApiResponse<MarketData[]>>(
      buildUrl(this.baseUrl, `/api/dealers/${encodeURIComponent(dealerId)}/markets`)
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'get dealer markets');
    }

    return response.data;
  }

  // =============================================================================
  // FEE WITHDRAWAL ENDPOINTS
  // =============================================================================

  /**
   * Get fee withdrawals with optional filtering.
   * GET /api/withdrawals
   *
   * @param filters - Optional query parameters (withdrawer, type, market, limit, offset)
   * @returns Paginated list of fee withdrawals
   * @throws Error if the request fails
   */
  async getWithdrawals(filters?: WithdrawalFilters): Promise<PaginatedResponse<FeeWithdrawalData>> {
    const params = new URLSearchParams();

    if (filters?.withdrawer) params.append('withdrawer', filters.withdrawer);
    if (filters?.type) params.append('type', filters.type);
    if (filters?.market) params.append('market', filters.market);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    const queryString = params.toString();
    const path = `/api/withdrawals${queryString ? `?${queryString}` : ''}`;

    const response = await this.networkClient.get<PaginatedResponse<FeeWithdrawalData>>(
      buildUrl(this.baseUrl, path)
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'get withdrawals');
    }

    return response.data;
  }

  // =============================================================================
  // ORACLE REQUEST ENDPOINTS
  // =============================================================================

  /**
   * Get oracle requests with optional filtering.
   * GET /api/oracle/requests
   *
   * @param filters - Optional query parameters (market, timedOut, limit, offset)
   * @returns Paginated list of oracle requests
   * @throws Error if the request fails
   */
  async getOracleRequests(filters?: OracleFilters): Promise<PaginatedResponse<OracleRequestData>> {
    const params = new URLSearchParams();

    if (filters?.market) params.append('market', filters.market);
    if (filters?.timedOut !== undefined) params.append('timedOut', filters.timedOut.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    const queryString = params.toString();
    const path = `/api/oracle/requests${queryString ? `?${queryString}` : ''}`;

    const response = await this.networkClient.get<PaginatedResponse<OracleRequestData>>(
      buildUrl(this.baseUrl, path)
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'get oracle requests');
    }

    return response.data;
  }

  /**
   * Get a specific oracle request by ID.
   * GET /api/oracle/requests/:id
   *
   * @param id - The oracle request ID
   * @returns The oracle request data wrapped in an API response
   * @throws Error if the oracle request is not found or the request fails
   */
  async getOracleRequest(id: string): Promise<ApiResponse<OracleRequestData>> {
    const response = await this.networkClient.get<ApiResponse<OracleRequestData>>(
      buildUrl(this.baseUrl, `/api/oracle/requests/${encodeURIComponent(id)}`)
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'get oracle request');
    }

    return response.data;
  }

  // =============================================================================
  // WALLET FAVORITES ENDPOINTS
  // =============================================================================

  /**
   * Get favorites for a wallet address.
   * GET /api/wallet/:address/favorites
   *
   * @param walletAddress - The wallet address to get favorites for
   * @param filters - Optional query parameters (category, subcategory, type, limit, offset)
   * @returns Paginated list of wallet favorites
   * @throws Error if the request fails
   */
  async getFavorites(
    walletAddress: string,
    filters?: WalletFavoritesFilters
  ): Promise<PaginatedResponse<WalletFavoriteData>> {
    const params = new URLSearchParams();

    if (filters?.category) params.append('category', filters.category);
    if (filters?.subcategory) params.append('subcategory', filters.subcategory);
    if (filters?.type) params.append('type', filters.type);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    const queryString = params.toString();
    const path = `/api/wallet/${encodeURIComponent(walletAddress)}/favorites${queryString ? `?${queryString}` : ''}`;

    const response = await this.networkClient.get<PaginatedResponse<WalletFavoriteData>>(
      buildUrl(this.baseUrl, path)
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'get favorites');
    }

    return response.data;
  }

  /**
   * Add a favorite for a wallet address.
   * POST /api/wallet/:address/favorites
   *
   * @param walletAddress - The wallet address to add a favorite for
   * @param favorite - The favorite item to add (category, subcategory, type, id)
   * @returns The newly created favorite data
   * @throws Error if the request fails
   */
  async addFavorite(
    walletAddress: string,
    favorite: CreateFavoriteRequest
  ): Promise<ApiResponse<WalletFavoriteData>> {
    const response = await this.networkClient.post<ApiResponse<WalletFavoriteData>>(
      buildUrl(this.baseUrl, `/api/wallet/${encodeURIComponent(walletAddress)}/favorites`),
      favorite
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'add favorite');
    }

    return response.data;
  }

  /**
   * Remove a favorite by ID.
   * DELETE /api/wallet/:address/favorites/:id
   *
   * @param walletAddress - The wallet address that owns the favorite
   * @param favoriteId - The numeric ID of the favorite to remove
   * @returns An API response confirming deletion
   * @throws Error if the favorite is not found or the request fails
   */
  async removeFavorite(walletAddress: string, favoriteId: number): Promise<ApiResponse<void>> {
    const response = await this.networkClient.delete<ApiResponse<void>>(
      buildUrl(
        this.baseUrl,
        `/api/wallet/${encodeURIComponent(walletAddress)}/favorites/${favoriteId}`
      )
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'remove favorite');
    }

    return response.data;
  }

  // =============================================================================
  // ANALYTICS ENDPOINTS
  // =============================================================================

  /**
   * Get market statistics.
   * GET /api/stats/markets
   *
   * @returns Aggregate market statistics (totals, breakdowns by status)
   * @throws Error if the request fails
   */
  async getMarketStats(): Promise<ApiResponse<MarketStatsData>> {
    const response = await this.networkClient.get<ApiResponse<MarketStatsData>>(
      buildUrl(this.baseUrl, '/api/stats/markets')
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'get market stats');
    }

    return response.data;
  }

  /**
   * Get health status of the indexer.
   * GET /api/health
   *
   * @returns The indexer health status
   * @throws Error if the request fails
   */
  async getHealth(): Promise<ApiResponse<HealthData>> {
    const response = await this.networkClient.get<ApiResponse<HealthData>>(
      buildUrl(this.baseUrl, '/api/health')
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'get health');
    }

    return response.data;
  }
}
