# Claude Code Workflows for Heavymath Indexer Client

This guide helps you work efficiently with Claude Code on the Heavymath Indexer Client library.

## Project Overview

React and React Native compatible client library for the Heavymath prediction market indexer API. Provides a four-layer architecture (hooks -> stores -> business -> network) with React Query integration, Zustand stores for optimistic updates, and SSE real-time subscriptions.

- **Version**: 0.0.14
- **Package**: `@sudobility/heavymath_indexer_client`
- **License**: BUSL-1.1
- **Stack**: TypeScript 5.9.3, React Query 5.90, Zustand 5, Vitest 4.0
- **Package manager**: Bun (never npm/yarn/pnpm)
- **Runtime dependencies**: None (zero runtime dependencies -- all peer deps)

## Quick Start

### Essential Commands

```bash
bun run build          # Compile TypeScript to dist/
bun run build:watch    # Compile TypeScript in watch mode
bun run typecheck      # Type validation (no emit)
bun run typecheck:watch # Type validation in watch mode
bun test               # Run tests in watch mode
bun run test:run       # Run tests once
bun run test:coverage  # Run tests with coverage
bun run lint           # Check for linting errors
bun run lint:fix       # Auto-fix linting issues
bun run format         # Format code with Prettier
bun run format:check   # Check formatting without writing
bun run check-all      # Run lint + typecheck + tests (use before commits)
bun run clean          # Remove dist/ directory
```

### Validation Workflow

Always run before committing:
```bash
bun run check-all    # Combines lint, typecheck, and test:run
```

Or individually:
```bash
bun run lint         # Linting
bun run typecheck    # Type checking
bun run test:run     # Tests
bun run build        # Build output
```

### Integration Tests

The `test:integration` and `test:integration:watch` scripts reference `vitest.integration.config.ts`, which does not exist yet. These commands will fail until the config file is created. If you need integration tests, create `vitest.integration.config.ts` following the pattern in `vitest.config.ts`.

## Project Structure

```
heavymath_indexer_client/
├── src/
│   ├── index.ts                 # Main export (re-exports all modules)
│   ├── types.ts                 # Type re-exports from shared packages + local types
│   ├── network/                 # Network layer (low-level HTTP)
│   │   ├── index.ts             # Network exports
│   │   └── IndexerClient.ts     # API client with all endpoints
│   ├── business/                # Business layer (high-level with caching)
│   │   ├── index.ts             # Business exports
│   │   └── indexer-service.ts   # IndexerService singleton with caching
│   ├── hooks/                   # React hooks layer
│   │   ├── index.ts             # Hook exports
│   │   ├── useMarkets.ts        # Market-related hooks
│   │   ├── usePredictions.ts    # Prediction/betting hooks
│   │   ├── useDealers.ts        # Dealer NFT hooks
│   │   ├── useWithdrawals.ts    # Fee withdrawal hooks
│   │   ├── useOracle.ts         # Oracle request hooks
│   │   ├── useStats.ts          # Statistics hooks
│   │   ├── useFavorites.ts      # Wallet favorites hooks (optimistic updates via Zustand)
│   │   └── useSSE.ts            # Server-Sent Events hooks for real-time updates
│   ├── stores/                  # Zustand state stores
│   │   ├── index.ts             # Store exports
│   │   └── favorites-store.ts   # Favorites store with persistence and optimistic updates
│   └── __tests__/               # Test files
│       └── index.test.ts        # Smoke tests
├── package.json                 # Dependencies and scripts
├── tsconfig.json                # TypeScript config (development)
├── tsconfig.build.json          # TypeScript config (production build)
├── eslint.config.js             # ESLint flat config
├── vitest.config.ts             # Vitest test config (happy-dom environment)
├── .prettierrc                  # Prettier formatting config
└── .github/workflows/
    └── ci-cd.yml                # CI/CD pipeline (reusable workflow)
```

### Navigation Tips

- **Adding new hook**: Create in `src/hooks/`, export from `src/hooks/index.ts`
- **Adding new type**: Types come from `@sudobility/heavymath_types` - update that package first
- **Adding API endpoint**: Add to `src/network/IndexerClient.ts`
- **Adding business method**: Add to `src/business/indexer-service.ts`
- **Adding a Zustand store**: Create in `src/stores/`, export from `src/stores/index.ts`
- **Writing tests**: Add to `src/__tests__/`

