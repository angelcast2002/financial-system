"""Carga de datos semilla para entorno de desarrollo."""

import httpx
import random
from decimal import Decimal
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import delete

from app.models.customer import Customer
from app.models.account import Account
from app.models.transaction import Transaction

import os

from dotenv import load_dotenv

load_dotenv()

USERS_URL = os.getenv("USERS_URL")


async def seed_database(db: Session):
    """Reinicia datos transaccionales y carga clientes/cuentas/transacciones de prueba."""

    db.execute(delete(Transaction))
    db.execute(delete(Account))
    db.execute(delete(Customer))
    db.commit()

    async with httpx.AsyncClient() as client:
        response = await client.get(USERS_URL)

    users = response.json()

    created_users = 0

    for user in users:

        name_parts = user["name"].split()

        new_customer = Customer(
            first_name=name_parts[0],
            last_name=" ".join(name_parts[1:]) if len(name_parts) > 1 else "",
            email=user["email"],
            dpi=str(random.randint(1000000000000, 9999999999999)),
            birth_date=datetime(1995, 1, 1),
            address=user["address"]["street"],
            department=user["address"]["city"],
            municipality=user["address"]["suite"],
        )

        db.add(new_customer)
        db.commit()
        db.refresh(new_customer)

        # Crear entre una y dos cuentas por cliente.
        for _ in range(random.randint(1, 2)):

            account = Account(
                customer_id=new_customer.id,
                account_number=str(random.randint(1000000000, 9999999999)),
                balance=Decimal("0.00"),
            )

            db.add(account)
            db.commit()
            db.refresh(account)

            # Generar transacciones distribuidas en 8 semanas.
            today = datetime.now()

            for _ in range(random.randint(20, 35)):

                amount = Decimal(random.randint(50, 500))
                transaction_type = random.choice(["deposit", "withdraw"])

                # Fecha aleatoria en las últimas 8 semanas.
                random_days = random.randint(0, 56)
                transaction_date = today - timedelta(days=random_days)

                # Evitar saldos negativos en retiros.
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
                    created_at=transaction_date
                )

                db.add(transaction)

            db.commit()

        created_users += 1

    return {
        "message": "Database reseeded successfully",
        "users_created": created_users
    }