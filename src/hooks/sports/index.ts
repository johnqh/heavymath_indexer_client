/**
 * Sports API proxy hooks
 * All hooks proxy requests through the heavymath_indexer with server-side caching.
 */

// Generic proxy hook
export { useSportsProxy } from './useSportsProxy';

// Per-sport hooks
export * from './football';
export * from './basketball';
export * from './hockey';
export * from './nfl';
export * from './baseball';
export * from './rugby';
export * from './f1';
export * from './mma';
export * from './handball';
export * from './volleyball';
