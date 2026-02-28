# NexusBank API (Guía rápida para Postman)

Esta guía es para probar rápido con copiar/pegar.

## 1) Levantar el proyecto

```bash
docker compose up -d
pnpm install
pnpm dev
```
configuration:
```
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

.env 
Base URL:

```text
http://localhost:3006/nexusBank/v1
```

Health check:

```text
GET http://localhost:3006/nexusBank/v1/health
```

---

## 2) Login de Admin (rápido)

El sistema crea un admin por defecto al arrancar:

Request:

```http
POST /auth/login
Content-Type: application/json
```

Body:

```json
{
  "email": "adminb@nexusbank.com",
  "password": "ADMINB"
}
```

Guarda el `token`.


## 3) Crear cliente (con Admin)

```http
POST /auth/register
Authorization: Se necesita el token del admin {{adminToken}}
Content-Type: application/json
```

```json
{
  "email": "cliente1@nexusbank.com",
  "password": "Cliente123!",
  "name": "Cliente Uno",
  "username": "clienteuno",
  "phoneNumber": "12345678",
  "address": "Zona 1",
  "jobName": "Analista",
  "documentType": "DPI",
  "documentNumber": "1234567890123",
  "income": 15000,
  "accountType": "ahorro"
}
```

> Nota: el cliente debe verificar email para poder hacer login.


## 4) Verificar correo del cliente (Gmail)


## 4.1 Reenviar verificación

```http
POST /auth/resend-verification
Content-Type: application/json
```

```json
{
  "token": "AQUI_TOKEN_DE_LA_CUENTA_REGISTRADA"
}
```

## 4.2 Verificar con token

Revisa Gmail (bandeja principal, Spam o Promociones), copia el token y envíalo aquí:

```http
POST /auth/verify-email
Content-Type: application/json
```

```json
{
  "token": "AQUI_PEGA_EL_TOKEN_DEL_CORREO"
}
```


## 5) Login cliente

```http
POST /auth/login
Content-Type: application/json
```

```json
{
  "email": "cliente1@nexusbank.com",
  "password": "Cliente123!"
}
```

Guarda EL token DEL  `clientToken`.



## 6) Endpoints útil

## 5.1 Ver cuentas

```http
GET /accounts
Authorization: Bearer {{clientToken}}
```

## 5.2 Solicitar depósito

```http
POST /accounts/deposit-requests
Authorization: Bearer {{clientToken}}
Content-Type: application/json
```

```json
{
  "destinationAccountNumber": "001-1234567890-1",
  "amount": 500,
  "description": "Deposito en ventanilla"
}
```

## 5.3 Aprobar depósito (Admin)

```http
PUT /accounts/deposit-requests/SE PONE AQUI EL ID DE LA CUENTA/approve
Authorization: Bearer {{adminToken}}
```

## 5.3.1 Editar monto de solicitud de depósito (Employee/Admin)

```http
PUT /accounts/deposit-requests/SE PONE AQUI EL ID DE LA SOLICITUD/amount
Authorization: Bearer {{employeeOrAdminToken}}
Content-Type: application/json
```

```json
{
  "amount": 850,
  "reason": "Corrección de monto ingresado"
}
```

> Regla: solo se permite editar solicitudes en estado `PENDIENTE`.

## 5.4 Transferencia

```http
POST /accounts/transfers
Authorization: Bearer {{clientToken}}
Content-Type: application/json
```

```json
{
  "sourceAccountNumber": "001-1234567890-1",
  "destinationAccountNumber": "001-0987654321-5",
  "recipientType": "TERCERO",
  "amount": 1200,
  "description": "Pago"
}
```

## 5.5 Vista admin por cuenta

```http
GET /admin/accounts/:accountId/details
Authorization: Bearer {{adminToken}}
```

## 6) Promociones Bancarias (Catálogo)

El sistema tiene un catálogo de promociones exclusivas para clientes. Las promociones incluyen cashback, descuentos en transferencias, intereses por saldo mínimo, etc.

### 6.1 Ver todas las promociones activas (Público - sin login)

```http
GET /catalog
Content-Type: application/json
```

**Response:**
```json
{
  "success": true,
  "message": "Promociones disponibles",
  "count": 3,
  "data": [
    {
      "id": "cat_ABC123XYZ456",
      "name": "21% Bonificación en Depósitos Mayores a Q5,000",
      "description": "Recibe 21% de cashback en cada depósito mayor a Q5,000",
      "promotionType": "DEPOSITO_CASHBACK",
      "minDepositAmount": 5000,
      "maxDepositAmount": null,
      "cashbackPercentage": 21,
      "startDate": "2026-03-01",
      "endDate": "2026-08-31",
      "isExclusive": false,
      "createdAt": "2026-02-27T10:30:00Z"
    },
    {
      "id": "cat_DEF456UVW789",
      "name": "Interés Premium 5% Anual por Saldo Mayor a Q50,000",
      "description": "Mantén Q50,000 o más y gana 5% de interés anual",
      "promotionType": "SALDO_MINIMO_REWARD",
      "minAccountBalance": 50000,
      "cashbackPercentage": 5,
      "isExclusive": false,
      "createdAt": "2026-02-27T10:30:00Z"
    }
  ]
}
```

### 6.2 Ver detalles de una promoción específica (Público)

```http
GET /catalog/cat_ABC123XYZ456
Content-Type: application/json
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "cat_ABC123XYZ456",
    "name": "21% Bonificación en Depósitos Mayores a Q5,000",
    "description": "Recibe 21% de cashback en cada depósito mayor a Q5,000. Promoción sin límites de uso.",
    "promotionType": "DEPOSITO_CASHBACK",
    "minDepositAmount": 5000,
    "cashbackPercentage": 21,
    "startDate": "2026-03-01",
    "endDate": "2026-08-31",
    "status": "ACTIVA",
    "isExclusive": false,
    "isCurrentlyValid": true
  }
}
```

### 6.3 Crear nueva promoción (Admin solo)

```http
POST /catalog/admin/create
Authorization: Bearer {{adminToken}}
Content-Type: application/json
```

**Body - Ejemplo 1: 21% Cashback en Depósitos Mayores a Q5,000**
```json
{
  "name": "21% Bonificación en Depósitos Mayores a Q5,000",
  "description": "Recibe 21% de cashback en cada depósito mayor a Q5,000",
  "promotionType": "DEPOSITO_CASHBACK",
  "minDepositAmount": 5000,
  "cashbackPercentage": 21,
  "startDate": "2026-03-01",
  "endDate": "2026-08-31",
  "isExclusive": false,
  "notes": "Promoción de bonificación por depósitos"
}
```

**Body - Ejemplo 2: Interés 5% por Saldo > Q50,000**
```json
{
  "name": "Interés Premium 5% Anual por Saldo Mayor a Q50,000",
  "description": "Mantén Q50,000 o más y gana 5% de interés anual sobre tu saldo",
  "promotionType": "SALDO_MINIMO_REWARD",
  "minAccountBalance": 50000,
  "cashbackPercentage": 5,
  "notes": "Interés se calcula y acredita el último día de cada mes"
}
```

**Body - Ejemplo 3: 15% Descuento en Transferencias Entre Cuentas Propias**
```json
{
  "name": "15% Descuento en Transferencias Entre Cuentas Propias",
  "description": "Transfiere entre tus propias cuentas y obtén 15% de descuento",
  "promotionType": "TRANSFERENCIA_PROPIA_BONUS",
  "minTransferAmount": 1000,
  "discountPercentage": 15,
  "startDate": "2026-03-01",
  "endDate": null,
  "isExclusive": false,
  "notes": "Válida todo el año para transferencias internas"
}
```

**Body - Ejemplo 4: Bienvenida Q500**
```json
{
  "name": "Bienvenida: Q500 + 3 Transferencias Gratis",
  "description": "Abre tu cuenta ahorista y recibe Q500 de bienvenida",
  "promotionType": "APERTURA_CUENTA_BONUS",
  "cashbackAmount": 500,
  "maxUsesPerClient": 1,
  "maxUsesTotalPromotion": 1000,
  "startDate": "2026-02-27",
  "endDate": "2026-12-31",
  "isExclusive": true,
  "notes": "Válido solo para primeros 1,000 clientes"
}
```

### 6.4 Actualizar promoción (Admin solo)

```http
PUT /catalog/admin/cat_ABC123XYZ456
Authorization: Bearer {{adminToken}}
Content-Type: application/json
```

**Body:**
```json
{
  "cashbackPercentage": 25,
  "endDate": "2026-10-31",
  "maxUsesPerClient": 10,
  "reason": "Aumento de beneficio por demanda de clientes"
}
```

### 6.5 Cambiar estado de promoción (Admin solo)

```http
PUT /catalog/admin/cat_ABC123XYZ456/status
Authorization: Bearer {{adminToken}}
Content-Type: application/json
```

**Body - Pausar promoción:**
```json
{
  "newStatus": "PAUSADA",
  "reason": "Promoción pausada temporalmente por mantenimiento"
}
```

**Estados permitidos:**
- `ACTIVA` - Promoción activa
- `INACTIVA` - Desactivada
- `PAUSADA` - Pausada temporalmente
- `EXPIRADA` - Fecha de fin pasó

### 6.6 Ver todas las promociones (Admin)

```http
GET /catalog/admin/all
Authorization: Bearer {{adminToken}}
```

**Con filtros:**
```http
GET /catalog/admin/all?status=ACTIVA&type=DEPOSITO_CASHBACK
Authorization: Bearer {{adminToken}}
```

### 6.7 Ver auditoría de cambios (Admin)

```http
GET /catalog/admin/cat_ABC123XYZ456/audit
Authorization: Bearer {{adminToken}}
```

**Response:**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": "aud_XYZ789ABC123",
      "catalogId": "cat_ABC123XYZ456",
      "action": "ACTUALIZAR",
      "actorUserId": "usr_admin123",
      "previousValues": {
        "cashbackPercentage": 21,
        "endDate": "2026-08-31"
      },
      "newValues": {
        "cashbackPercentage": 25,
        "endDate": "2026-10-31"
      },
      "changedFields": ["cashbackPercentage", "endDate"],
      "reason": "Aumento de beneficio por demanda de clientes",
      "createdAt": "2026-02-27T16:00:00Z"
    }
  ]
}
```

