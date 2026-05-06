NODE_ENV=development
PORT=3007

# MongoDB
URI_MONGO=mongodb://localhost:27017/NexusBank

# PostgreSQL
DB_HOST=localhost
DB_PORT=5435
DB_NAME=NexusBank
DB_USERNAME=root
DB_PASSWORD=admin
DB_SQL_LOGGING=false

# JWT
JWT_SECRET=<JWT_SECRET>
JWT_EXPIRES_IN=30m
JWT_REFRESH_EXPIRES_IN=7d
JWT_ISSUER=AuthService
JWT_AUDIENCE=AuthService

# SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_ENABLE_SSL=true
SMTP_USERNAME=narutoshippude745@gmail.com
SMTP_PASSWORD=rhcs dgno ywts egrt
EMAIL_FROM=narutoshippude745@gmail.com
EMAIL_FROM_NAME=AuthDotnet App

# Verificacion
VERIFICATION_EMAIL_EXPIRY_HOURS=24
PASSWORD_RESET_EXPIRY_HOURS=1

# Frontend URL
FRONTEND_URL=http://localhost:5173

# FX API
FX_API_BASE_URL=https://api.fastforex.io
FX_API_KEY=<FX_API_KEY>
FX_BASE_CURRENCY=GTQ
FX_TIMEOUT_MS=5000

# Cloudinary
CLOUDINARY_CLOUD_NAME=dut08rmaz
CLOUDINARY_API_KEY=279612751725163
CLOUDINARY_API_SECRET=UxGMRqU1iB580Kxb2AlDR4n4hu0
CLOUDINARY_BASE_URL=https://res.cloudinary.com/dut08rmaz/image/upload/
CLOUDINARY_FOLDER=gastroflow/profiles
CLOUDINARY_DEFAULT_AVATAR_FILENAME=default-avatar_ewzxwx.png

# Upload local
UPLOAD_PATH=./uploads

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,http://localhost:3006
ADMIN_ALLOWED_ORIGINS=http://localhost:5173