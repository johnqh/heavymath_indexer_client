# Improvement Plans for @sudobility/heavymath_indexer_client

## Priority 1 - High Impact

### 1. Expand Test Coverage Beyond Smoke Tests ✅
- ~~The only test file is `src/__tests__/index.test.ts` with 6 basic smoke tests that verify class instantiation and constructor validation.~~
- ~~There are zero tests for: `IndexerClient` API methods (17 endpoints), `IndexerService` business methods (8 methods with caching logic), all React hooks (`useMarkets`, `usePredictions`, `useDealers`, `useWithdrawals`, `useOracle`, `useStats`, `useFavorites`, `useSSE`), and the `useFavoritesStore` Zustand store.~~
- ~~The `IndexerClient` methods have consistent patterns (URL building, error handling, filter serialization) that can be tested with a mocked `NetworkClient`.~~
- ~~The `IndexerService` caching behavior (TTL expiration, cache key generation, `clearCache`) is pure logic that is highly testable.~~
- ~~The `useFavoritesStore` contains optimistic update logic (add/rollback, remove/rollback, temp IDs, wallet normalization) that should have unit tests.~~
- ~~The `vitest.integration.config.ts` referenced by `test:integration` scripts does not exist, meaning integration testing is completely blocked.~~
- **Status**: Completed. Added 88 new tests across 3 test files:
  - `src/__tests__/IndexerClient.test.ts` (34 tests) - all API endpoints, URL building, error handling, filter serialization
  - `src/__tests__/IndexerService.test.ts` (24 tests) - caching, TTL, cache invalidation, business methods, singleton
  - `src/__tests__/favorites-store.test.ts` (30 tests) - optimistic add/remove, rollback, wallet normalization, staleness checks

### 2. Add Field-Level JSDoc to Filter Types and Document Caching Behavior ✅
- ~~`IndexerClient` methods now have `@param`, `@returns`, and `@throws` annotations, but filter parameter types (`MarketFilters`, `PredictionFilters`, etc.) still lack field-level JSDoc explaining valid values, defaults, or constraints.~~
- ~~`IndexerService` business methods lack `@throws` documentation and caching behavior notes (e.g., that `getActiveMarkets` caches for 5 minutes by default).~~
- ~~Filter types should document which values are valid for enum-like fields (e.g., `status` in `MarketFilters` accepts `'Active' | 'Resolved' | 'Cancelled' | 'Abandoned'`).~~
- **Status**: Completed. Added field-level JSDoc to all 6 filter types (`MarketFilters`, `PredictionFilters`, `DealerFilters`, `WithdrawalFilters`, `OracleFilters`, `WalletFavoritesFilters`) and added `@throws` + caching behavior notes to all `IndexerService` business methods.

### 3. Fix the Deprecated Type Aliases Strategy ✅
- ~~`src/types.ts` exports 9 deprecated type aliases (e.g., `Market`, `Prediction`, `DealerNFT`) that map to the new names from `@sudobility/heavymath_types`.~~
- ~~However, the internal code still uses the old names everywhere: `IndexerClient.ts` imports `Market`, `Prediction`, `DealerNFT`, etc., and `indexer-service.ts` does the same.~~
- ~~This means the library's own code uses deprecated types, which is inconsistent with the deprecation strategy.~~
- ~~The internal code should be migrated to use `MarketData`, `PredictionData`, `DealerNftData`, etc., leaving the deprecated aliases only for backward compatibility of external consumers.~~
- **Status**: Completed. Migrated all internal code (`IndexerClient.ts`, `indexer-service.ts`, all 7 hook files) to use the new type names (`MarketData`, `PredictionData`, `DealerNftData`, `DealerPermissionData`, `FeeWithdrawalData`, `OracleRequestData`, `MarketStateHistoryData`, `MarketStatsData`, `HealthData`). Deprecated aliases remain in `types.ts` for backward compatibility only.

## Priority 2 - Medium Impact

