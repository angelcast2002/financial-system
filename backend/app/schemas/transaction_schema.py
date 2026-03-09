"""Esquemas de transacciones."""

from pydantic import BaseModel
from decimal import Decimal
from datetime import datetime


class TransactionCreate(BaseModel):
    """Datos para registrar una transacción."""

    account_id: int
    amount: Decimal
    type: str


class TransactionResponse(BaseModel):
    """Datos públicos de transacción."""

    id: int
    account_id: int
    amount: Decimal
    type: str
    created_at: datetime

    class Config:
        from_attributes = True