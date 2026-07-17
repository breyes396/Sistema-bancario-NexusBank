FROM node:20-slim AS builder
RUN npm i -g pnpm@10.29.2
WORKDIR /app

# Copiamos la configuración de paquetes y lockfiles de ms-postgres y ms-mongo
COPY ms-postgres/package.json ms-postgres/pnpm-lock.yaml ./ms-postgres/
COPY ms-mongo/package.json ms-mongo/pnpm-lock.yaml ./ms-mongo/

# Instalamos dependencias para ms-postgres
WORKDIR /app/ms-postgres
RUN pnpm install --frozen-lockfile

# Copiamos el código fuente de ms-postgres y la configuración necesaria de ms-mongo
WORKDIR /app
COPY ms-postgres/ ./ms-postgres/
COPY ms-mongo/configs/ ./ms-mongo/configs/

# Establecemos el directorio de trabajo del microservicio
WORKDIR /app/ms-postgres

FROM node:20-slim AS runner
WORKDIR /app
COPY --from=builder /app ./

WORKDIR /app/ms-postgres
EXPOSE 3007
ENV NODE_ENV=production
CMD ["node", "index.js"]
