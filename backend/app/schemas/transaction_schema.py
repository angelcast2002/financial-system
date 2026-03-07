"""Schemas Pydantic de transacciones."""

from pydantic import BaseModel
from decimal import Decimal


class TransactionCreate(BaseModel):
    """Body para registrar una transacción."""

    account_id: int
    amount: Decimal
    type: str


class TransactionResponse(BaseModel):
    """Respuesta pública de transacción."""

    id: int
    amount: Decimal
    type: str

    class Config:
        from_attributes = True