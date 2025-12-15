import { app } from './app';
import { config } from './config/config';
import { prisma } from './db/prisma';

const port = config.port || 8000;

const startServer = async () => {
  try {
    await prisma.$connect();
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (err) {
    console.error('Failed to start server', err);
    process.exit(1);
  }
};

startServer();

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});


