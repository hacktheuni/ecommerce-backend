import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: './prisma/schema.prisma',

  datasource: {
    url: env('DATABASE_URL'),
  },
  
  migrations: {
    path: './prisma/migrations'
  }
});
console.log(env('DATABASE_URL'));