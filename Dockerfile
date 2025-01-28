# ========================
# Etapa 1: Builder
# ========================
FROM node:22-slim AS builder

WORKDIR /app

# Copiar archivos de dependencias y instalar
COPY package*.json ./
RUN npm install

# Copiar el código fuente y construir la aplicación
COPY . .
# RUN npm run test && npm run build
RUN npm run build

# ========================
# Etapa 2: Producción con Puppeteer
# ========================
FROM ghcr.io/puppeteer/puppeteer:24.1.1 AS production

WORKDIR /app

# Copiar los artefactos construidos desde la etapa de builder
COPY --from=builder /app/dist ./dist

# Copiar archivos de dependencias para producción
COPY package*.json ./

# Cambiar a usuario root para ajustar permisos
USER root

# Cambiar la propiedad de /app al usuario pptruser
RUN chown -R pptruser:pptruser /app

# Cambiar al usuario no root proporcionado por la imagen de Puppeteer
USER pptruser

# Ejecutar npm install como pptruser
RUN npm install --only=production

# Configurar archivos de entorno si es necesario
# COPY .env .env

# Asegurar que el directorio .wwebjs_auth exista y tenga los permisos correctos
RUN mkdir -p /app/data/wwebjs_auth
RUN chown -R pptruser:pptruser /app /app/data/wwebjs_auth

# Exponer el puerto en el que corre la aplicación
EXPOSE 3000

# Comando para iniciar la aplicación
CMD ["npm", "start"]
