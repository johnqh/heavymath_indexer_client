/**
 * React hooks for Server-Sent Events (SSE) subscriptions
 * Provides real-time updates from the Heavymath Indexer
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type {
  SubscriptionChannel,
  SSEFilters,
  SSEMessage,
  SSEDataUpdateMessage,
  SSEConnectionState,
  SSEEventType,
} from '../types';

/**
 * Options for SSE subscription
 */
export interface UseSSEOptions {
  /** Subscription channel */
  channel?: SubscriptionChannel;
  /** Subscription filters */
  filters?: SSEFilters;
  /** Whether to automatically reconnect on disconnect */
  autoReconnect?: boolean;
  /** Reconnection delay in ms (default: 3000) */
  reconnectDelay?: number;
  /** Maximum reconnection attempts (default: 5) */
  maxReconnectAttempts?: number;
  /** Callback for incoming events */
  onEvent?: (event: SSEDataUpdateMessage) => void;
  /** Callback for connection state changes */
  onStateChange?: (state: SSEConnectionState) => void;
  /** Callback for errors */
  onError?: (error: Error) => void;
  /** Whether to automatically invalidate React Query caches */
  invalidateQueries?: boolean;
  /** Whether the subscription is enabled */
  enabled?: boolean;
}

/**
 * Return type for useSSE hook
 */
export interface UseSSEReturn {
  /** Current connection state */
  connectionState: SSEConnectionState;
  /** Last received event */
  lastEvent: SSEDataUpdateMessage | null;
  /** All received events */
  events: SSEDataUpdateMessage[];
  /** Client ID assigned by server */
  clientId: string | null;
  /** Subscription ID */
  subscriptionId: string | null;
  /** Error if any */
  error: Error | null;
  /** Manually reconnect */
  reconnect: () => void;
  /** Manually disconnect */
  disconnect: () => void;
  /** Clear events history */
  clearEvents: () => void;
}

/**
 * Hook for subscribing to SSE events from the indexer
 *
 * @example
 * ```tsx
 * // Subscribe to all market events
 * const { connectionState, events, lastEvent } = useSSE(
 *   'http://localhost:42069',
 *   { channel: 'markets' }
 * );
 *
 * // Subscribe to a specific market's events
 * const { connectionState, lastEvent } = useSSE(
 *   'http://localhost:42069',
 *   {
 *     channel: 'market',
 *     filters: { marketId: '1-market-123' },
 *     onEvent: (event) => console.log('New event:', event),
 *   }
 * );
 *
 * // Subscribe to user's predictions
 * const { events } = useSSE(
 *   'http://localhost:42069',
 *   {
 *     channel: 'predictions',
 *     filters: { user: '0x123...' },
 *     invalidateQueries: true, // Auto-refresh React Query caches
 *   }
 * );
 * ```
 */
