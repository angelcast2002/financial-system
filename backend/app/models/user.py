"""Modelo ORM de usuarios."""

from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Integer, String

from app.database import Base


class User(Base):
    """Tabla de usuarios de la aplicación."""

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default="user", index=True)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
