"""Endpoints de autenticación."""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.auth import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_current_active_user,
    get_password_hash,
    require_roles,
    verify_password,
)
from app.config import ADMIN_REGISTRATION_KEY
from app.database import get_db
from app.models.user import User
from app.schemas.auth_schema import RefreshTokenRequest, TokenPair, UserCreate, UserResponse

router = APIRouter(prefix="/auth", tags=["Auth"])


def _build_token_pair(user: User) -> TokenPair:
    access_token = create_access_token(subject=str(user.id), role=user.role)
    refresh_token = create_refresh_token(subject=str(user.id), role=user.role)
    return TokenPair(access_token=access_token, refresh_token=refresh_token)


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(payload: UserCreate, db: Session = Depends(get_db)):
    """Registra un usuario nuevo."""

    existing_user = db.query(User).filter(
        or_(User.username == payload.username, User.email == payload.email)
    ).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username or email already exists")

    users_count = db.query(User).count()
    role_to_assign = payload.role

    # El primer usuario del sistema se crea como admin.
    if users_count == 0:
        role_to_assign = "admin"

    # Después del primer usuario, crear admins requiere clave.
    if users_count > 0 and payload.role == "admin":
        if not ADMIN_REGISTRATION_KEY or payload.admin_key != ADMIN_REGISTRATION_KEY:
            raise HTTPException(status_code=403, detail="Admin registration is not allowed")

    db_user = User(
        username=payload.username,
        email=payload.email,
        password_hash=get_password_hash(payload.password),
        role=role_to_assign,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return db_user


@router.post("/login", response_model=TokenPair)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    """Inicia sesión y devuelve tokens."""

    user = db.query(User).filter(
        or_(User.username == form_data.username, User.email == form_data.username)
    ).first()

    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Inactive user")

    return _build_token_pair(user)


@router.post("/refresh", response_model=TokenPair)
def refresh_tokens(payload: RefreshTokenRequest, db: Session = Depends(get_db)):
    """Renueva tokens usando un refresh token válido."""

    token_payload = decode_token(payload.refresh_token, expected_type="refresh")

    try:
        user_id = int(token_payload["sub"])
    except (TypeError, ValueError) as exc:
        raise HTTPException(status_code=401, detail="Invalid token subject") from exc

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Inactive user")

    return _build_token_pair(user)


@router.get("/me", response_model=UserResponse)
def get_my_profile(current_user: User = Depends(get_current_active_user)):
    """Devuelve el perfil del usuario autenticado."""

    return current_user


@router.get("/users", response_model=list[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("admin")),
):
    """Lista usuarios (solo admin)."""

    return db.query(User).order_by(User.id).all()
