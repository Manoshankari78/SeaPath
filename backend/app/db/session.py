import logging

from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker

from app.config import DATABASE_URL

logger = logging.getLogger("seapath.db")


def _normalize_database_url(url: str) -> str:
    """
    Many managed Postgres providers (Heroku, Render, Railway, Supabase, ECS
    secrets, etc.) hand out connection strings starting with `postgres://`,
    which SQLAlchemy 2.x no longer accepts — it needs `postgresql://` (and
    we want the psycopg2 driver explicitly). This rewrites the scheme so the
    same DATABASE_URL a cloud dashboard gives you can be pasted in as-is.
    """
    if url.startswith("postgres://"):
        url = "postgresql://" + url[len("postgres://"):]
    if url.startswith("postgresql://") and "+psycopg2" not in url:
        url = url.replace("postgresql://", "postgresql+psycopg2://", 1)
    return url


DATABASE_URL = _normalize_database_url(DATABASE_URL)
IS_POSTGRES = DATABASE_URL.startswith("postgresql")
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def ensure_postgis_extension():
    """When running against PostgreSQL, try to enable the PostGIS extension
    so spatial queries (see services/spatial.py) work. No-op for SQLite.

    On many managed cloud databases (Render, Railway, Supabase, RDS with a
    restricted app user, etc.) PostGIS is either already enabled by the
    provider or the app user lacks CREATE EXTENSION privileges. Either way
    this must not crash startup — it logs a warning and the app falls back
    to the Python haversine spatial search (see services/spatial.py) if the
    extension truly isn't available.
    """
    if not IS_POSTGRES:
        return
    try:
        with engine.connect() as conn:
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis"))
            conn.commit()
    except Exception as exc:
        logger.warning(
            "Could not create the PostGIS extension automatically (%s). "
            "If your database user lacks CREATE EXTENSION privileges, ask "
            "your cloud provider to enable PostGIS for this database, or "
            "run `CREATE EXTENSION IF NOT EXISTS postgis;` manually as an "
            "admin. The app will still run — spatial search falls back to "
            "a Python calculation if PostGIS isn't available.",
            exc,
        )


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