### 6.8 Eliminar/Desactivar promoción (Admin)

```http
DELETE /catalog/admin/cat_ABC123XYZ456
Authorization: Bearer {{adminToken}}
Content-Type: application/json
```

**Body (opcional):**
```json
{
  "reason": "Promoción descontinuada"
}
```

---

## 7) Tipos de Promociones Disponibles

| Tipo | Descripción |
|------|-------------|
| `DEPOSITO_CASHBACK` | Cashback por depósitos |
| `TRANSFERENCIA_DESCUENTO` | Descuento en transferencias |
| `TRANSFERENCIA_PROPIA_BONUS` | Bonus transf. cuentas propias |
| `TRANSACCIONES_FRECUENTES` | Puntos por transacciones |
| `SALDO_MINIMO_REWARD` | Interés por saldo mínimo |
| `APERTURA_CUENTA_BONUS` | Bienvenida nuevos clientes |

---

## 8) Aplicar Cupones de Promoción en Operaciones

Los clientes pueden aplicar cupones de promoción al realizar transferencias o depósitos. Si el cupón es válido y cumple las condiciones, se aplicará automáticamente el beneficio.

### 8.1 Aplicar cupón en Transferencia

**Endpoint:** `POST /nexusBank/v1/account/transfer`

**Headers:**
```json
{
  "Authorization": "Bearer {{token_cliente}}"
}
```

