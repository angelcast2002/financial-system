"""Modelo ORM de cuentas bancarias."""

from decimal import Decimal

from sqlalchemy import Column, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import relationship

from app.database import Base


class Account(Base):
    """Entidad cuenta bancaria."""

    __tablename__ = "accounts"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False, index=True)
    account_number = Column(String(20), unique=True, nullable=False, index=True)
    balance = Column(Numeric(12, 2), nullable=False, default=Decimal("0.00"))

    # Relación N:1 con cliente.
    customer = relationship("Customer", back_populates="accounts")
    # Relación 1:N con transacciones.
    transactions = relationship("Transaction", back_populates="account", cascade="all, delete-orphan")
