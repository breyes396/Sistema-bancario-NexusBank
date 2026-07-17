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

## 🔐 Credenciales de Inicio (Entorno Local)

El sistema se inicializa automáticamente con dos usuarios de prueba predeterminados para la validación de roles en Swagger, Postman, la aplicación móvil y el panel de administración:

### 1. Administrador (Admin)
- **Email:** `adminb@nexusbank.com`
- **Username:** `ADMINB`
- **Password:** `ADMINB`

### 2. Empleado (Employee)
- **Email:** `empleado@nexusbank.com`
- **Username:** `EMPLEADO1`
- **Password:** `EMPLEADO1`

> [!WARNING]
> Estas credenciales son únicamente para el ambiente de desarrollo local. Se recomienda cambiarlas en ambientes de staging o producción.


## Configuracion Tecnica
### Importante
Crear archivo `.env` con los valores de tu entorno. No subir secretos al repositorio.

### Contenido del archivo .env (ms-postgres)
```env
NODE_ENV=development
PORT=3007

# MongoDB (Restaurantes, Mesas, Platos) - Local sin autenticación
URI_MONGO=mongodb://bpineda2024427_db_user:DDjTaCUzOCVNrmNj@ac-tqs0lm9-shard-00-00.6vw3viy.mongodb.net:27017,ac-tqs0lm9-shard-00-01.6vw3viy.mongodb.net:27017,ac-tqs0lm9-shard-00-02.6vw3viy.mongodb.net:27017/NexusBank?ssl=true&authSource=admin&retryWrites=true&w=majority

# Database PostgreSQL (Usuarios, Autenticación)
DB_URI=postgresql://neondb_owner:npg_gr4otsNVIFm8@ep-solitary-frost-ah6mxajj.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require
DB_SQL_LOGGING=false

JWT_SECRET=MyVerySecretKeyForJWTTokenAuthenticationWith256Bits!
JWT_EXPIRES_IN=30m
JWT_REFRESH_EXPIRES_IN=7d
JWT_ISSUER=AuthService
JWT_AUDIENCE=AuthService

SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_ENABLE_SSL=true
SMTP_USERNAME=narutoshippude745@gmail.com
SMTP_PASSWORD=rhcs dgno ywts egrt
EMAIL_FROM=byronstevepinedaluna@gmail.com
EMAIL_FROM_NAME=NexusBank
BREVO_API_KEY=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

# Verification Tokens (en horas)
VERIFICATION_EMAIL_EXPIRY_HOURS=24
PASSWORD_RESET_EXPIRY_HOURS=1

# Frontend URL (para enlaces en emails)
FRONTEND_URL=http://localhost:5173

# FX API (Conversion de divisas)
FX_BASE_CURRENCY=GTQ
FX_TIMEOUT_MS=5000

# Cloudinary (upload de imágenes de perfil)
CLOUDINARY_CLOUD_NAME=dut08rmaz
CLOUDINARY_API_KEY=279612751725163
CLOUDINARY_API_SECRET=UxGMRqU1iB580Kxb2AlDR4n4hu0
CLOUDINARY_BASE_URL=https://res.cloudinary.com/dut08rmaz/image/upload/
CLOUDINARY_FOLDER=gastroflow/profiles
CLOUDINARY_DEFAULT_AVATAR_FILENAME=default-avatar_ewzxwx.png

# File Upload (alternativa local)
UPLOAD_PATH=./uploads

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,http://localhost:3006
ADMIN_ALLOWED_ORIGINS=http://localhost:5173
```

## 🐳 Levantar el Proyecto (Manual de Instalación con Docker)

Esta guía te permitirá levantar todo el ecosistema de **NexusBank** (Base de datos PostgreSQL, MongoDB, microservicios backend, aplicación web frontend y Metro Bundler para la aplicación móvil) con un solo comando utilizando **Docker Compose**.

### Requisitos Previos
- Tener instalado **Docker Desktop** (con Docker Compose).
- Si vas a probar en un emulador o dispositivo móvil físico, asegúrate de tener el **Android SDK / Xcode** o **Expo Go** instalado.

---

