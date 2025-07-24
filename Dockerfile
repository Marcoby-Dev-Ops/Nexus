# Build stage
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# BEGIN ENV CONFIG
# These build-args allow you to inject Supabase credentials (and any other
# public-facing Vite variables) at build-time, e.g.
# docker build --build-arg VITE_SUPABASE_URL=... \
#              --build-arg VITE_SUPABASE_ANON_KEY=... \
#              -t nexus-web .
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

# Expose them to the build environment so Vite can substitute the values
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
# END ENV CONFIG

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

# Production stage
FROM nginx:1.27.0-alpine AS production

# Copy built application from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Create a simple nginx config
RUN echo 'server { \
    listen 80; \
    server_name _; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"] 