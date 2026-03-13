/**
 * Rugby proxy hooks - api-sports.io v1
 */

import type { UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import type { IndexerClient } from '../../network/IndexerClient';
import type { SportsApiResponse, SportsQueryParams } from '../../types/sports';
import { useSportsProxy } from './useSportsProxy';

type Opts = Omit<UseQueryOptions<SportsApiResponse<any>>, 'queryKey' | 'queryFn'>;

type Result = UseQueryResult<SportsApiResponse<any>>;

const S = 'rugby';

export function useRugbyTimezone(client: IndexerClient, opts?: Opts): Result {
  return useSportsProxy(client, S, '/timezone', undefined, opts);
}

export function useRugbyCountries(
  client: IndexerClient,
  params?: SportsQueryParams,
  opts?: Opts
): Result {
  return useSportsProxy(client, S, '/countries', params, opts);
}

export function useRugbySeasons(
  client: IndexerClient,
  params?: SportsQueryParams,
  opts?: Opts
): Result {
  return useSportsProxy(client, S, '/seasons', params, opts);
}

export function useRugbyLeagues(
  client: IndexerClient,
  params?: SportsQueryParams,
  opts?: Opts
): Result {
  return useSportsProxy(client, S, '/leagues', params, opts);
}

export function useRugbyTeams(
  client: IndexerClient,
  params?: SportsQueryParams,
  opts?: Opts
): Result {
  return useSportsProxy(client, S, '/teams', params, opts);
}

export function useRugbyTeamStatistics(
  client: IndexerClient,
  params?: SportsQueryParams,
  opts?: Opts
): Result {
  return useSportsProxy(client, S, '/statistics', params, opts);
}

export function useRugbyGames(
  client: IndexerClient,
  params?: SportsQueryParams,
  opts?: Opts
): Result {
  return useSportsProxy(client, S, '/games', params, opts);
}

export function useRugbyGamesH2H(
  client: IndexerClient,
  params?: SportsQueryParams,
  opts?: Opts
): Result {
  return useSportsProxy(client, S, '/games/h2h', params, opts);
}

export function useRugbyStandings(
  client: IndexerClient,
  params?: SportsQueryParams,
  opts?: Opts
): Result {
  return useSportsProxy(client, S, '/standings', params, opts);
}
