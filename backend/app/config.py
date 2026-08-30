"""
Central configuration for the SeaPath backend.
Values can be overridden with environment variables of the same name.
"""
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

# --- Database -------------------------------------------------------------
# SQLite by default so the project runs with zero external setup.
# For production, point this at a PostgreSQL + PostGIS instance instead, e.g.:
#   postgresql+psycopg2://user:password@localhost:5432/seapath
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'seapath.db'}")

# --- External APIs ---------------------------------------------------------
OPEN_METEO_MARINE_URL = "https://marine-api.open-meteo.com/v1/marine"
OPEN_METEO_WEATHER_URL = "https://api.open-meteo.com/v1/forecast"

# --- Routing grid -----------------------------------------------------------
# Grid resolution in degrees. Smaller = more accurate but much slower.
GRID_RESOLUTION_DEG = float(os.getenv("GRID_RESOLUTION_DEG", "0.5"))

# Diagonal + straight neighbour directions (8-connected grid)
NEIGHBOR_OFFSETS = [
    (-1, -1), (-1, 0), (-1, 1),
    (0, -1),           (0, 1),
    (1, -1),  (1, 0),  (1, 1),
]

# --- Vessel defaults --------------------------------------------------------
DEFAULT_FUEL_RATE_TON_PER_HR = {
    "container": 3.2,
    "tanker": 4.1,
    "bulk_carrier": 2.8,
    "cruise": 5.0,
    "fishing": 0.6,
}

# CO2 emitted per ton of heavy fuel oil burned (IMO default factor)
CO2_PER_TON_FUEL = 3.114

# CORS
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")

# --- Auth ---------------------------------------------------------------
# In production, set SECRET_KEY via environment variable to a long random value.
SECRET_KEY = os.getenv("SECRET_KEY", "dev-only-secret-change-me-in-production")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

# Risk score (0-1) above which an automatic StormWarning alert is raised
ALERT_RISK_THRESHOLD = 0.5
# Fractional change in a route's risk/fuel that triggers a RouteChange alert
REROUTE_CHANGE_THRESHOLD = 0.15
