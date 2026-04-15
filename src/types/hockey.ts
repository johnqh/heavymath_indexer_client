/**
 * @fileoverview Hockey type definitions
 * @description Types for hockey API responses, matching api-sports.io response format.
 */

import type { Optional } from '@sudobility/types';
import type { HockeyCountry } from '@sudobility/heavymath_types';

export type {
  HockeyCountry,
  HockeyLeague,
  HockeySeason,
  HockeyLeagueResponse,
  HockeyLeaguesParams,
  HockeySeasonsParams,
} from '@sudobility/heavymath_types';

export interface HockeyTeam {
  id: number;
  name: string;
  logo: Optional<string>;
  national: boolean;
}

export interface HockeyTeamResponse {
  id: number;
  name: string;
  logo: Optional<string>;
  national: boolean;
  country: HockeyCountry;
}

export interface HockeyTeamsParams {
  id?: Optional<number>;
  name?: Optional<string>;
  country?: Optional<string>;
  league?: Optional<number>;
  season?: Optional<number>;
  search?: Optional<string>;
}

export interface HockeyGameStatus {
  long: string;
  short: string;
  timer: Optional<string>;
}

export interface HockeyScores {
  first: Optional<number>;
  second: Optional<number>;
  third: Optional<number>;
  overtime: Optional<number>;
  penalties: Optional<number>;
  total: Optional<number>;
}

export interface HockeyGameEvent {
  type: string;
  time: string;
  team: {
    id: number;
    name: string;
    logo: Optional<string>;
  };
  player: Optional<string>;
  comment: Optional<string>;
}

export interface HockeyGame {
  id: number;
  date: string;
  time: string;
  timestamp: number;
  timezone: string;
  week: Optional<string>;
  status: HockeyGameStatus;
  league: {
    id: number;
    name: string;
    type: string;
    season: number;
    logo: Optional<string>;
  };
  country: HockeyCountry;
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
    home: HockeyScores;
    away: HockeyScores;
  };
  periods: {
    first: Optional<string>;
    second: Optional<string>;
    third: Optional<string>;
    overtime: Optional<string>;
    penalties: Optional<string>;
  };
  events: HockeyGameEvent[];
}

export interface HockeyGamesParams {
  id?: Optional<number>;
  date?: Optional<string>;
  league?: Optional<number>;
  season?: Optional<number>;
  team?: Optional<number>;
  timezone?: Optional<string>;
}