## Architecture

### Four-Layer Design

```
┌─────────────────────────────────────────────────────┐
│                   React Hooks                        │
│  (useMarkets, usePredictions, useDealers, etc.)     │
│  Uses @tanstack/react-query for caching             │
│  Receives IndexerClient as parameter                │
└─────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────┐
│                  Zustand Stores                      │
│  (useFavoritesStore)                                 │
│  Local persistence with optimistic updates           │
│  Used by favorites hooks for offline-first UX        │
└─────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────┐
│                  Business Layer                      │
│  (IndexerService)                                    │
│  High-level methods with TTL caching                 │
│  Requires NetworkClient from @sudobility/di          │
└─────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────┐
│                   Network Layer                      │
│  (IndexerClient + NetworkClient)                     │
│  Low-level HTTP requests, 1:1 with REST endpoints   │
│  NetworkClient injected from @sudobility/di          │
└─────────────────────────────────────────────────────┘
```

**When to use each layer:**
- **Hooks**: React components (most common)
- **Zustand Stores**: Local state with persistence, optimistic updates (used internally by favorites hooks)
- **Business Layer**: Non-React code needing caching
- **Network Layer**: Direct API access, custom implementations

### Dependency Injection

The library uses `NetworkClient` from `@sudobility/types` for HTTP requests. Consumers must provide a `NetworkClient` instance (typically from `@sudobility/di`):

```typescript
import { NetworkClient } from '@sudobility/types';
import { IndexerClient, IndexerService } from '@heavymath/indexer_client';

// Get NetworkClient from your DI container
const networkClient: NetworkClient = getNetworkService();

// Create IndexerClient
const client = new IndexerClient('http://localhost:42069', networkClient);

// Or create IndexerService
const service = new IndexerService({
  indexerUrl: 'http://localhost:42069',
  networkClient,
});
```

### Indexer API Endpoints

