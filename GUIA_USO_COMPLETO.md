# Guía única de levantamiento y uso completo del sistema

Esta guía te lleva desde cero para ejecutar **base de datos + backend + frontend**, cargar datos iniciales y usar todo el flujo funcional.

---

## 1) Requisitos previos

Instala y verifica:

- **Docker Desktop** (con Docker Compose habilitado)
- **Python 3.10+** (recomendado 3.11)
- **Node.js + npm** (recomendado Node 20+)
- **PowerShell** (Windows)

Verificación rápida:

```powershell
docker --version
docker compose version
python --version
node --version
npm --version
```

---

## 2) Variables de entorno (`.env` en la raíz)

El proyecto usa el archivo `.env` en la carpeta raíz `financial-system`.

Si no existe, créalo con este contenido base:

```dotenv
POSTGRES_USER=admin
POSTGRES_PASSWORD=admin123
POSTGRES_DB=financial_db
POSTGRES_PORT=5433

ADMIN_REGISTRATION_KEY=supersecretkey
JWT_SECRET_KEY=your_secret_key_here
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

USERS_URL=https://jsonplaceholder.typicode.com/users
TODOS_URL=https://jsonplaceholder.typicode.com/todos

# Opcionales para seed
SEED_ADMIN_USERNAME=admin.dev
SEED_ADMIN_EMAIL=admin.dev@local.test
SEED_ADMIN_PASSWORD=Admin123!
SEED_USER_PASSWORD=SeedUser123!
```

> Importante:
> - `POSTGRES_PORT` debe ser el mismo que usa Docker y backend.
> - `JWT_SECRET_KEY` es obligatorio (si está vacío, el backend falla al autenticar).

---

## 3) Levantar PostgreSQL con Docker

Desde la raíz del proyecto (`financial-system`):

```powershell
docker compose up -d postgres
docker compose ps
```

Deberías ver el contenedor `financial_postgres` en estado `running`.

---

## 4) Levantar backend (FastAPI)

Abre una terminal en `financial-system/backend`:

```powershell
cd backend
```

### Opción recomendada (script existente)

```powershell
.\setup.ps1
```

Si PowerShell bloquea scripts:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\setup.ps1
```

Luego activa el entorno (si no quedó activo):

```powershell
.\venv\Scripts\Activate.ps1
```

Inicia el backend:

```powershell
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Validación:

- Swagger: http://127.0.0.1:8000/docs
- OpenAPI JSON: http://127.0.0.1:8000/openapi.json

---

## 5) Cargar datos iniciales (seed)

Con backend arriba, en otra terminal ejecuta:

```powershell
Invoke-RestMethod -Method Post -Uri http://127.0.0.1:8000/seed/
```

Esto:
- limpia tablas (`users`, `customers`, `accounts`, `transactions`)
- crea usuarios de prueba
- crea cuentas y transacciones de ejemplo
- devuelve `test_users` con credenciales generadas

Credenciales por defecto más comunes (si no sobrescribes variables de seed):
- **Admin**: `admin.dev` / `Admin123!`
- **Usuarios seed**: contraseña `SeedUser123!`

---

## 6) Levantar frontend (Angular)

Abre otra terminal en `financial-system/financial-frontend`:

```powershell
cd financial-frontend
npm install
npm start
```

El frontend corre en:

- https://localhost:4200

> Nota: el proyecto usa SSL en desarrollo (`ng serve --ssl true`).
> Es normal que el navegador pida confirmar certificado local la primera vez.

Proxy API ya configurado:
- `/api` -> `http://127.0.0.1:8000`

---

## 7) Flujo de uso completo (usuario final)

## 7.1 Iniciar sesión

1. Entra a `https://localhost:4200`.
2. Usa credenciales del seed (ej. `admin.dev` / `Admin123!`).
3. Al autenticar, te redirige a `Dashboard`.

## 7.2 Dashboard (`/dashboard`)

Muestra:
- tarjetas de cuentas
- transacciones recientes
- gráficos de depósitos/retiros
- historial de balance

## 7.3 Transactions / Accounts (`/accounts`)

Muestra:
- resumen financiero
- transacciones recientes
- pagos programados (visual)

## 7.4 Register Account (`/register-account`)

Aquí se gestiona perfil de cliente:
- si no tienes perfil, crea cliente y cuenta automáticamente al guardar
- si ya existe, actualiza los datos
- valida mayoría de edad (18+)

## 7.5 Sidebar

Permite:
- navegar entre módulos
- cambiar idioma (`ES` / `EN`)
- subir avatar de perfil (máx 5 MB)
- cerrar sesión

---

## 8) Operaciones administrativas por API (Postman o Swagger)

El frontend consume lectura y perfil, pero algunas operaciones (como registrar transacciones) se usan mejor por API.

### Colección Postman incluida

Importa:

- `backend/documents/GenesisAPI.postman_collection.json`

Configura variable:

- `baseUrl = http://127.0.0.1:8000`

### Endpoints clave

- `POST /seed/` -> reset + carga de datos
- `POST /api/auth/register` -> crear usuario
- `POST /api/auth/login` -> login (form-urlencoded)
- `GET /api/auth/me` -> perfil autenticado
- `GET /api/customers/` -> clientes (admin ve todos)
- `POST /api/accounts/` -> crear cuenta
- `POST /api/transactions/` -> crear transacción (**solo admin**)
- `GET /api/transactions/account/{account_id}` -> historial por cuenta

---

## 9) Detener todo

En terminales de frontend/backend: `Ctrl + C`

Para apagar base de datos:

```powershell
docker compose down
```

Si quieres borrar también el volumen de datos:

```powershell
docker compose down -v
```

---

## 10) Solución rápida de problemas

- **No conecta frontend con backend**
  - verifica backend en `http://127.0.0.1:8000`
  - verifica frontend en `https://localhost:4200`
  - revisa `financial-frontend/proxy.conf.json`

- **`JWT_SECRET_KEY is not configured`**
  - completa `JWT_SECRET_KEY` en `.env`

- **Error al activar `setup.ps1`**
  - ejecuta: `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`

- **Puerto de PostgreSQL ocupado**
  - cambia `POSTGRES_PORT` en `.env` (y reinicia `docker compose`)

- **`ModuleNotFoundError` con `app`**
  - ejecuta `uvicorn app.main:app ...` desde la carpeta `backend`

- **Integración externa (`/api/integration/integrated-data`) devuelve vacío/nulo**
  - en el estado actual del código, ese endpoint está declarado pero no retorna datos integrados.

---

## 11) Orden recomendado de arranque diario

1. `docker compose up -d postgres`
2. backend (`cd backend` + activar venv + `uvicorn ...`)
3. frontend (`cd financial-frontend` + `npm start`)
4. (opcional) `POST /seed/` para refrescar datos de prueba

Con eso el sistema queda operativo de extremo a extremo.
