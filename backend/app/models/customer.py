"""Modelo ORM de clientes."""

from sqlalchemy import Column, Date, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base


class Customer(Base):
    """Tabla de clientes."""

    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    dpi = Column(String(50), unique=True, nullable=False, index=True)
    birth_date = Column(Date, nullable=False)
    address = Column(String(255), nullable=False)
    department = Column(String(100), nullable=False)
    municipality = Column(String(100), nullable=False)

    # Un cliente puede tener varias cuentas.
    accounts = relationship("Account", back_populates="customer", cascade="all, delete-orphan")
