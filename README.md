# NexusBank API — Documentación Oficial

Backend bancario para gestión de usuarios, cuentas, depósitos, transferencias, seguridad antifraude, favoritos y promociones.


## 1. Descripción general del proyecto

NexusBank es una API REST orientada a operaciones bancarias con control de acceso por roles y trazabilidad de eventos críticos.

### Objetivos funcionales
- Gestionar autenticación y perfiles de usuarios.
- Permitir creación y administración de cuentas bancarias.
- Procesar depósitos y transferencias con validaciones operativas.
- Aplicar reglas de seguridad (fraude, bloqueos, límites).
- Administrar promociones y auditoría de cambios.
- Gestionar favoritos para transferencias frecuentes.

### Módulos de negocio
- **Autenticación**: login, verificación de correo, recuperación de contraseña.
- **Usuarios**: consulta y edición de datos por rol.
- **Cuentas**: alta de cuentas, límites operativos, consultas administrativas.
- **Depósitos**: solicitudes, aprobación/reversión y auditoría.
- **Transferencias**: envío entre cuentas con reglas de límite diario.
- **Transacciones**: historial por cliente, cuenta y panel administrativo.
- **Seguridad**: estado de riesgo, intentos fallidos, alertas de fraude.
- **Favoritos**: CRUD de cuentas frecuentes.
- **Promociones**: catálogo público y gestión administrativa completa.

---

## 2. Arquitectura y stack técnico

### Tecnologías principales
- **Node.js + Express** para API REST.
- **Sequelize + PostgreSQL** para datos transaccionales principales.
- **MongoDB** para componentes auxiliares del ecosistema (según configuración del entorno).
- **JWT** para autenticación.
- **Middlewares** para autorización, validaciones y rate limiting.

### Estructura del proyecto
- `configs/`: bootstrap, conexión BD, CORS, Helmet y configuración general.
- `src/auth/`: autenticación y rutas de sesión/verificación.
- `src/user/`: usuarios y perfiles.
- `src/account/`: cuentas, depósitos, transferencias, seguridad operativa.
- `src/favorite/`: favoritos de cliente.
- `src/catalog/`: promociones y auditoría.
- `middlewares/`: validadores, auth, roles y limitadores.
- `services/`: email y detección de fraude.
- `helpers/`: utilidades de IDs, cuentas, asociaciones y tareas de arranque.

---

## 3. Seguridad (JWT y controles de acceso)

La seguridad está implementada en capas:

### 3.1 Autenticación con JWT
- El usuario obtiene token en `POST /auth/login`.
- El token es de tipo **JWT Bearer**.
- El token se envía en `Authorization: Bearer <token>`.
- La validación del token se realiza en middleware antes de llegar al controlador.

Formato de cabecera:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3.2 Autorización por roles
- La API usa verificación de roles para restringir endpoints sensibles.
- Roles operativos principales:
  - **Client**
  - **Employee**
  - **Admin**
- Endpoints administrativos validan explícitamente rol `Admin`.

### 3.3 Rutas públicas vs protegidas
- Existen rutas públicas (por ejemplo salud y recuperación/verificación).
- El resto requiere JWT válido y, según endpoint, rol autorizado.

### 3.4 Seguridad complementaria
- **Rate limiters** por tipo de operación (login, transferencias, depósitos, etc.).
- **Detección de fraude** con registro de intentos fallidos y alertas.
- **Bloqueo/congelación de cuentas** con historial y auditoría.
- **Helmet + CORS** para endurecimiento de cabeceras y control de orígenes.

---

## 4. Reglas operativas relevantes

- Límite diario de transferencias por cuenta origen: **Q10,000**.
- Límite diario por cuenta destino específica (par origen→destino): **Q2,000**.
- El saldo de cuenta destino **no tiene tope máximo** por depósitos/transferencias.
- Operaciones en cuentas congeladas/suspendidas/bloqueadas se restringen según regla de negocio.

---

## 5. Configuración del entorno (sin exponer secretos)

### Requisitos
- Node.js (LTS recomendado)
- pnpm
- Docker (opcional para servicios auxiliares)
- PostgreSQL y MongoDB según entorno

### Variables de entorno
No publiques secretos en documentación ni repositorio.

Definir en `.env` usando valores de tu entorno:
- `NODE_ENV`, `PORT`
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD`
- `URI_MONGO`
- `JWT_SECRET`, `JWT_EXPIRES_IN`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`
- `FRONTEND_URL`
- `ALLOWED_ORIGINS`, `ADMIN_ALLOWED_ORIGINS`
- Variables de límites operativos si aplican en despliegue

### Arranque
```bash
docker compose up -d
pnpm install
pnpm run dev
```

Base URL por defecto:
```text
http://localhost:<PORT>/nexusBank/v1
```

