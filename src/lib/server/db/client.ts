// src/lib/server/db/client.ts
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg'; // ✅ CommonJS-compatible import
import * as schema from './schema';

const { Pool } = pg;

const pool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_DA07gWekjPws@ep-snowy-sun-a54fowlf-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require",
});

export const db = drizzle(pool, { schema });
