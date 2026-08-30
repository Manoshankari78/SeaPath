from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, EmailStr, Field

VesselType = Literal["container", "tanker", "bulk_carrier", "cruise", "fishing"]
RouteStrategy = Literal["fastest", "efficient", "safest"]
VoyageStatus = Literal["Planned", "In-Progress", "Completed"]
AlertType = Literal["StormWarning", "RouteChange"]
AlertStatus = Literal["Read", "Unread"]
UserRole = Literal["Operator", "Admin"]


# --- Auth --------------------------------------------------------------
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(..., min_length=6)
    role: UserRole = "Operator"


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# --- Geo / routing --------------------------------------------------------
class Coordinate(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lon: float = Field(..., ge=-180, le=180)


class VesselProfile(BaseModel):
    name: str = "Vessel"
    vessel_type: VesselType = "container"
    cruise_speed_knots: float = Field(18.0, gt=0, le=40)
    draft_m: float = Field(10.0, gt=0)
    deadweight_tons: float = Field(20000.0, gt=0)
    fuel_rate_ton_per_hr: Optional[float] = None  # overrides the type default if given


class RouteRequest(BaseModel):
    origin: Coordinate
    destination: Coordinate
    vessel: VesselProfile
    depart_time: Optional[datetime] = None


class RoutePoint(BaseModel):
    lat: float
    lon: float


class RouteOption(BaseModel):
    strategy: RouteStrategy
    points: list[RoutePoint]
    # per-point risk score (0-1), same length/order as `points` — powers the
    # risk-radar heatmap overlay on the frontend map
    risk_segments: list[float]
    distance_nm: float
    duration_hr: float
    fuel_tons: float
    co2_tons: float
    risk_score: float  # 0 (safe) - 1 (high risk), max risk along the route
    sustainability_score: float  # 0-100, higher is better


class RouteResponse(BaseModel):
    origin: Coordinate
    destination: Coordinate
    vessel: VesselProfile
    options: list[RouteOption]
    warnings: list[str] = []


# --- Fleet ---------------------------------------------------------------
class VesselCreate(BaseModel):
    name: str
    vessel_type: VesselType
    cruise_speed_knots: float = 18.0
    draft_m: float = 10.0
    deadweight_tons: float = 20000.0
    fuel_rate_ton_per_hr: Optional[float] = None


class VesselOut(VesselCreate):
    id: int
    owner_id: Optional[int] = None

    class Config:
        from_attributes = True


# --- Voyages ---------------------------------------------------------------
class VoyageCreate(BaseModel):
    vessel_id: int
    start_port: Optional[str] = None
    end_port: Optional[str] = None
    origin: Coordinate
    destination: Coordinate
    strategy: RouteStrategy
    status: VoyageStatus = "Planned"
    distance_nm: float
    duration_hr: float
    fuel_tons: float
    co2_tons: float
    route_points: list[RoutePoint]
    risk_segments: list[float] = []


class VoyageOut(BaseModel):
    id: int
    vessel_id: int
    created_by: Optional[int] = None
    start_port: Optional[str] = None
    end_port: Optional[str] = None
    origin_lat: float
    origin_lon: float
    dest_lat: float
    dest_lon: float
    strategy: str
    status: str
    distance_nm: float
    duration_hr: float
    fuel_tons: float
    co2_tons: float
    created_at: datetime

    class Config:
        from_attributes = True


class VoyageStatusUpdate(BaseModel):
    status: VoyageStatus


# --- Waypoints ---------------------------------------------------------------
class WaypointOut(BaseModel):
    id: int
    voyage_id: int
    sequence: int
    latitude: float
    longitude: float
    eta: Optional[datetime] = None
    risk_score: float

    class Config:
        from_attributes = True


# --- Weather ---------------------------------------------------------------
class WeatherPoint(BaseModel):
    lat: float
    lon: float
    wave_height_m: float
    wave_direction_deg: Optional[float] = None
    wave_period_s: Optional[float] = None
    swell_wave_height_m: Optional[float] = None
    wind_wave_height_m: Optional[float] = None
    sea_surface_temperature_c: Optional[float] = None
    ocean_current_velocity_kmh: Optional[float] = None
    ocean_current_direction_deg: Optional[float] = None
    wind_speed_kmh: float
    wind_direction_deg: Optional[float] = None


# --- Alerts ---------------------------------------------------------------
class AlertOut(BaseModel):
    id: int
    voyage_id: int
    type: str
    message: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class AlertStatusUpdate(BaseModel):
    status: AlertStatus


# --- Reports ---------------------------------------------------------------
class ReportOut(BaseModel):
    id: int
    voyage_id: int
    fuel_used_tons: float
    co2_emitted_tons: float
    distance_covered_nm: float
    created_at: datetime

    class Config:
        from_attributes = True
