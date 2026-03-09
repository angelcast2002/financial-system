"""Endpoints de clientes."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth import get_current_active_user
from app.database import get_db
from app.models.customer import Customer
from app.models.user import User
from app.schemas.customer_schema import CustomerCreate, CustomerResponse, CustomerUpdate

router = APIRouter(prefix="/api/customers", tags=["Customers"])


def _is_admin(user: User) -> bool:
    return user.role.lower() == "admin"


def _create_customer_for_user(customer: CustomerCreate, current_user: User, db: Session) -> Customer:
    existing_customer = db.query(Customer).filter(Customer.id == current_user.id).first()
    if existing_customer:
        raise HTTPException(status_code=409, detail="Customer profile already exists")

    db_customer = Customer(id=current_user.id, **customer.model_dump())
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer


@router.post("/me", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
def create_my_customer(
    customer: CustomerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Crea el perfil de cliente del usuario autenticado."""

    return _create_customer_for_user(customer, current_user, db)


@router.post("/", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
def create_customer(
    customer: CustomerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Crea el perfil de cliente del usuario autenticado."""

    return _create_customer_for_user(customer, current_user, db)


@router.get("/", response_model=list[CustomerResponse])
def get_customers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Lista clientes. Usuarios no admin solo ven su perfil."""

    if _is_admin(current_user):
        return db.query(Customer).order_by(Customer.id.desc()).all()

    customer = db.query(Customer).filter(Customer.id == current_user.id).first()
    return [customer] if customer else []


@router.get("/me", response_model=CustomerResponse)
def get_my_customer(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Obtiene el cliente del usuario autenticado."""

    customer = db.query(Customer).filter(Customer.id == current_user.id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer profile not found")

    return customer


@router.put("/me", response_model=CustomerResponse)
def update_my_customer(
    payload: CustomerUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Actualiza el cliente del usuario autenticado."""

    customer = db.query(Customer).filter(Customer.id == current_user.id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer profile not found")

    for field, value in payload.model_dump().items():
        setattr(customer, field, value)

    db.add(customer)
    db.commit()
    db.refresh(customer)

    return customer


@router.get("/{customer_id}", response_model=CustomerResponse)
def get_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Obtiene un cliente por id."""

    if not _is_admin(current_user) and current_user.id != customer_id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


@router.put("/{customer_id}", response_model=CustomerResponse)
def update_customer(
    customer_id: int,
    payload: CustomerUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Actualiza un cliente existente."""

    if not _is_admin(current_user) and current_user.id != customer_id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    for field, value in payload.model_dump().items():
        setattr(customer, field, value)

    db.add(customer)
    db.commit()
    db.refresh(customer)

    return customer