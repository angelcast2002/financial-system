"""Configuración base del backend."""

import os

from dotenv import load_dotenv

# Carga variables desde .env cuando existe.
load_dotenv()

POSTGRES_USER = os.getenv("POSTGRES_USER")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD")
POSTGRES_DB = os.getenv("POSTGRES_DB")
POSTGRES_PORT = os.getenv("POSTGRES_PORT")
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))
ADMIN_REGISTRATION_KEY = os.getenv("ADMIN_REGISTRATION_KEY")

DEFAULT_CORS_ALLOWED_ORIGINS = ",".join(
    [
        "https://localhost:4200",
        "http://localhost:4200",
        "https://127.0.0.1:4200",
        "http://127.0.0.1:4200",
    ]
)

CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv("CORS_ALLOWED_ORIGINS", DEFAULT_CORS_ALLOWED_ORIGINS).split(",")
    if origin.strip()
]

# === FIX DE CONEXIÓN ===
# 1. Intentamos leer la URL completa (la que configuraste en Koyeb)
DATABASE_URL = os.getenv("DATABASE_URL")

# 2. Si NO existe (estamos en tu computadora local), la armamos con las variables
if not DATABASE_URL:
    DATABASE_URL = (
        f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@localhost:{POSTGRES_PORT}/{POSTGRES_DB}"
    )

# 3. Parche crítico: Koyeb entrega "postgres://" pero SQLAlchemy exige "postgresql://"
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)