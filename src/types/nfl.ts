/**
 * @fileoverview NFL type definitions
 * @description Types for NFL API responses, matching api-sports.io response format.
 */

import type { Optional } from '@sudobility/types';

export interface NflCountry {
  id: number;
  name: string;
  code: Optional<string>;
  flag: Optional<string>;
}

export interface NflLeague {
  id: number;
  name: string;
  type: string;
  logo: Optional<string>;
}

export interface NflSeason {
  season: number;
  start: string;
  end: string;
  current: boolean;
}

export interface NflLeagueResponse {
  league: NflLeague;
  country: NflCountry;
  seasons: NflSeason[];
}

export interface NflLeaguesParams {
  id?: Optional<number>;
  name?: Optional<string>;
  country?: Optional<string>;
  code?: Optional<string>;
  season?: Optional<number>;
  type?: Optional<string>;
  current?: Optional<boolean>;
  search?: Optional<string>;
}

export interface NflSeasonsParams {
  league?: Optional<number>;
}

export interface NflTeam {
  id: number;
  name: string;
  logo: Optional<string>;
  city: Optional<string>;
  code: Optional<string>;
  coach: Optional<string>;
  owner: Optional<string>;
  stadium: Optional<string>;
  capacity: Optional<number>;
  established: Optional<number>;
  national: boolean;
}

export interface NflTeamResponse {
  id: number;
  name: string;
  logo: Optional<string>;
  city: Optional<string>;
  code: Optional<string>;
  coach: Optional<string>;
  owner: Optional<string>;
  stadium: Optional<string>;
  capacity: Optional<number>;
  established: Optional<number>;
  national: boolean;
  country: NflCountry;
}

export interface NflTeamsParams {
  id?: Optional<number>;
  name?: Optional<string>;
  country?: Optional<string>;
  league?: Optional<number>;
  season?: Optional<number>;
  search?: Optional<string>;
}

export interface NflGameStatus {
  long: string;
  short: string;
  timer: Optional<string>;
}

export interface NflScores {
  quarter_1: Optional<number>;
  quarter_2: Optional<number>;
  quarter_3: Optional<number>;
  quarter_4: Optional<number>;
  overtime: Optional<number>;
  total: Optional<number>;
}

export interface NflGame {
  id: number;
  date: string;
  time: string;
  timestamp: number;
  timezone: string;
  stage: Optional<string>;
  week: Optional<string>;
  status: NflGameStatus;
  league: {
    id: number;
    name: string;
    type: string;
    season: number;
    logo: Optional<string>;
  };
  country: NflCountry;
  teams: {
    home: {
      id: number;
      name: string;
      logo: Optional<string>;
    };
    away: {
      id: number;
      name: string;
      logo: Optional<string>;
    };
  };
  scores: {
    home: NflScores;
    away: NflScores;
  };
}

export interface NflGamesParams {
  id?: Optional<number>;
  date?: Optional<string>;
  league?: Optional<number>;
  season?: Optional<number>;
  team?: Optional<number>;
  stage?: Optional<string>;
  week?: Optional<string>;
  timezone?: Optional<string>;
}
