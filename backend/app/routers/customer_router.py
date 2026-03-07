"""Endpoints de clientes."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth import require_roles
from app.database import get_db
from app.models.customer import Customer
from app.models.user import User
from app.schemas.customer_schema import CustomerCreate, CustomerResponse

router = APIRouter(prefix="/customers", tags=["Customers"])


@router.post("/", response_model=CustomerResponse)
def create_customer(
    customer: CustomerCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("admin")),
):
    """Crea un cliente."""

    db_customer = Customer(**customer.model_dump())
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer


@router.get("/", response_model=list[CustomerResponse])
def get_customers(db: Session = Depends(get_db)):
    """Lista clientes."""

    return db.query(Customer).all()
  

@router.get("/{customer_id}", response_model=CustomerResponse)
def get_customer(customer_id: int, db: Session = Depends(get_db)):
    """Obtiene un cliente por id."""

    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer