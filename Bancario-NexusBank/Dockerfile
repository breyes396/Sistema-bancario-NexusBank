FROM node:20-slim AS builder
ARG VITE_BANKING_API_URL
ARG VITE_AUTH_URL
ARG VITE_API_URL
ARG VITE_CATALOG_URL
ENV VITE_BANKING_API_URL=$VITE_BANKING_API_URL
ENV VITE_AUTH_URL=$VITE_AUTH_URL
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_CATALOG_URL=$VITE_CATALOG_URL

RUN npm i -g pnpm@10.29.2
WORKDIR /app

# Copiamos la configuración de paquetes
COPY Bancario-NexusBank/package.json Bancario-NexusBank/pnpm-lock.yaml ./Bancario-NexusBank/

WORKDIR /app/Bancario-NexusBank
RUN pnpm install --frozen-lockfile

# Copiamos el resto del código del frontend
WORKDIR /app
COPY Bancario-NexusBank/ ./Bancario-NexusBank/

WORKDIR /app/Bancario-NexusBank
# TRUCO: Copiamos src/assets a public/src/assets para que Vite exporte las imágenes 
# con sus rutas estáticas exactas (/src/assets/...) en la carpeta dist.
RUN mkdir -p public/src && cp -r src/assets public/src/assets
RUN pnpm build

FROM nginx:alpine AS runner
# Copiamos los archivos estáticos compilados
COPY --from=builder /app/Bancario-NexusBank/dist /usr/share/nginx/html
# Copiamos la configuración personalizada de Nginx
COPY Bancario-NexusBank/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
