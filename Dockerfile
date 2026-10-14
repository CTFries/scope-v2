# Build stage - compile native dependencies
FROM node:20-alpine AS builder

# Install build dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev for build)
RUN npm ci

# Production stage
FROM node:20-alpine

# Install runtime dependencies for better-sqlite3
RUN apk add --no-cache libstdc++

WORKDIR /app

# Copy node_modules from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy application files
COPY package*.json ./
COPY index.js ./
COPY build.js ./
COPY database.js ./
COPY helpers.js ./
COPY logger.js ./
COPY security.js ./
COPY commands ./commands
COPY resources ./resources

# Create volume mount points for persistent data and config
VOLUME ["/app/data", "/app/config"]

# The config.json should be mounted at runtime
# Example: -v /path/to/config.json:/app/config.json

# Set environment variable for data directory (optional future use)
ENV NODE_ENV=production

# Run the bot
CMD ["node", "."]
