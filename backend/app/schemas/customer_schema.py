"""Esquemas de clientes."""

from pydantic import BaseModel, EmailStr
from datetime import date


class CustomerCreate(BaseModel):
    """Datos para crear un cliente."""

    first_name: str
    last_name: str
    email: EmailStr
    dpi: str
    birth_date: date
    address: str
    department: str
    municipality: str


class CustomerResponse(BaseModel):
    """Datos públicos de cliente."""

    id: int
    first_name: str
    last_name: str
    email: str
    dpi: str
    birth_date: date
    address: str
    department: str
    municipality: str

    class Config:
        from_attributes = True


class CustomerUpdate(CustomerCreate):
    """Datos para actualizar un cliente."""