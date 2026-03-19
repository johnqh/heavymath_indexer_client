/**
 * @fileoverview Formula 1 type definitions
 * @description Types for F1 API responses, matching api-sports.io response format.
 */

export interface F1Competition {
  id: number;
  name: string;
  location: {
    country: string;
    city: string;
  };
}

export interface F1CompetitionsParams {
  id?: number;
  name?: string;
  country?: string;
  city?: string;
  search?: string;
}

export interface F1Circuit {
  id: number;
  name: string;
  image: string | null;
  competition: {
    id: number;
    name: string;
    location: {
      country: string;
      city: string;
    };
  };
  first_grand_prix: number | null;
  laps: number | null;
  length: string | null;
  race_distance: string | null;
  lap_record: {
    time: string | null;
    driver: string | null;
    year: string | null;
  } | null;
  capacity: number | null;
  opened: number | null;
  owner: string | null;
}

export interface F1CircuitsParams {
  id?: number;
  name?: string;
  country?: string;
  city?: string;
  search?: string;
}

export interface F1Team {
  id: number;
  name: string;
  logo: string | null;
  base: string | null;
  first_team_entry: number | null;
  world_championships: number | null;
  highest_race_finish: {
    position: number | null;
    number: number | null;
  } | null;
  pole_positions: number | null;
  fastest_laps: number | null;
  president: string | null;
  director: string | null;
  technical_manager: string | null;
  chassis: string | null;
  engine: string | null;
  tyres: string | null;
}

export interface F1TeamsParams {
  id?: number;
  name?: string;
  search?: string;
}

export interface F1Driver {
  id: number;
  name: string;
  abbr: string | null;
  number: number | null;
  image: string | null;
  nationality: string | null;
  country: {
    name: string | null;
    code: string | null;
  } | null;
  birthdate: string | null;
  birthplace: string | null;
  grands_prix_entered: number | null;
  world_championships: number | null;
  podiums: number | null;
  highest_race_finish: {
    position: number | null;
    number: number | null;
  } | null;
  highest_grid_position: number | null;
  career_points: string | null;
  teams: {
    season: number;
    team: F1Team;
  }[];
}

export interface F1DriversParams {
  id?: number;
  name?: string;
  search?: string;
}

export interface F1RaceStatus {
  short: string;
  long: string;
}

export interface F1Race {
  id: number;
  competition: F1Competition;
  circuit: F1Circuit;
  season: number;
  type: string;
  laps: {
    current: number | null;
    total: number | null;
  };
  fastest_lap: {
    driver: {
      id: number | null;
    };
    time: string | null;
  } | null;
  distance: string | null;
  timezone: string;
  date: string;
  weather: string | null;
  status: F1RaceStatus;
}

export interface F1RacesParams {
  id?: number;
  date?: string;
  next?: number;
  last?: number;
  competition?: number;
  circuit?: number;
  season?: number;
  type?: string;
  timezone?: string;
}
