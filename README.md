# NexusBank API

Guía oficial para probar la API con la colección:

- [NexusBank_Coleccion_Ordenada_ES.postman_collection.json](NexusBank_Coleccion_Ordenada_ES.postman_collection.json)

## 1) Levantar el proyecto

```bash
docker compose up -d
pnpm install
pnpm run dev
```

Base URL:

```text
http://localhost:3006/nexusBank/v1
```

Health check:

```text
GET /health
```

## 2) Credenciales y variables de Postman

Admin por defecto (se crea al iniciar):

```text
email: adminb@nexusbank.com
password: ADMINB
```

Variables recomendadas en Postman:

- `base_url` = `http://localhost:3006/nexusBank/v1`
- `token_admin`
- `token_cliente`
- `user_id`
- `account_id`
- `promotion_id`
- `favorite_id`
- `deposit_request_id`
- `transfer_id`

## 3) Reglas de negocio vigentes

- Límite diario por cuenta origen para transferencias: **Q10,000**.
- Límite diario por cuenta destino específica (par origen→destino): **Q2,000**.
- El saldo de una cuenta destino **no tiene tope máximo** por depósitos o transferencias.
- Una cuenta congelada/suspendida/bloqueada no puede enviar ni recibir operaciones según corresponda.

---

## 4) Flujo recomendado de uso

1. `POST /auth/login` con admin y guardar `token_admin`.
2. `POST /auth/register` para crear cliente.
3. Verificar email del cliente (`/auth/verify-email`) si aplica en tu flujo.
4. `POST /auth/login` con cliente y guardar `token_cliente`.
5. `POST /accounts` para crear cuenta del cliente.
6. Probar depósitos (`/accounts/deposit-requests` + aprobación admin).
7. Probar transferencias (`/accounts/transfers`).

---

## 5) Manual endpoint por endpoint (colección ordenada)

Leyenda:

- **Usuario requerido**: rol mínimo esperado.
- **Token**: si requiere `Authorization: Bearer ...`.
- **ID URL**: si requiere parámetro `:id` o similar en ruta.
- **Qué pide**: query/body mínimos para ejecutar.

### 01. Salud

#### `GET /health`
- Usuario requerido: Público
- Token: No
- ID URL: No
- Qué pide: nada
- Ejemplo: `GET {{base_url}}/health`

### 02. Autenticación

#### `POST /auth/login`
- Usuario requerido: Público
- Token: No
- ID URL: No
- Qué pide: body `email`, `password`
- Ejemplo body: `{"email":"adminb@nexusbank.com","password":"ADMINB"}`

#### `POST /auth/register`
- Usuario requerido: Admin o Employee
- Token: Sí (`token_admin` o empleado)
- ID URL: No
- Qué pide: body de registro (ej. `name`, `email`, `password`, `documentType`, `documentNumber`)
- Ejemplo body: `{"name":"Cliente Nuevo","email":"cliente@nexusbank.com","password":"123456"}`

#### `POST /auth/verify-email`
- Usuario requerido: Público
- Token: No
- ID URL: No
- Qué pide: body `token`
- Ejemplo body: `{"token":"TOKEN_VERIFICACION"}`

#### `GET /auth/verify-email?token=...`
- Usuario requerido: Público
- Token: No
- ID URL: No
- Qué pide: query `token`
- Ejemplo: `GET {{base_url}}/auth/verify-email?token=TOKEN_VERIFICACION`

#### `POST /auth/resend-verification`
- Usuario requerido: Público
- Token: No
- ID URL: No
- Qué pide: body de reenvío (según validación vigente)
- Ejemplo body: `{"email":"cliente@nexusbank.com"}`

#### `POST /auth/forgot-password`
- Usuario requerido: Público
- Token: No
- ID URL: No
- Qué pide: body `email`
- Ejemplo body: `{"email":"cliente@nexusbank.com"}`

#### `POST /auth/reset-password`
- Usuario requerido: Público
- Token: No
- ID URL: No
- Qué pide: body `token`, `newPassword`
- Ejemplo body: `{"token":"TOKEN_RESET","newPassword":"NuevaClave123"}`

### 03. Mi Cuenta

