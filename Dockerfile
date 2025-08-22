FROM node:20-alpine

WORKDIR /app/client

# Set environment variables
ENV NODE_ENV=production
ENV VITE_NODE_ENV=production

# Copy package files first for better caching
COPY client/package*.json client/pnpm-lock.yaml ./

# Install pnpm and dependencies
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

# Copy source code
COPY client/ .

# Build the application
RUN pnpm run build

# Install curl for health check
RUN apk add --no-cache curl

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

# Start the preview server with explicit configuration
CMD ["pnpm", "run", "preview", "--host", "0.0.0.0", "--port", "3000", "--strictPort"] 