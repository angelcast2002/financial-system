"""Servicios de integración con APIs externas."""

import os
import httpx
from fastapi import HTTPException
from dotenv import load_dotenv

load_dotenv()

USERS_URL = os.getenv("USERS_URL")
TODOS_URL = os.getenv("TODOS_URL")


async def get_integrated_data():
    """Consulta fuentes externas y combina usuarios con sus tareas."""

    timeout = httpx.Timeout(10.0, connect=5.0)

    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            users_response = await client.get(USERS_URL)
            todos_response = await client.get(TODOS_URL)

        # Validar respuestas HTTP.
        if users_response.status_code != 200:
            raise HTTPException(status_code=502, detail="Users service unavailable")

        if todos_response.status_code != 200:
            raise HTTPException(status_code=502, detail="Todos service unavailable")

        users = users_response.json()
        todos = todos_response.json()

    except httpx.RequestError:
        raise HTTPException(status_code=503, detail="External service connection error")

    # Construir índice por id de usuario.
    users_dict = {user["id"]: user for user in users}

    integrated = [
        {
            "user": users_dict[todo["userId"]]["name"],
            "email": users_dict[todo["userId"]]["email"],
            "id": todo["id"],
            "title": todo["title"],
            "completed": todo["completed"],
        }
        for todo in todos
        if todo["userId"] in users_dict
    ]

    return integrated