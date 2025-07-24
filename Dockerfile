FROM node:20-alpine

WORKDIR /app

COPY . .

RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile
RUN pnpm run build

# Install curl for health check
RUN apk add --no-cache curl

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

CMD ["pnpm", "run", "preview", "--host", "0.0.0.0", "--port", "3000"] 