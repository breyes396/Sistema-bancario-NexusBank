# NexusBank - Sistema Bancario 🏦

Sistema bancario desarrollado con Node.js, Express y MongoDB. Implementa autenticación JWT, validación de Bearer Token, middleware de roles y gestión de clientes y administradores.

## 📋 Tabla de Contenidos

- [Características](#características)
- [Requisitos Previos](#requisitos-previos)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Endpoints Implementados](#endpoints-implementados)
- [Pruebas](#pruebas)
- [Autenticación y Seguridad](#autenticación-y-seguridad)
- [Variables de Entorno](#variables-de-entorno)

## ✨ Características

### ✅ Implementadas

- **Autenticación JWT**: Tokens JWT con expiración de 24 horas
- **Validación de Bearer Token**: Middleware que valida el formato y presencia del token
- **Middleware de Roles**: Verificación de roles (Admin/Client)
  - `verifyIsAdmin`: Solo acceso para administradores
  - `verifyIsClient`: Solo acceso para clientes
  - `verifyRoles(roles[])`: Acceso para múltiples roles
- **Admin Automático**: Creación automática del usuario Admin al iniciar la aplicación
- **Encriptación de Contraseñas**: Usando bcryptjs (10 rounds de salt)
- **Registro de Usuarios**: Validación de ingresos mínimos ($100)
- **Login de Usuarios**: Generación segura de tokens JWT
- **Modelo de Usuario Completo**:
  - Nombre, email, teléfono, rol
  - Tipo y número de documento
  - Ingresos y saldo de cuenta
  - Número de cuenta único
  - Estado activo/inactivo
  - Último login registrado

## 📦 Requisitos Previos

- Node.js (v16+)
- pnpm (o npm)
- MongoDB (local o atlas)

## 🚀 Instalación

```bash
# Clonar el repositorio
git clone https://github.com/usuario/Sistema-bancario-NexusBank.git
cd Sistema-bancario-NexusBank

# Instalar dependencias
pnpm install

# Crear archivo .env (ver sección Variables de Entorno)
cp .env.example .env

# Inicia el servidor
pnpm start

# O en modo desarrollo (auto-reloadable con nodemon)
pnpm dev
```

## ⚙️ Configuración

### Variables de Entorno

Crear un archivo `.env` en la raíz del proyecto:

```env
# PORT
PORT=3000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/nexusbank
# O para MongoDB Atlas:
# MONGODB_URI=mongodb+srv://usuario:contraseña@cluster.mongodb.net/nexusbank

# JWT Secret (reemplazar con una clave segura)
JWT_SECRET=miClaveSeguraParaJWT-Cambiar-EnProduccion

# Node Environment
NODE_ENV=development
```

## 📁 Estructura del Proyecto

```
Sistema-bancario-NexusBank/
├── configs/                          # Configuraciones
│   ├── app.js                        # Configuración de Express
│   ├── cors-configuration.js         # CORS
│   ├── db.js                         # Conexión a MongoDB
│   └── helmet-configuration.js       # Seguridad HTTP
├── helpers/                          # Funciones auxiliares
│   ├── account-generator.js          # Generador de números de cuenta
│   └── create-default-admin.js       # Creador de admin automático
├── middlewares/                      # Middlewares personalizados
│   ├── auth-middleware.js            # Validación de Bearer Token
│   └── role-middleware.js            # Verificación de roles
├── src/
│   └── Client/                       # Módulo de Clientes
│       ├── client.model.js           # Esquema de Mongoose
│       ├── client.controller.js      # Lógica de negocio
│       └── client.routes.js          # Rutas
├── index.js                          # Punto de entrada
├── package.json                      # Dependencias
└── README.md                         # Este archivo
```

## 🔌 Endpoints Implementados

### Autenticación (Público)

#### POST `/nexusBank/v1/client/register`
Registra un nuevo cliente en el sistema.

**Validaciones:**
- Email requerido y debe ser válido
- Contraseña requerida (mín. 6 caracteres)
- Ingreso mínimo: $100
- Documento requerido (CC, CE, PA)

**Body:**
```json
{
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "password": "SecurePass123",
  "phone": "+573001234567",
  "income": 2000000,
  "documentType": "CC",
  "documentNumber": "1234567890"
}
```

**Respuesta (201):**
```json
{
  "success": true,
  "message": "Cliente registrado exitosamente",
  "data": {
    "_id": "...",
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "phone": "+573001234567",
    "role": "Client",
    "income": 2000000,
    "accountNumber": "ACC-2026-0001",
    "accountBalance": 0,
    "documentType": "CC",
    "documentNumber": "1234567890",
    "isActive": true,
    "createdAt": "2026-02-13T10:30:00.000Z"
  }
}
```

---

#### POST `/nexusBank/v1/client/login`
Inicia sesión y retorna un token JWT.

**Body:**
```json
{
  "email": "admin@nexusbank.com",
  "password": "Admin123"
}
```

**Respuesta (200):**
```json
{
  "success": true,
  "message": "Inicio de sesión exitoso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "id": "...",
    "name": "Admin NexusBank",
    "email": "admin@nexusbank.com",
    "phone": "+573001234567",
    "role": "Admin",
    "income": 0,
    "accountNumber": null,
    "accountBalance": 0,
    "documentType": "CC",
    "documentNumber": "1234567890",
    "isActive": true
  }
}
```

---

### Protegidas (Requieren Bearer Token)

Usado para otros endpoints privados:

**Header:**
```
Authorization: Bearer <token_recibido_en_login>
```

## 🧪 Pruebas

### Con cURL

#### 1. Registrar un cliente
```bash
curl -X POST http://localhost:3000/nexusBank/v1/client/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Maria González",
    "email": "maria@example.com",
    "password": "Maria123",
    "phone": "+573009876543",
    "income": 3000000,
    "documentType": "CC",
    "documentNumber": "9876543210"
  }'
```

#### 2. Login con Admin (creado automáticamente)
```bash
curl -X POST http://localhost:3000/nexusBank/v1/client/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@nexusbank.com",
    "password": "Admin123"
  }'
```

#### 3. Login con cliente registrado
```bash
curl -X POST http://localhost:3000/nexusBank/v1/client/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "maria@example.com",
    "password": "Maria123"
  }'
```

#### 4. Usar token en endpoint protegido (ejemplo)
```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl -X GET http://localhost:3000/nexusBank/v1/protected-route \
  -H "Authorization: Bearer $TOKEN"
```

### Con Postman

1. **Registrar usuario:**
   - Método: POST
   - URL: `http://localhost:3000/nexusBank/v1/client/register`
   - Tab Body → raw → JSON
   - Copiar el JSON del ejemplo anterior

2. **Login:**
   - Método: POST
   - URL: `http://localhost:3000/nexusBank/v1/client/login`
   - Copiar el token de la respuesta

3. **Usar token en Authorization:**
   - Tab Authorization → Type: Bearer Token
   - Token: `<copiar_token_recibido>`

### Con Thunder Client (VS Code)

1. Instalar extensión "Thunder Client"
2. Crear nueva solicitud
3. Seguir los mismos pasos que Postman

## 🔐 Autenticación y Seguridad

### Flujo de Autenticación

```
1. Usuario registra: POST /register
   ↓
2. Contraseña encriptada con bcryptjs (10 rounds)
   ↓
3. Usuario login: POST /login
   ↓
4. Validación de credenciales
   ↓
5. JWT generado (válido 24h) con payload:
   - id: ID de usuario
   - email: Email del usuario
   - name: Nombre del usuario
   - role: Rol (Admin/Client)
   ↓
6. Token retornado al cliente
   ↓
7. Cliente incluye token en header: "Authorization: Bearer <token>"
   ↓
8. Middleware validateBearerToken valida formato y presencia
   ↓
9. Middleware verifyTokenAndGetUser decodifica y valida
   ↓
10. Middlewares de rol verifican permisos (verifyIsAdmin, verifyIsClient, etc.)
```

### Middlewares Disponibles

**auth-middleware.js:**
- `validateBearerToken`: Valida formato Bearer Token
- `validateBearerTokenSelective`: Permite rutas públicas sin token

**role-middleware.js:**
- `verifyTokenAndGetUser`: Decodifica JWT y extrae datos
- `verifyIsAdmin`: Solo Admin
- `verifyIsClient`: Solo Client
- `verifyRoles(roles)`: Múltiples roles

### Ejemplo de uso en rutas protegidas

```javascript
import { verifyTokenAndGetUser, verifyIsAdmin } from '../middlewares/role-middleware.js';

// Ruta solo para admins
router.get('/admin-panel', verifyTokenAndGetUser, verifyIsAdmin, controllerFunction);

// Ruta para clientes
router.get('/profile', verifyTokenAndGetUser, verifyIsClient, controllerFunction);

// Ruta para múltiples roles
router.get('/data', verifyTokenAndGetUser, verifyRoles(['Admin', 'Client']), controllerFunction);
```

## 👤 Usuario Admin Automático

En cada inicio de la aplicación:

```
Verifica si existe usuario Admin
  ↓
Si NO existe:
  - Crea automáticamente
  - Email: admin@nexusbank.com
  - Contraseña: Admin123 (encriptada)
  - Rol: Admin
  
Si SÍ existe:
  - Utiliza el existente
```

**⚠️ Importante:** Cambiar la contraseña del admin por defecto después del primer acceso en producción.

## 📊 Esquema de Usuario

```javascript
{
  name: String (requerido, máx. 100 caracteres),
  email: String (requerido, único, válido),
  password: String (requerido, mín. 6 caracteres, encriptado),
  phone: String (requerido),
  role: String (Admin o Client, default: Client),
  income: Number (requerido, mín. 0),
  accountNumber: String (único, generado automáticamente),
  accountBalance: Number (default: 0),
  documentType: String (CC, CE, PA),
  documentNumber: String (único, requerido),
  isActive: Boolean (default: true),
  lastLogin: Date (registrado en cada login),
  timestamps: { createdAt, updatedAt }
}
```

## 🔄 Respuestas Estándar

La API retorna respuestas consistentes:

**Exitosa:**
```json
{
  "success": true,
  "message": "Descripción de la acción",
  "data": { /* datos */ }
}
```

**Error:**
```json
{
  "success": false,
  "message": "Descripción del error",
  "error": "Detalles técnicos (solo en desarrollo)"
}
```

## 📝 Códigos de Estado HTTP

| Código | Significado |
|--------|---|
| 200 | OK - Success |
| 201 | Created - Recurso creado |
| 400 | Bad Request - Datos inválidos |
| 401 | Unauthorized - Token inválido/ausente |
| 403 | Forbidden - Acceso denegado por rol |
| 404 | Not Found - Endpoint no existe |
| 500 | Server Error - Error interno |

## 🛠️ Dependencias Principales

```json
{
  "express": "^5.2.1",
  "mongoose": "^9.2.0",
  "jsonwebtoken": "^9.0.3",
  "bcryptjs": "^3.0.3",
  "cors": "^2.8.6",
  "helmet": "^8.1.0",
  "morgan": "^1.10.1",
  "uuid": "^13.0.0"
}
```

## 📌 Próximas Características

- [ ] Recuperación de contraseña
- [ ] Verificación de email
- [ ] Transferencias entre cuentas
- [ ] Historial de transacciones
- [ ] Rate limiting
- [ ] Auditoría de acciones
- [ ] Validación con 2FA
- [ ] Gestión de tarjetas
- [ ] Reportes bancarios

## 🤝 Contribuir

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

ISC License - Ver archivo LICENSE para detalles

## 👨‍💻 Autor

Sistema desarrollado para NexusBank - 2026

---

**Última actualización:** 13 de febrero de 2026
