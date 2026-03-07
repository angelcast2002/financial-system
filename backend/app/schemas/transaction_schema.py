"""Esquemas de transacciones."""

from pydantic import BaseModel
from decimal import Decimal


class TransactionCreate(BaseModel):
    """Datos para registrar una transacción."""

    account_id: int
    amount: Decimal
    type: str


class TransactionResponse(BaseModel):
    """Datos públicos de transacción."""

    id: int
    amount: Decimal
    type: str

    class Config:
        from_attributes = True