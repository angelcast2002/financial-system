"""Carga de datos semilla para entorno de desarrollo."""

from collections.abc import Iterable
import httpx
import random
from decimal import Decimal
from datetime import date, datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.auth import get_password_hash
from app.models.customer import Customer
from app.models.account import Account
from app.models.transaction import Transaction
from app.models.user import User

import os

from dotenv import load_dotenv

load_dotenv()

USERS_URL = os.getenv("USERS_URL")
SEED_ADMIN_USERNAME = os.getenv("SEED_ADMIN_USERNAME", "admin.dev")
SEED_ADMIN_EMAIL = os.getenv("SEED_ADMIN_EMAIL", "admin.dev@local.test")
SEED_ADMIN_PASSWORD = os.getenv("SEED_ADMIN_PASSWORD", "Admin123!")
SEED_USER_PASSWORD = os.getenv("SEED_USER_PASSWORD", "SeedUser123!")


def _normalize_username_seed(value: str) -> str:
    cleaned = "".join(character for character in value.lower() if character.isalnum() or character in {".", "_", "-"})
    cleaned = cleaned.strip("._-")
    if not cleaned:
        return "seed-user"
    return cleaned[:42]


def _build_unique_username(db: Session, base_value: str) -> str:
    base = _normalize_username_seed(base_value)
    candidate = base
    suffix = 1

    while db.query(User).filter(User.username == candidate).first():
        candidate = f"{base[:35]}-{suffix}"
        suffix += 1

    return candidate


def _build_unique_email(db: Session, base_email: str, fallback_index: int) -> str:
    normalized_email = (base_email or "").strip().lower()
    if "@" not in normalized_email:
        normalized_email = f"seed-user-{fallback_index}@local.test"

    local_part, domain = normalized_email.split("@", maxsplit=1)
    local_part = local_part or f"seed-user-{fallback_index}"
    domain = domain or "local.test"

    candidate = f"{local_part}@{domain}"
    suffix = 1

    while db.query(User).filter(User.email == candidate).first():
        candidate = f"{local_part}.{suffix}@{domain}"
        suffix += 1

    return candidate


def _fallback_seed_users() -> list[dict]:
    return [
        {
            "name": "Ana Pérez",
            "username": "ana.perez",
            "email": "ana.perez@local.test",
            "address": {
                "street": "Zona 10",
                "city": "guatemala",
                "suite": "guatemala",
            },
        },
        {
            "name": "Luis Gómez",
            "username": "luis.gomez",
            "email": "luis.gomez@local.test",
            "address": {
                "street": "Antigua Centro",
                "city": "sacatepequez",
                "suite": "antigua-guatemala",
            },
        },
        {
            "name": "Marta López",
            "username": "marta.lopez",
            "email": "marta.lopez@local.test",
            "address": {
                "street": "Las Américas",
                "city": "quetzaltenango",
                "suite": "quetzaltenango",
            },
        },
        {
            "name": "Carlos Díaz",
            "username": "carlos.diaz",
            "email": "carlos.diaz@local.test",
            "address": {
                "street": "Puerto",
                "city": "escuintla",
                "suite": "escuintla",
            },
        },
    ]


def _sanitize_external_users(raw_users: Iterable[dict]) -> list[dict]:
    sanitized: list[dict] = []
    seen_emails: set[str] = set()

    for index, external_user in enumerate(raw_users, start=1):
        if not isinstance(external_user, dict):
            continue

        email = str(external_user.get("email", "")).strip().lower()
        if not email or email in seen_emails:
            continue

        seen_emails.add(email)

        name = str(external_user.get("name", "")).strip() or f"Usuario {index}"
        username = str(external_user.get("username", "")).strip() or email.split("@", maxsplit=1)[0]
        address = external_user.get("address", {}) if isinstance(external_user.get("address"), dict) else {}

        sanitized.append(
            {
                "name": name,
                "username": username,
                "email": email,
                "address": {
                    "street": str(address.get("street", "N/A")),
                    "city": str(address.get("city", "guatemala")).lower(),
                    "suite": str(address.get("suite", "guatemala")).lower(),
                },
            }
        )

    return sanitized


async def _get_seed_users() -> tuple[list[dict], str]:
    if USERS_URL:
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.get(USERS_URL)
                response.raise_for_status()

            parsed_users = _sanitize_external_users(response.json())
            if parsed_users:
                return parsed_users, "remote"
        except Exception:
            pass

    return _fallback_seed_users(), "fallback"


