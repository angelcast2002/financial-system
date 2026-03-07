"""Rutas de transacciones."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.account import Account
from app.models.transaction import Transaction
from app.schemas.transaction_schema import TransactionCreate, TransactionResponse

router = APIRouter(prefix="/transactions", tags=["Transactions"])


@router.post("/", response_model=TransactionResponse)
def create_transaction(transaction: TransactionCreate, db: Session = Depends(get_db)):
    """POST /transactions: registra un movimiento y actualiza balance."""

    # Verifica que la cuenta exista.
    account = db.query(Account).filter(Account.id == transaction.account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    # Reglas por tipo de transacción.
    if transaction.type == "deposit":
        account.balance += transaction.amount
    elif transaction.type == "withdraw":
        if account.balance < transaction.amount:
            raise HTTPException(status_code=400, detail="Insufficient funds")
        account.balance -= transaction.amount
    else:
        raise HTTPException(status_code=400, detail="Invalid transaction type")

    # Guarda el movimiento.
    db_transaction = Transaction(**transaction.model_dump())
    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)

    return db_transaction