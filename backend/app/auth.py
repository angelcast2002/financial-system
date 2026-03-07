"""Funciones de autenticación JWT y autorización por roles."""

from datetime import datetime, timedelta, timezone
import hashlib
from typing import Any

import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.config import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    JWT_ALGORITHM,
    JWT_SECRET_KEY,
    REFRESH_TOKEN_EXPIRE_DAYS,
)
from app.database import get_db
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def _get_jwt_secret() -> str:
    if not JWT_SECRET_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="JWT_SECRET_KEY is not configured",
        )
    return JWT_SECRET_KEY


def _credentials_exception(detail: str = "Could not validate credentials") -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


def get_password_hash(password: str) -> str:
    """Genera el hash de una contraseña."""
    normalized_password = hashlib.sha256(password.encode("utf-8")).digest()
    return bcrypt.hashpw(normalized_password, bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Compara una contraseña en texto plano contra su hash."""
    normalized_password = hashlib.sha256(plain_password.encode("utf-8")).digest()
    try:
        return bcrypt.checkpw(normalized_password, hashed_password.encode("utf-8"))
    except ValueError:
        return False


def create_access_token(subject: str, role: str) -> str:
    """Crea un access token con expiración corta."""
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": subject, "role": role, "type": "access", "exp": expire}
    return jwt.encode(payload, _get_jwt_secret(), algorithm=JWT_ALGORITHM)


def create_refresh_token(subject: str, role: str) -> str:
    """Crea un refresh token con expiración extendida."""
    expire = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    payload = {"sub": subject, "role": role, "type": "refresh", "exp": expire}
    return jwt.encode(payload, _get_jwt_secret(), algorithm=JWT_ALGORITHM)


def decode_token(token: str, expected_type: str) -> dict[str, Any]:
    """Decodifica un token y valida su tipo."""
    try:
        payload = jwt.decode(token, _get_jwt_secret(), algorithms=[JWT_ALGORITHM])
    except JWTError as exc:
        raise _credentials_exception("Invalid or expired token") from exc

    token_type = payload.get("type")
    subject = payload.get("sub")
    if token_type != expected_type or subject is None:
        raise _credentials_exception("Invalid token payload")

    return payload


def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)) -> User:
    """Resuelve el usuario autenticado a partir del access token."""
    payload = decode_token(token, expected_type="access")

    try:
        user_id = int(payload["sub"])
    except (TypeError, ValueError) as exc:
        raise _credentials_exception("Invalid token subject") from exc

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise _credentials_exception("User not found")

    return user


def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """Verifica que el usuario esté activo."""
    if not current_user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Inactive user")
    return current_user


def require_roles(*allowed_roles: str):
    """Crea una dependencia para validar roles permitidos."""
    normalized_roles = {role.lower() for role in allowed_roles}

    def role_validator(current_user: User = Depends(get_current_active_user)) -> User:
        if current_user.role.lower() not in normalized_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions",
            )
        return current_user

    return role_validator
