# NexusBank - Sistema Bancario API

## Accesos Rapidos
- Swagger ms-postgres: `http://localhost:3006/api-docs`
- Swagger ms-mongo: `http://localhost:3006/api-docs`
- Base API ms-postgres: `http://localhost:3006/api/v1`
- Base API ms-mongo: `http://localhost:3006/api/v1`

En Swagger (`/api-docs`) usa el selector superior para alternar entre las dos especificaciones:
- `Postgre`
- `Mongo`

## Descripcion General
NexusBank es una plataforma bancaria backend que permite gestionar autenticacion, usuarios, cuentas, transferencias, depositos, favoritos, seguridad antifraude y promociones.

El sistema trabaja con roles:
- Administrador (Admin)
- Empleado (Employee)
- Cliente (Client)

Ademas, incluye controles de seguridad por JWT, validacion de roles, rate limiters y auditoria de operaciones criticas.

## Estructura Principal
- `Bancario-NexusBank/`: Frontend React + Vite
- `ms-mongo/`: Microservicio MongoDB (catalogo, favoritos, seguridad)
- `ms-postgres/`: Microservicio PostgreSQL (auth, usuarios, cuentas, transacciones)

## Credenciales de Inicio
Administrador por defecto (entorno local):
- Email: `adminb@nexusbank.com`
- Password: `ADMINB`

Recomendacion: cambiar credenciales en ambientes no locales.

## Configuracion Tecnica
### Importante
Crear archivo `.env` con los valores de tu entorno. No subir secretos al repositorio.

### Contenido base del archivo .env
```env
NODE_ENV=development
PORT=3006

# MongoDB
URI_MONGO=mongodb://localhost:27017/NexusBank

# PostgreSQL
DB_HOST=localhost
DB_PORT=5435
DB_NAME=NexusBank
DB_USERNAME=root
DB_PASSWORD=admin
DB_SQL_LOGGING=false

# JWT
JWT_SECRET=<JWT_SECRET>
JWT_EXPIRES_IN=30m
JWT_REFRESH_EXPIRES_IN=7d
JWT_ISSUER=AuthService
JWT_AUDIENCE=AuthService

# SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_ENABLE_SSL=true
SMTP_USERNAME=narutoshippude745@gmail.com
SMTP_PASSWORD=<SMTP_APP_PASSWORD>
EMAIL_FROM=narutoshippude745@gmail.com
EMAIL_FROM_NAME=AuthDotnet App

# Verificacion
VERIFICATION_EMAIL_EXPIRY_HOURS=24
PASSWORD_RESET_EXPIRY_HOURS=1

# Frontend URL
FRONTEND_URL=http://localhost:5173

# FX API
FX_API_BASE_URL=https://api.fastforex.io
FX_API_KEY=<FX_API_KEY>
FX_BASE_CURRENCY=GTQ
FX_TIMEOUT_MS=5000

# Cloudinary
CLOUDINARY_CLOUD_NAME=<CLOUDINARY_CLOUD_NAME>
CLOUDINARY_API_KEY=<CLOUDINARY_API_KEY>
CLOUDINARY_API_SECRET=<CLOUDINARY_API_SECRET>
CLOUDINARY_BASE_URL=https://res.cloudinary.com/<CLOUDINARY_CLOUD_NAME>/image/upload/
CLOUDINARY_FOLDER=gastroflow/profiles
CLOUDINARY_DEFAULT_AVATAR_FILENAME=default-avatar_ewzxwx.png

# Upload local
UPLOAD_PATH=./uploads

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,http://localhost:3006
ADMIN_ALLOWED_ORIGINS=http://localhost:5173
```

## Levantar el Proyecto
### Requisitos
- Node.js LTS
- pnpm
- Docker + Docker Compose

### Comandos sugeridos
```bash
docker compose up -d
```

En cada servicio backend:
```bash
cd ms-mongo
pnpm install
pnpm run dev
```

```bash
cd ms-postgres
pnpm install
pnpm run dev
```

Frontend:
```bash
cd Bancario-NexusBank
npm install
npm run dev
```

Base URL local API por microservicio:
- `ms-postgres`: `http://localhost:3006/api/v1`
- `ms-mongo`: `http://localhost:3006/api/v1`

Swagger por microservicio:
- `ms-postgres`: `http://localhost:3006/api-docs`
- `ms-mongo`: `http://localhost:3006/api-docs`

