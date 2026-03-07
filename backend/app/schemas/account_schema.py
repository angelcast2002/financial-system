"""Schemas Pydantic de cuentas."""

from pydantic import BaseModel
from decimal import Decimal


class AccountCreate(BaseModel):
    """Body de creación de cuenta."""

    customer_id: int


class AccountResponse(BaseModel):
    """Respuesta pública de cuenta."""

    id: int
    account_number: str
    balance: Decimal

    class Config:
        from_attributes = True