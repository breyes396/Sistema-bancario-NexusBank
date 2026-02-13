# 🚀 Guía Rápida - NexusBank

**¿Primerizo? Empieza aquí en 5 minutos.**

---

## ⚡ Inicio Rápido

### 1. Preparar el Entorno

```bash
# Ir a la carpeta del proyecto
cd c:\Github\Sistema-bancario-NexusBank

# Instalar dependencias
pnpm install

# Crear archivo .env
cp .env.example .env
```

### 2. Configurar .env

Edita el archivo `.env` y asegúrate de tener:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/nexusbank
JWT_SECRET=miClaveSeguraParaJWT-CambiarEnProduccion
NODE_ENV=development
```

### 3. Iniciar MongoDB

```bash
# En otra terminal
mongod
```

O si usas MongoDB Atlas:
```env
MONGODB_URI=mongodb+srv://usuario:pass@cluster.mongodb.net/nexusbank
```

### 4. Ejecutar el Servidor

```bash
# Modo desarrollo (con auto-reload)
pnpm dev

# O modo producción
pnpm start
```

Deberías ver:
```
✓ Usuario Admin creado exitosamente
   Email: admin@nexusbank.com
   Contraseña inicial: Admin123

NexusBank server running on port 3000
Health check: http://localhost:3000/nexusBank/v1/health
```

---

## 🧪 Prueba Rápida

### Registrar Cliente (3 segundos)

```bash
curl -X POST http://localhost:3000/nexusBank/v1/client/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Juan Test",
    "email": "juan@test.com",
    "password": "Test123",
    "phone": "+573001234567",
    "income": 2000000,
    "documentType": "CC",
    "documentNumber": "1234567890"
  }'
```

### Login como Admin (3 segundos)

```bash
curl -X POST http://localhost:3000/nexusBank/v1/client/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@nexusbank.com",
    "password": "Admin123"
  }'
```

**Resultado:**
- Status: 200 OK
- Token: `eyJhbGci...`
- Datos: usuario completo

---

## 📚 Documentación Completa

| Archivo | Contenido |
|---------|-----------|
| [README.md](./README.md) | Documentación completa, arquitectura, endpoints |
| [TESTING.md](./TESTING.md) | Guía de pruebas detallada |
| [CHANGELOG.md](./CHANGELOG.md) | Historial de cambios |
| [.env.example](./.env.example) | Variables de entorno |

---

## 🔑 Credenciales Predefinidas

| Usuario | Email | Contraseña | Rol |
|---------|-------|-----------|-----|
| Admin (auto-creado) | `admin@nexusbank.com` | `Admin123` | Admin |

**⚠️ Cambiar la contraseña después del primer uso en producción**

---

## 📁 Estructura Básica

```
src/Client/
├── client.controller.js    ← Lógica de login/register
├── client.model.js         ← Esquema de usuario
└── client.routes.js        ← Rutas: /login, /register

middlewares/
├── auth-middleware.js      ← Validacion Bearer Token
└── role-middleware.js      ← Verificacion de roles

configs/
└── app.js                  ← Configuracion global

helpers/
└── create-default-admin.js ← Admin automático
```

---

## 🔗 Endpoints Principales

### Login
```
POST /nexusBank/v1/client/login
Body: { "email": "...", "password": "..." }
Response: { "token": "...", "data": {...} }
```

### Registro
```
POST /nexusBank/v1/client/register
Body: { "name": "...", "email": "...", "password": "...", ... }
Response: { "data": {...usuario creado...} }
```

---

## ❓ Problemas Comunes

### ❌ Error: Cannot connect to MongoDB
**Solución:** Inicia MongoDB o verifica MONGODB_URI en .env

### ❌ Error: EADDRINUSE 3000
**Solución:** El puerto está ocupado. Cambia PORT en .env

### ❌ Error: Cannot find module
**Solución:** Ejecuta `pnpm install`

---

## 💡 Tips Útiles

### Usar Postman para pruebas
1. Instala [Postman](https://www.postman.com/downloads/)
2. Haz login → Copia el token
3. En Authorization, selecciona "Bearer Token"
4. Pega el token → ¡Listo!

### Ver logs en MongoDB
```bash
mongosh
use nexusbank
db.clients.find()
```

### Generar clave JWT segura
```bash
openssl rand -base64 32
```

### Cambiar puerto del servidor
```env
PORT=5000
```

---

## 🎯 Próximos Pasos

1. **Entender la autenticación:** Lee [README.md - Autenticación](./README.md#-autenticación-y-seguridad)
2. **Probar endpoints:** Sigue [TESTING.md](./TESTING.md)
3. **Agregar funcionalidades:** Crea nuevos controllers bajo `src/`
4. **Proteger rutas:** Importa middlewares de roles

---

## 📞 Ayuda Rápida

**¿Cómo crearía una ruta protegida solo para Admin?**

```javascript
import { verifyTokenAndGetUser, verifyIsAdmin } from './middlewares/role-middleware.js';

router.get(
    '/admin-panel',
    verifyTokenAndGetUser,  // Verificar JWT
    verifyIsAdmin,          // Verificar que sea Admin
    controller              // Tu lógica
);
```

**¿Cómo agrego campos al usuario?**

En `src/Client/client.model.js`:
```javascript
const clientSchema = mongoose.Schema({
    // Campos existentes...
    nuevosCampo: {
        type: String,
        required: true
    }
});
```

---

## ✅ Checklist de Primeros Pasos

- [ ] Instalar dependencias
- [ ] Crear `.env` con `MONGODB_URI`
- [ ] Iniciar MongoDB
- [ ] Ejecutar `pnpm dev`
- [ ] Ver que Admin se crea automáticamente
- [ ] Probar login como admin
- [ ] Registrar nuevo cliente
- [ ] Probar login como cliente
- [ ] Leer [README.md](./README.md)

---

**¡Listo! Ya estás corriendo NexusBank 🎉**

Próximo paso: [TESTING.md](./TESTING.md) para probar todos los endpoints
