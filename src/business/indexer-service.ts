/**
 * Business service for Heavymath Indexer operations
 * Provides high-level methods with caching for frequently accessed data
 */

import type { NetworkClient } from '@sudobility/types';
import { IndexerClient } from '../network/IndexerClient';
import type {
  MarketData,
  PredictionData,
  DealerNftData,
  PaginatedResponse,
  ApiResponse,
  PredictionFilters,
  MarketStateHistoryData,
  MarketStatsData,
} from '../types';

/**
 * Configuration for IndexerService
 */
export interface IndexerServiceConfig {
  indexerUrl: string;
  networkClient: NetworkClient;
  cacheTTL?: number; // Cache time-to-live in milliseconds (default: 5 minutes)
}

/**
 * Business service for indexer operations
 * Implements caching and high-level business logic
 */
export class IndexerService {
  private static instance: IndexerService;
  private indexerClient: IndexerClient;
  private cache = new Map<string, { data: unknown; expires: number }>();
  private readonly CACHE_TTL: number;

  /**
   * Create an IndexerService instance
   * @param config - Configuration including indexerUrl and networkClient from @sudobility/di
   */
  constructor(config: IndexerServiceConfig) {
    if (!config.indexerUrl) {
      throw new Error('indexerUrl is required in IndexerServiceConfig');
    }
    if (!config.networkClient) {
      throw new Error('networkClient is required in IndexerServiceConfig');
    }
    this.indexerClient = new IndexerClient(config.indexerUrl, config.networkClient);
    this.CACHE_TTL = config.cacheTTL || 5 * 60 * 1000; // 5 minutes default
  }

  public static getInstance(config: IndexerServiceConfig): IndexerService {
    if (!IndexerService.instance) {
      IndexerService.instance = new IndexerService(config);
    }
    return IndexerService.instance;
  }

  // =============================================================================
  // PRIVATE CACHE METHODS
  // =============================================================================

  private getCacheKey(...args: unknown[]): string {
    return args.map(arg => (typeof arg === 'object' ? JSON.stringify(arg) : arg)).join(':');
  }

