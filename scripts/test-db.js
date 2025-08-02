import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

async function testDatabase() {
    try {
        const sql = neon(process.env.DATABASE_URL);
        const db = drizzle(sql);
        
        // Test connection
        const result = await sql`SELECT 1 as test`;
        console.log('✅ Database connection successful');
        
        // Test database exists - simple check
        const version = await sql`SELECT version()`;
        console.log('✅ Database version verified');
        
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        process.exit(1);
    }
}

testDatabase();