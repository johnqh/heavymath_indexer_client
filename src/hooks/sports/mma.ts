/**
 * MMA proxy hooks - api-sports.io v1
 */

import type { UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import type { IndexerClient } from '../../network/IndexerClient';
import type { SportsApiResponse, SportsQueryParams } from '../../types/sports';
import { useSportsProxy } from './useSportsProxy';

type Opts = Omit<UseQueryOptions<SportsApiResponse<any>>, 'queryKey' | 'queryFn'>;

type Result = UseQueryResult<SportsApiResponse<any>>;

const S = 'mma';

export function useMmaTimezone(client: IndexerClient, opts?: Opts): Result {
  return useSportsProxy(client, S, '/timezone', undefined, opts);
}

export function useMmaCountries(
  client: IndexerClient,
  params?: SportsQueryParams,
  opts?: Opts
): Result {
  return useSportsProxy(client, S, '/countries', params, opts);
}

export function useMmaSeasons(
  client: IndexerClient,
  params?: SportsQueryParams,
  opts?: Opts
): Result {
  return useSportsProxy(client, S, '/seasons', params, opts);
}

export function useMmaCategories(
  client: IndexerClient,
  params?: SportsQueryParams,
  opts?: Opts
): Result {
  return useSportsProxy(client, S, '/categories', params, opts);
}

export function useMmaFighters(
  client: IndexerClient,
  params?: SportsQueryParams,
  opts?: Opts
): Result {
  return useSportsProxy(client, S, '/fighters', params, opts);
}

export function useMmaFights(
  client: IndexerClient,
  params?: SportsQueryParams,
  opts?: Opts
): Result {
  return useSportsProxy(client, S, '/fights', params, opts);
}