---

## 6. Guía de uso de endpoints

Esta sección indica por endpoint: función, usuario requerido, si pide token, si pide ID en URL y qué datos mínimos enviar.

Nota de autenticación:
- Cuando diga **Token: Sí**, el tipo requerido es **JWT Bearer**.

### 6.1 Salud

#### `GET /health`
- Función: verificar disponibilidad de API.
- Usuario requerido: Público
- Token: No
- ID URL: No
- Request mínimo: sin body

### 6.2 Autenticación

#### `POST /auth/login`
- Función: autenticar usuario y devolver JWT.
- Usuario requerido: Público
- Token: No
- ID URL: No
- Request mínimo: `email`, `password`

#### `POST /auth/register`
- Función: crear usuario cliente.
- Usuario requerido: Admin/Employee
- Token: Sí
- ID URL: No
- Request mínimo: datos de perfil + credenciales

#### `POST /auth/verify-email`
- Función: confirmar email por token en body.
- Usuario requerido: Público
- Token: No
- ID URL: No
- Request mínimo: `token`

#### `GET /auth/verify-email?token=...`
- Función: confirmar email por query string.
- Usuario requerido: Público
- Token: No
- ID URL: No
- Request mínimo: query `token`

#### `POST /auth/resend-verification`
- Función: reenviar verificación de correo.
- Usuario requerido: Público
- Token: No
- ID URL: No
- Request mínimo: identificador de usuario/email (según validación activa)

#### `POST /auth/forgot-password`
- Función: iniciar recuperación de contraseña.
- Usuario requerido: Público
- Token: No
- ID URL: No
- Request mínimo: `email`

#### `POST /auth/reset-password`
- Función: establecer nueva contraseña.
- Usuario requerido: Público
- Token: No
- ID URL: No
- Request mínimo: `token`, `newPassword`

### 6.3 Mi Cuenta

#### `GET /auth/profile`
- Función: obtener perfil del usuario autenticado.
- Usuario requerido: Client
- Token: Sí
- ID URL: No
- Request mínimo: sin body

#### `PUT /profile/edit`
- Función: editar datos del perfil propio.
- Usuario requerido: Client
- Token: Sí
- ID URL: No
- Request mínimo: campos editables de perfil

#### `GET /my-account/balance/convert`
- Función: conversión de saldo por moneda.
- Usuario requerido: Client
- Token: Sí
- ID URL: No
- Request mínimo: query `toCurrency`

#### `GET /my-account/history`
- Función: historial de operaciones de mis cuentas.
- Usuario requerido: Client
- Token: Sí
- ID URL: No
- Request mínimo: opcional filtros por query

### 6.4 Usuarios

#### `GET /users`
- Función: listar usuarios.
- Usuario requerido: Admin
- Token: Sí
- ID URL: No

#### `GET /users/admin/client/:id/detail`
- Función: detalle administrativo de cliente.
- Usuario requerido: Admin
- Token: Sí
- ID URL: Sí (`:id`)

#### `GET /users/:id`
- Función: obtener usuario por ID.
- Usuario requerido: Admin
- Token: Sí
- ID URL: Sí (`:id`)

#### `PUT /users/:id`
- Función: actualizar usuario.
- Usuario requerido: autenticado (uso recomendado: Admin)
- Token: Sí
- ID URL: Sí (`:id`)
- Request mínimo: campos a actualizar

### 6.5 Cuentas

#### `GET /accounts`
- Función: listar cuentas (alcance según rol).
- Usuario requerido: Client/Employee/Admin
- Token: Sí
- ID URL: No
- Request mínimo: opcional `userId` para vistas administrativas

#### `POST /accounts`
- Función: crear cuenta bancaria.
- Usuario requerido: Client
- Token: Sí
- ID URL: No
- Request mínimo: tipo de cuenta

#### `PUT /accounts/:id/limits`
- Función: actualizar límites operativos.
- Usuario requerido: Employee/Admin
- Token: Sí
- ID URL: Sí (`:id`)
- Request mínimo: límites/estado a modificar

#### `GET /accounts/:id/limits/admin`
- Función: consultar límites administrativos de cuenta.
- Usuario requerido: Admin
- Token: Sí
- ID URL: Sí (`:id`)

#### `PUT /accounts/:id/limits/admin`
- Función: actualización administrativa de límites.
- Usuario requerido: Admin
- Token: Sí
- ID URL: Sí (`:id`)
- Request mínimo: límites y motivo

### 6.6 Depósitos

#### `POST /accounts/deposit-requests`
- Función: crear solicitud de depósito.
- Usuario requerido: Client
- Token: Sí
- ID URL: No
- Request mínimo: `destinationAccountNumber`, `amount`

