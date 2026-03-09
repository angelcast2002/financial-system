"""Endpoints de transacciones."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth import get_current_active_user, require_roles
from app.database import get_db
from app.models.account import Account
from app.models.transaction import Transaction
from app.models.user import User
from app.schemas.transaction_schema import TransactionCreate, TransactionResponse

router = APIRouter(prefix="/api/transactions", tags=["Transactions"])


@router.post("/", response_model=TransactionResponse)
def create_transaction(
    transaction: TransactionCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("admin")),
):
    """Registra una transacción y actualiza el saldo."""

    # Verificar que la cuenta exista.
    account = db.query(Account).filter(Account.id == transaction.account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    # Aplicar reglas por tipo de transacción.
    if transaction.type == "deposit":
        account.balance += transaction.amount
    elif transaction.type == "withdraw":
        if account.balance < transaction.amount:
            raise HTTPException(status_code=400, detail="Insufficient funds")
        account.balance -= transaction.amount
    else:
        raise HTTPException(status_code=400, detail="Invalid transaction type")

    # Guardar el movimiento.
    db_transaction = Transaction(**transaction.model_dump())
    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)

    return db_transaction
  

@router.get("/account/{account_id}", response_model=list[TransactionResponse])
def get_transactions_by_account(
    account_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Lista transacciones por cuenta."""

    account = db.query(Account).filter(Account.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    is_admin = current_user.role.lower() == "admin"
    if not is_admin and account.customer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    return db.query(Transaction).filter(Transaction.account_id == account_id).all()