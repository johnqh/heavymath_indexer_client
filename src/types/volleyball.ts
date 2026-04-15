/**
 * @fileoverview Volleyball type definitions
 * @description Types for volleyball API responses, matching api-sports.io response format.
 */
import type { VolleyballLeague, VolleyballLeagueCountry } from '@sudobility/heavymath_types';

export type {
  VolleyballLeague,
  VolleyballLeagueCountry,
  VolleyballLeagueSeason,
  VolleyballLeagueResponse,
  VolleyballLeaguesParams,
} from '@sudobility/heavymath_types';

export interface VolleyballTeam {
  id: number;
  name: string;
  logo: string | null;
  national: boolean;
}

export interface VolleyballTeamCountry {
  id: number;
  name: string;
  code: string | null;
  flag: string | null;
}

export interface VolleyballTeamResponse {
  id: number;
  name: string;
  logo: string | null;
  national: boolean;
  country: VolleyballTeamCountry;
}

export interface VolleyballTeamsParams {
  id?: number;
  name?: string;
  country_id?: number;
  country?: string;
  league?: number;
  season?: number;
  search?: string;
}

export interface VolleyballGameStatus {
  long: string;
  short: string;
}

export interface VolleyballSetScores {
  1: number | null;
  2: number | null;
  3: number | null;
  4: number | null;
  5: number | null;
}

export interface VolleyballGameTeam {
  id: number;
  name: string;
  logo: string | null;
}

export interface VolleyballGameScores {
  home: VolleyballSetScores;
  away: VolleyballSetScores;
}

export interface VolleyballGame {
  id: number;
  date: string;
  time: string;
  timestamp: number;
  timezone: string;
  week: string | null;
  status: VolleyballGameStatus;
  league: VolleyballLeague;
  country: VolleyballLeagueCountry;
  teams: {
    home: VolleyballGameTeam;
    away: VolleyballGameTeam;
  };
  scores: VolleyballGameScores;
}

export interface VolleyballGamesParams {
  id?: number;
  date?: string;
  league?: number;
  season?: number;
  team?: number;
  timezone?: string;
  status?: string;
}
