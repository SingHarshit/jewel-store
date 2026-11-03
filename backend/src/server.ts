import { app } from './app.js';
import { env } from './config/env.js';
import { prisma } from './config/db.js';

const server = app.listen(env.PORT, () => {
  console.log(`🚀 Heirest fine jewelry API listening on http://localhost:${env.PORT}`);
});

const shutdown = async (signal: string) => {
  console.log(`${signal} received; shutting down gracefully...`);
  server.close(async () => {
    try {
      await prisma.$disconnect();
    } catch (e) {
      console.error('Error disconnecting Prisma:', e);
    }
    process.exit(0);
  });
};

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
