/**
 * Type definitions for Heavymath Prediction Market Indexer API
 */

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp?: string;
}

/**
 * Paginated API response wrapper
 */
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  count: number;
  limit: number;
  offset: number;
  error?: string;
}

/**
 * Market status
 */
export type MarketStatus =
  | 'Active'
  | 'Locked'
  | 'Resolved'
  | 'Cancelled'
  | 'Abandoned'
  | 'Refunded';

/**
 * Prediction Market
 */
export interface Market {
  id: string;
  chainId: number;
  marketId: string;
  dealerNftTokenId: string;
  dealerAddress: string;
  title: string;
  description: string | null;
  category: string;
  status: MarketStatus;
  outcome: string | null;
  createdAt: string;
  resolvedAt: string | null;
  blockNumber: string;
  transactionHash: string;
}

/**
 * User Prediction
 */
export interface Prediction {
  id: string;
  chainId: number;
  marketId: string;
  userAddress: string;
  amount: string;
  percentage: number;
  outcome: string;
  hasClaimed: string;
  claimedAmount: string | null;
  createdAt: string;
  updatedAt: string;
  lastBlockNumber: string;
  lastTransactionHash: string;
}

/**
 * Dealer NFT
 */
export interface DealerNFT {
  id: string;
  chainId: number;
  tokenId: string;
  ownerAddress: string;
  mintedAt: string;
  mintBlockNumber: string;
  mintTransactionHash: string;
  lastTransferAt: string | null;
  lastTransferBlockNumber: string | null;
  lastTransferTransactionHash: string | null;
}

/**
 * Dealer Permission
 */
export interface DealerPermission {
  id: string;
  chainId: number;
  tokenId: string;
  category: number;
  subCategory: number;
  grantedAt: string;
  blockNumber: string;
  transactionHash: string;
}

/**
 * Market State History
 */
export interface StateHistory {
  id: string;
  chainId: number;
  marketId: string;
  fromState: MarketStatus;
  toState: MarketStatus;
  changedAt: string;
  blockNumber: string;
  transactionHash: string;
  reason: string | null;
}

/**
 * Fee Withdrawal
 */
export interface FeeWithdrawal {
  id: string;
  chainId: number;
  marketId: string;
  withdrawerAddress: string;
  withdrawalType: 'dealer' | 'system';
  amount: string;
  withdrawnAt: string;
  blockNumber: string;
  transactionHash: string;
}

/**
 * Oracle Request
 */
export interface OracleRequest {
  id: string;
  chainId: number;
  marketId: string;
  requestId: string;
  requestedAt: string;
  requestBlockNumber: string;
  requestTransactionHash: string;
  timeout: string;
  respondedAt: string | null;
  responseBlockNumber: string | null;
  responseTransactionHash: string | null;
  isTimedOut: string;
}

/**
 * Market Statistics
 */
export interface MarketStats {
  totalMarkets: number;
  activeMarkets: number;
  resolvedMarkets: number;
  totalPredictions: number;
  totalVolume: string;
  totalFees: string;
}

/**
 * Health Check Response
 */
export interface HealthStatus {
  status: string;
  database: string;
  timestamp: string;
}

/**
 * Query parameters for markets endpoint
 */
export interface MarketFilters {
  status?: MarketStatus;
  dealer?: string;
  category?: string;
  limit?: number;
  offset?: number;
}

/**
 * Query parameters for predictions endpoint
 */
export interface PredictionFilters {
  user?: string;
  market?: string;
  claimed?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Query parameters for dealers endpoint
 */
export interface DealerFilters {
  owner?: string;
  limit?: number;
  offset?: number;
}

/**
 * Query parameters for withdrawals endpoint
 */
export interface WithdrawalFilters {
  withdrawer?: string;
  type?: 'dealer' | 'system';
  market?: string;
  limit?: number;
  offset?: number;
}

/**
 * Query parameters for oracle requests endpoint
 */
export interface OracleFilters {
  market?: string;
  timedOut?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Network response type
 */
export interface NetworkResponse<T> {
  ok: boolean;
  status: number;
  statusText: string;
  data: T;
  headers: Record<string, string>;
  success: boolean;
  timestamp: string;
}

/**
 * Optional utility type
 */
export type Optional<T> = T | null | undefined;
