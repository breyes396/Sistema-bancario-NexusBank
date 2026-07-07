# Guía de Despliegue en Render - NexusBank

Esta guía detalla los pasos para desplegar tu sistema bancario **NexusBank** en la plataforma **Render** utilizando las configuraciones de Docker recién creadas.

El sistema se compone de 3 servicios:
1. **ms-postgres** (Microservicio PostgreSQL)
2. **ms-mongo** (Microservicio MongoDB)
3. **Bancario-NexusBank** (Frontend en React)

---

## 1. Bases de Datos en Producción

Antes de desplegar los servicios web, necesitas tener las bases de datos de producción disponibles:
- **PostgreSQL**: Puedes crear una base de datos PostgreSQL gratuita directamente en Render.
- **MongoDB**: Render no ofrece MongoDB administrado en sus planes gratuitos. Te recomendamos utilizar **MongoDB Atlas** (gratuito) y copiar tu URI de conexión.

---

## 2. Despliegue de `ms-mongo` (Web Service)

Este servicio debe desplegarse primero porque provee los endpoints de catálogo y cupones que el microservicio de Postgres necesita consultar internamente.

1. En el dashboard de Render, presiona **New +** y selecciona **Web Service**.
2. Conecta tu repositorio de GitHub.
3. Configura los siguientes campos:
   - **Name**: `nexusbank-mongo`
   - **Root Directory**: *(Dejar vacío)*
   - **Runtime**: `Docker`
   - **Dockerfile Path**: `ms-mongo/Dockerfile`
4. Ve a la pestaña **Environment** y agrega las siguientes variables de entorno:
   - `PORT`: `10000` (Render asigna este puerto por defecto)
   - `URI_MONGO`: *(Tu cadena de conexión de producción de MongoDB, ej: Atlas)*
   - `JWT_SECRET`: *(Un string secreto aleatorio y seguro para firmar los tokens)*
   - `JWT_EXPIRES_IN`: `30m`
   - `JWT_REFRESH_EXPIRES_IN`: `7d`
   - `JWT_ISSUER`: `AuthService`
   - `JWT_AUDIENCE`: `AuthService`
   - `SMTP_HOST`: `smtp.gmail.com`
   - `SMTP_PORT`: `465`
   - `SMTP_ENABLE_SSL`: `true`
   - `SMTP_USERNAME`: *(Tu correo gmail de envío)*
   - `SMTP_PASSWORD`: *(Tu contraseña de aplicación de Gmail)*
   - `EMAIL_FROM`: *(Tu correo de envío)*
   - `EMAIL_FROM_NAME`: `NexusBank`
   - `FRONTEND_URL`: *(La URL final de tu frontend en Render, ej: `https://nexusbank.onrender.com`)*
   - `FX_API_BASE_URL`: `https://api.fastforex.io`
   - `FX_API_KEY`: *(Tu clave de FastForex)*
   - `FX_BASE_CURRENCY`: `GTQ`
   - `FX_TIMEOUT_MS`: `5000`
   - `CLOUDINARY_CLOUD_NAME`: *(Tus credenciales de Cloudinary)*
   - `CLOUDINARY_API_KEY`: *...*
   - `CLOUDINARY_API_SECRET`: *...*
   - `CLOUDINARY_BASE_URL`: *...*
   - `CLOUDINARY_FOLDER`: `nexusbank/profiles`
   - `CLOUDINARY_DEFAULT_AVATAR_FILENAME`: `default-avatar_ewzxwx.png`
   - `ALLOWED_ORIGINS`: `https://nexusbank.onrender.com` *(Reemplaza con la URL de tu frontend cuando esté desplegado)*
5. Guarda y presiona **Deploy Web Service**.
6. **Copia la URL que genera Render para este servicio** (ej: `https://nexusbank-mongo.onrender.com`).

---

## 3. Despliegue de `ms-postgres` (Web Service)

1. En Render, presiona **New +** y selecciona **Web Service**.
2. Conecta tu repositorio.
3. Configura:
   - **Name**: `nexusbank-postgres`
   - **Root Directory**: *(Dejar vacío)*
   - **Runtime**: `Docker`
   - **Dockerfile Path**: `ms-postgres/Dockerfile`
4. Ve a la pestaña **Environment** y agrega las siguientes variables:
   - `PORT`: `10000`
   - `DB_URI`: *(Tu URL de conexión de producción de Postgres. Por ejemplo, la de Render o Neon. Debe empezar con `postgresql://`)*
   - `DB_SQL_LOGGING`: `false`
   - `URI_MONGO`: *(Tu cadena de conexión de producción de MongoDB)*
   - `JWT_SECRET`: *(El mismo secreto JWT configurado en ms-mongo)*
   - `JWT_EXPIRES_IN`: `30m`
   - `JWT_REFRESH_EXPIRES_IN`: `7d`
   - `JWT_ISSUER`: `AuthService`
   - `JWT_AUDIENCE`: `AuthService`
   - `SMTP_HOST`: `smtp.gmail.com`
   - `SMTP_PORT`: `465`
   - `SMTP_ENABLE_SSL`: `true`
   - `SMTP_USERNAME`: *...*
   - `SMTP_PASSWORD`: *...*
   - `EMAIL_FROM`: *...*
   - `EMAIL_FROM_NAME`: `NexusBank`
   - `FRONTEND_URL`: *(La URL final de tu frontend en Render)*
   - `MONGO_API_URL`: `https://nexusbank-mongo.onrender.com/api/v1` *(La URL que copiaste del servicio `ms-mongo` en el paso anterior)*
   - `ALLOWED_ORIGINS`: `https://nexusbank.onrender.com`
5. Guarda y presiona **Deploy Web Service**.
6. **Copia la URL que genera Render para este servicio** (ej: `https://nexusbank-postgres.onrender.com`).

---

## 4. Despliegue del Frontend `Bancario-NexusBank` (Web Service)

Para el frontend React, usaremos la imagen con Nginx que creamos en el Dockerfile. Dado que React compila a estático, debemos pasar las URLs públicas del backend al momento de compilar.

1. En Render, presiona **New +** y selecciona **Web Service**.
2. Conecta tu repositorio.
3. Configura:
   - **Name**: `nexusbank`
   - **Root Directory**: *(Dejar vacío)*
   - **Runtime**: `Docker`
   - **Dockerfile Path**: `Bancario-NexusBank/Dockerfile`
4. Ve a la pestaña **Environment** y presiona en **Advanced**. Agrega los siguientes **Docker Build Arguments**:
   - `VITE_BANKING_API_URL` = `https://nexusbank-postgres.onrender.com/api/v1` *(URL pública del ms-postgres)*
   - `VITE_API_URL` = `https://nexusbank-mongo.onrender.com/api/v1` *(URL pública del ms-mongo)*
5. Guarda y presiona **Deploy Web Service**.

Una vez finalizado el deploy, ¡tu aplicación estará completamente en línea y funcional!

---

## 5. Actualización de CORS (Opcional pero Recomendado)
Cuando tu frontend esté listo y conozcas su URL definitiva (ej: `https://nexusbank.onrender.com`), asegúrate de que en las variables de entorno de `ms-mongo` y `ms-postgres` la variable `ALLOWED_ORIGINS` la incluya para evitar bloqueos por CORS en el navegador.
