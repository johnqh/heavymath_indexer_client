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
│   ├── types.ts                 # All type definitions
│   ├── network/                 # Network layer (low-level HTTP)
│   │   ├── index.ts             # Network exports
│   │   ├── FetchNetworkClient.ts # Generic HTTP client using fetch
│   │   └── IndexerClient.ts     # API client with all 15 endpoints
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
│   │   └── useStats.ts          # Statistics hooks
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
- **Adding new type**: Add to `src/types.ts`
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
└─────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────┐
│                  Business Layer                      │
│  (IndexerService)                                    │
│  High-level methods with TTL caching                 │
└─────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────┐
│                   Network Layer                      │
│  (IndexerClient + FetchNetworkClient)                │
│  Low-level HTTP requests, 1:1 with REST endpoints   │
└─────────────────────────────────────────────────────┘
```

**When to use each layer:**
- **Hooks**: React components (most common)
- **Business Layer**: Non-React code needing caching
- **Network Layer**: Direct API access, custom implementations

### Indexer API Endpoints

The client covers all 15 REST endpoints from `heavymath_indexer`:

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
import { useMemo } from 'react';
import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import type { SomeType, ApiResponse } from '../types';
import { IndexerClient } from '../network/IndexerClient';
import { FetchNetworkClient } from '../network/FetchNetworkClient';

export function useExample(
  endpointUrl: string,
  param: string,
  options?: Omit<UseQueryOptions<ApiResponse<SomeType>>, 'queryKey' | 'queryFn'>
): UseQueryResult<ApiResponse<SomeType>> {
  const client = useMemo(
    () => new IndexerClient(endpointUrl, new FetchNetworkClient()),
    [endpointUrl]
  );

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
1. Add types to `src/types.ts` if needed
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

### 4. Adding a New Type

Add to `src/types.ts`:
```typescript
/**
 * Description of the new type
 */
export interface NewType {
  id: string;
  chainId: number;
  someField: string;
  numericField: string; // BigInt as string
  createdAt: string;    // ISO date string
}

/**
 * Query parameters for new endpoint
 */
export interface NewTypeFilters {
  someFilter?: string;
  limit?: number;
  offset?: number;
}
```

## Type Conventions

### Response Types
- `ApiResponse<T>` - Single item response with `success`, `data`, `error`
- `PaginatedResponse<T>` - List response with `data[]`, `count`, `limit`, `offset`

### Field Conventions
- **IDs**: Chain-prefixed strings (e.g., `"1-market-123"`)
- **Addresses**: Lowercase hex strings (e.g., `"0xabc..."`)
- **BigInt values**: Stored as strings (e.g., `"1000000000000000000"`)
- **Dates**: ISO 8601 strings (e.g., `"2024-01-15T12:00:00Z"`)
- **Enums**: String literals (e.g., `MarketStatus = 'Active' | 'Resolved' | ...`)

### Filter Types
Each endpoint has a corresponding filter interface:
- `MarketFilters` - status, dealer, category, limit, offset
- `PredictionFilters` - user, market, claimed, limit, offset
- `DealerFilters` - owner, limit, offset
- `WithdrawalFilters` - withdrawer, type, market, limit, offset
- `OracleFilters` - market, timedOut, limit, offset

## Code Patterns to Follow

### Hook Query Keys
Always use hierarchical keys with `'heavymath'` prefix:
```typescript
queryKey: ['heavymath', 'markets', filters]
queryKey: ['heavymath', 'market', marketId]
queryKey: ['heavymath', 'user-predictions', wallet, filters]
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
import { describe, it, expect } from 'vitest';
import { IndexerClient, FetchNetworkClient } from '../index';

describe('FeatureName', () => {
  it('should do something', () => {
    const client = new IndexerClient('http://localhost:42069');
    expect(client).toBeInstanceOf(IndexerClient);
  });
});
```

## Dependencies

### Peer Dependencies (required by consumer)
- `react` ^19.2.0
- `@tanstack/react-query` ^5.90.5

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
- Use `useMemo` for client instances in hooks
- Run `npm run check-all` before committing

### Don'ts
- Don't use `any` type (prefer `unknown` and type guards)
- Don't skip the `enabled` option in hooks when param might be undefined
- Don't hardcode URLs in hooks (always pass `endpointUrl`)
- Don't create clients outside `useMemo` in hooks
- Don't forget to export from layer index files

## Related Project

This client library connects to the **Heavymath Indexer** (`~/heavymath_indexer`):
- GraphQL API: `http://localhost:42069/graphql`
- REST API: `http://localhost:42069/api/*`
- Default port: 42069

## Quick Reference

### Common Hook Signatures
```typescript
// Basic list with filters
useMarkets(endpointUrl: string, filters?: MarketFilters)

// Single item by ID
useMarket(endpointUrl: string, marketId: string | undefined)

// User-specific data
useUserPredictions(endpointUrl: string, wallet: string, filters?)

// Composite hook returning multiple queries
useMarketDetails(endpointUrl: string, marketId: string | undefined)
// Returns: { market, predictions, history, isLoading, isError }
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

// Stats
useMarketStats, useHealth
```

### Type Imports
```typescript
import type {
  // Core types
  Market, Prediction, DealerNFT, DealerPermission, StateHistory, FeeWithdrawal, OracleRequest,
  // Response wrappers
  ApiResponse, PaginatedResponse, NetworkResponse,
  // Filter types
  MarketFilters, PredictionFilters, DealerFilters, WithdrawalFilters, OracleFilters,
  // Enums
  MarketStatus,
  // Stats
  MarketStats, HealthStatus,
} from '@heavymath/indexer_client';
```

---

**Remember**: Always run `npm run check-all` before committing!
