# Heavymath Indexer Client - Project Structure

## Overview

TypeScript client library for the Heavymath Prediction Market Indexer API, following the pattern from `@sudobility/indexer_client`.

## Directory Structure

```
heavymath_indexer_client/
├── package.json                    ✅ Created
├── tsconfig.json                   ✅ Created
├── tsconfig.build.json             ✅ Created
├── eslint.config.js                ✅ Created
├── .prettierrc                     ✅ Created
├── .gitignore                      ✅ Created
├── vitest.config.ts                ✅ Created
├── README.md                       ⏳ To create
├── src/
│   ├── index.ts                    ⏳ Main export
│   ├── types.ts                    ⏳ Type definitions
│   ├── network/
│   │   ├── index.ts                ⏳ Network exports
│   │   ├── FetchNetworkClient.ts   ⏳ HTTP client
│   │   └── IndexerClient.ts        ⏳ API client with endpoints
│   ├── business/
│   │   ├── index.ts                ⏳ Business exports
│   │   └── indexer-service.ts      ⏳ High-level service with caching
│   └── hooks/
│       ├── index.ts                ⏳ Hook exports
│       ├── useMarkets.ts           ⏳ Market hooks
│       ├── usePredictions.ts       ⏳ Prediction hooks
│       ├── useDealers.ts           ⏳ Dealer NFT hooks
│       ├── useWithdrawals.ts       ⏳ Fee withdrawal hooks
│       └── useOracle.ts            ⏳ Oracle hooks
└── docs/
    ├── API.md                      ⏳ API documentation
    └── EXAMPLES.md                 ⏳ Usage examples
```

## File Responsibilities

### Configuration Files ✅ DONE
- **package.json** - Dependencies, scripts, metadata
- **tsconfig.json** - TypeScript compiler options
- **tsconfig.build.json** - Build-specific TS config
- **eslint.config.js** - Linting rules
- **.prettierrc** - Code formatting
- **vitest.config.ts** - Test configuration

### Core Types (src/types.ts) ⏳
- `Market` - Market data type
- `Prediction` - User prediction type
- `DealerNFT` - Dealer NFT type
- `DealerPermission` - Permission type
- `StateHistory` - State transition type
- `FeeWithdrawal` - Withdrawal type
- `OracleRequest` - Oracle request type
- `ApiResponse<T>` - Generic API response wrapper
- `PaginatedResponse<T>` - Paginated response wrapper

### Network Layer (src/network/) ⏳

#### FetchNetworkClient.ts
- Generic HTTP client using `fetch`
- Methods: `get()`, `post()`, `put()`, `delete()`
- Error handling and retry logic
- Request/response interceptors

#### IndexerClient.ts
- Low-level API client
- Maps 1:1 to REST endpoints:
  - `getMarkets(filters)` → GET /api/markets
  - `getMarket(id)` → GET /api/markets/:id
  - `getMarketPredictions(id)` → GET /api/markets/:id/predictions
  - `getMarketHistory(id)` → GET /api/markets/:id/history
  - `getPredictions(filters)` → GET /api/predictions
  - `getDealers(filters)` → GET /api/dealers
  - `getDealer(id)` → GET /api/dealers/:id
  - `getDealerPermissions(id)` → GET /api/dealers/:id/permissions
  - `getDealerMarkets(id)` → GET /api/dealers/:id/markets
  - `getWithdrawals(filters)` → GET /api/withdrawals
  - `getOracleRequests(filters)` → GET /api/oracle/requests
  - `getMarketStats()` → GET /api/stats/markets
  - `getHealth()` → GET /api/health

### Business Layer (src/business/) ⏳

#### indexer-service.ts
- High-level business service
- Caching with TTL (5 minutes default)
- Methods with business logic:
  - `getActiveMarkets()` - Get active markets with caching
  - `getUserPredictions(wallet)` - Get user's predictions
  - `getDealerNFTs(wallet)` - Check if wallet is dealer
  - `getDealerDashboard(wallet)` - Get dealer's markets
  - `getMarketDetails(id)` - Get market + predictions + history
  - `getUserBettingHistory(wallet)` - Active + past bets
  - `getMarketFromPrediction(predictionId)` - Navigate from bet to market

### React Hooks (src/hooks/) ⏳

#### useMarkets.ts
```typescript
// Get all markets
useMarkets(filters?: MarketFilters)

// Get active markets
useActiveMarkets(limit?: number)

// Get market details
useMarket(id: string)

// Get market predictions
useMarketPredictions(marketId: string)

// Get market history
useMarketHistory(marketId: string)
```

