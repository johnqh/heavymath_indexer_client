/**
 * @fileoverview Handball type definitions
 * @description Types for handball API responses, matching api-sports.io response format.
 */
import type { HandballLeague, HandballLeagueCountry } from '@sudobility/heavymath_types';

export type {
  HandballLeague,
  HandballLeagueCountry,
  HandballLeagueSeason,
  HandballLeagueResponse,
  HandballLeaguesParams,
} from '@sudobility/heavymath_types';

export interface HandballTeam {
  id: number;
  name: string;
  logo: string | null;
  national: boolean;
}

export interface HandballTeamCountry {
  id: number;
  name: string;
  code: string | null;
  flag: string | null;
}

export interface HandballTeamResponse {
  id: number;
  name: string;
  logo: string | null;
  national: boolean;
  country: HandballTeamCountry;
}

export interface HandballTeamsParams {
  id?: number;
  name?: string;
  country_id?: number;
  country?: string;
  league?: number;
  season?: number;
  search?: string;
}

export interface HandballGameStatus {
  long: string;
  short: string;
}

export interface HandballPeriodScores {
  first: number | null;
  second: number | null;
  overtime: number | null;
}

export interface HandballGameTeam {
  id: number;
  name: string;
  logo: string | null;
}

export interface HandballGameScores {
  home: HandballPeriodScores;
  away: HandballPeriodScores;
}

export interface HandballGame {
  id: number;
  date: string;
  time: string;
  timestamp: number;
  timezone: string;
  week: string | null;
  status: HandballGameStatus;
  league: HandballLeague;
  country: HandballLeagueCountry;
  teams: {
    home: HandballGameTeam;
    away: HandballGameTeam;
  };
  scores: HandballGameScores;
}

export interface HandballGamesParams {
  id?: number;
  date?: string;
  league?: number;
  season?: number;
  team?: number;
  timezone?: string;
  status?: string;
}
