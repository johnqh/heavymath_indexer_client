/**
 * @fileoverview Sports API Proxy Types
 * @description Generic response type matching api-sports.io format (passthrough).
 */

/**
 * Standard api-sports.io response format.
 * The proxy returns this exact shape for all sport endpoints.
 */
export interface SportsApiResponse<T> {
  get: string;
  parameters: Record<string, string>;
  errors: string[] | Record<string, string>;
  results: number;
  paging?: { current: number; total: number };
  response: T[];
}

/**
 * Valid sport identifiers for the proxy.
 */
export type SportName =
  | 'football'
  | 'basketball'
  | 'hockey'
  | 'nfl'
  | 'baseball'
  | 'rugby'
  | 'formula1'
  | 'mma'
  | 'handball'
  | 'volleyball';

/**
 * Generic query params for sport endpoints.
 */
export type SportsQueryParams = Record<string, string | number | boolean | undefined>;