#### `PUT /accounts/deposit-requests/:id/amount`
- Función: editar monto de solicitud pendiente.
- Usuario requerido: Employee/Admin
- Token: Sí
- ID URL: Sí (`:id`)
- Request mínimo: `amount`

#### `PUT /accounts/deposit-requests/:id/approve`
- Función: aprobar depósito.
- Usuario requerido: Employee/Admin
- Token: Sí
- ID URL: Sí (`:id`)
- Request mínimo: sin body obligatorio (opcional `couponId`)

#### `PUT /accounts/deposit-requests/:id/revert`
- Función: revertir depósito aprobado (según ventana de reversión).
- Usuario requerido: Employee/Admin
- Token: Sí
- ID URL: Sí (`:id`)
- Request mínimo: motivo de reversión

### 6.7 Transferencias

#### `POST /accounts/transfers`
- Función: transferir entre cuentas.
- Usuario requerido: Client
- Token: Sí
- ID URL: No
- Request mínimo: `sourceAccountNumber`, `destinationAccountNumber`, `recipientType`, `amount`

#### `PUT /accounts/transfers/:id/revert`
- Función: revertir transferencia.
- Usuario requerido: Client
- Token: Sí
- ID URL: Sí (`:id`)
- Request mínimo: motivo de reversión

### 6.8 Transacciones

#### `GET /client/transactions`
- Función: historial del cliente.
- Usuario requerido: Client
- Token: Sí
- ID URL: No
- Request mínimo: opcional filtros (`type`, `limit`, `page`, etc.)

#### `GET /admin/transactions`
- Función: historial global administrativo.
- Usuario requerido: Admin
- Token: Sí
- ID URL: No

#### `GET /employee/accounts/:accountId/transactions`
- Función: historial por cuenta para personal operativo.
- Usuario requerido: Employee
- Token: Sí
- ID URL: Sí (`:accountId`)

#### `GET /dashboard/transaction-ranking`
- Función: ranking agregado de transacciones.
- Usuario requerido: Admin
- Token: Sí
- ID URL: No
- Request mínimo: query de tipo/orden/límite

### 6.9 Favoritos

#### `POST /favorites`
- Función: crear favorito.
- Usuario requerido: Client
- Token: Sí
- ID URL: No
- Request mínimo: `accountNumber`, `accountType`, `alias`

#### `GET /favorites`
- Función: listar favoritos propios.
- Usuario requerido: Client
- Token: Sí
- ID URL: No

#### `GET /favorites/:id`
- Función: obtener favorito por ID.
- Usuario requerido: Client
- Token: Sí
- ID URL: Sí (`:id`)

#### `PUT /favorites/:id`
- Función: actualizar favorito.
- Usuario requerido: Client
- Token: Sí
- ID URL: Sí (`:id`)
- Request mínimo: campos a modificar

#### `DELETE /favorites/:id`
- Función: eliminar favorito.
- Usuario requerido: Client
- Token: Sí
- ID URL: Sí (`:id`)

### 6.10 Promociones (Público)

#### `GET /catalog`
- Función: listar promociones activas públicas.
- Usuario requerido: Público
- Token: No
- ID URL: No

#### `GET /catalog/:id`
- Función: ver detalle de promoción pública.
- Usuario requerido: Público
- Token: No
- ID URL: Sí (`:id`)

### 6.11 Promociones (Admin)

#### `GET /catalog/admin/all`
- Función: listar todas las promociones con filtros.
- Usuario requerido: Admin
- Token: Sí
- ID URL: No

#### `GET /catalog/admin/audit/all`
- Función: auditoría global de promociones.
- Usuario requerido: Admin
- Token: Sí
- ID URL: No

#### `POST /catalog/admin/create`
- Función: crear promoción.
- Usuario requerido: Admin
- Token: Sí
- ID URL: No
- Request mínimo: nombre, tipo y parámetros de beneficio

#### `PUT /catalog/admin/:id`
- Función: actualizar promoción.
- Usuario requerido: Admin
- Token: Sí
- ID URL: Sí (`:id`)
- Request mínimo: campos permitidos + motivo

#### `PUT /catalog/admin/:id/status`
- Función: cambiar estado operativo de promoción.
- Usuario requerido: Admin
- Token: Sí
- ID URL: Sí (`:id`)
- Request mínimo: `newStatus`, `reason`

#### `GET /catalog/admin/:id/audit`
- Función: auditoría de una promoción específica.
- Usuario requerido: Admin
- Token: Sí
- ID URL: Sí (`:id`)

#### `DELETE /catalog/admin/:id`
- Función: desactivar promoción (soft delete).
- Usuario requerido: Admin
- Token: Sí
- ID URL: Sí (`:id`)
- Request mínimo: motivo opcional

### 6.12 Seguridad y Fraude

