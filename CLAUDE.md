# Claude Code Workflows for Heavymath Indexer Client

This guide helps you work efficiently with Claude Code on the Heavymath Indexer Client library.

## Quick Start

### Essential Commands

```bash
npm run build        # Compile TypeScript to dist/
npm run typecheck    # Type validation (no emit)
npm test             # Run tests in watch mode
npm run test:run     # Run tests once
npm run lint         # Check for linting errors
npm run lint:fix     # Auto-fix linting issues
npm run format       # Format code with Prettier
npm run check-all    # Run lint + typecheck + tests (use before commits)
```

### Validation Workflow

Always run before committing:
```bash
npm run check-all    # Combines lint, typecheck, and test:run
```

Or individually:
```bash
npm run lint         # Linting
npm run typecheck    # Type checking
npm run test:run     # Tests
npm run build        # Build output
```

## Project Structure

```
heavymath_indexer_client/
├── src/
│   ├── index.ts                 # Main export (re-exports all modules)
│   ├── types.ts                 # Type re-exports from shared packages
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
│   │   ├── useFavorites.ts      # Wallet favorites hooks
│   │   └── useSSE.ts            # Server-Sent Events hooks
│   └── __tests__/               # Test files
│       └── index.test.ts        # Smoke tests
├── package.json                 # Dependencies and scripts
├── tsconfig.json                # TypeScript config (development)
├── tsconfig.build.json          # TypeScript config (production build)
├── eslint.config.js             # ESLint flat config
├── vitest.config.ts             # Vitest test config
└── .prettierrc                  # Prettier formatting config
```

### Navigation Tips

- **Adding new hook**: Create in `src/hooks/`, export from `src/hooks/index.ts`
- **Adding new type**: Types come from `@sudobility/heavymath_types` - update that package first
- **Adding API endpoint**: Add to `src/network/IndexerClient.ts`
- **Adding business method**: Add to `src/business/indexer-service.ts`
- **Writing tests**: Add to `src/__tests__/`

## Architecture

### Three-Layer Design

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

## Type Conventions

### Shared Types

Types are re-exported from `@sudobility/heavymath_types` and `@sudobility/types`:

- **From `@sudobility/types`**: `ApiResponse`, `PaginatedResponse`, `NetworkClient`, `NetworkResponse`, `Optional`
- **From `@sudobility/heavymath_types`**: `MarketData`, `PredictionData`, `DealerNftData`, `MarketStatus`, etc.

### Backward Compatibility Aliases

For backward compatibility, these aliases are available (but deprecated):
- `Market` → `MarketData`
- `Prediction` → `PredictionData`
- `DealerNFT` → `DealerNftData`
- `StateHistory` → `MarketStateHistoryData`

### Filter Types (defined locally)
- `MarketFilters` - status, dealer, category, limit, offset
- `PredictionFilters` - user, market, claimed, limit, offset
- `DealerFilters` - owner, limit, offset
- `WithdrawalFilters` - withdrawer, type, market, limit, offset
- `OracleFilters` - market, timedOut, limit, offset
- `WalletFavoritesFilters` - category, subcategory, type, limit, offset

## Code Patterns to Follow

### Hook Query Keys
Always use hierarchical keys with `'heavymath'` prefix:
```typescript
queryKey: ['heavymath', 'markets', filters]
queryKey: ['heavymath', 'market', marketId]
queryKey: ['heavymath', 'favorites', walletAddress, filters]
```

### Stale Time Guidelines
- Fast-changing data (predictions): 1 minute
- Normal data (markets, dealers): 2 minutes
- Slow-changing data (history, stats): 5 minutes

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
npm test             # Watch mode
npm run test:run     # Single run
npm run test:coverage # With coverage
```

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

## Dependencies

### Peer Dependencies (required by consumer)
- `react` ^19.2.0
- `@tanstack/react-query` ^5.90.5
- `@sudobility/types` - Provides NetworkClient, ApiResponse, etc.
- `@sudobility/heavymath_types` - Provides domain types

### Runtime Dependencies
- None (zero dependencies for network layer)

### Dev Dependencies
- TypeScript, ESLint, Prettier, Vitest

## Best Practices

### Do's
- Use existing patterns from similar hooks/methods
- Export everything from the appropriate `index.ts`
- Add JSDoc comments to exported functions
- Use TypeScript strict mode (enabled)
- Follow the three-layer architecture
- Pass `IndexerClient` as first parameter to hooks
- Run `npm run check-all` before committing

### Don'ts
- Don't use `any` type (prefer `unknown` and type guards)
- Don't skip the `enabled` option in hooks when param might be undefined
- Don't create NetworkClient instances in this library - let consumers inject them
- Don't forget to export from layer index files
- Don't define types locally if they exist in shared packages

## Related Projects

- **@sudobility/types**: Base types and NetworkClient interface
- **@sudobility/heavymath_types**: Domain-specific types (Market, Prediction, etc.)
- **@sudobility/di**: Dependency injection and NetworkClient implementations
- **heavymath_indexer**: The backend API this client connects to

## Quick Reference

### Common Hook Signatures
```typescript
// All hooks take IndexerClient as first parameter
useMarkets(client: IndexerClient, filters?: MarketFilters)
useMarket(client: IndexerClient, marketId: string | undefined)
useFavorites(client: IndexerClient, walletAddress: string | undefined, filters?)
```

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

// Favorites
useFavorites, useCategoryFavorites, useIsFavorite

// Stats
useMarketStats, useHealth
```

### Type Imports
```typescript
import type {
  // Core types (from @sudobility/heavymath_types)
  MarketData, PredictionData, DealerNftData, DealerPermissionData,
  MarketStateHistoryData, FeeWithdrawalData, OracleRequestData,
  WalletFavoriteData, CreateFavoriteRequest,
  // Enums
  MarketStatus, ClaimType, WithdrawalType,
  // Response wrappers (from @sudobility/types)
  ApiResponse, PaginatedResponse, NetworkClient, NetworkResponse,
  // Filter types (local)
  MarketFilters, PredictionFilters, DealerFilters, WithdrawalFilters, OracleFilters,
  WalletFavoritesFilters,
} from '@heavymath/indexer_client';
```

---

**Remember**: Always run `npm run check-all` before committing!
