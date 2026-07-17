FROM node:20-slim AS builder
RUN npm i -g pnpm@10.29.2
WORKDIR /app

# Copiamos la configuración de paquetes y lockfiles de ms-mongo y ms-postgres
COPY ms-mongo/package.json ms-mongo/pnpm-lock.yaml ./ms-mongo/
COPY ms-postgres/package.json ms-postgres/pnpm-lock.yaml ./ms-postgres/

# Instalamos dependencias para ms-mongo
WORKDIR /app/ms-mongo
RUN pnpm install --frozen-lockfile

# Copiamos el código fuente de ms-mongo y la configuración necesaria de ms-postgres
WORKDIR /app
COPY ms-mongo/ ./ms-mongo/
COPY ms-postgres/configs/ ./ms-postgres/configs/

# Establecemos el directorio de trabajo del microservicio
WORKDIR /app/ms-mongo

FROM node:20-slim AS runner
WORKDIR /app
COPY --from=builder /app ./

WORKDIR /app/ms-mongo
EXPOSE 3006
ENV NODE_ENV=production
CMD ["node", "index.js"]
