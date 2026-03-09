"""Punto de entrada de la API."""

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.auth import get_current_active_user
from app.config import CORS_ALLOWED_ORIGINS

from app.database import Base, engine

# Importar modelos para registrar metadatos.
from app.models import account, customer, transaction, user
from app.models.user import User
from app.routers import account_router, auth_router, customer_router, transaction_router, integration_router, seed_router

# Crear tablas si no existen.
Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrar routers.
app.include_router(auth_router.router)
app.include_router(customer_router.router, dependencies=[Depends(get_current_active_user)])
app.include_router(account_router.router, dependencies=[Depends(get_current_active_user)])
app.include_router(transaction_router.router, dependencies=[Depends(get_current_active_user)])
app.include_router(integration_router.router, dependencies=[Depends(get_current_active_user)])
app.include_router(seed_router.router)


@app.get("/")
def root(_: User = Depends(get_current_active_user)):
    """Verifica que el servicio está activo."""
    return {"message": "Backend running correctly"}