FROM node:20-alpine

WORKDIR /app

COPY . .

RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile
RUN pnpm run build

EXPOSE 3000

CMD ["pnpm", "run", "preview", "--host", "0.0.0.0", "--port", "3000"] 