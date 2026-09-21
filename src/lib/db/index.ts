/**
 * Vertex — Database Connection
 *
 * Singleton database client using Drizzle ORM + node-postgres.
 * Uses connection pooling for efficient connection management.
 *
 * SECURITY: DATABASE_URL is read from environment variables only.
 * It is NEVER exposed to the client.
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    'DATABASE_URL environment variable is not set. ' +
    'Copy .env.example to .env.local and configure your database connection.'
  );
}

const pool = new Pool({
  connectionString,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

export const db = drizzle(pool, { schema });

export { pool };

export type Database = typeof db;
