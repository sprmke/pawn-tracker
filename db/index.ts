import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
import * as schema from './schema';
import { config } from 'dotenv';

// Load environment variables if not already loaded
if (!process.env.DATABASE_URL) {
  config({ path: '.env.local' });
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    'DATABASE_URL environment variable is not set. Please check your .env.local file.'
  );
}

// Use Neon's serverless pool for pooled connections
const pool = new Pool({ connectionString });
export const db = drizzle(pool, { schema });
