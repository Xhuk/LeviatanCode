#!/usr/bin/env python3
"""
Fix LeviatanCode setup issues identified by validation
"""

import os
import sys
import json
import subprocess
from pathlib import Path

def fix_package_json_scripts():
    """Add missing scripts to package.json"""
    try:
        with open("package.json", "r") as f:
            package_data = json.load(f)
        
        # Add missing scripts
        if "scripts" not in package_data:
            package_data["scripts"] = {}
        
        new_scripts = {
            "windev": "cross-env NODE_ENV=development tsx server/index.ts",
            "test:db": "node scripts/test-db.js",
            "test:ai": "node scripts/test-ai.js",
            "seed:db": "node scripts/seed-db.js"
        }
        
        for script_name, script_command in new_scripts.items():
            package_data["scripts"][script_name] = script_command
        
        # Write back to file
        with open("package.json", "w") as f:
            json.dump(package_data, f, indent=2)
        
        print("✅ Fixed package.json scripts")
        return True
    except Exception as e:
        print(f"❌ Failed to fix package.json: {e}")
        return False

def create_missing_test_scripts():
    """Create missing test scripts"""
    
    # Test DB script
    test_db_content = '''const { drizzle } = require('drizzle-orm/neon-http');
const { neon } = require('@neondatabase/serverless');

async function testDatabase() {
    try {
        const sql = neon(process.env.DATABASE_URL);
        const db = drizzle(sql);
        
        // Test connection
        const result = await sql`SELECT 1 as test`;
        console.log('✅ Database connection successful');
        console.log('Connection result:', result);
        
        // Test tables exist
        const tables = await sql`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `;
        console.log('✅ Available tables:', tables.map(t => t.table_name));
        
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        process.exit(1);
    }
}

testDatabase();'''

    # Test AI script
    test_ai_content = '''async function testAI() {
    try {
        if (process.env.OPENAI_API_KEY) {
            const { default: OpenAI } = await import('openai');
            const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
            
            const response = await openai.chat.completions.create({
                model: 'gpt-4o',
                messages: [{ role: 'user', content: 'Say "OpenAI connection successful"' }],
                max_tokens: 10
            });
            
            console.log('✅ OpenAI connection successful');
            console.log('Response:', response.choices[0].message.content);
        }
        
        if (process.env.GEMINI_API_KEY) {
            const { GoogleGenAI } = await import('@google/genai');
            const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
            
            const response = await genAI.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: 'Say "Gemini connection successful"'
            });
            
            console.log('✅ Gemini connection successful');
            console.log('Response:', response.text);
        }
        
        if (!process.env.OPENAI_API_KEY && !process.env.GEMINI_API_KEY) {
            console.log('⚠️ No AI API keys configured');
        }
        
    } catch (error) {
        console.error('❌ AI service test failed:', error.message);
    }
}

testAI();'''

    try:
        # Ensure scripts directory exists
        Path("scripts").mkdir(exist_ok=True)
        
        # Write test scripts
        with open("scripts/test-db.js", "w") as f:
            f.write(test_db_content)
        
        with open("scripts/test-ai.js", "w") as f:
            f.write(test_ai_content)
        
        print("✅ Created missing test scripts")
        return True
    except Exception as e:
        print(f"❌ Failed to create test scripts: {e}")
        return False

def main():
    """Fix all setup issues"""
    print("🔧 Fixing LeviatanCode setup issues...")
    
    success = True
    
    if not fix_package_json_scripts():
        success = False
    
    if not create_missing_test_scripts():
        success = False
    
    if success:
        print("\n✅ All issues fixed! Run validation again:")
        print("python scripts/validate-setup.py")
    else:
        print("\n❌ Some issues could not be fixed")
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main())