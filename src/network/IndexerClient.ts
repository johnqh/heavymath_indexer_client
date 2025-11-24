import type {
  ApiResponse,
  PaginatedResponse,
  Market,
  Prediction,
  DealerNFT,
  DealerPermission,
  StateHistory,
  FeeWithdrawal,
  OracleRequest,
  MarketStats,
  HealthStatus,
  MarketFilters,
  PredictionFilters,
  DealerFilters,
  WithdrawalFilters,
  OracleFilters,
  NetworkResponse,
} from '../types';
import { FetchNetworkClient } from './FetchNetworkClient';

/**
 * Build URL with base and path
 */
function buildUrl(baseUrl: string, path: string): string {
  const base = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const fullPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${fullPath}`;
}

/**
 * Handle API errors
 */
function handleApiError(response: NetworkResponse<any>, operation: string): Error {
  const errorMessage = response.data?.error || response.statusText || `Failed to ${operation}`;
  return new Error(`API Error (${response.status}): ${errorMessage}`);
}

/**
 * Indexer API client for Heavymath Prediction Market
 * Provides methods for all 15 REST endpoints
 */
export class IndexerClient {
  private readonly baseUrl: string;
  private readonly networkClient: FetchNetworkClient;

  constructor(endpointUrl: string, networkClient?: FetchNetworkClient) {
    this.baseUrl = endpointUrl;
    this.networkClient = networkClient || new FetchNetworkClient();
  }

  // =============================================================================
  // MARKET ENDPOINTS
  // =============================================================================

  /**
   * Get all markets with optional filtering
   * GET /api/markets
   */
  async getMarkets(filters?: MarketFilters): Promise<PaginatedResponse<Market>> {
    const params = new URLSearchParams();

    if (filters?.status) params.append('status', filters.status);
    if (filters?.dealer) params.append('dealer', filters.dealer);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    const queryString = params.toString();
    const path = `/api/markets${queryString ? `?${queryString}` : ''}`;

    const response = await this.networkClient.get<PaginatedResponse<Market>>(
      buildUrl(this.baseUrl, path)
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'get markets');
    }

    return response.data;
  }

  /**
   * Get a specific market by ID
   * GET /api/markets/:id
   */
  async getMarket(id: string): Promise<ApiResponse<Market>> {
    const response = await this.networkClient.get<ApiResponse<Market>>(
      buildUrl(this.baseUrl, `/api/markets/${encodeURIComponent(id)}`)
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'get market');
    }

    return response.data;
  }

  /**
   * Get all predictions for a specific market
   * GET /api/markets/:id/predictions
   */
  async getMarketPredictions(marketId: string): Promise<ApiResponse<Prediction[]>> {
    const response = await this.networkClient.get<ApiResponse<Prediction[]>>(
      buildUrl(this.baseUrl, `/api/markets/${encodeURIComponent(marketId)}/predictions`)
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'get market predictions');
    }

    return response.data;
  }

  /**
   * Get state transition history for a market
   * GET /api/markets/:id/history
   */
  async getMarketHistory(marketId: string): Promise<ApiResponse<StateHistory[]>> {
    const response = await this.networkClient.get<ApiResponse<StateHistory[]>>(
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
   * Get predictions with optional filtering
   * GET /api/predictions
   */
  async getPredictions(filters?: PredictionFilters): Promise<PaginatedResponse<Prediction>> {
    const params = new URLSearchParams();

    if (filters?.user) params.append('user', filters.user);
    if (filters?.market) params.append('market', filters.market);
    if (filters?.claimed !== undefined) params.append('claimed', filters.claimed.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    const queryString = params.toString();
    const path = `/api/predictions${queryString ? `?${queryString}` : ''}`;

    const response = await this.networkClient.get<PaginatedResponse<Prediction>>(
      buildUrl(this.baseUrl, path)
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'get predictions');
    }

    return response.data;
  }

  /**
   * Get a specific prediction by ID
   * GET /api/predictions/:id
   */
  async getPrediction(id: string): Promise<ApiResponse<Prediction>> {
    const response = await this.networkClient.get<ApiResponse<Prediction>>(
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
   * Get all dealer NFTs with optional filtering
   * GET /api/dealers
   */
  async getDealers(filters?: DealerFilters): Promise<PaginatedResponse<DealerNFT>> {
    const params = new URLSearchParams();

    if (filters?.owner) params.append('owner', filters.owner);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    const queryString = params.toString();
    const path = `/api/dealers${queryString ? `?${queryString}` : ''}`;

    const response = await this.networkClient.get<PaginatedResponse<DealerNFT>>(
      buildUrl(this.baseUrl, path)
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'get dealers');
    }

    return response.data;
  }

  /**
   * Get a specific dealer NFT by ID
   * GET /api/dealers/:id
   */
  async getDealer(id: string): Promise<ApiResponse<DealerNFT>> {
    const response = await this.networkClient.get<ApiResponse<DealerNFT>>(
      buildUrl(this.baseUrl, `/api/dealers/${encodeURIComponent(id)}`)
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'get dealer');
    }

    return response.data;
  }

  /**
   * Get permissions for a specific dealer NFT
   * GET /api/dealers/:id/permissions
   */
  async getDealerPermissions(dealerId: string): Promise<ApiResponse<DealerPermission[]>> {
    const response = await this.networkClient.get<ApiResponse<DealerPermission[]>>(
      buildUrl(this.baseUrl, `/api/dealers/${encodeURIComponent(dealerId)}/permissions`)
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'get dealer permissions');
    }

    return response.data;
  }

  /**
   * Get all markets created by a specific dealer NFT
   * GET /api/dealers/:id/markets
   */
  async getDealerMarkets(dealerId: string): Promise<ApiResponse<Market[]>> {
    const response = await this.networkClient.get<ApiResponse<Market[]>>(
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
   * Get fee withdrawals with optional filtering
   * GET /api/withdrawals
   */
  async getWithdrawals(filters?: WithdrawalFilters): Promise<PaginatedResponse<FeeWithdrawal>> {
    const params = new URLSearchParams();

    if (filters?.withdrawer) params.append('withdrawer', filters.withdrawer);
    if (filters?.type) params.append('type', filters.type);
    if (filters?.market) params.append('market', filters.market);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    const queryString = params.toString();
    const path = `/api/withdrawals${queryString ? `?${queryString}` : ''}`;

    const response = await this.networkClient.get<PaginatedResponse<FeeWithdrawal>>(
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
   * Get oracle requests with optional filtering
   * GET /api/oracle/requests
   */
  async getOracleRequests(filters?: OracleFilters): Promise<PaginatedResponse<OracleRequest>> {
    const params = new URLSearchParams();

    if (filters?.market) params.append('market', filters.market);
    if (filters?.timedOut !== undefined) params.append('timedOut', filters.timedOut.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    const queryString = params.toString();
    const path = `/api/oracle/requests${queryString ? `?${queryString}` : ''}`;

    const response = await this.networkClient.get<PaginatedResponse<OracleRequest>>(
      buildUrl(this.baseUrl, path)
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'get oracle requests');
    }

    return response.data;
  }

  /**
   * Get a specific oracle request by ID
   * GET /api/oracle/requests/:id
   */
  async getOracleRequest(id: string): Promise<ApiResponse<OracleRequest>> {
    const response = await this.networkClient.get<ApiResponse<OracleRequest>>(
      buildUrl(this.baseUrl, `/api/oracle/requests/${encodeURIComponent(id)}`)
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'get oracle request');
    }

    return response.data;
  }

  // =============================================================================
  // ANALYTICS ENDPOINTS
  // =============================================================================

  /**
   * Get market statistics
   * GET /api/stats/markets
   */
  async getMarketStats(): Promise<ApiResponse<MarketStats>> {
    const response = await this.networkClient.get<ApiResponse<MarketStats>>(
      buildUrl(this.baseUrl, '/api/stats/markets')
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'get market stats');
    }

    return response.data;
  }

  /**
   * Get health status
   * GET /api/health
   */
  async getHealth(): Promise<ApiResponse<HealthStatus>> {
    const response = await this.networkClient.get<ApiResponse<HealthStatus>>(
      buildUrl(this.baseUrl, '/api/health')
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'get health');
    }

    return response.data;
  }
}
