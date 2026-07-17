# NexusBank Mobile Application 👋

Este es el cliente móvil de **NexusBank** desarrollado en **React Native** con **Expo** y **pnpm**.

---

## 🛠️ Credenciales y Variables de Entorno (.env)

Dado que este es un proyecto escolar, se listan a continuación las credenciales y variables de entorno del backend para simplificar el proceso de configuración:

### 1. Variables de Entorno Móvil (`ms-android/.env`)
Crea un archivo `.env` en la raíz de la carpeta `ms-android/` con los siguientes valores para conectarte al backend:
```env
# NexusBank Backend Connections (pointing to online Render APIs)
EXPO_PUBLIC_API_URL=https://nexusbank-postgres.onrender.com/api/v1
EXPO_PUBLIC_MONGO_API_URL=https://nexusbank-mongo.onrender.com/api/v1

# Desactivar la verificación de compatibilidad de Expo Router con React Navigation para SDK 56
EXPO_ROUTER_DISABLE_RN_NAVIGATION_CHECK=1

```

### 2. Configuración de Base de Datos Centralizada
- **PostgreSQL (Usuarios, Autenticación y Cuentas)**:
  - **Host**: `localhost` (puerto expuesto `5435`)
  - **Database Name**: `NexusBank`
  - **User**: `root`
  - **Password**: `admin`
- **MongoDB (Cupones y Catálogos)**:
  - **URI**: `mongodb://localhost:27017/NexusBank`

---

## 🚀 Cómo Iniciar el Proyecto

1. **Instalar dependencias**:
   ```bash
   pnpm install
   ```

2. **Levantar el servidor Metro de Expo**:
   ```bash
   pnpm start
   ```

3. **Abrir en Entorno de Pruebas**:
   - **Emulador de Android (SDK 15 / API 35)**: Presiona `a` en la terminal una vez iniciado Metro.
   - **Expo Go (Dispositivo Físico)**: Escanea el código QR que aparece en la terminal usando la app **Expo Go** en tu celular (asegúrate de cambiar la IP en `.env` por la IP local de tu computadora en lugar de `10.0.2.2`).
