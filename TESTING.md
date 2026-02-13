# 📋 GUÍA DE PRUEBAS - NexusBank API

## 🚀 Antes de Empezar

1. **Asegúrate de que el servidor está corriendo:**
   ```bash
   pnpm dev
   ```
   Deberías ver en la consola:
   ```
   ✓ Usuario Admin creado exitosamente
      Email: admin@nexusbank.com
      Contraseña inicial: Admin123
   
   NexusBank server running on port 3000
   ```

2. **Verifica tu archivo `.env`:**
   - Copia `.env.example` a `.env`
   - Configura `MONGODB_URI` con tu base de datos
   - Configura `JWT_SECRET` con una clave segura

---

## 🧪 Pruebas con cURL

### 1️⃣ Registrar un Client
```bash
curl -X POST http://localhost:3000/nexusBank/v1/client/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Carlos Mendez",
    "email": "carlos@example.com",
    "password": "Carlos123",
    "phone": "+573105555555",
    "income": 2500000,
    "documentType": "CC",
    "documentNumber": "1098765432"
  }'
```

**Respuesta esperada (201):**
```json
{
  "success": true,
  "message": "Cliente registrado exitosamente",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Carlos Mendez",
    "email": "carlos@example.com",
    "phone": "+573105555555",
    "role": "Client",
    "income": 2500000,
    "accountNumber": "ACC-2026-0001",
    "accountBalance": 0,
    "documentType": "CC",
    "documentNumber": "1098765432",
    "isActive": true,
    "createdAt": "2026-02-13T10:30:00.000Z",
    "updatedAt": "2026-02-13T10:30:00.000Z"
  }
}
```

---

### 2️⃣ Login como Admin (predefinido)
```bash
curl -X POST http://localhost:3000/nexusBank/v1/client/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@nexusbank.com",
    "password": "Admin123"
  }'
```

**Respuesta esperada (200):**
```json
{
  "success": true,
  "message": "Inicio de sesión exitoso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjUwN2YxZjc3YmNmODZjZDc5OTQzOTAxMSIsImVtYWlsIjoiYWRtaW5AbmV4dXNiYW5rLmNvbSIsIm5hbWUiOiJBZG1pbiBOZXh1c0JhbmsiLCJyb2xlIjoiQWRtaW4iLCJpYXQiOjE3MzkzNjI2MDAsImV4cCI6MTczOTQ0OTAwMH0.abc123...",
  "data": {
    "id": "507f1f77bcf86cd799439011",
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

**⚠️ Importante:** Guardar el token para las próximas pruebas

---

### 3️⃣ Login como Client (usuario registrado)
```bash
curl -X POST http://localhost:3000/nexusBank/v1/client/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "carlos@example.com",
    "password": "Carlos123"
  }'
```

---

### 4️⃣ Intentar Login con contraseña incorrecta ❌
```bash
curl -X POST http://localhost:3000/nexusBank/v1/client/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "carlos@example.com",
    "password": "ContraseñaIncorrecta"
  }'
```

**Respuesta esperada (401):**
```json
{
  "success": false,
  "message": "Email o contraseña incorrectos"
}
```

---

### 5️⃣ Usar Bearer Token en cabecera
```bash
# Guardar el token del login
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Hacer solicitud con el token
curl -X GET http://localhost:3000/nexusBank/v1/protected-endpoint \
  -H "Authorization: Bearer $TOKEN"
```

---

### ❌ Pruebas de Error

#### Sin Token
```bash
curl -X GET http://localhost:3000/nexusBank/v1/protected-endpoint
```
**Respuesta (401):**
```json
{
  "success": false,
  "message": "Token de autenticación no proporcionado"
}
```

#### Token con formato incorrecto
```bash
curl -X GET http://localhost:3000/nexusBank/v1/protected-endpoint \
  -H "Authorization: InvalidToken123"
