/**
 * Formula 1 proxy hooks - api-sports.io v1
 */

import type { UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import type { IndexerClient } from '../../network/IndexerClient';
import type { SportsApiResponse, SportsQueryParams } from '../../types/sports';
import { useSportsProxy } from './useSportsProxy';

type Opts = Omit<UseQueryOptions<SportsApiResponse<any>>, 'queryKey' | 'queryFn'>;

type Result = UseQueryResult<SportsApiResponse<any>>;

const S = 'formula1';

export function useF1Timezone(client: IndexerClient, opts?: Opts): Result {
  return useSportsProxy(client, S, '/timezone', undefined, opts);
}

export function useF1Seasons(
  client: IndexerClient,
  params?: SportsQueryParams,
  opts?: Opts
): Result {
  return useSportsProxy(client, S, '/seasons', params, opts);
}

export function useF1Circuits(
  client: IndexerClient,
  params?: SportsQueryParams,
  opts?: Opts
): Result {
  return useSportsProxy(client, S, '/circuits', params, opts);
}

export function useF1Competitions(
  client: IndexerClient,
  params?: SportsQueryParams,
  opts?: Opts
): Result {
  return useSportsProxy(client, S, '/competitions', params, opts);
}

export function useF1Teams(client: IndexerClient, params?: SportsQueryParams, opts?: Opts): Result {
  return useSportsProxy(client, S, '/teams', params, opts);
}

export function useF1Drivers(
  client: IndexerClient,
  params?: SportsQueryParams,
  opts?: Opts
): Result {
  return useSportsProxy(client, S, '/drivers', params, opts);
}

export function useF1Races(client: IndexerClient, params?: SportsQueryParams, opts?: Opts): Result {
  return useSportsProxy(client, S, '/races', params, opts);
}

export function useF1DriverRankings(
  client: IndexerClient,
  params?: SportsQueryParams,
  opts?: Opts
): Result {
  return useSportsProxy(client, S, '/rankings/drivers', params, opts);
}

export function useF1TeamRankings(
  client: IndexerClient,
  params?: SportsQueryParams,
  opts?: Opts
): Result {
  return useSportsProxy(client, S, '/rankings/teams', params, opts);
}

export function useF1PitStops(
  client: IndexerClient,
  params?: SportsQueryParams,
  opts?: Opts
): Result {
  return useSportsProxy(client, S, '/pitstops', params, opts);
}
