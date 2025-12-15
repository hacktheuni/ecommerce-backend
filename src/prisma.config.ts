import { defineConfig } from 'prisma/config';
import { config } from './config/config';

export default defineConfig({
  schema: './prisma/schema.prisma',

  datasource: {
    url: config.databaseUrl!,
  },
  
  migrations: {
    path: './prisma/migrations'
  }
});
