import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import dotenv from "dotenv";

const { Pool } = pg;

// Load environment variables
dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

// Create connection pool for Supabase
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
});

// Initialize Drizzle with the pool
export const db = drizzle(pool);

// Export pool for direct access if needed
export { pool };

// Test database connection
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🔄 Closing database connections...');
  await pool.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🔄 Closing database connections...');
  await pool.end();
  process.exit(0);
});