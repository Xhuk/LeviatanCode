import 'dotenv/config';

// Simple database connection test without complex queries
async function testConnection() {
    try {
        console.log('Testing database connection...');
        
        if (!process.env.DATABASE_URL) {
            console.error('❌ DATABASE_URL not found in environment');
            process.exit(1);
        }
        
        console.log('✅ DATABASE_URL is configured');
        
        // Try to import the database module
        const { neon } = await import('@neondatabase/serverless');
        console.log('✅ Database module imported successfully');
        
        // Test basic connection
        const sql = neon(process.env.DATABASE_URL);
        const result = await sql`SELECT 1 as connection_test`;
        
        if (result && result.length > 0) {
            console.log('✅ Database connection successful');
            console.log('✅ Basic query execution works');
        } else {
            console.error('❌ Connection test failed');
            process.exit(1);
        }
        
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        process.exit(1);
    }
}

testConnection();