#### `GET /security/status`
- Función: estado de seguridad del cliente.
- Usuario requerido: Client
- Token: Sí
- ID URL: No

#### `GET /security/failed-attempts`
- Función: listar intentos fallidos.
- Usuario requerido: Client
- Token: Sí
- ID URL: No

#### `GET /security/fraud-alerts`
- Función: listar alertas de fraude.
- Usuario requerido: Client
- Token: Sí
- ID URL: No

### 6.13 Administración de Cuentas

#### `GET /admin/accounts/:accountId/details`
- Función: detalle administrativo integral de cuenta.
- Usuario requerido: Admin
- Token: Sí
- ID URL: Sí (`:accountId`)

#### `POST /admin/accounts/:id/freeze`
- Función: congelar cuenta.
- Usuario requerido: Admin
- Token: Sí
- ID URL: Sí (`:id`)
- Request mínimo: motivo de congelación

#### `POST /admin/accounts/:id/unfreeze`
- Función: descongelar/reactivar cuenta.
- Usuario requerido: Admin
- Token: Sí
- ID URL: Sí (`:id`)
- Request mínimo: notas opcionales

#### `GET /admin/accounts/:id/block-history`
- Función: historial de bloqueos/desbloqueos.
- Usuario requerido: Admin
- Token: Sí
- ID URL: Sí (`:id`)

### 6.14 Ejemplos rápidos por endpoint

> Todos los endpoints con token usan cabecera `Authorization: Bearer <JWT>`.

Mapa rápido de tokens:
- `token_admin`: JWT de un usuario con rol **Admin**.
- `token_employee`: JWT de un usuario con rol **Employee**.
- `token_cliente`: JWT de un usuario con rol **Client**.

#### Salud
- `GET {{base_url}}/health`

#### Autenticación
- `POST {{base_url}}/auth/login` (sin token)
  - Body ejemplo: `{"email":"usuario@dominio.com","password":"********"}`
- `POST {{base_url}}/auth/register` (usar `token_admin` o `token_employee`)
  - Body ejemplo: `{"name":"Cliente","email":"cliente@dominio.com","password":"********","documentType":"DPI","documentNumber":"123"}`
- `POST {{base_url}}/auth/verify-email` (sin token)
  - Body ejemplo: `{"token":"TOKEN_VERIFICACION"}`
- `GET {{base_url}}/auth/verify-email?token=TOKEN_VERIFICACION` (sin token)
- `POST {{base_url}}/auth/resend-verification` (sin token)
  - Body ejemplo: `{"email":"cliente@dominio.com"}`
- `POST {{base_url}}/auth/forgot-password` (sin token)
  - Body ejemplo: `{"email":"cliente@dominio.com"}`
- `POST {{base_url}}/auth/reset-password` (sin token)
  - Body ejemplo: `{"token":"TOKEN_RESET","newPassword":"NuevaClave123"}`

#### Mi Cuenta
- `GET {{base_url}}/auth/profile` (usar `token_cliente`)
- `PUT {{base_url}}/profile/edit` (usar `token_cliente`)
  - Body ejemplo: `{"phone":"+50255556666"}`
- `GET {{base_url}}/my-account/balance/convert?toCurrency=USD` (usar `token_cliente`)
- `GET {{base_url}}/my-account/history` (usar `token_cliente`)

#### Usuarios
- `GET {{base_url}}/users` (usar `token_admin`)
- `GET {{base_url}}/users/admin/client/{{user_id}}/detail` (usar `token_admin`)
- `GET {{base_url}}/users/{{user_id}}` (usar `token_admin`)
- `PUT {{base_url}}/users/{{user_id}}` (usar `token_admin`)
  - Body ejemplo: `{"name":"Cliente Actualizado"}`

#### Cuentas
- `GET {{base_url}}/accounts` (usar `token_cliente` / `token_employee` / `token_admin`)
- `POST {{base_url}}/accounts` (usar `token_cliente`)
  - Body ejemplo: `{"accountType":"ahorro"}`
- `PUT {{base_url}}/accounts/{{account_id}}/limits` (usar `token_employee` o `token_admin`)
  - Body ejemplo: `{"dailyTransactionLimit":10000,"reason":"Ajuste"}`
- `GET {{base_url}}/accounts/{{account_id}}/limits/admin` (usar `token_admin`)
- `PUT {{base_url}}/accounts/{{account_id}}/limits/admin` (usar `token_admin`)
  - Body ejemplo: `{"perTransactionLimit":2000,"dailyTransactionLimit":10000,"reason":"Política interna"}`

#### Depósitos
- `POST {{base_url}}/accounts/deposit-requests` (usar `token_cliente`)
  - Body ejemplo: `{"destinationAccountNumber":"001-1234567890-1","amount":500,"description":"Depósito"}`
