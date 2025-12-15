import { PrismaClient } from '../prisma/generated/prisma/client/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { config } from '../config/config';

const connectionString = config.databaseUrl;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set in .env');
}

// 1. Create a pg Pool
const pool = new Pool({ connectionString });

// 2. Wrap it in PrismaPg adapter
const adapter = new PrismaPg(pool);

// 3. Pass adapter into PrismaClient
export const prisma = new PrismaClient({
  adapter,
});
