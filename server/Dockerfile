FROM node:22-alpine

WORKDIR /app

# Set environment variables
ENV NODE_ENV=production

# Copy package files first for better caching
COPY package.json ./

# Install pnpm and dependencies
RUN npm install -g pnpm
# Use shamefully-hoist to create a flat node_modules layout inside the container
# so that modules like 'express' resolve correctly even in monorepo contexts.
RUN pnpm install --prod --shamefully-hoist

# Copy source code
COPY . .

# Install curl for health check
RUN apk add --no-cache curl

EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Start the server
CMD ["node", "server.js"]
