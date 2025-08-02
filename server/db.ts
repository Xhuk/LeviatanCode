import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import dotenv from "dotenv";

const { Pool } = pg;

// Load environment variables
dotenv.config();

const databaseUrl = process.env.DATABASE_URL;
console.log('🔍 Database URL configured:', databaseUrl ? `${databaseUrl.substring(0, 30)}...` : 'NOT SET');

if (!databaseUrl) {
  console.warn("⚠️  DATABASE_URL environment variable is not set");
}

// Create connection pool for Supabase
const pool = databaseUrl ? new Pool({
  connectionString: databaseUrl,
  ssl: {
    rejectUnauthorized: false
  },
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
}) : null;

// Initialize Drizzle with the pool
export const db = pool ? drizzle(pool) : null;

// Export pool for direct access if needed
export { pool };

// Test database connection
export async function testDatabaseConnection(): Promise<boolean> {
  if (!pool) {
    console.warn('❌ No database pool available - DATABASE_URL not configured');
    return false;
  }
  
  try {
    console.log('🔍 Testing database connection...');
    const client = await pool.connect();
    const result = await client.query('SELECT 1 as test');
    client.release();
    console.log('✅ Database connection successful:', result.rows[0]);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
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