#### `GET /auth/profile`
- Usuario requerido: Cliente autenticado
- Token: Sí (`token_cliente`)
- ID URL: No
- Qué pide: nada
- Ejemplo: `GET {{base_url}}/auth/profile`

#### `PUT /profile/edit`
- Usuario requerido: Cliente
- Token: Sí
- ID URL: No
- Qué pide: body con campos de perfil permitidos
- Ejemplo body: `{"phone":"+50255556666"}`

#### `GET /my-account/balance/convert`
- Usuario requerido: Cliente
- Token: Sí
- ID URL: No
- Qué pide: query `toCurrency`
- Ejemplo: `GET {{base_url}}/my-account/balance/convert?toCurrency=USD`

#### `GET /my-account/history`
- Usuario requerido: Cliente
- Token: Sí
- ID URL: No
- Qué pide: opcional filtros por query
- Ejemplo: `GET {{base_url}}/my-account/history`

### 04. Usuarios

#### `GET /users`
- Usuario requerido: Admin
- Token: Sí (`token_admin`)
- ID URL: No
- Qué pide: nada
- Ejemplo: `GET {{base_url}}/users`

#### `GET /users/admin/client/:id/detail`
- Usuario requerido: Admin
- Token: Sí
- ID URL: Sí (`:id`)
- Qué pide: `user_id` en ruta
- Ejemplo: `GET {{base_url}}/users/admin/client/{{user_id}}/detail`

#### `GET /users/:id`
- Usuario requerido: Admin
- Token: Sí
- ID URL: Sí (`:id`)
- Qué pide: `user_id` en ruta
- Ejemplo: `GET {{base_url}}/users/{{user_id}}`

#### `PUT /users/:id`
- Usuario requerido: Usuario autenticado (operación recomendada para Admin)
- Token: Sí
- ID URL: Sí (`:id`)
- Qué pide: `user_id` + body de actualización
- Ejemplo body: `{"name":"Cliente Actualizado","phone":"99999999"}`

### 05. Cuentas

#### `GET /accounts`
- Usuario requerido: Cliente / Employee / Admin
- Token: Sí
- ID URL: No
- Qué pide: opcional query `userId` (admin/employee)
- Ejemplo: `GET {{base_url}}/accounts`

#### `POST /accounts`
- Usuario requerido: Cliente
- Token: Sí (`token_cliente`)
- ID URL: No
- Qué pide: body de cuenta (`accountType`)
- Ejemplo body: `{"accountType":"AHORRO"}`

#### `PUT /accounts/:id/limits`
- Usuario requerido: Employee o Admin
- Token: Sí
- ID URL: Sí (`:id`)
- Qué pide: `account_id` + body (`perTransactionLimit`, `dailyTransactionLimit`, `status`, `reason`)
- Ejemplo body: `{"dailyTransactionLimit":10000}`

#### `GET /accounts/:id/limits/admin`
- Usuario requerido: Admin
- Token: Sí
- ID URL: Sí (`:id`)
- Qué pide: `account_id`
- Ejemplo: `GET {{base_url}}/accounts/{{account_id}}/limits/admin`

#### `PUT /accounts/:id/limits/admin`
- Usuario requerido: Admin
- Token: Sí
- ID URL: Sí (`:id`)
- Qué pide: `account_id` + body de límites admin
- Ejemplo body: `{"dailyTransactionLimit":10000,"reason":"Ajuste operativo"}`

### 06. Depósitos

#### `POST /accounts/deposit-requests`
- Usuario requerido: Cliente
- Token: Sí
- ID URL: No
- Qué pide: body `destinationAccountNumber`, `amount`, `description` (opcional)
- Ejemplo body: `{"destinationAccountNumber":"001-1234567890-1","amount":500,"description":"Depósito"}`

#### `PUT /accounts/deposit-requests/:id/amount`
- Usuario requerido: Employee o Admin
- Token: Sí
- ID URL: Sí (`:id`)
- Qué pide: `deposit_request_id` + body `amount` (y `reason` opcional)
- Ejemplo body: `{"amount":850,"reason":"Corrección"}`