def _generate_unique_account_number(db: Session) -> str:
    while True:
        candidate = str(random.randint(1000000000, 9999999999))
        if not db.query(Account).filter(Account.account_number == candidate).first():
            return candidate


async def seed_database(db: Session):
    """Elimina todos los datos y regenera usuarios/clientes/cuentas/transacciones de prueba."""

    db.execute(text("TRUNCATE TABLE transactions, accounts, customers, users RESTART IDENTITY CASCADE"))
    db.commit()

    seed_users, seed_source = await _get_seed_users()

    created_users = 0
    created_customers = 0
    created_accounts = 0
    created_transactions = 0
    test_users: list[dict[str, str | int]] = []

    admin_user = User(
        username=_build_unique_username(db, SEED_ADMIN_USERNAME),
        email=_build_unique_email(db, SEED_ADMIN_EMAIL, 0),
        password_hash=get_password_hash(SEED_ADMIN_PASSWORD),
        role="admin",
        is_active=True,
    )
    db.add(admin_user)
    db.commit()
    db.refresh(admin_user)

    admin_customer = Customer(
        id=admin_user.id,
        first_name="Admin",
        last_name="Dev",
        email=admin_user.email,
        dpi=str(9000000000000 + admin_user.id),
        birth_date=date(1990, 1, 1),
        address="Development HQ",
        department="guatemala",
        municipality="guatemala",
    )
    db.add(admin_customer)
    db.commit()
    db.refresh(admin_customer)

    created_users += 1
    created_customers += 1
    test_users.append(
        {
            "id": admin_user.id,
            "username": admin_user.username,
            "email": admin_user.email,
            "password": SEED_ADMIN_PASSWORD,
            "role": admin_user.role,
        }
    )

    for index, external_user in enumerate(seed_users, start=1):
        email = _build_unique_email(db, str(external_user.get("email", "")), index)
        username_seed = str(external_user.get("username", "")).strip() or email.split("@", maxsplit=1)[0]
        db_user = User(
            username=_build_unique_username(db, username_seed),
            email=email,
            password_hash=get_password_hash(SEED_USER_PASSWORD),
            role="user",
            is_active=True,
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        created_users += 1

        full_name = str(external_user.get("name", "")).strip()
        name_parts = full_name.split() if full_name else [f"Usuario{index}"]
        address_data = external_user.get("address", {}) if isinstance(external_user.get("address"), dict) else {}

        department = str(address_data.get("city", "guatemala")).strip().lower() or "guatemala"
        municipality = str(address_data.get("suite", "guatemala")).strip().lower() or "guatemala"

        new_customer = Customer(
            id=db_user.id,
            first_name=name_parts[0],
            last_name=" ".join(name_parts[1:]) if len(name_parts) > 1 else "",
            email=db_user.email,
            dpi=str(1000000000000 + db_user.id),
            birth_date=date(1995, 1, 1),
            address=str(address_data.get("street", "N/A")),
            department=department,
            municipality=municipality,
        )

        db.add(new_customer)
        db.commit()
        db.refresh(new_customer)
        created_customers += 1

        account_count = random.randint(1, 2)
        for _ in range(account_count):
            account = Account(
                customer_id=new_customer.id,
                account_number=_generate_unique_account_number(db),
                balance=Decimal("0.00"),
            )

            db.add(account)
            db.commit()
            db.refresh(account)
            created_accounts += 1

            today = datetime.now()

            for _ in range(random.randint(20, 35)):
                amount = Decimal(random.randint(50, 500))
                transaction_type = random.choice(["deposit", "withdraw"])
                random_days = random.randint(0, 56)
                transaction_date = today - timedelta(days=random_days)

                if transaction_type == "withdraw" and account.balance < amount:
                    transaction_type = "deposit"

                if transaction_type == "deposit":
                    account.balance += amount
                else:
                    account.balance -= amount

                transaction = Transaction(
                    account_id=account.id,
                    amount=amount,
                    type=transaction_type,
                    created_at=transaction_date,
                )

                db.add(transaction)
                created_transactions += 1

            db.commit()

        test_users.append(
            {
                "id": db_user.id,
                "username": db_user.username,
                "email": db_user.email,
                "password": SEED_USER_PASSWORD,
                "role": db_user.role,
            }
        )

    return {
        "message": "Database reset and reseeded successfully",
        "seed_source": seed_source,
        "users_created": created_users,
        "customers_created": created_customers,
        "accounts_created": created_accounts,
        "transactions_created": created_transactions,
        "test_users": test_users,
    }