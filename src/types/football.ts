/**
 * @fileoverview Football (soccer) type definitions
 * @description Types for football API responses, matching api-sports.io response format.
 */

import type { Optional } from '@sudobility/types';

export type {
  FootballCountry,
  FootballLeague,
  FootballSeasonCoverage,
  FootballFixturesCoverage,
  FootballSeason,
  FootballLeagueResponse,
  FootballLeaguesParams,
  FootballSeasonsParams,
} from '@sudobility/heavymath_types';

export interface FootballTeam {
  id: number;
  name: string;
  code: Optional<string>;
  country: string;
  founded: Optional<number>;
  national: boolean;
  logo: string;
}

export interface FootballVenue {
  id: Optional<number>;
  name: string;
  address: Optional<string>;
  city: string;
  capacity: Optional<number>;
  surface: Optional<string>;
  image: Optional<string>;
}

export interface FootballTeamResponse {
  team: FootballTeam;
  venue: FootballVenue;
}

export interface FootballTeamsParams {
  id?: Optional<number>;
  name?: Optional<string>;
  league?: Optional<number>;
  season?: Optional<number>;
  country?: Optional<string>;
  code?: Optional<string>;
  venue?: Optional<number>;
  search?: Optional<string>;
}

export interface FootballFixture {
  id: number;
  referee: Optional<string>;
  timezone: string;
  date: string;
  timestamp: number;
  periods: FootballFixturePeriods;
  venue: FootballFixtureVenue;
  status: FootballFixtureStatus;
}

export interface FootballFixturePeriods {
  first: Optional<number>;
  second: Optional<number>;
}

export interface FootballFixtureVenue {
  id: Optional<number>;
  name: Optional<string>;
  city: Optional<string>;
}

export interface FootballFixtureStatus {
  long: string;
  short: FootballFixtureStatusCode;
  elapsed: Optional<number>;
}

export type FootballFixtureStatusCode =
  | 'TBD'
  | 'NS'
  | '1H'
  | 'HT'
  | '2H'
  | 'ET'
  | 'P'
  | 'FT'
  | 'AET'
  | 'PEN'
  | 'BT'
  | 'SUSP'
  | 'INT'
  | 'PST'
  | 'CANC'
  | 'ABD'
  | 'AWD'
  | 'WO'
  | 'LIVE';

export interface FootballFixtureLeague {
  id: number;
  name: string;
  country: string;
  logo: string;
  flag: Optional<string>;
  season: number;
  round: string;
}

export interface FootballFixtureTeams {
  home: FootballFixtureTeam;
  away: FootballFixtureTeam;
}

export interface FootballFixtureTeam {
  id: number;
  name: string;
  logo: string;
  winner: Optional<boolean>;
}

export interface FootballFixtureGoals {
  home: Optional<number>;
  away: Optional<number>;
}

export interface FootballFixtureScore {
  halftime: FootballFixtureGoals;
  fulltime: FootballFixtureGoals;
  extratime: FootballFixtureGoals;
  penalty: FootballFixtureGoals;
}

export interface FootballFixtureResponse {
  fixture: FootballFixture;
  league: FootballFixtureLeague;
  teams: FootballFixtureTeams;
  goals: FootballFixtureGoals;
  score: FootballFixtureScore;
}

export interface FootballFixturesParams {
  id?: Optional<number>;
  live?: Optional<'all' | string>;
  date?: Optional<string>;
  league?: Optional<number>;
  season?: Optional<number>;
  team?: Optional<number>;
  last?: Optional<number>;
  next?: Optional<number>;
  from?: Optional<string>;
  to?: Optional<string>;
  round?: Optional<string>;
  status?: Optional<string>;
  venue?: Optional<number>;
  timezone?: Optional<string>;
}
