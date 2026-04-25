import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { pool } from './connection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function setupDatabase() {
  console.log('[DB SETUP] Starting database setup...');

  try {
    const schemaSQL = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');
    
    await pool.query(schemaSQL);
    
    console.log('[DB SETUP] Tables created successfully');
    
    // Verify tables
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log('[DB SETUP] Tables in database:');
    result.rows.forEach((row) => console.log(`  - ${row.table_name}`));
    
    console.log('[DB SETUP] Setup complete!');
    process.exit(0);
  } catch (error: any) {
    console.error('[DB SETUP] Error:', error.message);
    process.exit(1);
  }
}

setupDatabase();