Coleccion oficial del proyecto:
- `NexusBank_Coleccion_Ordenada_ES.postman_collection.json`

## Coleccion Postman Actualizada
Archivo incluido en la raiz del proyecto con todos los endpoints actuales:
- `NexusBank_Coleccion_Ordenada_ES.postman_collection.json`

Uso rapido:
1. Importar la coleccion en Postman.
2. Verificar variables de coleccion:
- `baseUrl`: `http://localhost:3006`
- `apiVersion`: `api/v1`
3. Ejecutar requests en este orden:
- `Auth/Login Admin` (guarda token en `adminToken`)
- `Auth/Login Cliente` (guarda token en `clientToken`)

## Manual de Usuario
### Parte 1: Manual del Administrador
El Administrador tiene control total sobre usuarios, cuentas, limites, depositos, promociones y seguridad operativa.

#### Que puede hacer el Administrador
1. Gestionar usuarios
- Listar todos los usuarios
- Ver detalle de clientes
- Actualizar datos de usuarios
- Endpoints: `GET /users`, `GET /users/admin/client/:id/detail`, `GET /users/:id`, `PUT /users/:id`

2. Crear clientes (registro administrativo)
- Endpoint: `POST /auth/register`

3. Gestionar cuentas bancarias
- Endpoints: `GET /accounts`, `GET /admin/accounts/:accountId/details`, `PUT /accounts/:id/limits`, `GET /accounts/:id/limits/admin`, `PUT /accounts/:id/limits/admin`

4. Gestionar depositos
- Endpoints: `PUT /accounts/deposit-requests/:id/amount`, `PUT /accounts/deposit-requests/:id/approve`, `PUT /accounts/deposit-requests/:id/revert`

5. Supervision de transacciones
- Endpoints: `GET /admin/transactions`, `GET /dashboard/transaction-ranking`

6. Gestionar promociones bancarias
- Endpoints: `GET /catalog/admin/all`, `GET /catalog/admin/audit/all`, `POST /catalog/admin/create`, `PUT /catalog/admin/:id`, `PUT /catalog/admin/:id/status`, `GET /catalog/admin/:id/audit`, `DELETE /catalog/admin/:id`

7. Seguridad operativa y bloqueos
- Endpoints: `POST /admin/accounts/:id/freeze`, `POST /admin/accounts/:id/unfreeze`, `GET /admin/accounts/:id/block-history`

#### Que no puede hacer el Administrador
- No debe operar con credenciales productivas en entorno local
- No debe omitir trazabilidad de cambios criticos
- No debe compartir tokens o secretos por canales no seguros

### Parte 2: Manual del Cliente
El Cliente puede administrar su perfil, cuentas, transferencias, depositos y favoritos.

#### Que puede hacer el Cliente
1. Autenticarse y gestionar acceso
- Endpoints: `POST /auth/login`, `POST /auth/verify-email`, `GET /auth/verify-email?token=...`, `POST /auth/forgot-password`, `POST /auth/reset-password`

2. Gestionar perfil personal
- Endpoints: `GET /auth/profile`, `PUT /profile/edit`

3. Gestionar cuentas propias
- Endpoints: `POST /accounts`, `GET /accounts`, `GET /my-account/history`, `GET /my-account/balance/convert?toCurrency=USD`

4. Solicitar depositos
- Endpoint: `POST /accounts/deposit-requests`

5. Realizar transferencias
- Endpoints: `POST /accounts/transfers`, `PUT /accounts/transfers/:id/revert`
- Reglas:
  - Maximo diario por origen: Q10,000
  - Maximo diario por cuenta destino especifica (origen->destino): Q2,000

6. Consultar seguridad personal
- Endpoints: `GET /security/status`, `GET /security/failed-attempts`, `GET /security/fraud-alerts`

7. Gestionar favoritos
- Endpoints: `POST /favorites`, `GET /favorites`, `GET /favorites/:id`, `PUT /favorites/:id`, `DELETE /favorites/:id`

8. Consultar promociones publicas
- Endpoints: `GET /catalog`, `GET /catalog/:id`

#### Que no puede hacer el Cliente
- No puede acceder a endpoints administrativos
- No puede modificar limites globales de cuentas
- No puede aprobar/revertir depositos de otros usuarios
- No puede congelar/descongelar cuentas

