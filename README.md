# @heavymath/indexer_client

TypeScript client library for the Heavymath Prediction Market Indexer API. Provides React hooks, business services, and low-level API clients for querying prediction market data.

## Features

- **Full API Coverage** - All REST endpoints supported
- **React Hooks** - Built-in hooks using @tanstack/react-query
- **Business Services** - High-level services with caching
- **Network Layer** - Low-level API client for custom integrations
- **TypeScript First** - Full type definitions included
- **React Native Compatible** - Works in React Native environments
- **Dependency Injection** - Uses NetworkClient from @sudobility/di

## Installation

```bash
npm install @heavymath/indexer_client
```

## Peer Dependencies

```bash
npm install react @tanstack/react-query @sudobility/types @sudobility/heavymath_types @sudobility/di
```

## Quick Start

### 1. Setup React Query Provider

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <YourApp />
    </QueryClientProvider>
  );
}
```

### 2. Create IndexerClient with NetworkClient

```tsx
import { useMemo } from 'react';
import { useNetworkService } from '@sudobility/di'; // Or your DI container
import { IndexerClient } from '@heavymath/indexer_client';

// Create a hook to provide IndexerClient
function useIndexerClient() {
  const networkClient = useNetworkService();
  return useMemo(
    () => new IndexerClient('http://localhost:42069', networkClient),
    [networkClient]
  );
}
```

### 3. Use Hooks in Your Components

```tsx
import { useActiveMarkets, useUserPredictions } from '@heavymath/indexer_client';

function BettorDashboard({ wallet }: { wallet: string }) {
  const client = useIndexerClient();

  const { data: markets, isLoading: marketsLoading } = useActiveMarkets(client, 20);
  const { data: myBets, isLoading: betsLoading } = useUserPredictions(client, wallet);

  if (marketsLoading || betsLoading) return <div>Loading...</div>;

  return (
    <div>
      <h2>Active Markets</h2>
      {markets?.data?.map(market => (
        <MarketCard key={market.id} market={market} />
      ))}

      <h2>My Bets</h2>
      {myBets?.data?.map(bet => (
        <BetCard key={bet.id} bet={bet} />
      ))}
    </div>
  );
}
```

## Architecture

The library is organized into three layers:

### 1. Network Layer

Low-level API client that accepts a `NetworkClient` instance.

```tsx
import type { NetworkClient } from '@sudobility/types';
import { IndexerClient } from '@heavymath/indexer_client';

// Get NetworkClient from your DI container
const networkClient: NetworkClient = getNetworkService();

const client = new IndexerClient('http://localhost:42069', networkClient);

// Direct API calls
const markets = await client.getMarkets({ status: 'Active', limit: 10 });
const market = await client.getMarket('1-market-123');
```

### 2. Business Layer

High-level services with caching and business logic.

```tsx
import type { NetworkClient } from '@sudobility/types';
import { IndexerService } from '@heavymath/indexer_client';

const networkClient: NetworkClient = getNetworkService();

const service = new IndexerService({
  indexerUrl: 'http://localhost:42069',
  networkClient,
  cacheTTL: 5 * 60 * 1000, // 5 minutes (optional)
});

// Business methods with caching
const activeMarkets = await service.getActiveMarkets(20);
const userPredictions = await service.getUserPredictions('0x123...');
const dealerDashboard = await service.getDealerDashboard('0x123...');
```

### 3. Hooks Layer

React hooks using @tanstack/react-query for data fetching.

```tsx
import { useActiveMarkets, useUserPredictions, useDealerDashboard } from '@heavymath/indexer_client';

// All hooks take IndexerClient as first parameter
const { data, isLoading, error, refetch } = useActiveMarkets(client, 20);
```

## Common Use Cases

### Dealer Dashboard

```tsx
import { useDealerDashboard, useIsDealer } from '@heavymath/indexer_client';

function DealerDashboard({ wallet }: { wallet: string }) {
  const client = useIndexerClient();

  const { data: isDealer, isLoading: checkingDealer } = useIsDealer(client, wallet);
  const { nfts, markets, isLoading } = useDealerDashboard(client, wallet);

  if (checkingDealer) return <div>Checking dealer status...</div>;
  if (!isDealer) return <div>You are not a dealer</div>;
  if (isLoading) return <div>Loading dashboard...</div>;

  return (
    <div>
      <h2>My Dealer NFTs</h2>
      {nfts.data?.map(nft => (
        <div key={nft.id}>Token #{nft.tokenId}</div>
      ))}

      <h2>My Markets</h2>
      {markets.data?.map(market => (
        <MarketCard key={market.id} market={market} />
      ))}
    </div>
  );
}
```

### Market Details Page

```tsx
import { useMarketDetails } from '@heavymath/indexer_client';

function MarketPage({ marketId }: { marketId: string }) {
  const client = useIndexerClient();

  const { market, predictions, history, isLoading, isError } = useMarketDetails(client, marketId);

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error loading market</div>;

  return (
    <div>
      <h1>{market.data?.data?.title}</h1>
      <p>{market.data?.data?.description}</p>
      <p>Status: {market.data?.data?.status}</p>

      <h2>Predictions ({predictions.data?.data?.length || 0})</h2>
      {predictions.data?.data?.map(pred => (
        <div key={pred.id}>
          {pred.userAddress}: {pred.percentage}%
        </div>
      ))}

      <h2>State History</h2>
      {history.data?.data?.map(state => (
        <div key={state.id}>
          {state.fromState} → {state.toState}
        </div>
      ))}
    </div>
  );
}
```

### Wallet Favorites

```tsx
import { useFavorites } from '@heavymath/indexer_client';

