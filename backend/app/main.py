from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth_routes, alert_routes, fleet_routes, routing_routes, voyage_routes, weather_routes
from app.config import ALLOWED_ORIGINS
from app.db.session import Base, engine, ensure_postgis_extension

ensure_postgis_extension()
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SeaPath API",
    description="AI-assisted ship route, fuel and emissions optimization engine.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_routes.router)
app.include_router(routing_routes.router)
app.include_router(fleet_routes.router)
app.include_router(voyage_routes.router)
app.include_router(weather_routes.router)
app.include_router(alert_routes.router)


@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "seapath-api"}
