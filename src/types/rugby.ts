/**
 * @fileoverview Rugby type definitions
 * @description Types for rugby API responses, matching api-sports.io response format.
 */

export interface RugbyCountry {
  id: number;
  name: string;
  code: string | null;
  flag: string | null;
}

export interface RugbyLeague {
  id: number;
  name: string;
  type: string;
  logo: string | null;
}

export interface RugbySeason {
  season: number | string;
  start: string;
  end: string;
  current: boolean;
}

export interface RugbyLeagueResponse {
  id: number;
  name: string;
  type: string;
  logo: string | null;
  country: RugbyCountry;
  seasons: RugbySeason[];
}

export interface RugbyLeaguesParams {
  id?: number;
  name?: string;
  country?: string;
  country_id?: number;
  type?: string;
  season?: number | string;
  search?: string;
}

export interface RugbyTeam {
  id: number;
  name: string;
  logo: string | null;
  national: boolean;
}

export interface RugbyTeamResponse {
  id: number;
  name: string;
  logo: string | null;
  national: boolean;
  country: RugbyCountry;
}

export interface RugbyTeamsParams {
  id?: number;
  name?: string;
  country?: string;
  country_id?: number;
  league?: number;
  season?: number | string;
  search?: string;
}

export interface RugbyGameStatus {
  long: string;
  short: string;
}

export interface RugbyScores {
  home: {
    half_1: number | null;
    half_2: number | null;
    extra_time: number | null;
    total: number | null;
  };
  away: {
    half_1: number | null;
    half_2: number | null;
    extra_time: number | null;
    total: number | null;
  };
}

export interface RugbyGame {
  id: number;
  date: string;
  time: string;
  timestamp: number;
  timezone: string;
  week: string | null;
  status: RugbyGameStatus;
  country: RugbyCountry;
  league: RugbyLeague;
  teams: {
    home: RugbyTeam;
    away: RugbyTeam;
  };
  scores: RugbyScores;
}

export interface RugbyGamesParams {
  id?: number;
  date?: string;
  league?: number;
  season?: number | string;
  team?: number;
  timezone?: string;
  h2h?: string;
}
