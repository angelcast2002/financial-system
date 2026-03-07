"""Inicialización de SQLAlchemy y sesiones por request."""

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, declarative_base, sessionmaker

from app.config import DATABASE_URL

# Motor de conexión a PostgreSQL.
engine = create_engine(DATABASE_URL)

# Fábrica de sesiones para operaciones de BD.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base declarativa para los modelos ORM.
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """Dependencia FastAPI: abre una sesión y la cierra al finalizar."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()