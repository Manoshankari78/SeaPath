export type VesselType = "container" | "tanker" | "bulk_carrier" | "cruise" | "fishing";
export type RouteStrategy = "fastest" | "efficient" | "safest";
export type VoyageStatus = "Planned" | "In-Progress" | "Completed";
export type AlertType = "StormWarning" | "RouteChange";
export type AlertStatus = "Read" | "Unread";
export type UserRole = "Operator" | "Admin";

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Coordinate {
  lat: number;
  lon: number;
}

export interface VesselProfile {
  name: string;
  vessel_type: VesselType;
  cruise_speed_knots: number;
  draft_m: number;
  deadweight_tons: number;
  fuel_rate_ton_per_hr?: number | null;
}

export interface RouteRequest {
  origin: Coordinate;
  destination: Coordinate;
  vessel: VesselProfile;
  depart_time?: string | null;
}

export interface RoutePoint {
  lat: number;
  lon: number;
}

export interface RouteOption {
  strategy: RouteStrategy;
  points: RoutePoint[];
  risk_segments: number[];
  distance_nm: number;
  duration_hr: number;
  fuel_tons: number;
  co2_tons: number;
  risk_score: number;
  sustainability_score: number;
}

export interface RouteResponse {
  origin: Coordinate;
  destination: Coordinate;
  vessel: VesselProfile;
  options: RouteOption[];
  warnings: string[];
}

export interface VesselCreate {
  name: string;
  vessel_type: VesselType;
  cruise_speed_knots: number;
  draft_m: number;
  deadweight_tons: number;
  fuel_rate_ton_per_hr?: number | null;
}

export interface VesselOut extends VesselCreate {
  id: number;
  owner_id?: number | null;
}

export interface VoyageOut {
  id: number;
  vessel_id: number;
  created_by?: number | null;
  start_port?: string | null;
  end_port?: string | null;
  origin_lat: number;
  origin_lon: number;
  dest_lat: number;
  dest_lon: number;
  strategy: string;
  status: string;
  distance_nm: number;
  duration_hr: number;
  fuel_tons: number;
  co2_tons: number;
  created_at: string;
}

export interface VoyageCreate {
  vessel_id: number;
  start_port?: string;
  end_port?: string;
  origin: Coordinate;
  destination: Coordinate;
  strategy: RouteStrategy;
  status?: VoyageStatus;
  distance_nm: number;
  duration_hr: number;
  fuel_tons: number;
  co2_tons: number;
  route_points: RoutePoint[];
  risk_segments?: number[];
}

export interface WaypointOut {
  id: number;
  voyage_id: number;
  sequence: number;
  latitude: number;
  longitude: number;
  eta?: string | null;
  risk_score: number;
}

export interface WeatherPoint {
  lat: number;
  lon: number;
  wave_height_m: number;
  wave_direction_deg?: number | null;
  wave_period_s?: number | null;
  swell_wave_height_m?: number | null;
  wind_wave_height_m?: number | null;
  sea_surface_temperature_c?: number | null;
  ocean_current_velocity_kmh?: number | null;
  ocean_current_direction_deg?: number | null;
  wind_speed_kmh: number;
  wind_direction_deg?: number | null;
}

export interface AlertOut {
  id: number;
  voyage_id: number;
  type: AlertType;
  message: string;
  status: AlertStatus;
  created_at: string;
}

