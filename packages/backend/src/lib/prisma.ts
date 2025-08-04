import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

// Prevent multiple instances of Prisma Client in development
const prisma = globalThis.__prisma || new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'error',
    },
  ],
});

// Removed all $on listeners to unblock build. Re-add specific logging as needed.

if (process.env.NODE_ENV === 'development') {
  globalThis.__prisma = prisma;
}

export { prisma };
export default prisma;
