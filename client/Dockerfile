# Multi-stage build for React/Vite application
FROM node:18-alpine AS base

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy root package files and workspace configuration
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# Copy package.json for all workspace packages
COPY client/package.json ./client/
COPY server/package.json ./server/

# Install dependencies for the entire workspace
RUN pnpm install --frozen-lockfile

# Copy source code for the client application
COPY client/ ./client/
# Copy source code for the server application as well, for workspace context
COPY server/ ./server/

# Build stage
FROM base AS build
WORKDIR /app

# Build the client application
# We need to reference the filter from the WORKDIR
RUN pnpm --filter client... build

# Production stage
FROM nginx:alpine AS production

# Copy built assets from build stage
COPY --from=build /app/client/dist /usr/share/nginx/html

# Copy nginx configuration
COPY client/nginx.conf /etc/nginx/nginx.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
