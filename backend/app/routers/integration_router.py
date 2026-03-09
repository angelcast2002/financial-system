"""Endpoints de integración externa."""

from fastapi import APIRouter
from app.services.integration_service import get_integrated_data

router = APIRouter(prefix="/api/integration", tags=["Integration"])


@router.get("/integrated-data")
async def integrated_data():
    """Devuelve datos integrados de servicios externos."""
