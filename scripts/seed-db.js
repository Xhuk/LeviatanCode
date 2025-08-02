import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { users, projects, aiChats, messages } from '../shared/schema.ts';
import bcrypt from 'bcrypt';
import 'dotenv/config';

async function seedDatabase() {
    try {
        const sql = neon(process.env.DATABASE_URL);
        const db = drizzle(sql);
        
        console.log('Seeding database with sample data...');
        
        // Create demo user
        const hashedPassword = await bcrypt.hash('demo123', 10);
        
        await db.insert(users).values({
            id: 'demo-user-1',
            username: 'demo',
            passwordHash: hashedPassword,
            createdAt: new Date()
        }).onConflictDoNothing();
        
        // Create demo project
        await db.insert(projects).values({
            id: 'demo-project-1',
            name: 'ProductData_Analysis',
            description: 'Sample data analysis project with Python and Jupyter notebooks',
            userId: 'demo-user-1',
            createdAt: new Date(),
            updatedAt: new Date()
        }).onConflictDoNothing();
        
        // Create sample AI chat
        const chatId = 'demo-chat-1';
        await db.insert(aiChats).values({
            id: chatId,
            projectId: 'demo-project-1',
            title: 'Getting Started',
            createdAt: new Date(),
            updatedAt: new Date()
        }).onConflictDoNothing();
        
        // Add sample messages
        await db.insert(messages).values([
            {
                id: 'msg-1',
                chatId: chatId,
                role: 'user',
                content: 'How do I run this Python project?',
                createdAt: new Date()
            },
            {
                id: 'msg-2', 
                chatId: chatId,
                role: 'assistant',
                content: 'This appears to be a Python data analysis project. To run it, you should first install the dependencies with `pip install -r requirements.txt`, then start Jupyter with `jupyter notebook` to open the analysis notebooks.',
                createdAt: new Date()
            }
        ]).onConflictDoNothing();
        
        console.log('✅ Database seeded successfully');
        console.log('Demo user: username=demo, password=demo123');
        
    } catch (error) {
        console.error('❌ Database seeding failed:', error.message);
        process.exit(1);
    }
}

seedDatabase();