- `PUT {{base_url}}/accounts/deposit-requests/{{deposit_request_id}}/amount` (usar `token_employee` o `token_admin`)
  - Body ejemplo: `{"amount":850,"reason":"Corrección"}`
- `PUT {{base_url}}/accounts/deposit-requests/{{deposit_request_id}}/approve` (usar `token_employee` o `token_admin`)
  - Body ejemplo: `{"couponId":"cat_ABC123"}`
- `PUT {{base_url}}/accounts/deposit-requests/{{deposit_request_id}}/revert` (usar `token_employee` o `token_admin`)
  - Body ejemplo: `{"reason":"Error operativo"}`

#### Transferencias
- `POST {{base_url}}/accounts/transfers` (usar `token_cliente`)
  - Body ejemplo: `{"sourceAccountNumber":"1000000001","destinationAccountNumber":"1000000002","recipientType":"TERCERO","amount":1500,"description":"Pago"}`
- `PUT {{base_url}}/accounts/transfers/{{transfer_id}}/revert` (usar `token_cliente`)
  - Body ejemplo: `{"reason":"Reversión solicitada"}`

#### Transacciones
- `GET {{base_url}}/client/transactions?type=TRANSFERENCIA_ENVIADA&limit=10&page=1` (usar `token_cliente`)
- `GET {{base_url}}/admin/transactions?limit=20&page=1` (usar `token_admin`)
- `GET {{base_url}}/employee/accounts/{{account_id}}/transactions?limit=20&page=1` (usar `token_employee`)
- `GET {{base_url}}/dashboard/transaction-ranking?type=TRANSFERENCIA_ENVIADA&order=DESC&limit=10` (usar `token_admin`)

#### Favoritos
- `POST {{base_url}}/favorites` (usar `token_cliente`)
  - Body ejemplo: `{"accountNumber":"001-9115890794-1","accountType":"ahorro","alias":"Mamá"}`
- `GET {{base_url}}/favorites` (usar `token_cliente`)
- `GET {{base_url}}/favorites/{{favorite_id}}` (usar `token_cliente`)
- `PUT {{base_url}}/favorites/{{favorite_id}}` (usar `token_cliente`)
  - Body ejemplo: `{"alias":"Mamá Rosa","isActive":true}`
- `DELETE {{base_url}}/favorites/{{favorite_id}}` (usar `token_cliente`)

#### Promociones (Público)
- `GET {{base_url}}/catalog` (sin token)
- `GET {{base_url}}/catalog/{{promotion_id}}` (sin token)

#### Promociones (Admin)
- `GET {{base_url}}/catalog/admin/all?status=ACTIVA&type=DEPOSITO_CASHBACK` (usar `token_admin`)
- `GET {{base_url}}/catalog/admin/audit/all?limit=20&offset=0` (usar `token_admin`)
- `POST {{base_url}}/catalog/admin/create` (usar `token_admin`)
  - Body ejemplo: `{"name":"Promo X","promotionType":"DEPOSITO_CASHBACK","cashbackPercentage":10}`
- `PUT {{base_url}}/catalog/admin/{{promotion_id}}` (usar `token_admin`)
  - Body ejemplo: `{"cashbackPercentage":15,"reason":"Ajuste"}`
- `PUT {{base_url}}/catalog/admin/{{promotion_id}}/status` (usar `token_admin`)
  - Body ejemplo: `{"newStatus":"ACTIVA","reason":"Validación"}`
- `GET {{base_url}}/catalog/admin/{{promotion_id}}/audit` (usar `token_admin`)
- `DELETE {{base_url}}/catalog/admin/{{promotion_id}}` (usar `token_admin`)
  - Body ejemplo: `{"reason":"Fin de campaña"}`

#### Seguridad y Fraude
- `GET {{base_url}}/security/status` (usar `token_cliente`)
- `GET {{base_url}}/security/failed-attempts` (usar `token_cliente`)
- `GET {{base_url}}/security/fraud-alerts` (usar `token_cliente`)

#### Administración de Cuentas
- `GET {{base_url}}/admin/accounts/{{account_id}}/details` (usar `token_admin`)
- `POST {{base_url}}/admin/accounts/{{account_id}}/freeze` (usar `token_admin`)
  - Body ejemplo: `{"reason":"SECURITY_REVIEW","notes":"Revisión preventiva"}`
- `POST {{base_url}}/admin/accounts/{{account_id}}/unfreeze` (usar `token_admin`)
  - Body ejemplo: `{"notes":"Cuenta rehabilitada"}`
- `GET {{base_url}}/admin/accounts/{{account_id}}/block-history` (usar `token_admin`)

### 6.15 Qué hacer en cada endpoint (resumen operativo)

