/**
 * Baseball proxy hooks - api-sports.io v1
 */

import type { UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import type { IndexerClient } from '../../network/IndexerClient';
import type { SportsApiResponse, SportsQueryParams } from '../../types/sports';
import { useSportsProxy } from './useSportsProxy';

type Opts<T> = Omit<UseQueryOptions<SportsApiResponse<T>>, 'queryKey' | 'queryFn'>;
type Result<T> = UseQueryResult<SportsApiResponse<T>>;

const S = 'baseball';

export function useBaseballTimezone(client: IndexerClient, opts?: Opts<unknown>): Result<unknown> {
  return useSportsProxy(client, S, '/timezone', undefined, opts);
}

export function useBaseballCountries(
  client: IndexerClient,
  params?: SportsQueryParams,
  opts?: Opts<unknown>
): Result<unknown> {
  return useSportsProxy(client, S, '/countries', params, opts);
}

export function useBaseballSeasons(
  client: IndexerClient,
  params?: SportsQueryParams,
  opts?: Opts<unknown>
): Result<unknown> {
  return useSportsProxy(client, S, '/seasons', params, opts);
}

export function useBaseballLeagues(
  client: IndexerClient,
  params?: SportsQueryParams,
  opts?: Opts<unknown>
): Result<unknown> {
  return useSportsProxy(client, S, '/leagues', params, opts);
}

export function useBaseballTeams(
  client: IndexerClient,
  params?: SportsQueryParams,
  opts?: Opts<unknown>
): Result<unknown> {
  return useSportsProxy(client, S, '/teams', params, opts);
}

export function useBaseballTeamStatistics(
  client: IndexerClient,
  params?: SportsQueryParams,
  opts?: Opts<unknown>
): Result<unknown> {
  return useSportsProxy(client, S, '/statistics', params, opts);
}

export function useBaseballGames(
  client: IndexerClient,
  params?: SportsQueryParams,
  opts?: Opts<unknown>
): Result<unknown> {
  return useSportsProxy(client, S, '/games', params, opts);
}

export function useBaseballGamesH2H(
  client: IndexerClient,
  params?: SportsQueryParams,
  opts?: Opts<unknown>
): Result<unknown> {
  return useSportsProxy(client, S, '/games/h2h', params, opts);
}

export function useBaseballStandings(
  client: IndexerClient,
  params?: SportsQueryParams,
  opts?: Opts<unknown>
): Result<unknown> {
  return useSportsProxy(client, S, '/standings', params, opts);
}
