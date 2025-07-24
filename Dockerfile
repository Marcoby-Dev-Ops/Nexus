FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first for better caching
COPY package*.json pnpm-lock.yaml ./

# Install pnpm and dependencies
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application with explicit environment and mode
RUN NODE_ENV=production pnpm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Install pnpm for production
RUN npm install -g pnpm

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/pnpm-lock.yaml ./

# Install only production dependencies
RUN pnpm install --frozen-lockfile --prod

# Install curl for health check
RUN apk add --no-cache curl

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Change ownership of the app directory
RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

# Start the preview server with explicit configuration
CMD ["pnpm", "run", "preview", "--host", "0.0.0.0", "--port", "3000", "--strictPort"] 