The client covers all REST endpoints from `heavymath_indexer`:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/markets` | GET | List markets (filterable) |
| `/api/markets/:id` | GET | Get market by ID |
| `/api/markets/:id/predictions` | GET | Get market's predictions |
| `/api/markets/:id/history` | GET | Get market state history |
| `/api/predictions` | GET | List predictions (filterable) |
| `/api/predictions/:id` | GET | Get prediction by ID |
| `/api/dealers` | GET | List dealer NFTs (filterable) |
| `/api/dealers/:id` | GET | Get dealer NFT by ID |
| `/api/dealers/:id/permissions` | GET | Get dealer's permissions |
| `/api/dealers/:id/markets` | GET | Get dealer's markets |
| `/api/withdrawals` | GET | List fee withdrawals |
| `/api/oracle/requests` | GET | List oracle requests |
| `/api/oracle/requests/:id` | GET | Get oracle request by ID |
| `/api/wallet/:address/favorites` | GET | Get wallet favorites |
| `/api/wallet/:address/favorites` | POST | Add favorite |
| `/api/wallet/:address/favorites/:id` | DELETE | Remove favorite |
| `/api/stats/markets` | GET | Get market statistics |
| `/api/health` | GET | Health check |
| `/api/events` | SSE | Server-Sent Events stream |

## Zustand Stores

### Favorites Store (`src/stores/favorites-store.ts`)

The favorites store provides local persistence and optimistic updates for wallet favorites using Zustand with the `persist` middleware.

**Key features:**
- Persists to `localStorage` under the key `heavymath-favorites` (no-op in non-browser environments)
- Wallet addresses are normalized to lowercase
- Optimistic add/remove with rollback on error
- Staleness checking via `needsRefresh()` (default 5-minute TTL)
- Temporary IDs for optimistic items use negative timestamps (`-Date.now()`)

**Store API:**

| Method | Description |
|--------|-------------|
| `getFavorites(walletAddress)` | Get favorites for a wallet |
| `setFavorites(walletAddress, favorites)` | Set favorites from API response |
| `addFavoriteOptimistic(walletAddress, favorite)` | Add with temp ID |
| `updateFavoriteFromServer(walletAddress, favorite)` | Replace temp with real data |
| `removeFavoriteOptimistic(walletAddress, favoriteId)` | Remove optimistically |
| `rollbackAdd(walletAddress, itemId)` | Undo optimistic add |
| `rollbackRemove(walletAddress, favorite)` | Undo optimistic remove |
| `isFavorite(walletAddress, itemId)` | Check if item is favorited |
| `findFavorite(walletAddress, itemId)` | Find favorite by item ID |
| `clearFavorites(walletAddress)` | Clear one wallet's favorites |
| `clearAll()` | Clear all favorites data |
| `needsRefresh(walletAddress, maxAge?)` | Check if data is stale |

## Server-Sent Events (SSE)

### useSSE Hook (`src/hooks/useSSE.ts`)

The core SSE hook connects to `/api/events` with configurable channel and filter parameters.

**Options (`UseSSEOptions`):**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `channel` | `SubscriptionChannel` | `'markets'` | Subscription channel (`markets`, `market`, `predictions`, `dealers`, `oracle`) |
| `filters` | `SSEFilters` | `{}` | Filters: `marketId`, `dealer`, `user`, `category` |
| `autoReconnect` | `boolean` | `true` | Auto-reconnect on disconnect |
| `reconnectDelay` | `number` | `3000` | Reconnect delay in ms |
| `maxReconnectAttempts` | `number` | `5` | Max reconnect attempts before giving up |
| `onEvent` | `(event) => void` | - | Callback for incoming data update events |
| `onStateChange` | `(state) => void` | - | Callback for connection state changes |
| `onError` | `(error) => void` | - | Callback for errors |
| `invalidateQueries` | `boolean` | `false` | Auto-invalidate React Query caches on events |
| `enabled` | `boolean` | `true` | Enable/disable the subscription |

**Return (`UseSSEReturn`):**

| Field | Type | Description |
|-------|------|-------------|
| `connectionState` | `SSEConnectionState` | `'connecting'` / `'connected'` / `'disconnected'` / `'error'` |
| `lastEvent` | `SSEDataUpdateMessage \| null` | Most recent event |
| `events` | `SSEDataUpdateMessage[]` | All received events |
| `clientId` | `string \| null` | Server-assigned client ID |
| `subscriptionId` | `string \| null` | Subscription ID |
| `error` | `Error \| null` | Current error |
| `reconnect` | `() => void` | Manual reconnect (resets attempt counter) |
| `disconnect` | `() => void` | Manual disconnect |
| `clearEvents` | `() => void` | Clear events history |

**Auto-invalidation:** When `invalidateQueries: true`, the hook automatically invalidates relevant React Query caches based on event type (e.g., `MarketCreated` invalidates `['heavymath', 'markets']`).

### Convenience SSE Hooks

```typescript
// Subscribe to a specific market's events
useMarketUpdates(endpointUrl, marketId?, options?)
// - channel: 'market', filters: { marketId }
// - Auto-disabled when marketId is undefined

// Subscribe to all market events
useAllMarketUpdates(endpointUrl, options?)
// - channel: 'markets'

// Subscribe to a user's prediction updates
useUserPredictionUpdates(endpointUrl, userAddress?, options?)
// - channel: 'predictions', filters: { user: userAddress }
// - Auto-disabled when userAddress is undefined
```

**Usage example:**
```typescript
// Real-time updates for a market detail page
const { connectionState, lastEvent } = useMarketUpdates(
  'http://localhost:42069',
  marketId,
  {
    invalidateQueries: true, // Auto-refresh React Query caches
    onEvent: (event) => console.log('Update:', event.eventType),
  }
);

// Monitor all markets for a dashboard
const { events } = useAllMarketUpdates('http://localhost:42069');

// Watch a user's prediction changes
const { lastEvent } = useUserPredictionUpdates(
  'http://localhost:42069',
  walletAddress
);
```

## Common Workflows

### 1. Adding a New React Hook

**Steps:**
1. Create hook in appropriate file in `src/hooks/`
2. Export from `src/hooks/index.ts`
3. Add tests if complex logic involved

**Pattern to follow:**
```typescript
// src/hooks/useExample.ts
import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import type { SomeType, ApiResponse } from '../types';
import { IndexerClient } from '../network/IndexerClient';

