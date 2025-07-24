# Build stage
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Environment variables for build
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

# Copy package files
COPY package*.json ./
COPY pnpm-lock.yaml ./
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm run build

# Production stage - use a simple HTTP server
FROM node:20-alpine

# Install serve and curl for health check
RUN npm install -g serve && apk add --no-cache curl

# Copy built application
COPY --from=builder /app/dist /app/dist

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

# Start the server
CMD ["serve", "-s", "/app/dist", "-l", "3000"] 