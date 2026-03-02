# NexusBank - Sistema Bancario API

## 📋 Descripción General
NexusBank es una plataforma bancaria backend que permite gestionar autenticación, usuarios, cuentas, transferencias, depósitos, favoritos, seguridad antifraude y promociones.

El sistema trabaja con roles:
- **Administrador (Admin)**
- **Empleado (Employee)**
- **Cliente (Client)**

Además, incluye controles de seguridad por JWT, validación de roles, rate limiters y auditoría de operaciones críticas.

---

## 🔐 Credenciales de Inicio

**Administrador por defecto (entorno local):**
- Email: `adminb@nexusbank.com`
- Password: `ADMINB`

> Recomendación: cambiar credenciales en ambientes no locales.

---

## ⚙️ Configuración Técnica

### ⚠️ IMPORTANTE
Crear archivo `.env` con los valores de tu entorno. No subir secretos al repositorio.

### 📝 Contenido base del archivo `.env`

```env
NODE_ENV = development
PORT = 3006
 
# MongoDB (Restaurantes, Mesas, Platos) - Local sin autenticación
URI_MONGO=mongodb://localhost:27017/NexusBank
 
# Database PostgreSQL (Usuarios, Autenticación)
DB_HOST=localhost
DB_PORT=5435
DB_NAME=NexusBank
DB_USERNAME=root
DB_PASSWORD=admin
DB_SQL_LOGGING=false
 
JWT_SECRET=MyVerySecretKeyForJWTTokenAuthenticationWith256Bits!
JWT_EXPIRES_IN=30m
JWT_REFRESH_EXPIRES_IN=7d
JWT_ISSUER=AuthService
JWT_AUDIENCE=AuthService
 
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_ENABLE_SSL=true
SMTP_USERNAME=kinalsports@gmail.com
SMTP_PASSWORD=yrsd prvf kwat toee
EMAIL_FROM=kinalsports@gmail.com
EMAIL_FROM_NAME=AuthDotnet App
 
# Verification Tokens (en horas)
VERIFICATION_EMAIL_EXPIRY_HOURS=24
PASSWORD_RESET_EXPIRY_HOURS=1
 
# Frontend URL (para enlaces en emails)
FRONTEND_URL=http://localhost:5173
 
# FX API (Conversion de divisas)
FX_API_BASE_URL=https://api.fastforex.io
FX_API_KEY=10aa904cb9-fb754e1ad4-tb3guj
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

### ▶️ Levantar el proyecto

```bash
docker compose up -d
pnpm install
pnpm run dev
```

Base URL local:

```text
http://localhost:3006/nexusBank/v1
```

Colección oficial del proyecto:

- `NexusBank_Coleccion_Ordenada_ES.postman_collection.json`

---

# 📖 MANUAL DE USUARIO

## PARTE 1: MANUAL DEL ADMINISTRADOR

El Administrador tiene control total sobre usuarios, cuentas, límites, depósitos, promociones y seguridad operativa.

### ✅ QUÉ PUEDE HACER EL ADMINISTRADOR

#### 1. **Gestionar usuarios**
- Listar todos los usuarios.
- Ver detalle de clientes.
- Actualizar datos de usuarios.

Endpoints clave:
- `GET /users`
- `GET /users/admin/client/:id/detail`
- `GET /users/:id`
- `PUT /users/:id`

#### 2. **Crear clientes (registro administrativo)**
- Crear clientes desde administración (o empleado autorizado).
- Iniciar flujo de verificación de correo.

Endpoint:
- `POST /auth/register`

#### 3. **Gestionar cuentas bancarias**
- Ver cuentas del sistema.
- Consultar detalles administrativos de cuenta.
- Ajustar límites por operación y diarios.

Endpoints:
- `GET /accounts`
- `GET /admin/accounts/:accountId/details`
- `PUT /accounts/:id/limits`
- `GET /accounts/:id/limits/admin`
- `PUT /accounts/:id/limits/admin`

#### 4. **Gestionar depósitos**
- Revisar solicitudes de depósito.
- Corregir monto de solicitud pendiente.
- Aprobar o revertir depósitos.

Endpoints:
- `PUT /accounts/deposit-requests/:id/amount`
- `PUT /accounts/deposit-requests/:id/approve`
- `PUT /accounts/deposit-requests/:id/revert`

#### 5. **Supervisión de transacciones**
- Consultar transacciones globales.
- Obtener ranking de transacciones para dashboard.

Endpoints:
- `GET /admin/transactions`
- `GET /dashboard/transaction-ranking`

#### 6. **Gestionar promociones bancarias**
- Crear, actualizar, cambiar estado y desactivar promociones.
- Consultar auditoría global y por promoción.

Endpoints:
- `GET /catalog/admin/all`
- `GET /catalog/admin/audit/all`
- `POST /catalog/admin/create`
- `PUT /catalog/admin/:id`
- `PUT /catalog/admin/:id/status`
- `GET /catalog/admin/:id/audit`
- `DELETE /catalog/admin/:id`

#### 7. **Seguridad operativa y bloqueos**
- Congelar y descongelar cuentas.
- Consultar historial de bloqueos.

Endpoints:
- `POST /admin/accounts/:id/freeze`
- `POST /admin/accounts/:id/unfreeze`
- `GET /admin/accounts/:id/block-history`

### ❌ QUÉ NO PUEDE HACER EL ADMINISTRADOR

- No debe operar con credenciales productivas en entorno local.
- No debe omitir trazabilidad de cambios críticos (auditoría).
- No debe compartir tokens o secretos por canales no seguros.

---

## PARTE 2: MANUAL DEL CLIENTE

El Cliente puede administrar su perfil, cuentas, transferencias, depósitos y favoritos.

### ✅ QUÉ PUEDE HACER EL CLIENTE

#### 1. **Autenticarse y gestionar acceso**
- Iniciar sesión.
- Verificar correo.
- Recuperar contraseña.

Endpoints:
- `POST /auth/login`
- `POST /auth/verify-email`
- `GET /auth/verify-email?token=...`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`

