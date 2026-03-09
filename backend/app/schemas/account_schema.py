"""Esquemas de cuentas."""

from pydantic import BaseModel
from decimal import Decimal


class AccountCreate(BaseModel):
    """Datos para crear una cuenta."""

    customer_id: int


class AccountResponse(BaseModel):
    """Datos públicos de cuenta."""

    id: int
    customer_id: int
    account_number: str
    balance: Decimal

    class Config:
        from_attributes = True