**Body:**
```json
{
  "sourceAccountNumber": "1234567890",
  "destinationAccountNumber": "0987654321",
  "recipientType": "TERCERO",
  "amount": 500,
  "description": "Pago con cupón",
  "couponId": "cat_5HpxDvF3g8Kq"
}
```

**Respuesta exitosa con cupón válido:**
```json
{
  "success": true,
  "message": "Transferencia realizada exitosamente con cupón Descuento Especial 25%",
  "data": {
    "transactionId": "txn_abc123",
    "sourceAccountId": "acc_...",
    "destinationAccountId": "acc_...",
    "recipientType": "TERCERO",
    "amount": "500.00",
    "sourceNewBalance": "375.00",
    "destinationNewBalance": "1500.00",
    "appliedPromotion": {
      "id": "cat_5HpxDvF3g8Kq",
      "name": "Descuento Especial 25%",
      "discount": "125.00",
      "finalAmount": "375.00"
    }
  }
}
```

**Respuesta con cupón inválido:**
```json
{
  "success": false,
  "message": "Cupón inválido: promoción no está activa"
}
```

**Otros mensajes de error posibles:**
- `"Cupón inválido: promoción no encontrada"`
- `"Cupón inválido: promoción expirada o límite alcanzado"`
- `"Cupón inválido: esta promoción no aplica para transferencia tercero"`
- `"Cupón inválido: la transferencia debe ser mínimo Q500"`

---

### 8.2 Aplicar cupón en Depósito (al aprobar)

**Endpoint:** `PUT /nexusBank/v1/account/deposit/:id/approve`

**Headers:**
```json
{
  "Authorization": "Bearer {{token_admin_employee}}"
}
```

**Body:**
```json
{
  "couponId": "cat_9AbCdEfGhIjK"
}
```

**Respuesta exitosa con cupón válido:**
```json
{
  "success": true,
  "message": "Deposito aprobado exitosamente con cupón Cashback 10% Depósitos",
  "data": {
    "transactionId": "txn_dep123",
    "accountId": "acc_...",
    "depositAmount": "1000.00",
    "newBalance": "2100.00",
    "appliedPromotion": {
      "id": "cat_9AbCdEfGhIjK",
      "name": "Cashback 10% Depósitos",
      "cashback": "100.00",
      "totalCredited": "1100.00"
    }
  }
}
```

**Cómo funciona:**
- **Transferencias a tercero:** Aplica descuento en el monto debitado de la cuenta origen
- **Transferencias propias:** Otorga bonus o puntos adicionales
- **Depósitos:** Agrega cashback adicional al monto depositado

**Validaciones automáticas:**
- El cupón debe existir
- La promoción debe estar ACTIVA
- La promoción no debe estar expirada (fechas válidas)
- El tipo de promoción debe coincidir con la operación
- El monto debe cumplir los límites mínimos/máximos
- No debe haberse alcanzado el límite de usos

---