#### Salud
- `GET /health`: úsalo para confirmar que la API está levantada antes de iniciar pruebas.

#### Autenticación
- `POST /auth/login`: inicia sesión y guarda el JWT para llamadas protegidas.
- `POST /auth/register`: crea un cliente nuevo (solo admin/employee).
- `POST /auth/verify-email`: confirma la cuenta usando token recibido por correo.
- `GET /auth/verify-email?token=...`: alternativa de verificación por query string.
- `POST /auth/resend-verification`: solicita un nuevo token de verificación.
- `POST /auth/forgot-password`: inicia recuperación de contraseña.
- `POST /auth/reset-password`: establece una nueva contraseña con token válido.

#### Mi Cuenta
- `GET /auth/profile`: consulta tus datos actuales autenticados.
- `PUT /profile/edit`: actualiza tu información de perfil permitida.
- `GET /my-account/balance/convert`: consulta saldo convertido a otra moneda.
- `GET /my-account/history`: revisa tus movimientos recientes.

#### Usuarios
- `GET /users`: lista usuarios del sistema para gestión administrativa.
- `GET /users/admin/client/:id/detail`: revisa detalle completo de un cliente.
- `GET /users/:id`: consulta un usuario puntual por ID.
- `PUT /users/:id`: edita datos de un usuario existente.

#### Cuentas
- `GET /accounts`: lista cuentas visibles para tu rol.
- `POST /accounts`: crea una nueva cuenta bancaria.
- `PUT /accounts/:id/limits`: ajusta límites operativos de una cuenta.
- `GET /accounts/:id/limits/admin`: consulta límites actuales de la cuenta.
- `PUT /accounts/:id/limits/admin`: actualiza límites con contexto administrativo.

#### Depósitos
- `POST /accounts/deposit-requests`: registra una solicitud de depósito.
- `PUT /accounts/deposit-requests/:id/amount`: corrige monto de solicitud pendiente.
- `PUT /accounts/deposit-requests/:id/approve`: aprueba y acredita el depósito.
- `PUT /accounts/deposit-requests/:id/revert`: revierte depósito aprobado según política.

#### Transferencias
- `POST /accounts/transfers`: envía dinero entre cuentas con validaciones de límites.
- `PUT /accounts/transfers/:id/revert`: revierte una transferencia dentro de la ventana permitida.

#### Transacciones
- `GET /client/transactions`: consulta historial del cliente con filtros.
- `GET /admin/transactions`: consulta historial global para supervisión.
- `GET /employee/accounts/:accountId/transactions`: revisa movimientos por cuenta (employee).
- `GET /dashboard/transaction-ranking`: obtén ranking de actividad transaccional.

#### Favoritos
- `POST /favorites`: agrega una cuenta frecuente.
- `GET /favorites`: lista tus favoritos.
- `GET /favorites/:id`: consulta un favorito específico.
- `PUT /favorites/:id`: edita alias/datos de favorito.
- `DELETE /favorites/:id`: elimina un favorito.

#### Promociones públicas
- `GET /catalog`: consulta promociones activas para clientes.
- `GET /catalog/:id`: revisa detalle de una promoción.

#### Promociones admin
- `GET /catalog/admin/all`: lista promociones con filtros administrativos.
- `GET /catalog/admin/audit/all`: revisa auditoría global de promociones.
- `POST /catalog/admin/create`: crea una nueva promoción.
- `PUT /catalog/admin/:id`: actualiza datos de promoción.
- `PUT /catalog/admin/:id/status`: cambia estado operativo de promoción.
- `GET /catalog/admin/:id/audit`: revisa historial de cambios de una promoción.
- `DELETE /catalog/admin/:id`: desactiva promoción (soft delete).

#### Seguridad y fraude
- `GET /security/status`: consulta estado de seguridad del cliente.
- `GET /security/failed-attempts`: revisa intentos fallidos registrados.
- `GET /security/fraud-alerts`: consulta alertas de fraude detectadas.

#### Administración de cuentas
- `GET /admin/accounts/:accountId/details`: revisa panorama administrativo de cuenta.
- `POST /admin/accounts/:id/freeze`: congela cuenta por motivo operativo/seguridad.
- `POST /admin/accounts/:id/unfreeze`: reactiva cuenta congelada.
- `GET /admin/accounts/:id/block-history`: revisa historial de bloqueos/desbloqueos.

### 6.16 Cómo llenar cada endpoint (guía práctica)

Formato base para endpoints con token:

```http
Authorization: Bearer {{token_admin|token_employee|token_cliente}}
Content-Type: application/json
```

#### 6.16.1 Salud

**GET /health**
- Necesita: nada
- Ejemplo:
```http
GET {{base_url}}/health
```

#### 6.16.2 Autenticación