### Paso 1: Levantar los contenedores con Docker Compose
Desde la raíz del proyecto, ejecuta el siguiente comando para construir e iniciar todos los servicios en segundo plano:

```bash
docker compose up --build -d
```

Esto levantará los siguientes servicios y puertos:
- **`postgres-db`**: Base de datos relacional (PostgreSQL) expuesta en el puerto `5435`.
- **`mongo-db`**: Base de datos no relacional (MongoDB) expuesta en el puerto `27017`.
- **`postgres-service`**: Microservicio backend Postgres (Auth, Cuentas, Usuarios) expuesto en el puerto `3007`.
- **`mongo-service`**: Microservicio backend Mongo (Catálogo, Favoritos, Auditoría) expuesto en el puerto `3006`.
- **`frontend`**: Aplicación web frontend (React + Vite) accesible desde tu navegador en el puerto `80` (ej. `http://localhost`).
- **`ms-android`**: Servidor de desarrollo Metro de Expo (App Móvil React Native) expuesto en el puerto `8081`.

Para ver los logs de todos los servicios en ejecución, puedes usar:
```bash
docker compose logs -f
```

---

### Paso 2: Configuración y Conexión de la App Móvil (`ms-android`)

Dado que la aplicación móvil corre a través de Expo Metro Bundler dentro de Docker, sigue estas instrucciones según tu entorno de pruebas para poder depurar y correr la app:

#### Opción A: Pruebas con Emulador de Android (Recomendado)
1. **Redirección de Puertos (adb reverse)**:
   Abre una terminal en tu máquina host (anfitrión) y ejecuta el siguiente comando para que el emulador pueda conectarse al Metro Bundler que corre en Docker:
   ```bash
   adb reverse tcp:8081 tcp:8081
   ```
2. **Redirección de APIs locales**:
   Para que el emulador pueda comunicarse con los servicios de backend expuestos localmente en los puertos `3007` y `3006`, ejecuta también:
   ```bash
   adb reverse tcp:3007 tcp:3007
   adb reverse tcp:3006 tcp:3006
   ```
3. **Archivo de variables de entorno**:
   Asegúrate de que el archivo `ms-android/.env` tenga las variables de conexión correctas hacia local en lugar de las URL públicas de Render si deseas pruebas completamente locales:
   ```env
   EXPO_PUBLIC_API_URL=http://localhost:3007/api/v1
   EXPO_PUBLIC_MONGO_API_URL=http://localhost:3006/api/v1
   EXPO_ROUTER_DISABLE_RN_NAVIGATION_CHECK=1
   ```

#### Opción B: Pruebas con Dispositivo Físico (Expo Go)
1. **Modificar `.env` móvil**:
   Abre `ms-android/.env` en tu computadora y reemplaza las URLs por la dirección IP local de tu máquina host (por ejemplo, `192.168.1.15`):
   ```env
   EXPO_PUBLIC_API_URL=http://192.168.1.15:3007/api/v1
   EXPO_PUBLIC_MONGO_API_URL=http://192.168.1.15:3006/api/v1
   EXPO_ROUTER_DISABLE_RN_NAVIGATION_CHECK=1
   ```
2. **Escaneo del QR**:
   Abre la consola de Docker o ejecuta `docker compose logs -f ms-android`. Expo generará un código QR y un enlace Metro en la consola. Escanea el código QR utilizando la app **Expo Go** en tu celular (ambos dispositivos deben estar conectados a la misma red Wi-Fi).

---

### Opción Alternativa: Levantar los servicios manualmente (Sin Docker)
Si necesitas desarrollar y prefieres correr los servicios localmente sin contenedores:

1. **Microservicio Mongo**:
   ```bash
   cd ms-mongo
   pnpm install
   pnpm run dev
   ```
2. **Microservicio Postgres**:
   ```bash
   cd ms-postgres
   pnpm install
   pnpm run dev
   ```
3. **Aplicación Web Frontend**:
   ```bash
   cd Bancario-NexusBank
   npm install
   npm run dev
   ```
4. **Aplicación Móvil**:
   ```bash
   cd ms-android
   pnpm install
   pnpm start
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
