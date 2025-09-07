# ========================
# Base Image with Puppeteer
# ========================
FROM ghcr.io/puppeteer/puppeteer:24.1.1 AS production

WORKDIR /app

# Copy package files and install only production dependencies
COPY package*.json ./

# Install production dependencies

# Copy source code
COPY . .

# Change ownership of /app to pptruser
USER root
RUN npm install
RUN chown -R pptruser:pptruser /app

RUN apt-get update && apt-get install -y ffmpeg && apt-get clean


USER pptruser

# Ensure authentication directory exists
RUN mkdir -p /app/data/wwebjs_auth && chown -R pptruser:pptruser /app/data/wwebjs_auth
RUN mkdir -p /app/.wwebjs_cache && chown -R pptruser:pptruser /app/.wwebjs_cache

# Expose port
EXPOSE 3000

# Start the application with SWC
CMD ["node", "-r", "@swc-node/register", "src/index.ts"]
