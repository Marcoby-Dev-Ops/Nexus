FROM node:20-alpine

WORKDIR /app

# Set environment variables
ENV NODE_ENV=production
ENV VITE_NODE_ENV=production

# Install pnpm
RUN npm install -g pnpm

# Copy only the necessary workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY client/package.json ./client/
COPY server/package.json ./server/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy only the client source code (excluding node_modules, dist, etc.)
COPY client/src/ ./client/src/
COPY client/public/ ./client/public/
COPY client/index.html ./client/
COPY client/vite.config.ts ./client/
COPY client/tsconfig*.json ./client/
COPY client/tailwind.config.ts ./client/
COPY client/postcss.config.cjs ./client/
COPY client/.swcrc ./client/

# Build the application
WORKDIR /app/client
RUN pnpm run build

# Install curl for health check
RUN apk add --no-cache curl

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

# Start the preview server with explicit configuration
CMD ["pnpm", "run", "preview", "--host", "0.0.0.0", "--port", "3000", "--strictPort"] 