  private getCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && cached.expires > Date.now()) {
      return cached.data as T;
    }
    this.cache.delete(key);
    return null;
  }

  private setCache<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      expires: Date.now() + this.CACHE_TTL,
    });
  }

  // =============================================================================
  // PUBLIC BUSINESS METHODS
  // =============================================================================

  /**
   * Get active markets with caching.
   * Commonly used for displaying available markets to bettors.
   * Results are cached for the configured TTL (default: 5 minutes).
   *
   * @param limit - Maximum number of markets to return (default: 50)
   * @returns Paginated list of active markets
   * @throws Error if the API request fails (with a descriptive message)
   */
  public async getActiveMarkets(limit: number = 50): Promise<PaginatedResponse<MarketData>> {
    const cacheKey = this.getCacheKey('active-markets', limit);
    const cached = this.getCache<PaginatedResponse<MarketData>>(cacheKey);
    if (cached) return cached;

    try {
      const result = await this.indexerClient.getMarkets({
        status: 'Active',
        limit,
      });

      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      throw new Error(
        `Failed to get active markets: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get user's predictions (betting history) with caching.
   * Results are cached for the configured TTL (default: 5 minutes).
   *
   * @param walletAddress - User's wallet address
   * @param filters - Additional prediction filters (excluding 'user', which is set automatically)
   * @returns Paginated list of the user's predictions
   * @throws Error if the API request fails
   */
  public async getUserPredictions(
    walletAddress: string,
    filters?: Omit<PredictionFilters, 'user'>
  ): Promise<PaginatedResponse<PredictionData>> {
    const cacheKey = this.getCacheKey('user-predictions', walletAddress, filters);
    const cached = this.getCache<PaginatedResponse<PredictionData>>(cacheKey);
    if (cached) return cached;

    try {
      const result = await this.indexerClient.getPredictions({
        user: walletAddress,
        ...filters,
      });

      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      throw new Error(
        `Failed to get user predictions: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Check if wallet is a dealer and get their NFTs with caching.
   * Results are cached for the configured TTL (default: 5 minutes).
   *
   * @param walletAddress - Wallet address to check
   * @returns Array of dealer NFTs owned by the wallet (empty if not a dealer)
   * @throws Error if the API request fails
   */
  public async getDealerNFTs(walletAddress: string): Promise<DealerNftData[]> {
    const cacheKey = this.getCacheKey('dealer-nfts', walletAddress);
    const cached = this.getCache<DealerNftData[]>(cacheKey);
    if (cached) return cached;

    try {
      const result = await this.indexerClient.getDealers({
        owner: walletAddress,
      });

      const nfts = result.data ?? [];
      this.setCache(cacheKey, nfts);
      return nfts;
    } catch (error) {
      throw new Error(
        `Failed to get dealer NFTs: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get dealer's dashboard (all markets for their NFTs) with caching.
   * Fetches dealer NFTs and then all markets for each NFT in parallel.
   * Results are cached for the configured TTL (default: 5 minutes).
   *
   * @param walletAddress - Dealer's wallet address
   * @returns Object containing the dealer's NFTs and their aggregated markets (deduplicated)
   * @throws Error if the API request fails
   */
  public async getDealerDashboard(walletAddress: string): Promise<{
    nfts: DealerNftData[];
    markets: MarketData[];
  }> {
    const cacheKey = this.getCacheKey('dealer-dashboard', walletAddress);
    const cached = this.getCache<{ nfts: DealerNftData[]; markets: MarketData[] }>(cacheKey);
    if (cached) return cached;

    try {
      // Get dealer NFTs
      const nfts = await this.getDealerNFTs(walletAddress);

      // Get markets for each NFT
      const marketPromises = nfts.map(nft => this.indexerClient.getDealerMarkets(nft.id));
      const marketResults = await Promise.all(marketPromises);

      // Flatten markets and remove duplicates
      const marketsMap = new Map<string, MarketData>();
      marketResults.forEach(result => {
        if (result.data) {
          result.data.forEach(market => marketsMap.set(market.id, market));
        }
      });
      const markets = Array.from(marketsMap.values());

      const result = { nfts, markets };
      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      throw new Error(
        `Failed to get dealer dashboard: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get complete market details including predictions and history with caching.
   * Fetches market, predictions, and history in parallel.
   * Results are cached for the configured TTL (default: 5 minutes).
   *
   * @param marketId - Chain-prefixed market ID (e.g., '1-market-123')
   * @returns Object containing the market data, its predictions, and state history
   * @throws Error if the market is not found or the API request fails
   */
  public async getMarketDetails(marketId: string): Promise<{
    market: MarketData;
    predictions: PredictionData[];
    history: MarketStateHistoryData[];
  }> {
    const cacheKey = this.getCacheKey('market-details', marketId);
    const cached = this.getCache<{
      market: MarketData;
      predictions: PredictionData[];
      history: MarketStateHistoryData[];
    }>(cacheKey);
    if (cached) return cached;

    try {
      const [marketResult, predictionsResult, historyResult] = await Promise.all([
        this.indexerClient.getMarket(marketId),
        this.indexerClient.getMarketPredictions(marketId),
        this.indexerClient.getMarketHistory(marketId),
      ]);

      if (!marketResult.data) {
        throw new Error('Market not found');
      }

      const result = {
        market: marketResult.data,
        predictions: predictionsResult.data || [],
        history: historyResult.data || [],
      };

      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      throw new Error(
        `Failed to get market details: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get user's betting history (active + past bets) with caching.
   * Fetches active and claimed predictions in parallel (limited to 100 each).
   * Results are cached for the configured TTL (default: 5 minutes).
   *
   * @param walletAddress - User's wallet address
   * @returns Object containing arrays of active (unclaimed) and claimed predictions
   * @throws Error if the API request fails
   */
  public async getUserBettingHistory(walletAddress: string): Promise<{
    active: PredictionData[];
    claimed: PredictionData[];
  }> {
    const cacheKey = this.getCacheKey('user-betting-history', walletAddress);
    const cached = this.getCache<{ active: PredictionData[]; claimed: PredictionData[] }>(cacheKey);
    if (cached) return cached;

    try {
      const [activeResult, claimedResult] = await Promise.all([
        this.indexerClient.getPredictions({
          user: walletAddress,
          claimed: false,
          limit: 100,
        }),
        this.indexerClient.getPredictions({
          user: walletAddress,
          claimed: true,
          limit: 100,
        }),
      ]);

      const result = {
        active: activeResult.data || [],
        claimed: claimedResult.data || [],
      };

      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      throw new Error(
        `Failed to get user betting history: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get market from a prediction (navigate from bet to market).
   * First fetches the prediction to get the marketId, then fetches the market.
   * Note: this method does not use caching since it involves two sequential requests.
   *
   * @param predictionId - Chain-prefixed prediction ID
   * @returns The market data if found, or null if the prediction has no associated market
   * @throws Error if the API request fails
   */
  public async getMarketFromPrediction(predictionId: string): Promise<MarketData | null> {
    try {
      const predictionResult = await this.indexerClient.getPrediction(predictionId);
      if (!predictionResult.data) {
        return null;
      }

      const marketResult = await this.indexerClient.getMarket(predictionResult.data.marketId);
      return marketResult.data || null;
    } catch (error) {
      throw new Error(
        `Failed to get market from prediction: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get market statistics with caching.
   * Results are cached for the configured TTL (default: 5 minutes).
   *
   * @returns Aggregate market statistics wrapped in an API response
   * @throws Error if the API request fails
   */
  public async getMarketStats(): Promise<ApiResponse<MarketStatsData>> {
    const cacheKey = this.getCacheKey('market-stats');
    const cached = this.getCache<ApiResponse<MarketStatsData>>(cacheKey);
    if (cached) return cached;

    try {
      const result = await this.indexerClient.getMarketStats();
      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      throw new Error(
        `Failed to get market stats: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Clear the entire internal cache.
   * Use {@link invalidateCache} for targeted invalidation.
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * Invalidate cache entries whose keys start with the given prefix.
   * Useful for targeted cache invalidation when SSE events indicate
   * specific data has changed (e.g., invalidating all market-related caches).
   *
   * @param prefix - The cache key prefix to match (e.g., 'active-markets', 'dealer-dashboard')
   * @returns The number of cache entries that were invalidated
   *
   * @example
   * ```ts
   * // Invalidate all market-related caches
   * service.invalidateCache('active-markets');
   *
   * // Invalidate all caches for a specific user
   * service.invalidateCache('user-predictions:0x123...');
   * ```
   */
  public invalidateCache(prefix: string): number {
    let count = 0;
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
        count++;
      }
    }
    return count;
  }

  /**
   * Get the underlying IndexerClient for direct API access.
   *
   * @returns The IndexerClient instance used by this service
   */
  public getClient(): IndexerClient {
    return this.indexerClient;
  }
}