#### 2. **Gestionar perfil personal**
- Ver perfil autenticado.
- Editar perfil propio.

Endpoints:
- `GET /auth/profile`
- `PUT /profile/edit`

#### 3. **Gestionar cuentas propias**
- Crear cuenta.
- Ver cuentas.
- Ver historial.
- Convertir saldo.

Endpoints:
- `POST /accounts`
- `GET /accounts`
- `GET /my-account/history`
- `GET /my-account/balance/convert?toCurrency=USD`

#### 4. **Solicitar depósitos**
- Crear solicitud de depósito a cuenta destino.

Endpoint:
- `POST /accounts/deposit-requests`

#### 5. **Realizar transferencias**
- Transferir a cuentas propias o de terceros.
- Revertir transferencias en ventana permitida.

Endpoints:
- `POST /accounts/transfers`
- `PUT /accounts/transfers/:id/revert`

Reglas clave:
- Máximo diario por origen: **Q10,000**.
- Máximo diario por cuenta destino específica (origen→destino): **Q2,000**.

#### 6. **Consultar seguridad personal**
- Ver estado de seguridad.
- Ver intentos fallidos.
- Ver alertas de fraude.

Endpoints:
- `GET /security/status`
- `GET /security/failed-attempts`
- `GET /security/fraud-alerts`

#### 7. **Gestionar favoritos**
- Crear, listar, editar y eliminar favoritos.

Endpoints:
- `POST /favorites`
- `GET /favorites`
- `GET /favorites/:id`
- `PUT /favorites/:id`
- `DELETE /favorites/:id`

#### 8. **Consultar promociones públicas**
- Ver promociones activas.
- Ver detalle de promoción.

Endpoints:
- `GET /catalog`
- `GET /catalog/:id`

### ❌ QUÉ NO PUEDE HACER EL CLIENTE

- No puede acceder a endpoints administrativos.
- No puede modificar límites globales de cuentas.
- No puede aprobar/revertir depósitos de otros usuarios.
- No puede congelar/descongelar cuentas.

---

## 📊 Reportes y consultas administrativas

Aunque no hay exportación PDF/Excel expuesta en esta API actual, el administrador puede obtener datos analíticos mediante:

- `GET /dashboard/transaction-ranking`
- `GET /admin/transactions`
- `GET /catalog/admin/audit/all`

Estos endpoints permiten construir reportes externos en BI o scripts internos.

---

# 🔌 EJEMPLOS API CON JSON

## PARTE 1: EJEMPLOS PARA ADMINISTRADOR

### 1️⃣ Login Admin

```http
POST /nexusBank/v1/auth/login
Content-Type: application/json
```

```json
{
  "email": "adminb@nexusbank.com",
  "password": "ADMINB"
}
```

### 2️⃣ Crear Cliente (Admin/Employee)

