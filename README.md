# 🏦 NexusBank - Sistema Bancario

NexusBank es una plataforma bancaria backend y frontend que permite gestionar autenticación, usuarios, cuentas, transferencias, depósitos, favoritos y promociones bancarias.

---

## 🐳 Instalación Rápida con Docker

Todo el ecosistema de **NexusBank** se puede levantar de forma fácil y local con un solo comando utilizando **Docker Compose**.

### Requisitos
- **Docker Desktop** (con Docker Compose instalado).

### Ejecución
Desde la raíz del proyecto, ejecuta el siguiente comando:

```bash
docker compose up --build -d
```

### Puertos y Servicios Expuestos:
- 🖥️ **Frontend (React + Vite):** [http://localhost](http://localhost) (Puerto `80`)
- ⚙️ **Backend Postgres (Auth y Cuentas):** [http://localhost:3007](http://localhost:3007)
  - *Documentación Swagger:* [http://localhost:3007/api-docs](http://localhost:3007/api-docs)
- ⚙️ **Backend Mongo (Catálogo y Promociones):** [http://localhost:3006](http://localhost:3006)
  - *Documentación Swagger:* [http://localhost:3006/api-docs](http://localhost:3006/api-docs)
- 📱 **App Móvil Metro Bundler (Expo):** [http://localhost:8081](http://localhost:8081) (Puerto `8081`)

Para apagar los servicios ejecutados:
```bash
docker compose down
```

---

## 🔐 Credenciales por Defecto (Entorno Local)

Al iniciar el proyecto, se crean automáticamente los siguientes usuarios de prueba:

### 1. Administrador (Admin)
- **Email:** `adminb@nexusbank.com`
- **Contraseña:** `ADMINB`

### 2. Empleado (Employee)
- **Email:** `empleado@nexusbank.com`
- **Contraseña:** `EMPLEADO1`

---

## 📱 Uso de la App Móvil (Expo Metro Bundler)

Una vez levantado Docker Compose:

  ```
- **Si usas Expo Go (Dispositivo Físico):** Asegúrate de que el archivo `ms-android/.env` apunte a la IP de tu computadora y escanea el código QR que se muestra en los logs del contenedor (`docker compose logs -f ms-android`).

---

## 📁 Recursos del Proyecto
- **Colección Postman:** Archivo `NexusBank API - Colección Ordenada (ES).postman_collection.json` en la raíz del proyecto.
