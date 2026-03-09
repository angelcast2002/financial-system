"""Endpoints de cuentas."""

import random

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth import get_current_active_user
from app.database import get_db
from app.models.account import Account
from app.models.customer import Customer
from app.models.user import User
from app.schemas.account_schema import AccountCreate, AccountResponse

router = APIRouter(prefix="/api/accounts", tags=["Accounts"])


@router.post("/", response_model=AccountResponse)
def create_account(
    account: AccountCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Crea una cuenta para un cliente."""

    customer = db.query(Customer).filter(Customer.id == account.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    is_admin = current_user.role.lower() == "admin"
    if not is_admin and account.customer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

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
def get_accounts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Lista cuentas. Usuarios no admin solo ven sus cuentas."""

    if current_user.role.lower() == "admin":
        return db.query(Account).all()

    return db.query(Account).filter(Account.customer_id == current_user.id).all()


@router.get("/customer/{customer_id}", response_model=list[AccountResponse])
def get_accounts_by_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Lista cuentas por cliente."""

    if current_user.role.lower() != "admin" and customer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    return db.query(Account).filter(Account.customer_id == customer_id).all()