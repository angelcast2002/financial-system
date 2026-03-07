"""Aplicación FastAPI principal.

Registra routers y crea tablas al iniciar.
"""

from fastapi import FastAPI

from app.database import Base, engine

# Import de modelos para registrar metadatos antes de create_all.
from app.models import account, customer, transaction
from app.routers import account_router, customer_router, transaction_router

# Crea tablas si no existen.
Base.metadata.create_all(bind=engine)

app = FastAPI()

# Registro de rutas API.
app.include_router(customer_router.router)
app.include_router(account_router.router)
app.include_router(transaction_router.router)


@app.get("/")
def root():
    """Healthcheck básico del servicio."""
    return {"message": "Backend running correctly"}