import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

export const pool = new Pool({
  connectionString,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Test connection
pool.on('connect', () => {
  console.log('[DB] New client connected to Neon');
});

pool.on('error', (err) => {
  console.error('[DB] Unexpected error on idle client', err);
});

// Helper function to generate IDs
export function generateId(prefix: string = ''): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 15);
  return prefix ? `${prefix}_${timestamp}${randomStr}` : `${timestamp}${randomStr}`;
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('[DB] Closing pool...');
  await pool.end();
});

process.on('SIGINT', async () => {
  console.log('[DB] Closing pool...');
  await pool.end();
});