#### `PUT /accounts/deposit-requests/:id/approve`
- Usuario requerido: Employee o Admin
- Token: Sí
- ID URL: Sí (`:id`)
- Qué pide: `deposit_request_id` + body opcional (`couponId`)
- Ejemplo body: `{"couponId":"cat_ABC123"}`

#### `PUT /accounts/deposit-requests/:id/revert`
- Usuario requerido: Employee o Admin
- Token: Sí
- ID URL: Sí (`:id`)
- Qué pide: `deposit_request_id` + body `reason`
- Ejemplo body: `{"reason":"Error operativo"}`

### 07. Transferencias

#### `POST /accounts/transfers`
- Usuario requerido: Cliente
- Token: Sí
- ID URL: No
- Qué pide: body `sourceAccountNumber`, `destinationAccountNumber`, `recipientType`, `amount`
- Ejemplo body: `{"sourceAccountNumber":"1000000001","destinationAccountNumber":"1000000002","recipientType":"TERCERO","amount":1500}`

#### `PUT /accounts/transfers/:id/revert`
- Usuario requerido: Cliente
- Token: Sí
- ID URL: Sí (`:id`)
- Qué pide: `transfer_id` + body `reason`
- Ejemplo body: `{"reason":"Reversión solicitada"}`

### 08. Transacciones

#### `GET /client/transactions`
- Usuario requerido: Cliente
- Token: Sí
- ID URL: No
- Qué pide: query de filtros (ej. `type`, `limit`, `page`)
- Ejemplo: `GET {{base_url}}/client/transactions?type=TRANSFERENCIA_ENVIADA&limit=10&page=1`

#### `GET /admin/transactions`
- Usuario requerido: Admin
- Token: Sí
- ID URL: No
- Qué pide: query de filtros/paginación
- Ejemplo: `GET {{base_url}}/admin/transactions?limit=20&page=1`

#### `GET /employee/accounts/:accountId/transactions`
- Usuario requerido: Employee
- Token: Sí
- ID URL: Sí (`:accountId`)
- Qué pide: `account_id` + query opcional
- Ejemplo: `GET {{base_url}}/employee/accounts/{{account_id}}/transactions?limit=20&page=1`

#### `GET /dashboard/transaction-ranking`
- Usuario requerido: Admin
- Token: Sí
- ID URL: No
- Qué pide: query `type`, `order`, `limit`
- Ejemplo: `GET {{base_url}}/dashboard/transaction-ranking?type=TRANSFERENCIA_ENVIADA&order=DESC&limit=10`

### 09. Favoritos

#### `POST /favorites`
- Usuario requerido: Cliente
- Token: Sí
- ID URL: No
- Qué pide: body `accountNumber`, `accountType`, `alias`
- Ejemplo body: `{"accountNumber":"001-9115890794-1","accountType":"ahorro","alias":"Mamá"}`

#### `GET /favorites`
- Usuario requerido: Cliente
- Token: Sí
- ID URL: No
- Qué pide: nada
- Ejemplo: `GET {{base_url}}/favorites`

#### `GET /favorites/:id`
- Usuario requerido: Cliente
- Token: Sí
- ID URL: Sí (`:id`)
- Qué pide: `favorite_id`
- Ejemplo: `GET {{base_url}}/favorites/{{favorite_id}}`

#### `PUT /favorites/:id`
- Usuario requerido: Cliente
- Token: Sí
- ID URL: Sí (`:id`)
- Qué pide: `favorite_id` + body de actualización
- Ejemplo body: `{"alias":"Mamá Rosa","isActive":true}`

#### `DELETE /favorites/:id`
- Usuario requerido: Cliente
- Token: Sí
- ID URL: Sí (`:id`)
- Qué pide: `favorite_id`
- Ejemplo: `DELETE {{base_url}}/favorites/{{favorite_id}}`

### 10. Promociones (Público)

#### `GET /catalog`
- Usuario requerido: Público
- Token: No
- ID URL: No
- Qué pide: nada
- Ejemplo: `GET {{base_url}}/catalog`

#### `GET /catalog/:id`
- Usuario requerido: Público
- Token: No
- ID URL: Sí (`:id`)
- Qué pide: `promotion_id`
- Ejemplo: `GET {{base_url}}/catalog/{{promotion_id}}`

### 11. Promociones (Admin)

