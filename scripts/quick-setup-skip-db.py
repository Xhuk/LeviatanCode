#!/usr/bin/env python3
"""
Quick Windows Setup - Skip Database Step
For when database is already configured
"""

import os
import sys
import json
import subprocess
from pathlib import Path

# ANSI color codes for Windows console
class Colors:
    GREEN = '\033[92m'
    CYAN = '\033[96m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    WHITE = '\033[97m'
    END = '\033[0m'

def print_colored(text: str, color: str = Colors.WHITE) -> None:
    """Print colored text to console"""
    print(f"{color}{text}{Colors.END}")

def run_command(cmd: list, check: bool = True) -> subprocess.CompletedProcess:
    """Run command and return result"""
    try:
        result = subprocess.run(cmd, check=check, capture_output=True, text=True, shell=True)
        return result
    except subprocess.CalledProcessError as e:
        print_colored(f"[FAIL] Command failed: {' '.join(cmd)}", Colors.RED)
        print_colored(f"Error: {e.stderr}", Colors.RED)
        raise

def create_test_scripts() -> bool:
    """Create test scripts for validation"""
    print_colored("\n1. Creating Test Scripts...", Colors.CYAN)
    
    # Test DB script - ASCII safe content
    test_db_content = '''import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

async function testDatabase() {
    try {
        const sql = neon(process.env.DATABASE_URL);
        const db = drizzle(sql);
        
        // Test connection
        const result = await sql`SELECT 1 as test`;
        console.log('[OK] Database connection successful');
        
        // Test basic query
        const version = await sql`SELECT version()`;
        console.log('[OK] Database version verified');
        
    } catch (error) {
        console.error('[FAIL] Database connection failed:', error.message);
        process.exit(1);
    }
}

testDatabase();'''

    # Test AI script - ASCII safe content
    test_ai_content = '''import 'dotenv/config';

async function testAI() {
    try {
        if (process.env.OPENAI_API_KEY) {
            const { default: OpenAI } = await import('openai');
            const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
            
            const response = await openai.chat.completions.create({
                model: 'gpt-4o',
                messages: [{ role: 'user', content: 'Say "OpenAI connection successful"' }],
                max_tokens: 10
            });
            
            console.log('[OK] OpenAI connection successful');
            console.log('Response:', response.choices[0].message.content);
        }
        
        if (process.env.GEMINI_API_KEY) {
            const { GoogleGenAI } = await import('@google/genai');
            const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
            
            const response = await genAI.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: 'Say "Gemini connection successful"'
            });
            
            console.log('[OK] Gemini connection successful');
            console.log('Response:', response.text);
        }
        
        if (!process.env.OPENAI_API_KEY && !process.env.GEMINI_API_KEY) {
            console.log('[INFO] No AI API keys configured');
        }
        
    } catch (error) {
        console.error('[FAIL] AI service test failed:', error.message);
    }
}

testAI();'''
    
    try:
        # Ensure scripts directory exists
        Path("scripts").mkdir(exist_ok=True)
        
        # Write test scripts with UTF-8 encoding
        with open("scripts/test-db.js", "w", encoding='utf-8') as f:
            f.write(test_db_content)
        
        with open("scripts/test-ai.js", "w", encoding='utf-8') as f:
            f.write(test_ai_content)
        
        print_colored("[OK] Test scripts created", Colors.GREEN)
        return True
    except Exception as e:
        print_colored(f"[FAIL] Failed to create test scripts: {e}", Colors.RED)
        return False

def update_package_json() -> bool:
    """Add useful scripts to package.json"""
    print_colored("\n2. Adding Useful Scripts...", Colors.CYAN)
    
    try:
        # Read package.json
        with open("package.json", "r", encoding='utf-8') as f:
            package_data = json.load(f)
        
        # Add scripts if they don't exist
        if "scripts" not in package_data:
            package_data["scripts"] = {}
        
        new_scripts = {
            "test:db": "node scripts/test-db.js",
            "test:ai": "node scripts/test-ai.js", 
            "windev": "cross-env NODE_ENV=development PORT=5005 tsx server/index.ts"
        }
        
        updated = False
        for script_name, script_command in new_scripts.items():
            if script_name not in package_data["scripts"]:
                package_data["scripts"][script_name] = script_command
                updated = True
                print_colored(f"[OK] Added script: {script_name}", Colors.GREEN)
        
        if updated:
            # Write updated package.json
            with open("package.json", "w", encoding='utf-8') as f:
                json.dump(package_data, f, indent=2)
            print_colored("[OK] package.json updated", Colors.GREEN)
        else:
            print_colored("[OK] All scripts already exist", Colors.GREEN)
        
        return True
    except Exception as e:
        print_colored(f"[FAIL] Failed to update package.json: {e}", Colors.RED)
        return False

def test_database() -> bool:
    """Test database connection"""
    print_colored("\n3. Testing Database Connection...", Colors.CYAN)
    
    try:
        result = run_command(["node", "scripts/test-db.js"], check=False)
        if result.returncode == 0:
            print_colored("[OK] Database test passed", Colors.GREEN)
            return True
        else:
            print_colored("[WARN] Database test failed (expected in some environments)", Colors.YELLOW)
            return False
    except:
        print_colored("[WARN] Database test failed (expected in some environments)", Colors.YELLOW)
        return False

def main() -> int:
    """Main setup function - skips database migration"""
    print_colored("=" * 50, Colors.GREEN)
    print_colored("LeviatanCode Quick Setup (Skip Database)", Colors.GREEN)
    print_colored("=" * 50, Colors.GREEN)
    print_colored("Note: Skipping database migration since tables already exist", Colors.YELLOW)
    
    try:
        # Run setup steps
        if not create_test_scripts():
            return 1
        
        if not update_package_json():
            return 1
        
        test_database()
        
        print_colored("\n" + "=" * 50, Colors.GREEN)
        print_colored("Setup Complete!", Colors.GREEN)
        print_colored("=" * 50, Colors.GREEN)
        
        print_colored("\nTo start the application:", Colors.CYAN)
        print_colored("npm run windev", Colors.WHITE)
        
        print_colored("\nUseful commands:", Colors.CYAN)
        print_colored("npm run test:db    # Test database connection", Colors.WHITE)
        print_colored("npm run test:ai    # Test AI services", Colors.WHITE)
        
        print_colored("\nApplication will be available at:", Colors.CYAN)
        print_colored("http://localhost:5005", Colors.WHITE)
        
        return 0
        
    except KeyboardInterrupt:
        print_colored("\n[FAIL] Setup interrupted by user", Colors.RED)
        return 1
    except Exception as e:
        print_colored(f"\n[FAIL] Setup failed: {e}", Colors.RED)
        return 1

if __name__ == "__main__":
    sys.exit(main())