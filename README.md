# Endpoints funcionales

1) Cantidad de endpoints funcionales: 13

2) Rutas:

## Cliente (Requiere autenticación - solo login)
- POST /nexusBank/v1/client/login
- GET /nexusBank/v1/client/users (requiere Admin o Employee) - Ver todos los usuarios (Admin, Employee, Client)
- PUT /nexusBank/v1/client/user/:id - No permite actualizar `documentNumber` (DPI) ni `password`
- DELETE /nexusBank/v1/client/user/:id (requiere Admin) - No permite eliminar a otro Admin

## Catálogo (GET público, POST/PUT/DELETE requiere Admin)
- POST /nexusBank/v1/catalog/create (requiere Admin)
- GET /nexusBank/v1/catalog/get
- GET /nexusBank/v1/catalog/category/:category
- GET /nexusBank/v1/catalog/:id
- PUT /nexusBank/v1/catalog/:id (requiere Admin)
- PUT /nexusBank/v1/catalog/:id/activate (requiere Admin)
- PUT /nexusBank/v1/catalog/:id/deactivate (requiere Admin)
- DELETE /nexusBank/v1/catalog/:id (requiere Admin)

## Empleado (Requiere Employee)
- POST /nexusBank/v1/employee/create-client (requiere Employee)

Ejemplos (body JSON):

POST /nexusBank/v1/client/login
```json
{
  "email": "maria@example.com",
  "password": "Maria123"
}
```

POST /nexusBank/v1/employee/create-client (requiere autenticacion Employee)
```json
{
  "name": "Juan Perez",
  "email": "juan@example.com",
  "password": "Juan123",
  "phone": "+573001234567",
  "income": 1500000,
  "documentType": "CC",
  "documentNumber": "1234567890"
}
```

GET /nexusBank/v1/client/users (requiere Admin o Employee - con Bearer Token)
```bash
curl -X GET \
  -H "Authorization: Bearer <TOKEN>" \
  http://localhost:3006/nexusBank/v1/client/users
```

PUT /nexusBank/v1/client/user/:id (autenticado — no permitir `documentNumber` ni `password`)
```json
{
  "name": "Nombre Actualizado",
  "phone": "+573009998877",
  "income": 2000000
}
```

Ejemplo curl:
```bash
curl -X PUT \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Nombre Actualizado","phone":"+573009998877","income":2000000}' \
  http://localhost:3000/nexusBank/v1/client/user/<ID>
```

Nota: Si el body contiene `password` o `documentNumber` la petición será rechazada con 400.

GET /nexusBank/v1/catalog/get (publico)
```
?page=1&limit=10&isActive=true&category=CUENTAS
```

POST /nexusBank/v1/catalog/create (requiere Admin)
```json
{
  "name": "Cuenta Ahorro",
  "description": "Cuenta de ahorro basica",
  "price": 0,
  "category": "CUENTAS"
}
```

PUT /nexusBank/v1/catalog/:id (requiere Admin)
```json
{
  "name": "Cuenta Ahorro Plus",
  "description": "Cuenta de ahorro con beneficios",
  "price": 5000,
  "category": "CUENTAS"
}
```

.env esta en .gitignore para no subir credenciales.

Crear archivo .env en la raiz copiando .env.example:
```
NODE_ENV = development
PORT = 3006

URI_MONGO=mongodb://localhost:27017/NexusBank

JWT_SECRET=MyVerySecretKeyForJWTTokenAuthenticationWith256Bits!
JWT_EXPIRES_IN=30m
JWT_REFRESH_EXPIRES_IN=7d
JWT_ISSUER=AuthService
JWT_AUDIENCE=AuthService

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
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

# Cloudinary (upload de imágenes de perfil)
CLOUDINARY_CLOUD_NAME=dut08rmaz
CLOUDINARY_API_KEY=279612751725163
CLOUDINARY_API_SECRET=UxGMRqU1iB580Kxb2AlDR4n4hu0
CLOUDINARY_BASE_URL=https://res.cloudinary.com/dut08rmaz/image/upload/
CLOUDINARY_FOLDER=nexusbank/profiles
CLOUDINARY_DEFAULT_AVATAR_FILENAME=default-avatar_ewzxwx.png

# File Upload (alternativa local)
UPLOAD_PATH=./uploads

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,http://localhost:3006
ADMIN_ALLOWED_ORIGINS=http://localhost:5173
```

Luego completar los valores segun tu entorno (MongoDB, JWT_SECRET, Cloudinary, SMTP, etc).



{
  "email": "admin@nexusbank.com",
  "password": "Admin123"
}


