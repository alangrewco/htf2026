import os
from contextlib import contextmanager

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.errors import ConfigError


Base = declarative_base()
_engine = None
SessionLocal = None


def _database_url() -> str:
    url = os.getenv("DATABASE_URL", "").strip()
    if not url:
        raise ConfigError(
            "DATABASE_URL is required for reference API business logic.",
            {"env_var": "DATABASE_URL"},
        )
    return url


def get_engine():
    global _engine
    if _engine is None:
        _engine = create_engine(_database_url(), future=True, pool_pre_ping=True)
    return _engine


def get_sessionmaker():
    global SessionLocal
    if SessionLocal is None:
        SessionLocal = sessionmaker(bind=get_engine(), autoflush=False, autocommit=False, future=True)
    return SessionLocal


@contextmanager
def session_scope():
    session = get_sessionmaker()()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()
