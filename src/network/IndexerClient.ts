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
  MarketDetailData,
  PredictionData,
  DealerWithPermissionsData,
  LicensePermissionData,
  MarketStateHistoryData,
  FeeWithdrawalData,
  OracleRequestData,
  MarketStatsData,
  HealthData,
  TriggerLockResponseData,
  TriggerResolveResponseData,
  MarketFilters,
  PredictionFilters,
  DealerFilters,
  WithdrawalFilters,
  OracleFilters,
  WalletFavoriteData,
  WalletFavoritesFilters,
  CreateFavoriteRequest,
  FavoriteCountsFilters,
  SetMarketOracleConfigRequest,
  MarketOracleConfigData,
  MarketResolutionCheck,
  MarketResolutionCheckSuccess,
  MarketResolutionCheckError,
  AuthNonceResponse,
  AuthVerifyResponse,
  DiscussionData,
  CommentData,
  DiscussionCommentsResponse,
  PostCommentRequest,
  DiscussionQuery,
  DiscussionCommentsFilters,
} from '../types';
import type { SportsApiResponse, SportsQueryParams, SportsSearchResponse } from '../types/sports';
import { getNow, getTestMode } from '../utils/datetime';

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
    const path = `/api/markets/list${queryString ? `?${queryString}` : ''}`;

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
  async getMarket(id: string): Promise<ApiResponse<MarketDetailData>> {
    const response = await this.networkClient.get<ApiResponse<MarketDetailData>>(
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
  async getMarketPredictions(marketId: string): Promise<PaginatedResponse<PredictionData>> {
    const response = await this.networkClient.get<PaginatedResponse<PredictionData>>(
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
  async getDealers(filters?: DealerFilters): Promise<PaginatedResponse<DealerWithPermissionsData>> {
    const params = new URLSearchParams();

    if (filters?.owner) params.append('owner', filters.owner);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    const queryString = params.toString();
    const path = `/api/dealers/list${queryString ? `?${queryString}` : ''}`;

    const response = await this.networkClient.get<PaginatedResponse<DealerWithPermissionsData>>(
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
  async getDealer(id: string): Promise<ApiResponse<DealerWithPermissionsData>> {
    const response = await this.networkClient.get<ApiResponse<DealerWithPermissionsData>>(
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
  async getDealerPermissions(dealerId: string): Promise<ApiResponse<LicensePermissionData[]>> {
    const response = await this.networkClient.get<ApiResponse<LicensePermissionData[]>>(
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
  async getDealerMarkets(dealerId: string): Promise<PaginatedResponse<MarketData>> {
    const response = await this.networkClient.get<PaginatedResponse<MarketData>>(
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
  // ORACLE RESOLUTION ENDPOINTS
  // =============================================================================

  /**
   * Set the oracle resolution config for a market.
   * POST /api/markets/:id/oracle-config
   *
   * Called after on-chain market creation to store which team's win = positive outcome.
   *
   * @param marketId - Chain-prefixed market ID
   * @param config - Oracle config with positive team info
   * @returns The created oracle config
   * @throws Error if the market is not found or doesn't have an oracle
   */
  async setMarketOracleConfig(
    marketId: string,
    config: SetMarketOracleConfigRequest
  ): Promise<ApiResponse<MarketOracleConfigData>> {
    const response = await this.networkClient.post<ApiResponse<MarketOracleConfigData>>(
      buildUrl(this.baseUrl, `/api/markets/${encodeURIComponent(marketId)}/oracle-config`),
      config
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'set market oracle config');
    }

    return response.data;
  }

  /**
   * Get the oracle resolution config for a market.
   * GET /api/markets/:id/oracle-config
   *
   * @param marketId - Chain-prefixed market ID
   * @returns The oracle config data
   * @throws Error if the config is not found
   */
  async getMarketOracleConfig(marketId: string): Promise<ApiResponse<MarketOracleConfigData>> {
    const response = await this.networkClient.get<ApiResponse<MarketOracleConfigData>>(
      buildUrl(this.baseUrl, `/api/markets/${encodeURIComponent(marketId)}/oracle-config`)
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'get market oracle config');
    }

    return response.data;
  }

  /**
   * Check if a market can be resolved via oracle.
   * GET /api/markets/:id/resolve
   *
   * Returns the resolution result if the game has ended (HTTP 200),
   * or an error if the game hasn't ended yet (HTTP 400).
   *
   * Unlike other methods, this does NOT throw on 400 — it returns a
   * structured result so the UI can display the reason.
   *
   * @param marketId - Chain-prefixed market ID
   * @returns Resolution check result (ok: true with data, or ok: false with error)
   */
  async checkMarketResolution(marketId: string): Promise<MarketResolutionCheck> {
    const url = buildUrl(this.baseUrl, `/api/markets/${encodeURIComponent(marketId)}/resolve`);
    const testMode = getTestMode();

    try {
      const response = await this.networkClient.get<MarketResolutionCheckSuccess>(url);

      if (response.ok && response.data) {
        return {
          ok: true,
          data: response.data as MarketResolutionCheckSuccess,
        };
      }

      // Shouldn't reach here (WebNetworkClient throws on !ok), but handle gracefully
      return {
        ok: false,
        error: {
          success: false,
          error: `Unexpected response (${response.status})`,
          timestamp: getNow(testMode).toISOString(),
        },
      };
    } catch (error: unknown) {
      // WebNetworkClient throws NetworkError on non-2xx responses.
      // Extract the structured error body so the UI can show the reason
      // (e.g. "Game has not ended yet") instead of a generic error.
      if (error && typeof error === 'object' && 'status' in error && 'response' in error) {
        const networkError = error as { status: number; response?: unknown };
        const errorData = networkError.response as MarketResolutionCheckError | undefined;
        return {
          ok: false,
          error: errorData ?? {
            success: false,
            error: `API Error (${networkError.status}): Failed to check market resolution`,
            timestamp: getNow(testMode).toISOString(),
          },
        };
      }
      // Re-throw actual network failures (timeouts, connection refused)
      throw error;
    }
  }

  /**
   * Lock a market via the indexer's resolver wallet.
   * POST /api/markets/:id/trigger-lock
   *
   * Calls PredictionMarket.lockMarket() on-chain. Gas is paid by the
   * resolver wallet, not the user's wallet.
   *
   * @param marketId - Chain-prefixed market ID
   * @returns Success with transaction hash, or error
   */
  async triggerLock(marketId: string): Promise<ApiResponse<TriggerLockResponseData>> {
    const url = buildUrl(this.baseUrl, `/api/markets/${encodeURIComponent(marketId)}/trigger-lock`);

    const response = await this.networkClient.post<ApiResponse<TriggerLockResponseData>>(
      url,
      undefined,
      { timeout: 120_000 }
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'trigger lock');
    }

    return response.data;
  }

  /**
   * Trigger oracle resolution via the indexer's authorized updater.
   * POST /api/markets/:id/trigger-resolve
   *
   * Computes the game result from the sports API and pushes it on-chain
   * via OracleResolver.updateOracleData(). After success, the market can
   * be finalized by calling completeOracleResolution() on-chain.
   *
   * Like checkMarketResolution, this does NOT throw on 4xx — it returns
   * a structured result so the UI can display the reason.
   *
   * @param marketId - Chain-prefixed market ID
   * @returns Resolution result with oracleUpdated flag, or error
   */
  async triggerResolve(marketId: string): Promise<ApiResponse<TriggerResolveResponseData>> {
    const url = buildUrl(
      this.baseUrl,
      `/api/markets/${encodeURIComponent(marketId)}/trigger-resolve`
    );

    const response = await this.networkClient.post<ApiResponse<TriggerResolveResponseData>>(
      url,
      undefined,
      { timeout: 120_000 }
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'trigger resolve');
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

  /**
   * Get favorite counts across all wallets for specific items.
   * GET /api/favorites/counts
   *
   * @param filters - Required filters: category, subcategory, type, itemIds
   * @returns Map of itemId to favorite count (items with 0 favorites are omitted)
   */
  async getFavoriteCounts(
    filters: FavoriteCountsFilters
  ): Promise<ApiResponse<Record<string, number>>> {
    const params = new URLSearchParams();
    params.append('category', filters.category);
    params.append('subcategory', filters.subcategory);
    params.append('type', filters.type);
    // itemIds is optional — omit to get all non-zero counts for the category
    if (filters.itemIds && filters.itemIds.length > 0) {
      params.append('itemIds', filters.itemIds.join(','));
    }

    const path = `/api/favorites/counts?${params.toString()}`;
    const response = await this.networkClient.get<ApiResponse<Record<string, number>>>(
      buildUrl(this.baseUrl, path)
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'get favorite counts');
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

  // =============================================================================
  // SPORTS API PROXY ENDPOINTS
  // =============================================================================

  /**
   * Cross-sport team search.
   * Searches teams across all sports via the indexer's aggregated search endpoint.
   * GET /api/sports/search?q={query}
   *
   * @param query - Search query (minimum 3 characters)
   * @returns Aggregated search results grouped by sport
   * @throws Error if the request fails
   */
  async searchSports(query: string): Promise<ApiResponse<SportsSearchResponse>> {
    const params = new URLSearchParams();
    params.append('q', query);

    const path = `/api/sports/search?${params.toString()}`;

    const response = await this.networkClient.get<ApiResponse<SportsSearchResponse>>(
      buildUrl(this.baseUrl, path)
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'search sports');
    }

    return response.data;
  }

  /**
   * Generic sports API proxy call.
   * Proxies any api-sports.io request through the indexer with server-side caching.
   * Returns the raw api-sports.io response body (passthrough format).
   *
   * @param sport - Sport identifier (e.g., 'football', 'basketball')
   * @param endpoint - API endpoint path (e.g., '/countries', '/fixtures')
   * @param params - Optional query parameters to forward
   * @returns The raw api-sports.io response
   * @throws Error if the request fails
   *
   * @example
   * ```ts
   * const data = await client.getSportsData('football', '/countries');
   * const leagues = await client.getSportsData('basketball', '/leagues', { season: '2023-2024' });
   * ```
   */
  async getSportsData<T = unknown>(
    sport: string,
    endpoint: string,
    params?: SportsQueryParams
  ): Promise<SportsApiResponse<T>> {
    const searchParams = new URLSearchParams();
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      }
    }

    const queryString = searchParams.toString();
    const path = `/api/sports/${encodeURIComponent(sport)}${endpoint}${queryString ? `?${queryString}` : ''}`;

    const response = await this.networkClient.get<SportsApiResponse<T>>(
      buildUrl(this.baseUrl, path)
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, `get sports data (${sport}${endpoint})`);
    }

    return response.data;
  }

  // =============================================================================
  // AUTH ENDPOINTS
  // =============================================================================

  /**
   * Get a SIWE nonce for signing.
   * GET /api/auth/nonce
   */
  async getNonce(): Promise<ApiResponse<AuthNonceResponse>> {
    const response = await this.networkClient.get<ApiResponse<AuthNonceResponse>>(
      buildUrl(this.baseUrl, '/api/auth/nonce')
    );
    if (!response.ok || !response.data) {
      throw handleApiError(response, 'get nonce');
    }
    return response.data;
  }

  /**
   * Verify a SIWE signature and get a JWT.
   * POST /api/auth/verify
   */
  async verifySiwe(
    message: string,
    signature: string
  ): Promise<ApiResponse<AuthVerifyResponse>> {
    const response = await this.networkClient.post<ApiResponse<AuthVerifyResponse>>(
      buildUrl(this.baseUrl, '/api/auth/verify'),
      { message, signature }
    );
    if (!response.ok || !response.data) {
      throw handleApiError(response, 'verify SIWE');
    }
    return response.data;
  }

  // =============================================================================
  // DISCUSSION ENDPOINTS
  // =============================================================================

  /**
   * Get discussion metadata for a subject.
   * GET /api/discussions?subject_type=...&sport=...&subject_id=...
   */
  async getDiscussion(
    query: DiscussionQuery
  ): Promise<ApiResponse<DiscussionData | null>> {
    const params = new URLSearchParams();
    params.append('subject_type', query.subjectType);
    params.append('sport', query.sport);
    params.append('subject_id', query.subjectId);

    const response = await this.networkClient.get<ApiResponse<DiscussionData | null>>(
      buildUrl(this.baseUrl, `/api/discussions?${params.toString()}`)
    );
    if (!response.ok || !response.data) {
      throw handleApiError(response, 'get discussion');
    }
    return response.data;
  }

  /**
   * Get paginated, threaded comments for a discussion.
   * GET /api/discussions/:id/comments
   */
  async getDiscussionComments(
    discussionId: number,
    filters?: DiscussionCommentsFilters
  ): Promise<ApiResponse<DiscussionCommentsResponse>> {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.sort) params.append('sort', filters.sort);

    const queryString = params.toString();
    const path = `/api/discussions/${discussionId}/comments${queryString ? `?${queryString}` : ''}`;

    const response = await this.networkClient.get<ApiResponse<DiscussionCommentsResponse>>(
      buildUrl(this.baseUrl, path)
    );
    if (!response.ok || !response.data) {
      throw handleApiError(response, 'get discussion comments');
    }
    return response.data;
  }

  /**
   * Post a comment to a discussion (creates discussion lazily if needed).
   * POST /api/discussions/comments
   */
  async postComment(
    token: string,
    body: PostCommentRequest
  ): Promise<ApiResponse<CommentData>> {
    const response = await this.networkClient.post<ApiResponse<CommentData>>(
      buildUrl(this.baseUrl, '/api/discussions/comments'),
      body,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!response.ok || !response.data) {
      throw handleApiError(response, 'post comment');
    }
    return response.data;
  }

  /**
   * Soft-delete a comment (author or admin only).
   * DELETE /api/discussions/comments/:id
   */
  async deleteComment(
    token: string,
    commentId: number
  ): Promise<ApiResponse<{ message: string }>> {
    const response = await this.networkClient.delete<ApiResponse<{ message: string }>>(
      buildUrl(this.baseUrl, `/api/discussions/comments/${commentId}`),
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!response.ok || !response.data) {
      throw handleApiError(response, 'delete comment');
    }
    return response.data;
  }
}
