/**
 * @fileoverview Basketball type definitions
 * @description Types for basketball API responses, matching api-sports.io response format.
 */

import type { Optional } from '@sudobility/types';

export interface BasketballCountry {
  id: number;
  name: string;
  code: Optional<string>;
  flag: Optional<string>;
}

export interface BasketballLeague {
  id: number;
  name: string;
  type: string;
  logo: Optional<string>;
}

export interface BasketballSeason {
  season: string;
  start: string;
  end: string;
}

export interface BasketballLeagueResponse {
  id: number;
  name: string;
  type: string;
  logo: Optional<string>;
  country: BasketballCountry;
  seasons: BasketballSeason[];
}

export interface BasketballLeaguesParams {
  id?: Optional<number>;
  name?: Optional<string>;
  country?: Optional<string>;
  season?: Optional<string>;
  type?: Optional<string>;
  current?: Optional<boolean>;
  search?: Optional<string>;
}

export interface BasketballSeasonsParams {
  league?: Optional<number>;
}

export interface BasketballTeam {
  id: number;
  name: string;
  logo: Optional<string>;
  national: boolean;
}

export interface BasketballTeamResponse {
  id: number;
  name: string;
  logo: Optional<string>;
  national: boolean;
  country: {
    id: number;
    name: string;
    code: Optional<string>;
    flag: Optional<string>;
  };
}

export interface BasketballTeamsParams {
  id?: Optional<number>;
  name?: Optional<string>;
  country?: Optional<number>;
  league?: Optional<number>;
  season?: Optional<string>;
  search?: Optional<string>;
}

export interface BasketballGameStatus {
  long: string;
  short: string;
  timer: Optional<string>;
}

export interface BasketballScores {
  home: {
    quarter_1: Optional<number>;
    quarter_2: Optional<number>;
    quarter_3: Optional<number>;
    quarter_4: Optional<number>;
    over_time: Optional<number>;
    total: Optional<number>;
  };
  away: {
    quarter_1: Optional<number>;
    quarter_2: Optional<number>;
    quarter_3: Optional<number>;
    quarter_4: Optional<number>;
    over_time: Optional<number>;
    total: Optional<number>;
  };
}

export interface BasketballGame {
  id: number;
  date: string;
  time: string;
  timestamp: number;
  timezone: string;
  stage: Optional<string>;
  week: Optional<string>;
  status: BasketballGameStatus;
  league: {
    id: number;
    name: string;
    type: string;
    season: string;
    logo: Optional<string>;
  };
  country: {
    id: number;
    name: string;
    code: Optional<string>;
    flag: Optional<string>;
  };
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
  scores: BasketballScores;
}

export interface BasketballGamesParams {
  id?: Optional<number>;
  date?: Optional<string>;
  league?: Optional<number>;
  season?: Optional<string>;
  team?: Optional<number>;
  timezone?: Optional<string>;
  live?: Optional<string>;
  from?: Optional<string>;
  to?: Optional<string>;
}
