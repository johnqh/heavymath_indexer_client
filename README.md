# @heavymath/indexer_client

TypeScript client library for the Heavymath Prediction Market Indexer API. Provides React hooks, business services, and low-level API clients for querying prediction market data.

## Features

- 🎯 **Full API Coverage** - All 15 REST endpoints supported
- ⚛️ **React Hooks** - Built-in hooks using @tanstack/react-query
- 💼 **Business Services** - High-level services with caching
- 🔄 **Network Layer** - Low-level HTTP client for custom integrations
- 📦 **Zero Dependencies** - Network layer has no runtime dependencies
- 🎨 **TypeScript First** - Full type definitions included
- 📱 **React Native Compatible** - Works in React Native environments

## Installation

```bash
npm install @heavymath/indexer_client
```

## Peer Dependencies

For React hooks:
```bash
npm install react @tanstack/react-query
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

### 2. Use Hooks in Your Components

```tsx
import { useActiveMarkets, useUserPredictions } from '@heavymath/indexer_client';

function BettorDashboard({ wallet }: { wallet: string }) {
  const { data: markets, isLoading: marketsLoading } = useActiveMarkets(
    'http://localhost:42069',
    20
  );

  const { data: myBets, isLoading: betsLoading } = useUserPredictions(
    'http://localhost:42069',
    wallet
  );

  if (marketsLoading || betsLoading) return <div>Loading...</div>;

  return (
    <div>
      <h2>Active Markets</h2>
      {markets?.data.map(market => (
        <MarketCard key={market.id} market={market} />
      ))}

      <h2>My Bets</h2>
      {myBets?.data.map(bet => (
        <BetCard key={bet.id} bet={bet} />
      ))}
    </div>
  );
}
```

## Architecture

The library is organized into three layers:

### 1. Network Layer

Low-level HTTP client and API endpoint methods.

```tsx
import { IndexerClient, FetchNetworkClient } from '@heavymath/indexer_client';

const client = new IndexerClient(
  'http://localhost:42069',
  new FetchNetworkClient()
);

// Direct API calls
const markets = await client.getMarkets({ status: 'Active', limit: 10 });
const market = await client.getMarket('1-market-123');
```

### 2. Business Layer

High-level services with caching and business logic.

```tsx
import { IndexerService } from '@heavymath/indexer_client';

