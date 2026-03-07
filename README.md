# @sudobility/heavymath_indexer_client

React and React Native compatible client library for the Heavymath prediction market indexer API. Provides a four-layer architecture (hooks, stores, business, network) with React Query integration, Zustand stores for optimistic updates, and SSE real-time subscriptions.

## Installation

```bash
bun add @sudobility/heavymath_indexer_client
```

### Peer Dependencies

```bash
bun add react @tanstack/react-query zustand @sudobility/types @sudobility/heavymath_types
```

## Usage

```typescript
import { IndexerClient, useActiveMarkets, useFavorites } from '@sudobility/heavymath_indexer_client';

// Create client with injected NetworkClient
const client = new IndexerClient('http://localhost:42069', networkClient);

// Use hooks in React components
function Dashboard({ wallet }) {
  const { data: markets } = useActiveMarkets(client, 20);
  const { favorites, addFavorite, removeFavorite } = useFavorites(client, wallet);
  // ...
}
```

## Available Hooks

### Markets
`useMarkets`, `useActiveMarkets`, `useMarket`, `useMarketPredictions`, `useMarketHistory`, `useMarketDetails`

### Predictions
`usePredictions`, `useUserPredictions`, `useActiveBets`, `usePastBets`, `usePrediction`, `useUserBettingHistory`

### Dealers
`useDealers`, `useIsDealer`, `useDealerNFTs`, `useDealer`, `useDealerPermissions`, `useDealerMarkets`, `useDealerDashboard`

### Withdrawals / Oracle
`useWithdrawals`, `useDealerWithdrawals`, `useSystemWithdrawals`, `useMarketWithdrawals`, `useOracleRequests`, `useOracleRequest`, `useMarketOracle`

### Favorites (with Zustand optimistic updates)
`useFavorites`, `useCategoryFavorites`, `useIsFavorite`

### SSE (real-time)
`useSSE`, `useMarketUpdates`, `useAllMarketUpdates`, `useUserPredictionUpdates`

### Stats
`useMarketStats`, `useHealth`

## Architecture

```
Hooks (React Query)  -->  Zustand Stores  -->  Business Layer (caching)  -->  Network Layer (HTTP)
```

All hooks accept `IndexerClient` as their first parameter. SSE hooks accept an endpoint URL.

## Development

```bash
bun run build        # Compile TypeScript to dist/
bun run typecheck    # Type validation
bun run test:run     # Run tests once
bun run lint         # ESLint check
bun run check-all    # Lint + typecheck + tests
```

## Related Packages

- `@sudobility/heavymath_types` -- shared type definitions
- `@sudobility/heavymath_indexer` -- the backend indexer this client connects to
- `@sudobility/heavymath_lib` -- business logic hooks
- `heavymath_app` -- frontend web application

## License

BUSL-1.1
