# Stage 1: Builder
FROM node:22-slim AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code and build
COPY . .
RUN npm run test && npm run build

# Stage 2: Production
FROM node:22-slim AS production

WORKDIR /app

# Copy built assets from builder
COPY --from=builder /app/dist dist

# Install only production dependencies
COPY package*.json .
RUN npm install --only=production

# Expose the application port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