export function useSSE(endpointUrl: string, options: UseSSEOptions = {}): UseSSEReturn {
  const {
    channel = 'markets',
    filters = {},
    autoReconnect = true,
    reconnectDelay = 3000,
    maxReconnectAttempts = 5,
    onEvent,
    onStateChange,
    onError,
    invalidateQueries = false,
    enabled = true,
  } = options;

  const [connectionState, setConnectionState] = useState<SSEConnectionState>('disconnected');
  const [lastEvent, setLastEvent] = useState<SSEDataUpdateMessage | null>(null);
  const [events, setEvents] = useState<SSEDataUpdateMessage[]>([]);
  const [clientId, setClientId] = useState<string | null>(null);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const queryClient = useQueryClient();

  // Update connection state and notify callback
  const updateConnectionState = useCallback(
    (state: SSEConnectionState) => {
      setConnectionState(state);
      onStateChange?.(state);
    },
    [onStateChange]
  );

  // Handle incoming SSE message
  const handleMessage = useCallback(
    (messageEvent: MessageEvent) => {
      try {
        const message: SSEMessage = JSON.parse(messageEvent.data);

        if (message.type === 'connected') {
          setClientId(message.clientId);
          setSubscriptionId(message.subscriptionId);
          updateConnectionState('connected');
          reconnectAttemptsRef.current = 0;
        } else if (message.type === 'data_update') {
          const dataMessage = message as SSEDataUpdateMessage;
          setLastEvent(dataMessage);
          setEvents(prev => [...prev, dataMessage]);
          onEvent?.(dataMessage);

          // Invalidate relevant React Query caches
          if (invalidateQueries) {
            invalidateQueryCaches(queryClient, dataMessage.eventType, dataMessage.data);
          }
        }
        // Heartbeat messages are handled silently
      } catch (err) {
        console.error('[SSE] Failed to parse message:', err);
      }
    },
    [onEvent, invalidateQueries, queryClient, updateConnectionState]
  );

  // Connect to SSE endpoint
  const connect = useCallback(() => {
    if (!enabled) return;

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    // Build URL with query params
    const url = new URL(`${endpointUrl}/api/events`);
    url.searchParams.set('channel', channel);
    if (filters.marketId) url.searchParams.set('marketId', filters.marketId);
    if (filters.dealer) url.searchParams.set('dealer', filters.dealer);
    if (filters.user) url.searchParams.set('user', filters.user);
    if (filters.category) url.searchParams.set('category', filters.category);

    updateConnectionState('connecting');
    setError(null);

    try {
      const eventSource = new EventSource(url.toString());
      eventSourceRef.current = eventSource;

      // Handle all message types
      eventSource.onmessage = handleMessage;

      // Handle specific event types
      eventSource.addEventListener('connected', handleMessage);
      eventSource.addEventListener('data_update', handleMessage);
      eventSource.addEventListener('heartbeat', () => {
        // Heartbeat received - connection is alive
      });
      eventSource.addEventListener('subscription_confirmed', handleMessage);

      eventSource.onerror = () => {
        updateConnectionState('error');
        const err = new Error('SSE connection error');
        setError(err);
        onError?.(err);

        // Attempt reconnection
        if (autoReconnect && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          console.log(
            `[SSE] Reconnecting (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})...`
          );

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectDelay);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          console.error('[SSE] Max reconnection attempts reached');
          updateConnectionState('disconnected');
        }
      };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to connect to SSE');
      setError(error);
      onError?.(error);
      updateConnectionState('error');
    }
  }, [
    enabled,
    endpointUrl,
    channel,
    filters,
    handleMessage,
    autoReconnect,
    maxReconnectAttempts,
    reconnectDelay,
    updateConnectionState,
    onError,
  ]);

  // Disconnect from SSE endpoint
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setClientId(null);
    setSubscriptionId(null);
    updateConnectionState('disconnected');
  }, [updateConnectionState]);

  // Reconnect
  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0;
    disconnect();
    connect();
  }, [disconnect, connect]);

  // Clear events history
  const clearEvents = useCallback(() => {
    setEvents([]);
    setLastEvent(null);
  }, []);

  // Effect to connect/disconnect based on enabled state
  useEffect(() => {
    if (enabled) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  // Effect to reconnect when filters change
  useEffect(() => {
    if (enabled && connectionState === 'connected') {
      reconnect();
    }
  }, [channel, JSON.stringify(filters), enabled, connectionState, reconnect]);

  return {
    connectionState,
    lastEvent,
    events,
    clientId,
    subscriptionId,
    error,
    reconnect,
    disconnect,
    clearEvents,
  };
}

/**
 * Hook for subscribing to market updates with auto-refresh
 * Convenience wrapper around useSSE for the most common use case
 *
 * @example
 * ```tsx
 * const { lastEvent, connectionState } = useMarketUpdates(
 *   'http://localhost:42069',
 *   '1-market-123'
 * );
 * ```
 */
export function useMarketUpdates(
  endpointUrl: string,
  marketId: string | undefined,
  options: Omit<UseSSEOptions, 'channel' | 'filters'> = {}
): UseSSEReturn {
  return useSSE(endpointUrl, {
    ...options,
    channel: 'market',
    filters: { marketId },
    enabled: !!marketId && (options.enabled ?? true),
  });
}

/**
 * Hook for subscribing to all market events
 *
 * @example
 * ```tsx
 * const { events, connectionState } = useAllMarketUpdates('http://localhost:42069');
 * ```
 */
export function useAllMarketUpdates(
  endpointUrl: string,
  options: Omit<UseSSEOptions, 'channel'> = {}
): UseSSEReturn {
  return useSSE(endpointUrl, {
    ...options,
    channel: 'markets',
  });
}

/**
 * Hook for subscribing to user's prediction updates
 *
 * @example
 * ```tsx
 * const { lastEvent } = useUserPredictionUpdates(
 *   'http://localhost:42069',
 *   '0x123...'
 * );
 * ```
 */
export function useUserPredictionUpdates(
  endpointUrl: string,
  userAddress: string | undefined,
  options: Omit<UseSSEOptions, 'channel' | 'filters'> = {}
): UseSSEReturn {
  return useSSE(endpointUrl, {
    ...options,
    channel: 'predictions',
    filters: { user: userAddress },
    enabled: !!userAddress && (options.enabled ?? true),
  });
}

/**
 * Invalidate React Query caches based on event type
 */
function invalidateQueryCaches(
  queryClient: ReturnType<typeof useQueryClient>,
  eventType: SSEEventType,
  data: unknown
): void {
  const eventData = data as Record<string, unknown>;

  switch (eventType) {
    case 'MarketCreated':
    case 'MarketResolved':
    case 'MarketCancelled':
    case 'MarketAbandoned':
    case 'DealerFeeSet':
      // Invalidate markets list and specific market
      queryClient.invalidateQueries({ queryKey: ['heavymath', 'markets'] });
      if (eventData.marketId) {
        queryClient.invalidateQueries({
          queryKey: ['heavymath', 'market', eventData.marketId],
        });
      }
      break;

    case 'PredictionPlaced':
    case 'PredictionUpdated':
    case 'WinningsClaimed':
    case 'RefundClaimed':
      // Invalidate predictions
      queryClient.invalidateQueries({ queryKey: ['heavymath', 'predictions'] });
      if (eventData.marketId) {
        queryClient.invalidateQueries({
          queryKey: ['heavymath', 'market-predictions', eventData.marketId],
        });
      }
      break;

    case 'LicenseIssued':
    case 'LicenseTransferred':
    case 'PermissionsSet':
      // Invalidate dealers
      queryClient.invalidateQueries({ queryKey: ['heavymath', 'dealers'] });
      break;

    case 'OracleRegistered':
    case 'OracleDataUpdated':
      // Invalidate oracle requests
      queryClient.invalidateQueries({ queryKey: ['heavymath', 'oracle'] });
      break;

    case 'DealerFeesWithdrawn':
      // Invalidate withdrawals
      queryClient.invalidateQueries({ queryKey: ['heavymath', 'withdrawals'] });
      break;
  }
}
