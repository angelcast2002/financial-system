"""Endpoints para poblar datos de prueba."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.seed_service import seed_database

router = APIRouter(prefix="/seed", tags=["Seed"])


@router.post("/")
async def seed(
    db: Session = Depends(get_db),
):
    """Ejecuta la carga de datos semilla."""

    return await seed_database(db)