```
**Respuesta (401):**
```json
{
  "success": false,
  "message": "Formato de token inválido. Use: Bearer <token>"
}
```

#### Ingreso menor a $100 en registro
```bash
curl -X POST http://localhost:3000/nexusBank/v1/client/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "User Test",
    "email": "test@example.com",
    "password": "Test123",
    "phone": "+573001234567",
    "income": 50,
    "documentType": "CC",
    "documentNumber": "1111111111"
  }'
```
**Respuesta (400):**
```json
{
  "success": false,
  "message": "El ingreso debe ser mayor o igual a 100"
}
```

---

## 📮 Pruebas con Postman

### Importar Colección

1. **Crear nueva colección:** "NexusBank API"
2. **Crear carpeta:** "Auth"
3. **Agregar requests:**

#### Solicitud 1: Register Client
```
POST http://localhost:3000/nexusBank/v1/client/register

Headers:
  Content-Type: application/json

Body (raw - JSON):
{
  "name": "Maria Garcia",
  "email": "maria.garcia@example.com",
  "password": "MariaGarcia123",
  "phone": "+573006666666",
  "income": 3500000,
  "documentType": "CC",
  "documentNumber": "5555555555"
}
```

#### Solicitud 2: Login Admin
```
POST http://localhost:3000/nexusBank/v1/client/login

Headers:
  Content-Type: application/json

Body (raw - JSON):
{
  "email": "admin@nexusbank.com",
  "password": "Admin123"
}
```

**Después de ejecutar:**
1. En la respuesta, copiar el valor de `token`
2. Ir a `Variables` → Crear variable `token`
3. Pegar el valor del token

#### Uso del Token en Postman

En cualquier solicitud protegida:
1. Tab **Authorization**
2. Type: **Bearer Token**
3. Token: **{{token}}** (usa la variable)

---

## 🔧 Pruebas con Thunder Client (VS Code)

1. **Instalar extensión:**
   - Abrir Extensions en VS Code
   - Buscar "Thunder Client"
   - Instalar

2. **Crear solicitud:**
   - Click en el icono de Thunder Client
   - "New Request"
   - Llenar datos igual que en Postman

3. **Usar variable para token:**
   - Click en el engranaje "Settings"
   - "Env" → "New"
   - Variable: `token` = `valor_del_token`
   - Usar `{{token}}` en Authorization

---

## 📊 Secuencia de Pruebas Recomendada

```
1. Iniciar servidor → Esperar confirmación del Admin
   ↓
2. Registrar nuevo client → Obtener accountNumber
   ↓
3. Login con admin → Obtener token de admin
   ↓
4. Login con client → Obtener token de client
   ↓
5. Intentar acceso sin token → Verificar error 401
   ↓
6. Intentar con token inválido → Verificar error 401
   ↓
7. Usar token válido en endpoints protegidos ✓
```

---

## ✅ Checklist de Validación

- [ ] Servidor inicia sin errores
- [ ] Admin se crea automáticamente
- [ ] Registrar cliente con datos válidos
- [ ] Login exitoso con credenciales correctas
- [ ] Login fallido con contraseña incorrecta
- [ ] Token generado en login tiene formato JWT
- [ ] Token incluido en Bearer Authorization valida
- [ ] Sin token en endpoint protegido retorna 401
- [ ] Token expirado (> 24h) retorna 401
- [ ] Email duplicado en registro retorna error
- [ ] Ingreso < 100 en registro retorna error
- [ ] Documento duplicado retorna error

---

## 🐛 Troubleshooting

### Error: MONGODB_URI not defined
**Solución:** Crear archivo `.env` con `MONGODB_URI`

### Error: Cannot find module 'jsonwebtoken'
**Solución:** Ejecutar `pnpm install`

### Error: Connect ECONNREFUSED 127.0.0.1:27017
**Solución:** 
- Iniciar MongoDB: `mongod`
- O verificar MONGODB_URI en `.env`

### Token inválido aunque acabo de hacer login
**Solución:**
- Verificar que JWT_SECRET es el mismo en `.env`
- Copiar token completo sin espacios
- Verificar formato: `Bearer <token>`

---

**¡Éxito en tus pruebas! 🎉**

Para más información, ver [README.md](./README.md)
