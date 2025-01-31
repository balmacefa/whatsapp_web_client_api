# ========================
# Base Image with Puppeteer
# ========================
FROM ghcr.io/puppeteer/puppeteer:24.1.1 AS production

WORKDIR /app

# Copy package files and install only production dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy source code
COPY . .

# Change ownership of /app to pptruser
USER root
RUN chown -R pptruser:pptruser /app
USER pptruser

# Ensure authentication directory exists
RUN mkdir -p /app/data/wwebjs_auth && chown -R pptruser:pptruser /app/data/wwebjs_auth
RUN mkdir -p /app/.wwebjs_cache && chown -R pptruser:pptruser /app/.wwebjs_cache

# Expose port
EXPOSE 3000

# Start the application with SWC
CMD ["node", "-r", "@swc-node/register", "src/index.ts"]
