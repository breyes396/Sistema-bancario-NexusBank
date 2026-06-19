NODE_ENV = development
PORT = 3007
 
# MongoDB (Restaurantes, Mesas, Platos) - Local sin autenticación
URI_MONGO=mongodb://bpineda2024427_db_user:DDjTaCUzOCVNrmNj@ac-tqs0lm9-shard-00-00.6vw3viy.mongodb.net:27017,ac-tqs0lm9-shard-00-01.6vw3viy.mongodb.net:27017,ac-tqs0lm9-shard-00-02.6vw3viy.mongodb.net:27017/NexusBank?ssl=true&authSource=admin&retryWrites=true&w=majority
 
# Database PostgreSQL (Usuarios, Autenticación)
DB_URI=postgresql://neondb_owner:npg_gr4otsNVIFm8@ep-solitary-frost-ah6mxajj.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require
DB_SQL_LOGGING=false
 
JWT_SECRET=MyVerySecretKeyForJWTTokenAuthenticationWith256Bits!
JWT_EXPIRES_IN=30m
JWT_REFRESH_EXPIRES_IN=7d
JWT_ISSUER=AuthService
JWT_AUDIENCE=AuthService
 
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_ENABLE_SSL=true
SMTP_USERNAME=narutoshippude745@gmail.com
SMTP_PASSWORD=rhcs dgno ywts egrt
EMAIL_FROM=narutoshippude745@gmail.com
EMAIL_FROM_NAME=AuthDotnet App
 
# Verification Tokens (en horas)
VERIFICATION_EMAIL_EXPIRY_HOURS=24
PASSWORD_RESET_EXPIRY_HOURS=1
 
# Frontend URL (para enlaces en emails)
FRONTEND_URL=http://localhost:5173
 
# FX API (Conversion de divisas)
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