### 3. Add Request Cancellation and Abort Controller Support
- None of the `IndexerClient` methods support request cancellation via `AbortController`.
- React Query passes a `signal` to the `queryFn`, but the hooks do not forward this signal to the network client.
- This means navigating away from a page with pending requests will leave orphaned HTTP requests that complete after unmount, potentially causing state updates on unmounted components.
- Adding `signal?: AbortSignal` to each `IndexerClient` method and forwarding it through the `NetworkClient` would enable proper cleanup.
- **Status**: Skipped. Requires changes to the `NetworkClient` interface in `@sudobility/types` to accept `AbortSignal`.

### 4. Add Retry and Timeout Configuration to IndexerClient ✅ (partial)
- ~~The `handleApiError` function could also include the request URL and method in the error message for easier debugging.~~
- The `IndexerClient` has no configurable timeout, retry logic, or rate limiting.
- All hooks set `retry: false` in React Query options, meaning a single transient network failure results in an immediate error state.
- Adding configurable `timeout` (with a sensible default like 10 seconds) and optional `retry` configuration at the client level would improve resilience.
- **Status**: Partially completed. Improved `handleApiError` to accept an optional URL parameter for better debugging. Full timeout/retry configuration requires deeper `NetworkClient` integration.

### 5. Improve SSE Hook Stability and Memory Management
- The `useSSE` hook accumulates all events in a `useState` array (`setEvents(prev => [...prev, dataMessage])`), which will grow unboundedly for long-running connections.
- There is no maximum event buffer size or automatic pruning of old events.
- The `useEffect` dependency on `JSON.stringify(filters)` creates a new string on every render, which can cause unnecessary reconnections if the filters object is recreated (even with the same values) by the parent component.
- The reconnection logic in `onerror` creates a new `setTimeout` that could stack if multiple errors fire rapidly.
- **Status**: Skipped. Requires significant hook refactoring (useMemo for filters, event buffer limits, reconnect debouncing).

## Priority 3 - Nice to Have

### 6. Create the Missing vitest.integration.config.ts ✅
- ~~`package.json` defines `test:integration` and `test:integration:watch` scripts that reference `vitest.integration.config.ts`, but this file does not exist.~~
- ~~This blocks any integration testing workflow and is a known pitfall documented in CLAUDE.md.~~
- ~~Creating this config file (even if initially empty of test files) would unblock the integration testing story and prevent script-level errors.~~
- **Status**: Completed. Created `vitest.integration.config.ts` with `src/__integration__/` test path pattern and 30s timeout.

### 7. Add Cache Invalidation Hooks to IndexerService ✅
- ~~The `IndexerService` cache is an in-memory `Map` with TTL-based expiration, but there is no way to selectively invalidate specific cache keys.~~
- ~~`clearCache()` clears everything, which is a blunt instrument when only one endpoint's data has become stale.~~
- ~~Adding `invalidateCache(prefix: string)` to clear cache entries matching a pattern (e.g., all market-related caches) would enable more targeted cache management, especially useful when SSE events indicate specific data has changed.~~
- **Status**: Completed. Added `invalidateCache(prefix: string): number` method to `IndexerService` that deletes all cache entries with keys starting with the given prefix and returns the count of invalidated entries. Includes JSDoc with usage examples.

### 8. Add Type-Safe Event Data to SSE Messages
- `SSEDataUpdateMessage.data` is typed as `unknown`, requiring consumers to cast to the appropriate event data type.
- Specific event data interfaces exist (`MarketCreatedEventData`, `MarketResolvedEventData`, etc.) but are not connected to `SSEEventType` via a discriminated union or generic.
- A mapped type like `SSEEventDataMap` that associates each `SSEEventType` with its corresponding data interface would enable type-safe event handling: `if (event.eventType === 'MarketCreated') { event.data.marketId /* typed as string */ }`.
- **Status**: Skipped. Requires complex generic discriminated union redesign that would be a breaking change to the `SSEDataUpdateMessage` type.