#### `GET /catalog/admin/all`
- Usuario requerido: Admin
- Token: Sí
- ID URL: No
- Qué pide: query opcional (`status`, `type`, `active`)
- Ejemplo: `GET {{base_url}}/catalog/admin/all?status=ACTIVA&type=DEPOSITO_CASHBACK`

#### `GET /catalog/admin/audit/all`
- Usuario requerido: Admin
- Token: Sí
- ID URL: No
- Qué pide: query opcional (`action`, `actorUserId`, `limit`, `offset`)
- Ejemplo: `GET {{base_url}}/catalog/admin/audit/all?limit=20&offset=0`

#### `POST /catalog/admin/create`
- Usuario requerido: Admin
- Token: Sí
- ID URL: No
- Qué pide: body de creación de promoción
- Ejemplo body: `{"name":"Promo X","promotionType":"DEPOSITO_CASHBACK","cashbackPercentage":10}`

#### `PUT /catalog/admin/:id`
- Usuario requerido: Admin
- Token: Sí
- ID URL: Sí (`:id`)
- Qué pide: `promotion_id` + body con campos permitidos
- Ejemplo body: `{"cashbackPercentage":25,"reason":"Ajuste"}`

#### `PUT /catalog/admin/:id/status`
- Usuario requerido: Admin
- Token: Sí
- ID URL: Sí (`:id`)
- Qué pide: `promotion_id` + body `newStatus`, `reason`
- Ejemplo body: `{"newStatus":"ACTIVA","reason":"Validación"}`

#### `GET /catalog/admin/:id/audit`
- Usuario requerido: Admin
- Token: Sí
- ID URL: Sí (`:id`)
- Qué pide: `promotion_id`
- Ejemplo: `GET {{base_url}}/catalog/admin/{{promotion_id}}/audit`

#### `DELETE /catalog/admin/:id`
- Usuario requerido: Admin
- Token: Sí
- ID URL: Sí (`:id`)
- Qué pide: `promotion_id` + body opcional `reason`
- Ejemplo body: `{"reason":"Fin de campaña"}`

### 12. Seguridad y Fraude

#### `GET /security/status`
- Usuario requerido: Cliente
- Token: Sí
- ID URL: No
- Qué pide: nada
- Ejemplo: `GET {{base_url}}/security/status`

#### `GET /security/failed-attempts`
- Usuario requerido: Cliente
- Token: Sí
- ID URL: No
- Qué pide: nada
- Ejemplo: `GET {{base_url}}/security/failed-attempts`

#### `GET /security/fraud-alerts`
- Usuario requerido: Cliente
- Token: Sí
- ID URL: No
- Qué pide: nada
- Ejemplo: `GET {{base_url}}/security/fraud-alerts`

### 13. Administración de Cuentas

#### `GET /admin/accounts/:accountId/details`
- Usuario requerido: Admin
- Token: Sí
- ID URL: Sí (`:accountId`)
- Qué pide: `account_id`
- Ejemplo: `GET {{base_url}}/admin/accounts/{{account_id}}/details`

#### `POST /admin/accounts/:id/freeze`
- Usuario requerido: Admin
- Token: Sí
- ID URL: Sí (`:id`)
- Qué pide: `account_id` + body `reason`, `notes` (opc.)
- Ejemplo body: `{"reason":"SECURITY_REVIEW","notes":"Revisión preventiva"}`

#### `POST /admin/accounts/:id/unfreeze`
- Usuario requerido: Admin
- Token: Sí
- ID URL: Sí (`:id`)
- Qué pide: `account_id` + body opcional `notes`
- Ejemplo body: `{"notes":"Caso resuelto"}`

#### `GET /admin/accounts/:id/block-history`
- Usuario requerido: Admin
- Token: Sí
- ID URL: Sí (`:id`)
- Qué pide: `account_id`
- Ejemplo: `GET {{base_url}}/admin/accounts/{{account_id}}/block-history`

---

## 6) Notas importantes

- Si cambias puerto en `.env`, actualiza `base_url` en Postman.
- Si falla por permisos, revisa el rol del token usado en ese endpoint.
- Si pide `:id` en URL y token, debes enviar **ambos**.
- Para pruebas estables, usa la colección ordenada en español.
