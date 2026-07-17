FROM node:20-slim
RUN npm i -g pnpm@10.29.2
WORKDIR /app/ms-android

# Copiamos la configuración de paquetes y lockfiles
COPY ms-android/package.json ms-android/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copiamos el resto del código del microservicio móvil
COPY ms-android/ ./

EXPOSE 8081

# Metro bundler running in non-interactive mode
ENV EXPO_NO_TELEMETRY=1
CMD ["pnpm", "start"]
