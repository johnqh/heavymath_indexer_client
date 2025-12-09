/**
 * Type definitions for Heavymath Prediction Market Indexer API Client
 *
 * Re-exports types from @sudobility/heavymath_types and @sudobility/types
 * to ensure type consistency between frontend and backend.
 */

// ============================================================================
// Re-exports from @sudobility/types
// ============================================================================

export type {
  // Base response types
  BaseResponse,
  PaginationInfo,
  PaginatedResponse,
  Optional,
  // Network types
  NetworkClient,
  NetworkResponse,
  NetworkRequestOptions,
} from '@sudobility/types';

// ApiResponse is an alias for BaseResponse
export type { ApiResponse } from '@sudobility/types';

// ============================================================================
// Re-exports from @sudobility/heavymath_types
// ============================================================================

export type {
  // Common types
  ChainPrefixedId,
  PredictionId,
  TxLogId,

  // Enums
  MarketStatus,
  ClaimType,
  WithdrawalType,

  // API Data types (JSON-serializable versions for API responses)
  MarketData,
  PredictionData,
  DealerNftData,
  DealerPermissionData,
  FeeWithdrawalData,
  OracleRequestData,
  MarketStateHistoryData,
  MarketStatsData,
  HealthData,
  SSEStatsData,
  WalletFavoriteData,
  CreateFavoriteRequest,
  PaginationMeta,
} from '@sudobility/heavymath_types';

// ============================================================================
// Type Aliases for Backward Compatibility
// ============================================================================

// These aliases map old type names to new ones from @sudobility/heavymath_types
// This maintains backward compatibility with existing code using the old names

import type {
  MarketData,
  PredictionData,
  DealerNftData,
  DealerPermissionData,
  FeeWithdrawalData,
  OracleRequestData,
  MarketStateHistoryData,
  MarketStatsData,
  HealthData,
} from '@sudobility/heavymath_types';

/** @deprecated Use MarketData instead */
export type Market = MarketData;

/** @deprecated Use PredictionData instead */
export type Prediction = PredictionData;

/** @deprecated Use DealerNftData instead */
export type DealerNFT = DealerNftData;

/** @deprecated Use DealerPermissionData instead */
export type DealerPermission = DealerPermissionData;

/** @deprecated Use FeeWithdrawalData instead */
export type FeeWithdrawal = FeeWithdrawalData;

/** @deprecated Use OracleRequestData instead */
export type OracleRequest = OracleRequestData;

/** @deprecated Use MarketStateHistoryData instead */
export type StateHistory = MarketStateHistoryData;

/** @deprecated Use MarketStatsData instead */
export type MarketStats = MarketStatsData;

/** @deprecated Use HealthData instead */
export type HealthStatus = HealthData;

// ============================================================================
// Client-specific Types (not in shared packages)
// ============================================================================

/**
 * Query parameters for markets endpoint
 */
export interface MarketFilters {
  status?: import('@sudobility/heavymath_types').MarketStatus;
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
  type?: import('@sudobility/heavymath_types').WithdrawalType;
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
 * Query parameters for wallet favorites endpoint
 */
export interface WalletFavoritesFilters {
  category?: string;
  subcategory?: string;
  type?: string;
  limit?: number;
  offset?: number;
}

// ============================================================================
// Server-Sent Events (SSE) Types
// ============================================================================

/**
 * SSE subscription channels
 */
export type SubscriptionChannel = 'markets' | 'market' | 'predictions' | 'dealers' | 'oracle';

/**
 * SSE event types
 */
export type SSEEventType =
  | 'MarketCreated'
  | 'MarketResolved'
  | 'MarketCancelled'
  | 'MarketAbandoned'
  | 'PredictionPlaced'
  | 'PredictionUpdated'
  | 'WinningsClaimed'
  | 'RefundClaimed'
  | 'DealerFeeSet'
  | 'DealerFeesWithdrawn'
  | 'LicenseIssued'
  | 'LicenseTransferred'
  | 'PermissionsSet'
  | 'OracleRegistered'
  | 'OracleDataUpdated';

/**
 * SSE subscription filters
 */
export interface SSEFilters {
  marketId?: string;
  dealer?: string;
  user?: string;
  category?: string;
}

/**
 * SSE connection message
 */
export interface SSEConnectedMessage {
  type: 'connected';
  clientId: string;
  subscriptionId: string;
  channel: SubscriptionChannel;
  timestamp: number;
}

/**
 * SSE data update message
 */
export interface SSEDataUpdateMessage {
  type: 'data_update';
  subscriptionId: string;
  eventType: SSEEventType;
  data: unknown;
  timestamp: number;
}

/**
 * SSE heartbeat message
 */
export interface SSEHeartbeatMessage {
  type: 'heartbeat';
  timestamp: number;
}

/**
 * SSE subscription confirmed message
 */
export interface SSESubscriptionConfirmedMessage {
  type: 'subscription_confirmed';
  subscriptionId: string;
  channel: SubscriptionChannel;
}

/**
 * Union of all SSE message types
 */
export type SSEMessage =
  | SSEConnectedMessage
  | SSEDataUpdateMessage
  | SSEHeartbeatMessage
  | SSESubscriptionConfirmedMessage;

/**
 * SSE connection state
 */
export type SSEConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error';

/**
 * Market created event data
 */
export interface MarketCreatedEventData {
  marketId: string;
  dealer: string;
  category: string;
  chainId: number;
}

/**
 * Market resolved event data
 */
export interface MarketResolvedEventData {
  marketId: string;
  resolution: string;
  equilibrium: string;
  chainId: number;
}

/**
 * Prediction placed event data
 */
export interface PredictionPlacedEventData {
  marketId: string;
  predictor: string;
  amount: string;
  percentage: string;
  chainId: number;
}

/**
 * Prediction updated event data
 */
export interface PredictionUpdatedEventData {
  marketId: string;
  predictor: string;
  newAmount: string;
  newPercentage: string;
  chainId: number;
}

/**
 * Winnings/refund claimed event data
 */
export interface ClaimEventData {
  marketId: string;
  predictor: string;
  amount: string;
  chainId: number;
}
