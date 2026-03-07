"""Rutas de cuentas bancarias."""

import random

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.account import Account
from app.schemas.account_schema import AccountCreate, AccountResponse

router = APIRouter(prefix="/accounts", tags=["Accounts"])


@router.post("/", response_model=AccountResponse)
def create_account(account: AccountCreate, db: Session = Depends(get_db)):
    """POST /accounts: crea una cuenta para un cliente."""

    account_number = str(random.randint(1000000000, 9999999999))
    db_account = Account(
        customer_id=account.customer_id,
        account_number=account_number
    )
    db.add(db_account)
    db.commit()
    db.refresh(db_account)
    return db_account


@router.get("/", response_model=list[AccountResponse])
def get_accounts(db: Session = Depends(get_db)):
    """GET /accounts: lista cuentas."""

    return db.query(Account).all()