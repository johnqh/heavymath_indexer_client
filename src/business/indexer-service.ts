/**
 * Business service for Heavymath Indexer operations
 * Provides high-level methods with caching for frequently accessed data
 */

import { IndexerClient } from '../network/IndexerClient';
import { FetchNetworkClient } from '../network/FetchNetworkClient';
import type {
  Market,
  Prediction,
  DealerNFT,
  PaginatedResponse,
  ApiResponse,
  PredictionFilters,
  StateHistory,
  MarketStats,
} from '../types';

/**
 * Configuration for IndexerService
 */
export interface IndexerServiceConfig {
  indexerUrl: string;
  cacheTTL?: number; // Cache time-to-live in milliseconds (default: 5 minutes)
}

/**
 * Business service for indexer operations
 * Implements caching and high-level business logic
 */
export class IndexerService {
  private static instance: IndexerService;
  private indexerClient: IndexerClient;
  private cache = new Map<string, { data: any; expires: number }>();
  private readonly CACHE_TTL: number;

  constructor(config: IndexerServiceConfig) {
    if (!config.indexerUrl) {
      throw new Error('indexerUrl is required in IndexerServiceConfig');
    }
    const fetchClient = new FetchNetworkClient();
    this.indexerClient = new IndexerClient(config.indexerUrl, fetchClient);
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

  private getCacheKey(...args: any[]): string {
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
   * Get active markets with caching
   * Commonly used for displaying available markets to bettors
   */
  public async getActiveMarkets(limit: number = 50): Promise<PaginatedResponse<Market>> {
    const cacheKey = this.getCacheKey('active-markets', limit);
    const cached = this.getCache<PaginatedResponse<Market>>(cacheKey);
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
   * Get user's predictions (betting history)
   * @param walletAddress - User's wallet address
   * @param filters - Additional filters
   */
  public async getUserPredictions(
    walletAddress: string,
    filters?: Omit<PredictionFilters, 'user'>
  ): Promise<PaginatedResponse<Prediction>> {
    const cacheKey = this.getCacheKey('user-predictions', walletAddress, filters);
    const cached = this.getCache<PaginatedResponse<Prediction>>(cacheKey);
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
   * Check if wallet is a dealer and get their NFTs
   * @param walletAddress - Wallet address to check
   */
  public async getDealerNFTs(walletAddress: string): Promise<DealerNFT[]> {
    const cacheKey = this.getCacheKey('dealer-nfts', walletAddress);
    const cached = this.getCache<DealerNFT[]>(cacheKey);
    if (cached) return cached;

    try {
      const result = await this.indexerClient.getDealers({
        owner: walletAddress,
      });

      const nfts = result.data;
      this.setCache(cacheKey, nfts);
      return nfts;
    } catch (error) {
      throw new Error(
        `Failed to get dealer NFTs: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get dealer's dashboard (all markets for their NFTs)
   * @param walletAddress - Dealer's wallet address
   */
  public async getDealerDashboard(walletAddress: string): Promise<{
    nfts: DealerNFT[];
    markets: Market[];
  }> {
    const cacheKey = this.getCacheKey('dealer-dashboard', walletAddress);
    const cached = this.getCache<{ nfts: DealerNFT[]; markets: Market[] }>(cacheKey);
    if (cached) return cached;

    try {
      // Get dealer NFTs
      const nfts = await this.getDealerNFTs(walletAddress);

      // Get markets for each NFT
      const marketPromises = nfts.map(nft => this.indexerClient.getDealerMarkets(nft.id));
      const marketResults = await Promise.all(marketPromises);

      // Flatten markets and remove duplicates
      const marketsMap = new Map<string, Market>();
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
   * Get complete market details including predictions and history
   * @param marketId - Market ID
   */
  public async getMarketDetails(marketId: string): Promise<{
    market: Market;
    predictions: Prediction[];
    history: StateHistory[];
  }> {
    const cacheKey = this.getCacheKey('market-details', marketId);
    const cached = this.getCache<{
      market: Market;
      predictions: Prediction[];
      history: StateHistory[];
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
   * Get user's betting history (active + past bets)
   * @param walletAddress - User's wallet address
   */
  public async getUserBettingHistory(walletAddress: string): Promise<{
    active: Prediction[];
    claimed: Prediction[];
  }> {
    const cacheKey = this.getCacheKey('user-betting-history', walletAddress);
    const cached = this.getCache<{ active: Prediction[]; claimed: Prediction[] }>(cacheKey);
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
   * Get market from a prediction (navigate from bet to market)
   * @param predictionId - Prediction ID
   */
  public async getMarketFromPrediction(predictionId: string): Promise<Market | null> {
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
   * Get market statistics with caching
   */
  public async getMarketStats(): Promise<ApiResponse<MarketStats>> {
    const cacheKey = this.getCacheKey('market-stats');
    const cached = this.getCache<ApiResponse<MarketStats>>(cacheKey);
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
   * Clear the internal cache
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get the underlying IndexerClient for direct API access
   */
  public getClient(): IndexerClient {
    return this.indexerClient;
  }
}