## Reportes y Consultas Administrativas
Aunque no hay exportacion PDF/Excel expuesta en esta API actual, el administrador puede obtener datos analiticos mediante:
- `GET /dashboard/transaction-ranking`
- `GET /admin/transactions`
- `GET /catalog/admin/audit/all`

Estos endpoints permiten construir reportes externos en BI o scripts internos.

## Ejemplos API con JSON
### Parte 1: Ejemplos para Administrador
1. Login Admin
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "adminb@nexusbank.com",
  "password": "ADMINB"
}
```

2. Crear Cliente (Admin/Employee)
```http
POST /api/v1/auth/register
Authorization: Bearer {{token_admin}}
Content-Type: application/json

{
  "name": "Cliente Demo",
  "email": "cliente.demo@nexusbank.com",
  "password": "Cliente123!",
  "documentType": "DPI",
  "documentNumber": "1234567890101",
  "income": 8500
}
```

3. Ajustar limites de cuenta
```http
PUT /api/v1/accounts/{{account_id}}/limits
Authorization: Bearer {{token_admin}}
Content-Type: application/json

{
  "perTransactionLimit": 2000,
  "dailyTransactionLimit": 10000,
  "reason": "Ajuste por politica operativa"
}
```

4. Aprobar deposito
```http
PUT /api/v1/accounts/deposit-requests/{{deposit_request_id}}/approve
Authorization: Bearer {{token_admin}}
Content-Type: application/json

{
  "couponId": "cat_ABC123"
}
```

5. Crear promocion
```http
POST /api/v1/catalog/admin/create
Authorization: Bearer {{token_admin}}
Content-Type: application/json

{
  "name": "Cashback 10% Depositos",
  "promotionType": "DEPOSITO_CASHBACK",
  "minDepositAmount": 1000,
  "cashbackPercentage": 10,
  "startDate": "2026-03-01",
  "endDate": "2026-08-31"
}
```

### Parte 2: Ejemplos para Cliente
1. Login Cliente
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "cliente.demo@nexusbank.com",
  "password": "Cliente123!"
}
```

2. Crear cuenta bancaria
```http
POST /api/v1/accounts
Authorization: Bearer {{token_cliente}}
Content-Type: application/json

{
  "accountType": "ahorro"
}
```

3. Solicitar deposito
```http
POST /api/v1/accounts/deposit-requests
Authorization: Bearer {{token_cliente}}
Content-Type: application/json

{
  "destinationAccountNumber": "001-1234567890-1",
  "amount": 500,
  "description": "Deposito en ventanilla"
}
```

4. Crear transferencia
```http
POST /api/v1/accounts/transfers
Authorization: Bearer {{token_cliente}}
Content-Type: application/json

{
  "sourceAccountNumber": "1000000001",
  "destinationAccountNumber": "1000000002",
  "recipientType": "TERCERO",
  "amount": 1500,
  "description": "Pago de prueba"
}
```

5. Crear favorito
```http
POST /api/v1/favorites
Authorization: Bearer {{token_cliente}}
Content-Type: application/json

{
  "accountNumber": "001-9115890794-1",
  "accountType": "ahorro",
  "alias": "Mama"
}
```

## Resumen de Codigos de Respuesta
| Codigo | Significado | Ejemplo |
|---|---|---|
| 200 | OK - Peticion exitosa | Consultas y actualizaciones |
| 201 | Created - Recurso creado | Registro de usuario, cuenta, favorito |
| 400 | Bad Request | Validacion o regla de negocio invalida |
| 401 | Unauthorized | Token faltante o invalido |
| 403 | Forbidden | Rol sin permiso |
| 404 | Not Found | Recurso no encontrado |
| 409 | Conflict | Recurso duplicado o estado incompatible |
| 423 | Locked | Cuenta bloqueada/congelada |
| 500 | Internal Server Error | Error interno del servidor |

## Autenticacion y Tokens
Todos los endpoints protegidos requieren token JWT Bearer.

```text
Authorization: Bearer <JWT>
```

Tokens por rol en Postman:
- `token_admin`
- `token_employee`
- `token_cliente`

Duraciones configurables por `.env`:
- `JWT_EXPIRES_IN`
- `JWT_REFRESH_EXPIRES_IN`

## Recomendacion Final
Usa siempre la coleccion `NexusBank_Coleccion_Ordenada_ES.postman_collection.json` y mantenla sincronizada con este README para que QA, desarrollo y documentacion avancen en paralelo.
