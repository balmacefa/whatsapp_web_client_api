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
FROM ghcr.io/puppeteer/puppeteer:22.7.1 AS production

WORKDIR /app

# Copiar los artefactos construidos desde la etapa de builder
COPY --from=builder /app/dist ./dist

# Copiar archivos de dependencias para producción e instalar solo las dependencias necesarias
COPY package*.json ./
RUN npm install --only=production

# Configurar archivos de entorno si es necesario
# Por ejemplo, si tienes un archivo .env, puedes copiarlo así:
# COPY .env .env

# Asegurar que el directorio .wwebjs_auth exista y tenga los permisos correctos
RUN mkdir -p /app/.wwebjs_auth
RUN chown -R pptruser:pptruser /app /app/data/wwebjs_auth

# Cambiar al usuario no root proporcionado por la imagen de Puppeteer
USER pptruser

# Exponer el puerto en el que corre la aplicación
EXPOSE 3000

# Comando para iniciar la aplicación
CMD ["npm", "start"]
