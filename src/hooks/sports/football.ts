/**
 * Football (Soccer) proxy hooks - api-sports.io v3
 */

import type { UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import type { IndexerClient } from '../../network/IndexerClient';
import type { SportsApiResponse, SportsQueryParams } from '../../types/sports';
import { useSportsProxy } from './useSportsProxy';

type Opts<T> = Omit<UseQueryOptions<SportsApiResponse<T>>, 'queryKey' | 'queryFn'>;
type Result<T> = UseQueryResult<SportsApiResponse<T>>;

const S = 'football';

export function useFootballTimezone(client: IndexerClient, opts?: Opts<unknown>): Result<unknown> {
  return useSportsProxy(client, S, '/timezone', undefined, opts);
}

export function useFootballCountries(
  client: IndexerClient,
  params?: SportsQueryParams,
  opts?: Opts<unknown>
): Result<unknown> {
  return useSportsProxy(client, S, '/countries', params, opts);
}

export function useFootballSeasons(client: IndexerClient, opts?: Opts<unknown>): Result<unknown> {
  return useSportsProxy(client, S, '/seasons', undefined, opts);
}

export function useFootballLeagues(
  client: IndexerClient,
  params?: SportsQueryParams,
  opts?: Opts<unknown>
): Result<unknown> {
  return useSportsProxy(client, S, '/leagues', params, opts);
}

export function useFootballTeams(
  client: IndexerClient,
  params?: SportsQueryParams,
  opts?: Opts<unknown>
): Result<unknown> {
  return useSportsProxy(client, S, '/teams', params, opts);
}

export function useFootballTeamStatistics(
  client: IndexerClient,
  params?: SportsQueryParams,
  opts?: Opts<unknown>
): Result<unknown> {
  return useSportsProxy(client, S, '/teams/statistics', params, opts);
}

export function useFootballVenues(
  client: IndexerClient,
  params?: SportsQueryParams,
  opts?: Opts<unknown>
): Result<unknown> {
  return useSportsProxy(client, S, '/venues', params, opts);
}

export function useFootballStandings(
  client: IndexerClient,
  params?: SportsQueryParams,
  opts?: Opts<unknown>
): Result<unknown> {
  return useSportsProxy(client, S, '/standings', params, opts);
}

export function useFootballFixtures(
  client: IndexerClient,
  params?: SportsQueryParams,
  opts?: Opts<unknown>
): Result<unknown> {
  return useSportsProxy(client, S, '/fixtures', params, opts);
}

export function useFootballFixturesHeadToHead(
  client: IndexerClient,
  params?: SportsQueryParams,
  opts?: Opts<unknown>
): Result<unknown> {
  return useSportsProxy(client, S, '/fixtures/headtohead', params, opts);
}

export function useFootballFixtureStatistics(
  client: IndexerClient,
  params?: SportsQueryParams,
  opts?: Opts<unknown>
): Result<unknown> {
  return useSportsProxy(client, S, '/fixtures/statistics', params, opts);
}

export function useFootballFixtureEvents(
  client: IndexerClient,
  params?: SportsQueryParams,
  opts?: Opts<unknown>
): Result<unknown> {
  return useSportsProxy(client, S, '/fixtures/events', params, opts);
}

export function useFootballFixtureLineups(
  client: IndexerClient,
  params?: SportsQueryParams,
  opts?: Opts<unknown>
): Result<unknown> {
  return useSportsProxy(client, S, '/fixtures/lineups', params, opts);
}

export function useFootballFixturePlayers(
  client: IndexerClient,
  params?: SportsQueryParams,
  opts?: Opts<unknown>
): Result<unknown> {
  return useSportsProxy(client, S, '/fixtures/players', params, opts);
}

export function useFootballPlayers(
  client: IndexerClient,
  params?: SportsQueryParams,
  opts?: Opts<unknown>
): Result<unknown> {
  return useSportsProxy(client, S, '/players', params, opts);
}

export function useFootballPlayersSeasons(
  client: IndexerClient,
  params?: SportsQueryParams,
  opts?: Opts<unknown>
): Result<unknown> {
  return useSportsProxy(client, S, '/players/seasons', params, opts);
}

export function useFootballSquads(
  client: IndexerClient,
  params?: SportsQueryParams,
  opts?: Opts<unknown>
): Result<unknown> {
  return useSportsProxy(client, S, '/players/squads', params, opts);
}

export function useFootballTopScorers(
  client: IndexerClient,
  params?: SportsQueryParams,
  opts?: Opts<unknown>
): Result<unknown> {
  return useSportsProxy(client, S, '/players/topscorers', params, opts);
}

export function useFootballTopAssists(
  client: IndexerClient,
  params?: SportsQueryParams,
  opts?: Opts<unknown>
): Result<unknown> {
  return useSportsProxy(client, S, '/players/topassists', params, opts);
}

export function useFootballTopCards(
  client: IndexerClient,
  params?: SportsQueryParams,
  opts?: Opts<unknown>
): Result<unknown> {
  return useSportsProxy(client, S, '/players/topcards', params, opts);
}

export function useFootballTransfers(
  client: IndexerClient,
  params?: SportsQueryParams,
  opts?: Opts<unknown>
): Result<unknown> {
  return useSportsProxy(client, S, '/transfers', params, opts);
}

export function useFootballTrophies(
  client: IndexerClient,
  params?: SportsQueryParams,
  opts?: Opts<unknown>
): Result<unknown> {
  return useSportsProxy(client, S, '/trophies', params, opts);
}

export function useFootballSidelined(
  client: IndexerClient,
  params?: SportsQueryParams,
  opts?: Opts<unknown>
): Result<unknown> {
  return useSportsProxy(client, S, '/sidelined', params, opts);
}

export function useFootballCoaches(
  client: IndexerClient,
  params?: SportsQueryParams,
  opts?: Opts<unknown>
): Result<unknown> {
  return useSportsProxy(client, S, '/coachs', params, opts);
}

export function useFootballInjuries(
  client: IndexerClient,
  params?: SportsQueryParams,
  opts?: Opts<unknown>
): Result<unknown> {
  return useSportsProxy(client, S, '/injuries', params, opts);
}