**POST /auth/login**
- Necesita: `email`, `password`
```http
POST {{base_url}}/auth/login
Content-Type: application/json
```
```json
{ "email": "usuario@dominio.com", "password": "********" }
```

**POST /auth/register**
- Token: `token_admin` o `token_employee`
- Necesita: datos básicos del cliente
```http
POST {{base_url}}/auth/register
Authorization: Bearer {{token_admin}}
Content-Type: application/json
```
```json
{
  "name": "Cliente Demo",
  "email": "cliente.demo@dominio.com",
  "password": "********",
  "documentType": "DPI",
  "documentNumber": "1234567890101",
  "income": 5000
}
```

**POST /auth/verify-email**
- Necesita: `token`
```json
{ "token": "TOKEN_VERIFICACION" }
```

**GET /auth/verify-email?token=...**
- Necesita: query `token`
```http
GET {{base_url}}/auth/verify-email?token=TOKEN_VERIFICACION
```

**POST /auth/resend-verification**
- Necesita: `email`
```json
{ "email": "cliente.demo@dominio.com" }
```

**POST /auth/forgot-password**
- Necesita: `email`
```json
{ "email": "cliente.demo@dominio.com" }
```

**POST /auth/reset-password**
- Necesita: `token`, `newPassword`
```json
{ "token": "TOKEN_RESET", "newPassword": "NuevaClave123" }
```

#### 6.16.3 Mi Cuenta (Cliente)

**GET /auth/profile**
- Token: `token_cliente`
- Necesita: sin body

**PUT /profile/edit**
- Token: `token_cliente`
- Necesita: campos editables de perfil
```json
{ "phone": "+50255556666", "address": "Zona 10" }
```

**GET /my-account/balance/convert**
- Token: `token_cliente`
- Necesita: query `toCurrency`
```http
GET {{base_url}}/my-account/balance/convert?toCurrency=USD
```

**GET /my-account/history**
- Token: `token_cliente`
- Necesita: sin body (filtros opcionales)

#### 6.16.4 Usuarios

**GET /users**
- Token: `token_admin`

**GET /users/admin/client/:id/detail**
- Token: `token_admin`
- Necesita: `{{user_id}}` en URL
```http
GET {{base_url}}/users/admin/client/{{user_id}}/detail
```

**GET /users/:id**
- Token: `token_admin`
- Necesita: `{{user_id}}`

**PUT /users/:id**
- Token: `token_admin`
- Necesita: `{{user_id}}` + body de cambios
```json
{ "name": "Cliente Actualizado", "phone": "99999999" }
```

#### 6.16.5 Cuentas

**GET /accounts**
- Token: `token_cliente` / `token_employee` / `token_admin`
- Opcional: query `userId` para vista administrativa

**POST /accounts**
- Token: `token_cliente`
- Necesita: tipo de cuenta
```json
{ "accountType": "ahorro" }
```

**PUT /accounts/:id/limits**
- Token: `token_employee` o `token_admin`
- Necesita: `{{account_id}}` + campos de límite
```json
{ "dailyTransactionLimit": 10000, "perTransactionLimit": 2000, "reason": "Ajuste" }
```

**GET /accounts/:id/limits/admin**
- Token: `token_admin`
- Necesita: `{{account_id}}`

**PUT /accounts/:id/limits/admin**
- Token: `token_admin`
- Necesita: `{{account_id}}` + body de límites

#### 6.16.6 Depósitos

**POST /accounts/deposit-requests**
- Token: `token_cliente`
- Necesita: `destinationAccountNumber`, `amount`
```json
{ "destinationAccountNumber": "001-1234567890-1", "amount": 500, "description": "Depósito" }
```

**PUT /accounts/deposit-requests/:id/amount**
- Token: `token_employee` o `token_admin`
- Necesita: `{{deposit_request_id}}` + `amount`
```json
{ "amount": 850, "reason": "Corrección" }
```

**PUT /accounts/deposit-requests/:id/approve**
- Token: `token_employee` o `token_admin`
- Necesita: `{{deposit_request_id}}` (body opcional)
```json
{ "couponId": "cat_ABC123" }
```

**PUT /accounts/deposit-requests/:id/revert**
- Token: `token_employee` o `token_admin`
- Necesita: `{{deposit_request_id}}` + motivo
```json
{ "reason": "Error operativo" }
```

#### 6.16.7 Transferencias

**POST /accounts/transfers**
- Token: `token_cliente`
- Necesita: cuenta origen, destino, tipo, monto
```json
{
  "sourceAccountNumber": "1000000001",
  "destinationAccountNumber": "1000000002",
  "recipientType": "TERCERO",
  "amount": 1500,
  "description": "Pago"
}
```