function FavoritesPage({ wallet }: { wallet: string }) {
  const client = useIndexerClient();

  const { favorites, isLoading, addFavorite, removeFavorite, refresh } = useFavorites(
    client,
    wallet
  );

  const handleAddFavorite = async () => {
    await addFavorite.mutateAsync({
      category: 'sports',
      subcategory: 'soccer',
      type: 'team',
      id: 'team-123',
    });
  };

  const handleRemoveFavorite = async (id: number) => {
    await removeFavorite.mutateAsync(id);
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h2>My Favorites</h2>
      {favorites.map(fav => (
        <div key={fav.id}>
          {fav.category}/{fav.subcategory}: {fav.itemId}
          <button onClick={() => handleRemoveFavorite(fav.id)}>Remove</button>
        </div>
      ))}
      <button onClick={handleAddFavorite}>Add Favorite</button>
    </div>
  );
}
```

## Available Hooks

### Market Hooks
- `useMarkets(client, filters?)` - Get all markets with filtering
- `useActiveMarkets(client, limit?)` - Get active markets only
- `useMarket(client, marketId)` - Get specific market
- `useMarketPredictions(client, marketId)` - Get market's predictions
- `useMarketHistory(client, marketId)` - Get market's state history
- `useMarketDetails(client, marketId)` - Get complete market details

### Prediction Hooks
- `usePredictions(client, filters?)` - Get predictions with filtering
- `useUserPredictions(client, wallet, filters?)` - Get user's predictions
- `useActiveBets(client, wallet)` - Get user's active bets
- `usePastBets(client, wallet)` - Get user's claimed bets
- `usePrediction(client, predictionId)` - Get specific prediction
- `useUserBettingHistory(client, wallet)` - Get complete betting history

### Dealer Hooks
- `useDealers(client, filters?)` - Get dealer NFTs with filtering
- `useIsDealer(client, wallet)` - Check if wallet is a dealer
- `useDealerNFTs(client, wallet)` - Get wallet's dealer NFTs
- `useDealer(client, dealerId)` - Get specific dealer NFT
- `useDealerPermissions(client, dealerId)` - Get dealer's permissions
- `useDealerMarkets(client, dealerId)` - Get dealer's markets
- `useDealerDashboard(client, wallet)` - Get complete dealer dashboard

### Withdrawal Hooks
- `useWithdrawals(client, filters?)` - Get withdrawals with filtering
- `useDealerWithdrawals(client, dealer)` - Get dealer's withdrawals
- `useSystemWithdrawals(client)` - Get system withdrawals
- `useMarketWithdrawals(client, marketId)` - Get market's withdrawals

### Oracle Hooks
- `useOracleRequests(client, filters?)` - Get oracle requests with filtering
- `useOracleRequest(client, requestId)` - Get specific oracle request
- `useMarketOracle(client, marketId)` - Get market's oracle request
- `useTimedOutOracleRequests(client)` - Get timed out requests
- `usePendingOracleRequests(client)` - Get pending requests

### Favorites Hooks
- `useFavorites(client, wallet, filters?)` - Get favorites with add/remove/refresh
- `useCategoryFavorites(client, wallet, category)` - Get favorites by category
- `useIsFavorite(client, wallet, item)` - Check if item is favorited with toggle

### Stats Hooks
- `useMarketStats(client)` - Get market statistics
- `useHealth(client)` - Get indexer health status

## API Endpoints

The client supports all REST endpoints:

- **Markets**: `/api/markets`, `/api/markets/:id`, `/api/markets/:id/predictions`, `/api/markets/:id/history`
- **Predictions**: `/api/predictions`, `/api/predictions/:id`
- **Dealers**: `/api/dealers`, `/api/dealers/:id`, `/api/dealers/:id/permissions`, `/api/dealers/:id/markets`
- **Withdrawals**: `/api/withdrawals`
- **Oracle**: `/api/oracle/requests`, `/api/oracle/requests/:id`
- **Favorites**: `/api/wallet/:address/favorites` (GET, POST, DELETE)
- **Analytics**: `/api/stats/markets`, `/api/health`

## TypeScript Support

Full TypeScript definitions included:

```tsx
import type {
  // Core types (from @sudobility/heavymath_types)
  MarketData,
  PredictionData,
  DealerNftData,
  DealerPermissionData,
  MarketStateHistoryData,
  FeeWithdrawalData,
  OracleRequestData,
  WalletFavoriteData,
  CreateFavoriteRequest,
  // Enums
  MarketStatus,
  ClaimType,
  WithdrawalType,
  // Response wrappers (from @sudobility/types)
  ApiResponse,
  PaginatedResponse,
  NetworkClient,
  // Filter types
  MarketFilters,
  PredictionFilters,
  DealerFilters,
  WithdrawalFilters,
  OracleFilters,
  WalletFavoritesFilters,
} from '@heavymath/indexer_client';
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Type check
npm run typecheck

# Lint
npm run lint

# Format
npm run format

# Run all checks
npm run check-all
```

## License

BUSL 1.1 - Business Use Source License

Copyright (c) 2025 Sudobility Inc.
