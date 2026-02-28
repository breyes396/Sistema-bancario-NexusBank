# NexusBank API (Guía rápida para Postman)

Esta guía es para probar rápido con copiar/pegar.

## 1) Levantar el proyecto

```bash
docker compose up -d
pnpm install
pnpm dev
```

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


