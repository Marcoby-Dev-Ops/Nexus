# Multi-stage build for React/Vite application
FROM node:slim AS base

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy dependency manifests first for better caching
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile || pnpm install

# Copy source code
COPY . .

# Build stage
FROM base AS build
WORKDIR /app

# Accept build-time VITE_ variables so the app can be built with embedded values
# Pass these with `--build-arg` or via docker-compose build.args
ARG VITE_API_URL
ARG VITE_AUTHENTIK_CLIENT_ID
ARG VITE_AUTHENTIK_URL
ARG VITE_GOOGLE_CLIENT_ID
ARG VITE_HUBSPOT_CLIENT_ID
ARG VITE_MICROSOFT_CLIENT_ID
ARG VITE_STRIPE_PUBLISHABLE_KEY
ARG VITE_DEV

# Make the ARGs available as environment variables during build so Vite picks them up
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_AUTHENTIK_CLIENT_ID=${VITE_AUTHENTIK_CLIENT_ID}
ENV VITE_AUTHENTIK_URL=${VITE_AUTHENTIK_URL}
ENV VITE_GOOGLE_CLIENT_ID=${VITE_GOOGLE_CLIENT_ID}
ENV VITE_HUBSPOT_CLIENT_ID=${VITE_HUBSPOT_CLIENT_ID}
ENV VITE_MICROSOFT_CLIENT_ID=${VITE_MICROSOFT_CLIENT_ID}
ENV VITE_STRIPE_PUBLISHABLE_KEY=${VITE_STRIPE_PUBLISHABLE_KEY}
ENV VITE_DEV=${VITE_DEV}

# Build the client application (will capture VITE_* into the built bundle)
RUN pnpm run build

# Bake a JSON-safe env.js into the built assets at build time using Node.
# This avoids needing Python or runtime scripts in the final image.
RUN node -e "const fs=require('fs');const shouldInclude=k=>k.startsWith('VITE_')||k==='FRONTEND_URL';const cleanValue=v=>{if(typeof v!=='string')return '';const trimmed=v.replace(/\r/g,'').trim();return trimmed;};const env=Object.keys(process.env).filter(shouldInclude).reduce((acc,k)=>{const val=cleanValue(process.env[k]);if(!val)return acc;acc[k]=val;return acc;},{});const json=JSON.stringify(env);const safe=json.replace(/[\\u2028\\u2029<>]/g,c=>{if(c==='\u2028')return '\\\\u2028';if(c==='\u2029')return '\\\\u2029';if(c==='<')return '\\\\u003c';if(c==='>')return '\\\\u003e';return c;});const script='window.__RUNTIME_ENV = '+safe+';';fs.writeFileSync('/app/dist/env.js',script,{encoding:'utf8'});console.log('Wrote /app/dist/env.js with',Object.keys(env).length,'keys');"

# Validate that the generated env.js is valid JSON when stripped of the JS assignment.
RUN node -e "const fs=require('fs');const content=fs.readFileSync('/app/dist/env.js','utf8');const jsonStr=content.replace(/^[\\s]*window\\.__RUNTIME_ENV\\s*=\\s*/,'').replace(/;\\s*$/,'');try{JSON.parse(jsonStr);console.log('env.js JSON validation passed');}catch(e){console.error('env.js JSON validation failed',e);console.error('env.js content:\\n',content);process.exit(1);}"

# Production stage
FROM nginx:stable AS production

# Install envsubst and curl/wget for environment variable substitution and health checks
# Use Debian package manager to install minimal packages from the official debian-based nginx image
RUN apt-get update \
    && apt-get install -y --no-install-recommends gettext-base curl wget \
    && rm -rf /var/lib/apt/lists/*

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy the repo nginx config as template (keeps Dockerfile simpler and consistent with repo)
COPY nginx.conf /etc/nginx/nginx.conf.template

# Create startup script for environment variable substitution and runtime env injection
RUN cat > /docker-entrypoint.sh <<'SH'
#!/bin/sh
set -e

# Generate nginx config from template
export BACKEND_URL=${VITE_API_URL:-https://napi.marcoby.com}
echo "BACKEND_URL: $BACKEND_URL"
envsubst '$BACKEND_URL' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf
echo "Nginx configuration generated successfully"
nginx -t
echo "Nginx configuration test passed"

echo "Using baked env.js from build artifacts (if present)"

# Exec nginx in foreground
exec nginx -g 'daemon off;'
SH

RUN chmod +x /docker-entrypoint.sh

# Expose port 80
EXPOSE 80

# Add health check (use curl for better compatibility with Coolify)
# Increase start-period and timeout to allow the container to fully initialize on slower hosts.
# Print a diagnostic message when the check fails to make Coolify logs actionable.
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD sh -c 'curl -fsS --max-time 8 http://127.0.0.1/health -w "HTTP %{http_code}\n" || (echo "[healthcheck] curl failed with code $?" >&2; exit 1)'

# Start nginx with environment variable substitution via entrypoint
ENTRYPOINT ["/docker-entrypoint.sh"]


# ---------------------------------------------------------------------------
# Dev stage: use the prepared `base` stage so we can run `pnpm dev` inside
# a Node image without affecting the production nginx image. Compose can
# build this stage with `build.target: dev` to get a dev-friendly image.
# ---------------------------------------------------------------------------
FROM base AS dev
WORKDIR /app
ENV NODE_ENV=development
# Expose vite default dev port
EXPOSE 5173
# Start dev server when used as the image's default command. Compose will
# typically override this, but having a sensible default is convenient.
CMD ["pnpm", "dev", "--host"]
