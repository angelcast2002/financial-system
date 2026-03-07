"""Esquemas de autenticación y usuario."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    """Datos requeridos para registrar un usuario."""

    username: str = Field(min_length=3, max_length=50, pattern=r"^[a-zA-Z0-9_.-]+$")
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    role: Literal["user", "admin"] = "user"
    admin_key: str | None = None


class UserResponse(BaseModel):
    """Datos públicos de un usuario."""

    id: int
    username: str
    email: EmailStr
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class TokenPair(BaseModel):
    """Par de tokens para sesión autenticada."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshTokenRequest(BaseModel):
    """Datos necesarios para renovar tokens."""

    refresh_token: str
