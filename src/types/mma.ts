/**
 * @fileoverview MMA type definitions
 * @description Types for MMA API responses, matching api-sports.io response format.
 */

export type MmaCategory = string;

export interface MmaCategoriesParams {
  id?: number;
  name?: string;
  search?: string;
}

export interface MmaTeam {
  id: number;
  name: string;
}

export interface MmaFighter {
  id: number;
  name: string;
  nickname: string | null;
  photo: string | null;
  gender: string | null;
  birth_date: string | null;
  age: number | null;
  height: string | null;
  weight: string | null;
  reach: string | null;
  stance: string | null;
  category: MmaCategory | null;
  team: MmaTeam | null;
  last_update: string | null;
}

export interface MmaFightFighter {
  id: number;
  name: string;
  logo: string | null;
  winner: boolean;
}

export interface MmaFightersParams {
  id?: number;
  name?: string;
  category?: number;
  search?: string;
}

export interface MmaFightStatus {
  long: string;
  short: string;
}

export interface MmaFight {
  id: number;
  date: string;
  time: string;
  timestamp: number;
  timezone: string;
  slug: string | null;
  is_main: boolean;
  category: MmaCategory | null;
  status: MmaFightStatus;
  fighters: {
    first: MmaFightFighter;
    second: MmaFightFighter;
  };
}

export interface MmaFightsParams {
  id?: number;
  date?: string;
  league?: number;
  season?: number;
  fighter?: number;
  category?: number;
  timezone?: string;
}
