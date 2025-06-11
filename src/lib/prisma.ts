import { PrismaClient } from '@prisma/client';

declare global {
  // `var` is intentionally used here to attach the Prisma client instance to
  // the Node.js global object. This pattern prevents exhausting database
  // connections during hot-module reloads in development.
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined; // eslint-disable-line no-var
}

export const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
} 