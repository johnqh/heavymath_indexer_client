/**
 * Handball proxy hooks - api-sports.io v1
 */

import type { UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import type { IndexerClient } from '../../network/IndexerClient';
import type { SportsApiResponse, SportsQueryParams } from '../../types/sports';
import type { HandballLeagueResponse } from '../../types/handball';
import { useSportsProxy } from './useSportsProxy';

type Opts<T = any> = Omit<UseQueryOptions<SportsApiResponse<T>>, 'queryKey' | 'queryFn'>;

type Result<T = any> = UseQueryResult<SportsApiResponse<T>>;

const S = 'handball';

export function useHandballTimezones(client: IndexerClient, opts?: Opts): Result {
  return useSportsProxy(client, S, '/timezone', undefined, opts);
}

export function useHandballCountries(
  client: IndexerClient,
  params?: SportsQueryParams,
  opts?: Opts
): Result {
  return useSportsProxy(client, S, '/countries', params, opts);
}

export function useHandballSeasons(
  client: IndexerClient,
  params?: SportsQueryParams,
  opts?: Opts
): Result {
  return useSportsProxy(client, S, '/seasons', params, opts);
}

export function useHandballLeagues(
  client: IndexerClient,
  params?: SportsQueryParams,
  opts?: Opts<HandballLeagueResponse>
): Result<HandballLeagueResponse> {
  return useSportsProxy(client, S, '/leagues', params, opts);
}

export function useHandballTeams(
  client: IndexerClient,
  params?: SportsQueryParams,
  opts?: Opts
): Result {
  return useSportsProxy(client, S, '/teams', params, opts);
}

export function useHandballStandings(
  client: IndexerClient,
  params?: SportsQueryParams,
  opts?: Opts
): Result {
  return useSportsProxy(client, S, '/standings', params, opts);
}

export function useHandballGames(
  client: IndexerClient,
  params?: SportsQueryParams,
  opts?: Opts
): Result {
  return useSportsProxy(client, S, '/games', params, opts);
}

export function useHandballH2H(
  client: IndexerClient,
  params?: SportsQueryParams,
  opts?: Opts
): Result {
  return useSportsProxy(client, S, '/games/h2h', params, opts);
}

export function useHandballOdds(
  client: IndexerClient,
  params?: SportsQueryParams,
  opts?: Opts
): Result {
  return useSportsProxy(client, S, '/odds', params, opts);
}
