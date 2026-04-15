/**
 * @fileoverview Sports API Proxy Types
 * @description Re-exports shared sports proxy and competition metadata types.
 */

export type {
  SportsApiResponse,
  SportName,
  SportsQueryParams,
  SearchTeamResult,
  SportsSearchResponse,
} from '@sudobility/heavymath_types';

// Sport-specific types
export * from './baseball';
export * from './basketball';
export * from './football';
export * from './hockey';
export * from './nfl';
export * from './rugby';
export * from './handball';
export * from './volleyball';
export * from './mma';
export * from './f1';