**PUT /accounts/transfers/:id/revert**
- Token: `token_cliente`
- Necesita: `{{transfer_id}}` + motivo
```json
{ "reason": "Reversión solicitada" }
```

#### 6.16.8 Transacciones

**GET /client/transactions**
- Token: `token_cliente`
- Opcional: `type`, `limit`, `page`
```http
GET {{base_url}}/client/transactions?type=TRANSFERENCIA_ENVIADA&limit=10&page=1
```

**GET /admin/transactions**
- Token: `token_admin`
```http
GET {{base_url}}/admin/transactions?limit=20&page=1
```

**GET /employee/accounts/:accountId/transactions**
- Token: `token_employee`
- Necesita: `{{account_id}}`

**GET /dashboard/transaction-ranking**
- Token: `token_admin`
- Necesita: `type`, `order`, `limit`

#### 6.16.9 Favoritos

**POST /favorites**
- Token: `token_cliente`
- Necesita: `accountNumber`, `accountType`, `alias`
```json
{ "accountNumber": "001-9115890794-1", "accountType": "ahorro", "alias": "Mamá" }
```

**GET /favorites**
- Token: `token_cliente`

**GET /favorites/:id**
- Token: `token_cliente`
- Necesita: `{{favorite_id}}`

**PUT /favorites/:id**
- Token: `token_cliente`
- Necesita: `{{favorite_id}}` + body
```json
{ "alias": "Mamá Rosa", "isActive": true }
```

**DELETE /favorites/:id**
- Token: `token_cliente`
- Necesita: `{{favorite_id}}`

#### 6.16.10 Promociones

**GET /catalog**
- Público, sin token

**GET /catalog/:id**
- Público, sin token
- Necesita: `{{promotion_id}}`

**GET /catalog/admin/all**
- Token: `token_admin`
- Opcional: `status`, `type`

**GET /catalog/admin/audit/all**
- Token: `token_admin`
- Opcional: `limit`, `offset`, `action`

**POST /catalog/admin/create**
- Token: `token_admin`
- Necesita: body de promoción
```json
{ "name": "Promo X", "promotionType": "DEPOSITO_CASHBACK", "cashbackPercentage": 10 }
```

**PUT /catalog/admin/:id**
- Token: `token_admin`
- Necesita: `{{promotion_id}}` + body
```json
{ "cashbackPercentage": 15, "reason": "Ajuste" }
```

**PUT /catalog/admin/:id/status**
- Token: `token_admin`
- Necesita: `{{promotion_id}}`, `newStatus`, `reason`
```json
{ "newStatus": "ACTIVA", "reason": "Validación" }
```

**GET /catalog/admin/:id/audit**
- Token: `token_admin`
- Necesita: `{{promotion_id}}`

**DELETE /catalog/admin/:id**
- Token: `token_admin`
- Necesita: `{{promotion_id}}` (motivo opcional)

#### 6.16.11 Seguridad y administración de cuentas

**GET /security/status**
- Token: `token_cliente`

**GET /security/failed-attempts**
- Token: `token_cliente`

**GET /security/fraud-alerts**
- Token: `token_cliente`

**GET /admin/accounts/:accountId/details**
- Token: `token_admin`
- Necesita: `{{account_id}}`

**POST /admin/accounts/:id/freeze**
- Token: `token_admin`
- Necesita: `{{account_id}}` + motivo
```json
{ "reason": "SECURITY_REVIEW", "notes": "Revisión preventiva" }
```

**POST /admin/accounts/:id/unfreeze**
- Token: `token_admin`
- Necesita: `{{account_id}}` + notas opcionales
```json
{ "notes": "Cuenta rehabilitada" }
```

**GET /admin/accounts/:id/block-history**
- Token: `token_admin`
- Necesita: `{{account_id}}`

---

## 7. Convenciones de respuestas

### Éxito
```json
{
  "success": true,
  "message": "Operación exitosa",
  "data": {}
}
```

### Error
```json
{
  "success": false,
  "message": "Descripción del error"
}
```

Códigos comunes:
- `200`: consulta/operación exitosa
- `201`: recurso creado
- `400`: validación o regla de negocio incumplida
- `401`: no autenticado
- `403`: rol sin permisos
- `404`: recurso no encontrado
- `423`: recurso bloqueado/congelado
- `500`: error interno

---

## 8. Buenas prácticas de consumo

- Usa la colección oficial y variables de entorno de Postman.
- Prueba primero con admin para aprovisionar usuario/cuenta y luego con cliente.
- Envía IDs válidos en rutas con `:id`.
- En endpoints protegidos, siempre incluye token vigente.
- No compartir tokens, contraseñas ni secretos en tickets, commits o documentación.

---

## 9. Estado de la documentación

Este README es la documentación oficial del backend NexusBank para ambiente de desarrollo y pruebas funcionales.
