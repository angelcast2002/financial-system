"""Schemas Pydantic de clientes."""

from pydantic import BaseModel, EmailStr
from datetime import date


class CustomerCreate(BaseModel):
    """Body de creación de cliente."""

    first_name: str
    last_name: str
    email: EmailStr
    dpi: str
    birth_date: date
    address: str
    department: str
    municipality: str


class CustomerResponse(BaseModel):
    """Respuesta pública de cliente."""

    id: int
    first_name: str
    last_name: str
    email: str

    class Config:
        from_attributes = True