/**
 * @fileoverview Baseball type definitions
 * @description Types for baseball API responses, matching api-sports.io response format.
 */
import type { BaseballCountry, BaseballLeague } from '@sudobility/heavymath_types';

export type {
  BaseballCountry,
  BaseballLeague,
  BaseballSeason,
  BaseballLeagueResponse,
  BaseballLeaguesParams,
} from '@sudobility/heavymath_types';

export interface BaseballTeam {
  id: number;
  name: string;
  logo: string | null;
  national: boolean;
}

export interface BaseballTeamResponse {
  id: number;
  name: string;
  logo: string | null;
  national: boolean;
  country: BaseballCountry;
}

export interface BaseballTeamsParams {
  id?: number;
  name?: string;
  country?: string;
  country_id?: number;
  league?: number;
  season?: number;
  search?: string;
}

export interface BaseballGameStatus {
  long: string;
  short: string;
}

export interface BaseballScores {
  home: {
    hits: number | null;
    errors: number | null;
    innings: Record<string, number | null>;
    total: number | null;
  };
  away: {
    hits: number | null;
    errors: number | null;
    innings: Record<string, number | null>;
    total: number | null;
  };
}

export interface BaseballGame {
  id: number;
  date: string;
  time: string;
  timestamp: number;
  timezone: string;
  week: string | null;
  status: BaseballGameStatus;
  country: BaseballCountry;
  league: BaseballLeague;
  teams: {
    home: BaseballTeam;
    away: BaseballTeam;
  };
  scores: BaseballScores;
}

export interface BaseballGamesParams {
  id?: number;
  date?: string;
  league?: number;
  season?: number;
  team?: number;
  timezone?: string;
  h2h?: string;
}