const service = IndexerService.getInstance({
  indexerUrl: 'http://localhost:42069',
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
import {
  useActiveMarkets,
  useUserPredictions,
  useDealerDashboard,
} from '@heavymath/indexer_client';

// React hooks with automatic caching and refetching
const { data, isLoading, error, refetch } = useActiveMarkets(
  'http://localhost:42069',
  20
);
```

## Common Use Cases

### Dealer Dashboard

```tsx
import { useDealerDashboard, useIsDealer } from '@heavymath/indexer_client';

function DealerDashboard({ wallet }: { wallet: string }) {
  const { data: isDealer, isLoading: checkingDealer } = useIsDealer(
    'http://localhost:42069',
    wallet
  );

  const { nfts, markets, isLoading } = useDealerDashboard(
    'http://localhost:42069',
    wallet
  );

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
  const { market, predictions, history, isLoading, isError } = useMarketDetails(
    'http://localhost:42069',
    marketId
  );

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

### User Betting History

```tsx
import { useUserBettingHistory } from '@heavymath/indexer_client';

function BettingHistory({ wallet }: { wallet: string }) {
  const { active, claimed, isLoading } = useUserBettingHistory(
    'http://localhost:42069',
    wallet
  );

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h2>Active Bets ({active.data?.data.length || 0})</h2>
      {active.data?.data.map(bet => (
        <BetCard key={bet.id} bet={bet} status="active" />
      ))}

      <h2>Past Bets ({claimed.data?.data.length || 0})</h2>
      {claimed.data?.data.map(bet => (
        <BetCard key={bet.id} bet={bet} status="claimed" />
      ))}
    </div>
  );
}
```

### Market Statistics

```tsx
import { useMarketStats } from '@heavymath/indexer_client';

function StatsPage() {
  const { data, isLoading } = useMarketStats('http://localhost:42069');

  if (isLoading) return <div>Loading stats...</div>;

  const stats = data?.data;
  return (
    <div>
      <h2>Platform Statistics</h2>
      <div>Total Markets: {stats?.totalMarkets}</div>
      <div>Active Markets: {stats?.activeMarkets}</div>
      <div>Resolved Markets: {stats?.resolvedMarkets}</div>
      <div>Total Volume: {stats?.totalVolume}</div>
    </div>
  );
}
```

## Available Hooks

### Market Hooks
- `useMarkets(url, filters?)` - Get all markets with filtering
- `useActiveMarkets(url, limit?)` - Get active markets only
- `useMarket(url, marketId)` - Get specific market
- `useMarketPredictions(url, marketId)` - Get market's predictions
- `useMarketHistory(url, marketId)` - Get market's state history
- `useMarketDetails(url, marketId)` - Get complete market details

### Prediction Hooks
- `usePredictions(url, filters?)` - Get predictions with filtering
- `useUserPredictions(url, wallet, filters?)` - Get user's predictions
- `useActiveBets(url, wallet)` - Get user's active bets
- `usePastBets(url, wallet)` - Get user's claimed bets
- `usePrediction(url, predictionId)` - Get specific prediction
- `useUserBettingHistory(url, wallet)` - Get complete betting history

### Dealer Hooks
- `useDealers(url, filters?)` - Get dealer NFTs with filtering
- `useIsDealer(url, wallet)` - Check if wallet is a dealer
- `useDealerNFTs(url, wallet)` - Get wallet's dealer NFTs
- `useDealer(url, dealerId)` - Get specific dealer NFT
- `useDealerPermissions(url, dealerId)` - Get dealer's permissions
- `useDealerMarkets(url, dealerId)` - Get dealer's markets
- `useDealerDashboard(url, wallet)` - Get complete dealer dashboard

### Withdrawal Hooks
- `useWithdrawals(url, filters?)` - Get withdrawals with filtering
- `useDealerWithdrawals(url, dealer)` - Get dealer's withdrawals
- `useSystemWithdrawals(url)` - Get system withdrawals
- `useMarketWithdrawals(url, marketId)` - Get market's withdrawals

### Oracle Hooks
- `useOracleRequests(url, filters?)` - Get oracle requests with filtering
- `useOracleRequest(url, requestId)` - Get specific oracle request
- `useMarketOracle(url, marketId)` - Get market's oracle request
- `useTimedOutOracleRequests(url)` - Get timed out requests
- `usePendingOracleRequests(url)` - Get pending requests

### Stats Hooks
- `useMarketStats(url)` - Get market statistics
- `useHealth(url)` - Get indexer health status

## API Endpoints

The client supports all 15 REST endpoints:

- **Markets**: `/api/markets`, `/api/markets/:id`, `/api/markets/:id/predictions`, `/api/markets/:id/history`
- **Predictions**: `/api/predictions`, `/api/predictions/:id`
- **Dealers**: `/api/dealers`, `/api/dealers/:id`, `/api/dealers/:id/permissions`, `/api/dealers/:id/markets`
- **Withdrawals**: `/api/withdrawals`
- **Oracle**: `/api/oracle/requests`, `/api/oracle/requests/:id`
- **Analytics**: `/api/stats/markets`, `/api/health`

## TypeScript Support

Full TypeScript definitions included:

```tsx
import type {
  Market,
  Prediction,
  DealerNFT,
  DealerPermission,
  StateHistory,
  FeeWithdrawal,
  OracleRequest,
  MarketStats,
  ApiResponse,
  PaginatedResponse,
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