```http
POST /nexusBank/v1/auth/register
Authorization: Bearer {{token_admin}}
Content-Type: application/json
```

```json
{
  "name": "Cliente Demo",
  "email": "cliente.demo@nexusbank.com",
  "password": "Cliente123!",
  "documentType": "DPI",
  "documentNumber": "1234567890101",
  "income": 8500
}
```

### 3️⃣ Ajustar límites de cuenta

```http
PUT /nexusBank/v1/accounts/{{account_id}}/limits
Authorization: Bearer {{token_admin}}
Content-Type: application/json
```

```json
{
  "perTransactionLimit": 2000,
  "dailyTransactionLimit": 10000,
  "reason": "Ajuste por política operativa"
}
```

### 4️⃣ Aprobar depósito

```http
PUT /nexusBank/v1/accounts/deposit-requests/{{deposit_request_id}}/approve
Authorization: Bearer {{token_admin}}
Content-Type: application/json
```

```json
{
  "couponId": "cat_ABC123"
}
```

### 5️⃣ Crear promoción

```http
POST /nexusBank/v1/catalog/admin/create
Authorization: Bearer {{token_admin}}
Content-Type: application/json
```

```json
{
  "name": "Cashback 10% Depósitos",
  "promotionType": "DEPOSITO_CASHBACK",
  "minDepositAmount": 1000,
  "cashbackPercentage": 10,
  "startDate": "2026-03-01",
  "endDate": "2026-08-31"
}
```

## PARTE 2: EJEMPLOS PARA CLIENTE

### 1️⃣ Login Cliente

```http
POST /nexusBank/v1/auth/login
Content-Type: application/json
```

```json
{
  "email": "cliente.demo@nexusbank.com",
  "password": "Cliente123!"
}
```

### 2️⃣ Crear cuenta bancaria

```http
POST /nexusBank/v1/accounts
Authorization: Bearer {{token_cliente}}
Content-Type: application/json
```

```json
{
  "accountType": "ahorro"
}
```

### 3️⃣ Solicitar depósito

```http
POST /nexusBank/v1/accounts/deposit-requests
Authorization: Bearer {{token_cliente}}
Content-Type: application/json
```

```json
{
  "destinationAccountNumber": "001-1234567890-1",
  "amount": 500,
  "description": "Depósito en ventanilla"
}
```

### 4️⃣ Crear transferencia

```http
POST /nexusBank/v1/accounts/transfers
Authorization: Bearer {{token_cliente}}
Content-Type: application/json
```

```json
{
  "sourceAccountNumber": "1000000001",
  "destinationAccountNumber": "1000000002",
  "recipientType": "TERCERO",
  "amount": 1500,
  "description": "Pago de prueba"
}
```

### 5️⃣ Crear favorito

```http
POST /nexusBank/v1/favorites
Authorization: Bearer {{token_cliente}}
Content-Type: application/json
```

```json
{
  "accountNumber": "001-9115890794-1",
  "accountType": "ahorro",
  "alias": "Mamá"
}
```

---

## 📌 Resumen de Códigos de Respuesta

| Código | Significado | Ejemplo |
|--------|-------------|---------|
| 200 | OK - Petición exitosa | Consultas y actualizaciones |
| 201 | Created - Recurso creado | Registro de usuario, cuenta, favorito |
| 400 | Bad Request | Validación o regla de negocio inválida |
| 401 | Unauthorized | Token faltante o inválido |
| 403 | Forbidden | Rol sin permiso |
| 404 | Not Found | Recurso no encontrado |
| 409 | Conflict | Recurso duplicado o estado incompatible |
| 423 | Locked | Cuenta bloqueada/congelada |
| 500 | Internal Server Error | Error interno del servidor |

---

## 🔐 Autenticación y Tokens

Todos los endpoints protegidos requieren token **JWT Bearer**.

```http
Authorization: Bearer <JWT>
```

Tokens por rol en Postman:
- `token_admin`: token de administrador
- `token_employee`: token de empleado
- `token_cliente`: token de cliente

Duraciones configurables por `.env`:
- `JWT_EXPIRES_IN`
- `JWT_REFRESH_EXPIRES_IN`

---

## ✅ Recomendación final

Usa siempre la colección:
- `NexusBank_Coleccion_Ordenada_ES.postman_collection.json`

y mantenla sincronizada con este README para que QA, desarrollo y documentación avancen en paralelo.