export function useExample(
  client: IndexerClient,
  param: string,
  options?: Omit<UseQueryOptions<ApiResponse<SomeType>>, 'queryKey' | 'queryFn'>
): UseQueryResult<ApiResponse<SomeType>> {
  return useQuery({
    queryKey: ['heavymath', 'example', param],
    queryFn: async () => {
      if (!param) throw new Error('Param is required');
      return await client.getSomething(param);
    },
    enabled: !!param,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: false,
    ...options,
  });
}
```

### 2. Adding a New API Endpoint

**Steps:**
1. Add types to `@sudobility/heavymath_types` if needed
2. Add method to `src/network/IndexerClient.ts`
3. Optionally add business method to `src/business/indexer-service.ts`
4. Create hook in `src/hooks/`

**IndexerClient pattern:**
```typescript
// src/network/IndexerClient.ts
async getNewEndpoint(id: string): Promise<ApiResponse<NewType>> {
  const response = await this.networkClient.get<ApiResponse<NewType>>(
    buildUrl(this.baseUrl, `/api/new-endpoint/${encodeURIComponent(id)}`)
  );

  if (!response.ok || !response.data) {
    throw handleApiError(response, 'get new endpoint');
  }

  return response.data;
}
```

### 3. Adding Business Logic with Caching

**Pattern:**
```typescript
// src/business/indexer-service.ts
public async getNewData(param: string): Promise<NewType[]> {
  const cacheKey = this.getCacheKey('new-data', param);
  const cached = this.getCache<NewType[]>(cacheKey);
  if (cached) return cached;

  try {
    const result = await this.indexerClient.getNewEndpoint(param);
    const data = result.data || [];
    this.setCache(cacheKey, data);
    return data;
  } catch (error) {
    throw new Error(
      `Failed to get new data: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
```

### 4. Adding a Zustand Store

**Steps:**
1. Create store file in `src/stores/`
2. Export from `src/stores/index.ts`
3. Use the `persist` middleware if local persistence is needed

**Pattern (following `favorites-store.ts`):**
```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface MyStoreState {
  data: SomeType[];
  setData: (data: SomeType[]) => void;
  clearAll: () => void;
}

export const useMyStore = create<MyStoreState>()(
  persist(
    (set, get) => ({
      data: [],
      setData: (data) => set({ data }),
      clearAll: () => set({ data: [] }),
    }),
    {
      name: 'heavymath-my-store',
      storage: createJSONStorage(() => {
        if (typeof window !== 'undefined' && window.localStorage) {
          return window.localStorage;
        }
        return { getItem: () => null, setItem: () => {}, removeItem: () => {} };
      }),
    }
  )
);
```

## Type Conventions

### Shared Types

Types are re-exported from `@sudobility/heavymath_types` and `@sudobility/types`:

- **From `@sudobility/types`**: `ApiResponse`, `BaseResponse`, `PaginatedResponse`, `PaginationInfo`, `NetworkClient`, `NetworkResponse`, `NetworkRequestOptions`, `Optional`
- **From `@sudobility/heavymath_types`**: `MarketData`, `PredictionData`, `DealerNftData`, `DealerPermissionData`, `FeeWithdrawalData`, `OracleRequestData`, `MarketStateHistoryData`, `MarketStatsData`, `HealthData`, `SSEStatsData`, `WalletFavoriteData`, `CreateFavoriteRequest`, `PaginationMeta`, `MarketStatus`, `ClaimType`, `WithdrawalType`

### Backward Compatibility Aliases

For backward compatibility, these aliases are available (but deprecated):
- `Market` -> `MarketData`
- `Prediction` -> `PredictionData`
- `DealerNFT` -> `DealerNftData`
- `DealerPermission` -> `DealerPermissionData`
- `FeeWithdrawal` -> `FeeWithdrawalData`
- `OracleRequest` -> `OracleRequestData`
- `StateHistory` -> `MarketStateHistoryData`
- `MarketStats` -> `MarketStatsData`
- `HealthStatus` -> `HealthData`

### Filter Types (defined locally in `src/types.ts`)
- `MarketFilters` - status, dealer, category, limit, offset
- `PredictionFilters` - user, market, claimed, limit, offset
- `DealerFilters` - owner, limit, offset
- `WithdrawalFilters` - withdrawer, type, market, limit, offset
- `OracleFilters` - market, timedOut, limit, offset
- `WalletFavoritesFilters` - category, subcategory, type, limit, offset

### SSE Types (defined locally in `src/types.ts`)
- `SubscriptionChannel` - `'markets' | 'market' | 'predictions' | 'dealers' | 'oracle'`
- `SSEEventType` - Union of all event types (e.g., `MarketCreated`, `PredictionPlaced`, etc.)
- `SSEFilters` - `marketId`, `dealer`, `user`, `category`
- `SSEMessage` - Union of `SSEConnectedMessage`, `SSEDataUpdateMessage`, `SSEHeartbeatMessage`, `SSESubscriptionConfirmedMessage`
- `SSEConnectionState` - `'connecting' | 'connected' | 'disconnected' | 'error'`
- Event data types: `MarketCreatedEventData`, `MarketResolvedEventData`, `PredictionPlacedEventData`, `PredictionUpdatedEventData`, `ClaimEventData`

## Code Patterns to Follow

### Hook Query Keys
Always use hierarchical keys with `'heavymath'` prefix:
```typescript
queryKey: ['heavymath', 'markets', filters]
queryKey: ['heavymath', 'market', marketId]
queryKey: ['heavymath', 'favorites', walletAddress, filters]
```

### Stale Time Guidelines
- Fast-changing data (predictions, oracle requests, health): 1 minute
- Normal data (markets, dealers, withdrawals): 2 minutes
- Slow-changing data (history, stats, dealer NFTs, permissions): 5-10 minutes

### Error Handling
```typescript
// In IndexerClient - throw standardized errors
if (!response.ok || !response.data) {
  throw handleApiError(response, 'operation description');
}

// In IndexerService - wrap and re-throw
catch (error) {
  throw new Error(
    `Failed to do X: ${error instanceof Error ? error.message : 'Unknown error'}`
  );
}

// In hooks - let React Query handle it
// Errors are exposed via query.error
```

### URL Building
Always use the `buildUrl` helper and `encodeURIComponent`:
```typescript
buildUrl(this.baseUrl, `/api/markets/${encodeURIComponent(id)}`)
```

### Query Parameters
```typescript
const params = new URLSearchParams();
if (filters?.status) params.append('status', filters.status);
if (filters?.limit) params.append('limit', filters.limit.toString());
const queryString = params.toString();
const path = `/api/endpoint${queryString ? `?${queryString}` : ''}`;
```

## Testing

### Running Tests
```bash
bun test               # Watch mode
bun run test:run       # Single run
bun run test:coverage  # With coverage (v8 provider, outputs text/json/html)
```

### Test Configuration

Tests use Vitest with `happy-dom` environment and `globals: true`. Coverage excludes `node_modules/`, `dist/`, test files, and integration test files.

### Test Pattern
```typescript
import { describe, it, expect, vi } from 'vitest';
import type { NetworkClient } from '@sudobility/types';
import { IndexerClient, IndexerService } from '../index';

// Mock NetworkClient for testing
const createMockNetworkClient = (): NetworkClient => ({
  request: vi.fn(),
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
});

describe('FeatureName', () => {
  it('should do something', () => {
    const mockNetworkClient = createMockNetworkClient();
    const client = new IndexerClient('http://localhost:42069', mockNetworkClient);
    expect(client).toBeInstanceOf(IndexerClient);
  });
});
```

## CI/CD

The project uses a reusable GitHub Actions workflow defined in `.github/workflows/ci-cd.yml`.

**Triggers:**
- Push to `main` or `develop`
- Pull requests targeting `main` or `develop`

**What it does:**
- Calls the shared workflow at `johnqh/workflows/.github/workflows/unified-cicd.yml@main`
- Publishes to NPM with public access when `NPM_TOKEN` is configured
- Has permissions for creating GitHub releases, NPM provenance, and deployment tracking
- All repository secrets are passed via `secrets: inherit`

## Dependencies

### Peer Dependencies (required by consumer)
- `react` >=18.0.0
- `@tanstack/react-query` >=5.0.0
- `@sudobility/types` ^1.9.53 - Provides `NetworkClient`, `ApiResponse`, etc.
- `@sudobility/heavymath_types` ^0.0.8 - Provides domain types
- `zustand` ^5.0.0 - Used by favorites store for local persistence

### Runtime Dependencies
- None (zero runtime dependencies)

### Dev Dependencies
| Package | Version | Purpose |
|---|---|---|
| `typescript` | ^5.9.3 | TypeScript compiler |
| `eslint` | ^9.38.0 | Linting |
| `prettier` | ^3.6.2 | Code formatting |
| `vitest` | ^4.0.4 | Test framework |
| `@vitest/coverage-v8` | ^4.0.4 | Coverage reporting |
| `happy-dom` | ^20.0.8 | DOM environment for tests |
| `@testing-library/react` | ^16.3.0 | React testing utilities |
| `@testing-library/dom` | ^10.4.1 | DOM testing utilities |
| `react` | ^19.2.1 | React (dev/testing only) |
| `react-dom` | ^19.2.1 | React DOM (dev/testing only) |
| `zustand` | ^5.0.0 | Zustand (dev/testing only) |
| `vite` | ^7.1.12 | Build tool (for Vitest) |
| `dotenv` | ^17.2.3 | Environment variable loading |

## React Native Compatibility

This library is designed to work in both React (web) and React Native environments:

- **No DOM dependencies in core logic**: The network layer, business layer, and type definitions have no browser-specific APIs.
- **SSE hooks use `EventSource`**: The `useSSE` hook requires `EventSource` to be available. In React Native, you may need a polyfill (e.g., `react-native-sse` or `event-source-polyfill`).
- **Zustand persistence**: The favorites store uses `createJSONStorage` with a fallback for non-browser environments. In React Native, the `persist` middleware will use its no-op storage by default. To enable persistence in React Native, configure Zustand with `AsyncStorage` by providing a custom storage adapter.
- **`NetworkClient` injection**: Since HTTP is abstracted via the injected `NetworkClient`, consumers can provide a React Native-compatible implementation (e.g., using `fetch` directly).
- **Package keywords**: `react-native` is listed as a keyword in `package.json`, confirming intended compatibility.

## Common Pitfalls

### 1. Missing `QueryClientProvider`
All hooks using `@tanstack/react-query` require a `QueryClientProvider` in the React tree. Forgetting this will cause a runtime error.

### 2. Passing `undefined` to hooks without `enabled` guard
Hooks that accept optional IDs (e.g., `useMarket(client, marketId)`) use `enabled: !!marketId` internally, but custom hooks you write must do this explicitly.

### 3. Forgetting to export from barrel files
When adding a new hook, store, or module, you must export it from the relevant `index.ts` barrel file AND from `src/index.ts` if it is in a new directory.

### 4. Integration test config does not exist
The `test:integration` and `test:integration:watch` scripts reference `vitest.integration.config.ts`, which has not been created. Running these commands will fail.

### 5. Zustand store not available without `zustand` peer dependency
Consumers must install `zustand` ^5.0.0 as a peer dependency. Without it, importing from the `stores/` module or the `useFavorites` hook will fail at runtime.

### 6. SSE `EventSource` not available in all environments
The `useSSE` hook creates a browser `EventSource` directly. In environments without native `EventSource` (e.g., React Native, Node.js SSR), you must polyfill it before using SSE hooks.

### 7. Optimistic favorites use negative IDs
The favorites store creates temporary favorites with `id = -Date.now()`. Any code that checks `favorite.id > 0` will incorrectly filter out optimistic entries. Check for `favorite.id < 0` to identify pending items.

### 8. BigInt serialization in favorites
The favorites store stores `createdAt` as a `number` cast to `bigint` for JSON serialization compatibility. Do not rely on `createdAt` being a true `bigint` for favorites from the local store.

### 9. IndexerService singleton
`IndexerService.getInstance()` returns a singleton. If you call it with different configs, only the first config is used. Use `new IndexerService(config)` for separate instances.

### 10. Stale cached data in IndexerService
The business layer uses an in-memory `Map` for caching with a configurable TTL (default 5 minutes). Call `service.clearCache()` if you need fresh data immediately.

## Best Practices

### Do's
- Use existing patterns from similar hooks/methods
- Export everything from the appropriate `index.ts`
- Add JSDoc comments to exported functions
- Use TypeScript strict mode (enabled in `tsconfig.json`)
- Follow the four-layer architecture (hooks -> stores -> business -> network)
- Pass `IndexerClient` as first parameter to hooks
- Run `bun run check-all` before committing
- Use `bun` for all commands (not `npm` or `yarn`)

### Don'ts
- Don't use `any` type (prefer `unknown` and type guards)
- Don't skip the `enabled` option in hooks when param might be undefined
- Don't create `NetworkClient` instances in this library - let consumers inject them
- Don't forget to export from layer index files
- Don't define types locally if they exist in shared packages
- Don't import from `zustand` in files outside `src/stores/` - use the store's exported hook instead

## Related Projects

- **@sudobility/types**: Base types and `NetworkClient` interface
- **@sudobility/heavymath_types**: Domain-specific types (Market, Prediction, etc.)
- **@sudobility/di**: Dependency injection and `NetworkClient` implementations
- **heavymath_indexer**: The backend API this client connects to
- **johnqh/workflows**: Shared CI/CD workflow repository

## Quick Reference

### Available Hooks by Category

```typescript
// Markets
useMarkets, useActiveMarkets, useMarket, useMarketPredictions, useMarketHistory, useMarketDetails

// Predictions
usePredictions, useUserPredictions, useActiveBets, usePastBets, usePrediction, useUserBettingHistory

// Dealers
useDealers, useIsDealer, useDealerNFTs, useDealer, useDealerPermissions, useDealerMarkets, useDealerDashboard

// Withdrawals
useWithdrawals, useDealerWithdrawals, useSystemWithdrawals, useMarketWithdrawals

// Oracle
useOracleRequests, useOracleRequest, useMarketOracle, useTimedOutOracleRequests, usePendingOracleRequests

// Favorites (with Zustand optimistic updates)
useFavorites, useCategoryFavorites, useIsFavorite, useFavoritesStoreHook

// SSE (real-time)
useSSE, useMarketUpdates, useAllMarketUpdates, useUserPredictionUpdates

// Stats
useMarketStats, useHealth
```

### Common Hook Signatures
```typescript
// All data hooks take IndexerClient as first parameter
useMarkets(client: IndexerClient, filters?: MarketFilters, options?)
useMarket(client: IndexerClient, marketId: string | undefined, options?)
useFavorites(client: IndexerClient, walletAddress: string | undefined, filters?, options?)
useIsFavorite(client: IndexerClient, walletAddress: string | undefined, item: CreateFavoriteRequest)

// SSE hooks take endpointUrl as first parameter (not IndexerClient)
useSSE(endpointUrl: string, options?: UseSSEOptions)
useMarketUpdates(endpointUrl: string, marketId: string | undefined, options?)
useAllMarketUpdates(endpointUrl: string, options?)
useUserPredictionUpdates(endpointUrl: string, userAddress: string | undefined, options?)
```

### Type Imports
```typescript
import type {
  // Core types (from @sudobility/heavymath_types)
  MarketData, PredictionData, DealerNftData, DealerPermissionData,
  MarketStateHistoryData, FeeWithdrawalData, OracleRequestData,
  WalletFavoriteData, CreateFavoriteRequest, MarketStatsData, HealthData,
  // Enums
  MarketStatus, ClaimType, WithdrawalType,
  // Response wrappers (from @sudobility/types)
  ApiResponse, PaginatedResponse, NetworkClient, NetworkResponse,
  // Filter types (local)
  MarketFilters, PredictionFilters, DealerFilters, WithdrawalFilters, OracleFilters,
  WalletFavoritesFilters,
  // SSE types (local)
  SubscriptionChannel, SSEEventType, SSEFilters, SSEMessage, SSEConnectionState,
  SSEDataUpdateMessage, UseSSEOptions, UseSSEReturn,
} from '@heavymath/indexer_client';

// Zustand store
import { useFavoritesStore } from '@heavymath/indexer_client';
import type { FavoritesState } from '@heavymath/indexer_client';
```

---

**Remember**: Always run `bun run check-all` before committing!
