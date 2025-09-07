# ========================
# Base Image with Puppeteer
# ========================
FROM ghcr.io/puppeteer/puppeteer:24.1.1

WORKDIR /app

# Instalar FFmpeg para conversión de audio
USER root
RUN apt-get update && apt-get install -y ffmpeg && apt-get clean

# Copiar archivos de configuración
COPY package*.json ./

# Instalar dependencias (solo producción)
RUN npm install --omit=dev

# Copiar todo el código fuente
COPY . .

# Ajustar permisos para usuario no root
RUN chown -R pptruser:pptruser /app
USER pptruser

# Crear directorios para WhatsApp Web JS
RUN mkdir -p /app/data/wwebjs_auth && mkdir -p /app/.wwebjs_cache

# Exponer puerto
EXPOSE 3000

# Comando de inicio
CMD ["node", "-r", "@swc-node/register", "src/index.ts"]
