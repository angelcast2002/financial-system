"""Conexión y sesiones de base de datos."""

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, declarative_base, sessionmaker

from app.config import DATABASE_URL

# Engine principal de conexión.
engine = create_engine(DATABASE_URL)

# Fábrica de sesiones.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base declarativa para modelos ORM.
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """Abre una sesión por request y la cierra al finalizar."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()