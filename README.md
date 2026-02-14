# Endpoints funcionales

1) Cantidad de endpoints funcionales: 10

2) Rutas:
- POST /nexusBank/v1/client/register
- POST /nexusBank/v1/client/login
- POST /nexusBank/v1/catalog/create
- GET /nexusBank/v1/catalog/get
- GET /nexusBank/v1/catalog/category/:category
- GET /nexusBank/v1/catalog/:id
- PUT /nexusBank/v1/catalog/:id
- PUT /nexusBank/v1/catalog/:id/activate
- PUT /nexusBank/v1/catalog/:id/deactivate
- DELETE /nexusBank/v1/catalog/:id

Ejemplos (body JSON):

POST /nexusBank/v1/client/register
```json
{
  "name": "Maria Gonzalez",
  "email": "maria@example.com",
  "password": "Maria123",
  "phone": "+573009876543",
  "income": 3000000,
  "documentType": "CC",
  "documentNumber": "9876543210"
}
```

POST /nexusBank/v1/client/login
```json
{
  "email": "maria@example.com",
  "password": "Maria123"
}
```

POST /nexusBank/v1/catalog/create
```json
{
  "name": "Cuenta Ahorro",
  "description": "Cuenta de ahorro basica",
  "price": 0,
  "category": "CUENTAS"
}
```

PUT /nexusBank/v1/catalog/:id
```json
{
  "name": "Cuenta Ahorro Plus",
  "description": "Cuenta de ahorro con beneficios",
  "price": 5000,
  "category": "CUENTAS"
}
```

.env esta en .gitignore para no subir credenciales.

Crear archivo .env en la raiz (contenido completo):
```env
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