#### usePredictions.ts
```typescript
// Get user predictions
useUserPredictions(wallet: string, filters?: PredictionFilters)

// Get active bets
useActiveBets(wallet: string)

// Get past bets
usePastBets(wallet: string)

// Get specific prediction
usePrediction(id: string)
```

#### useDealers.ts
```typescript
// Check if wallet is dealer
useIsDealer(wallet: string)

// Get dealer NFTs
useDealerNFTs(wallet: string)

// Get dealer permissions
useDealerPermissions(nftId: string)

// Get dealer markets
useDealerMarkets(nftId: string)
```

#### useWithdrawals.ts
```typescript
// Get withdrawals
useWithdrawals(filters?: WithdrawalFilters)

// Get dealer withdrawals
useDealerWithdrawals(dealer: string)
```

#### useOracle.ts
```typescript
// Get oracle requests
useOracleRequests(filters?: OracleFilters)

// Get market oracle
useMarketOracle(marketId: string)
```

## API Endpoint Coverage

All 15 REST endpoints from the indexer:

✅ Markets
- GET /api/markets
- GET /api/markets/:id
- GET /api/markets/:id/predictions
- GET /api/markets/:id/history

✅ Predictions
- GET /api/predictions
- GET /api/predictions/:id

✅ Dealer NFTs
- GET /api/dealers
- GET /api/dealers/:id
- GET /api/dealers/:id/permissions
- GET /api/dealers/:id/markets

✅ Fee Withdrawals
- GET /api/withdrawals

✅ Oracle Requests
- GET /api/oracle/requests
- GET /api/oracle/requests/:id

✅ Analytics
- GET /api/stats/markets
- GET /api/health

## Usage Examples

### Dealer Flow
```typescript
import { useIsDealer, useDealerMarkets } from '@heavymath/indexer_client';

function DealerDashboard({ wallet }) {
  const { data: isDealer } = useIsDealer(wallet);
  const { data: markets } = useDealerMarkets(wallet);

  if (!isDealer) return <div>Not a dealer</div>;

  return (
    <div>
      <h2>My Markets</h2>
      {markets?.map(market => (
        <MarketCard key={market.id} market={market} />
      ))}
    </div>
  );
}
```

### Bettor Flow
```typescript
import { useActiveMarkets, useUserPredictions } from '@heavymath/indexer_client';

function BettorUI({ wallet }) {
  const { data: activeMarkets } = useActiveMarkets();
  const { data: myBets } = useUserPredictions(wallet);

  return (
    <div>
      <h2>Active Markets</h2>
      {activeMarkets?.map(market => (
        <MarketCard key={market.id} market={market} />
      ))}

      <h2>My Bets</h2>
      {myBets?.map(bet => (
        <BetCard key={bet.id} bet={bet} />
      ))}
    </div>
  );
}
```

## Next Steps

1. ⏳ Create src/types.ts with all type definitions
2. ⏳ Create src/network/FetchNetworkClient.ts
3. ⏳ Create src/network/IndexerClient.ts with all endpoints
4. ⏳ Create src/business/indexer-service.ts with caching
5. ⏳ Create all hooks in src/hooks/
6. ⏳ Create src/index.ts main export
7. ⏳ Create README.md and documentation
8. ⏳ Add tests for each module
9. ⏳ Build and publish to npm

## Dependencies

### Runtime
- None (zero dependencies for network layer)

### Peer Dependencies
- `react` ^19.2.0
- `@tanstack/react-query` ^5.90.5

### Dev Dependencies
- TypeScript
- ESLint
- Prettier
- Vitest
- Testing Library

## Build Process

```bash
# Install dependencies
npm install

# Development
npm run build:watch
npm run typecheck:watch
npm run test:watch

# Production
npm run check-all  # Lint + typecheck + test
npm run build      # Compile to dist/

# Publish
npm run prepublishOnly  # Clean + build
npm publish
```

## Integration with Heavymath Frontend

```typescript
// 1. Install
npm install @heavymath/indexer_client

// 2. Setup React Query
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <YourApp />
    </QueryClientProvider>
  );
}

// 3. Use hooks
import {
  useActiveMarkets,
  useIsDealer,
  useUserPredictions
} from '@heavymath/indexer_client';
```

## Pattern Consistency

This client follows the exact same pattern as `@sudobility/indexer_client`:
- ✅ Same directory structure
- ✅ Same layered architecture (network → business → hooks)
- ✅ Same caching strategy
- ✅ Same React Query integration
- ✅ Same testing approach
- ✅ Same build configuration
