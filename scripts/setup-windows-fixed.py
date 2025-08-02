#!/usr/bin/env python3
"""
LeviatanCode Windows Setup Script - Fixed for Unicode Issues
Comprehensive setup for Windows development environment with port 5005
"""

import os
import sys
import json
import subprocess
import shutil
from pathlib import Path
from typing import Dict, List, Optional

# ANSI color codes for Windows console
class Colors:
    GREEN = '\033[92m'
    CYAN = '\033[96m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    WHITE = '\033[97m'
    BOLD = '\033[1m'
    END = '\033[0m'

def print_colored(text: str, color: str = Colors.WHITE) -> None:
    """Print colored text to console"""
    print(f"{color}{text}{Colors.END}")

def print_header(text: str) -> None:
    """Print section header"""
    print_colored("\n" + "=" * 50, Colors.GREEN)
    print_colored(text, Colors.GREEN)
    print_colored("=" * 50, Colors.GREEN)

def run_command(cmd: List[str], check: bool = True) -> subprocess.CompletedProcess:
    """Run command and return result"""
    try:
        result = subprocess.run(cmd, check=check, capture_output=True, text=True, shell=True)
        return result
    except subprocess.CalledProcessError as e:
        print_colored(f"[FAIL] Command failed: {' '.join(cmd)}", Colors.RED)
        print_colored(f"Error: {e.stderr}", Colors.RED)
        raise

def check_prerequisites() -> bool:
    """Check if required tools are installed"""
    print_colored("\n1. Checking Prerequisites...", Colors.CYAN)
    
    # Check Node.js
    try:
        result = run_command(["node", "--version"])
        print_colored(f"[OK] Node.js version: {result.stdout.strip()}", Colors.GREEN)
    except:
        print_colored("[FAIL] Node.js not found. Please install Node.js 18+", Colors.RED)
        return False
    
    # Check Git
    try:
        result = run_command(["git", "--version"])
        print_colored(f"[OK] Git version: {result.stdout.strip()}", Colors.GREEN)
    except:
        print_colored("[FAIL] Git not found. Please install Git", Colors.RED)
        return False
    
    # Check .env file
    if not Path(".env").exists():
        print_colored("[FAIL] .env file not found.", Colors.RED)
        print_colored("Run: copy .env.example .env and configure it", Colors.YELLOW)
        return False
    
    print_colored("[OK] Prerequisites check completed", Colors.GREEN)
    return True

def install_dependencies() -> bool:
    """Install npm dependencies"""
    print_colored("\n2. Installing Dependencies...", Colors.CYAN)
    
    try:
        run_command(["npm", "install"])
        print_colored("[OK] Dependencies installed", Colors.GREEN)
        return True
    except:
        print_colored("[FAIL] Failed to install dependencies", Colors.RED)
        return False

def load_environment() -> Dict[str, str]:
    """Load environment variables from .env file"""
    print_colored("\n3. Loading Environment Configuration...", Colors.CYAN)
    
    env_vars = {}
    try:
        with open(".env", "r", encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, value = line.split("=", 1)
                    env_vars[key.strip()] = value.strip()
                    os.environ[key.strip()] = value.strip()
    except Exception as e:
        print_colored(f"[FAIL] Failed to load .env file: {e}", Colors.RED)
        return {}
    
    # Check required variables
    required_vars = ["DATABASE_URL"]
    optional_vars = ["OPENAI_API_KEY", "GEMINI_API_KEY"]
    
    for var in required_vars:
        if var not in env_vars or not env_vars[var]:
            print_colored(f"[FAIL] Required environment variable {var} is not set", Colors.RED)
            return {}
        print_colored(f"[OK] {var} is configured", Colors.GREEN)
    
    has_ai_key = False
    for var in optional_vars:
        if var in env_vars and env_vars[var]:
            print_colored(f"[OK] {var} is configured", Colors.GREEN)
            has_ai_key = True
    
    if not has_ai_key:
        print_colored("[WARN] No AI API keys found. AI features will not work.", Colors.YELLOW)
        print_colored("Please add OPENAI_API_KEY or GEMINI_API_KEY to .env", Colors.YELLOW)
    
    return env_vars

def setup_database() -> bool:
    """Setup database migrations"""
    print_colored("\n4. Setting Up Database...", Colors.CYAN)
    
    try:
        print_colored("Generating database migrations...", Colors.YELLOW)
        run_command(["npx", "drizzle-kit", "generate"])
        
        print_colored("Running database migrations...", Colors.YELLOW)
        run_command(["npx", "drizzle-kit", "push"])
        
        print_colored("[OK] Database setup completed", Colors.GREEN)
        return True
    except:
        print_colored("[FAIL] Database setup failed", Colors.RED)
        return False

def create_test_scripts() -> bool:
    """Create test scripts for validation - ASCII safe"""
    print_colored("\n5. Creating Test Scripts...", Colors.CYAN)
    
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

def test_database() -> bool:
    """Test database connection"""
    print_colored("\n6. Testing Database Connection...", Colors.CYAN)
    
    try:
        run_command(["node", "scripts/test-db.js"])
        return True
    except:
        print_colored("[FAIL] Database connection test failed", Colors.RED)
        return False

def test_ai_services() -> None:
    """Test AI services"""
    print_colored("\n7. Testing AI Services...", Colors.CYAN)
    
    try:
        run_command(["node", "scripts/test-ai.js"], check=False)
    except:
        print_colored("AI service test completed with warnings", Colors.YELLOW)

def update_package_json() -> bool:
    """Add useful scripts to package.json"""
    print_colored("\n8. Adding Useful Scripts...", Colors.CYAN)
    
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
            "windev": "cross-env NODE_ENV=development tsx server/index.ts"
        }
        
        for script_name, script_command in new_scripts.items():
            if script_name not in package_data["scripts"]:
                package_data["scripts"][script_name] = script_command
        
        # Write updated package.json
        with open("package.json", "w", encoding='utf-8') as f:
            json.dump(package_data, f, indent=2)
        
        print_colored("[OK] Scripts added to package.json", Colors.GREEN)
        return True
    except Exception as e:
        print_colored(f"[FAIL] Failed to update package.json: {e}", Colors.RED)
        return False

def print_completion_message() -> None:
    """Print setup completion message"""
    print_header("Setup Complete!")
    
    print_colored("\nTo start the application:", Colors.CYAN)
    print_colored("npm run windev", Colors.WHITE)
    
    print_colored("\nUseful commands:", Colors.CYAN)
    print_colored("npm run test:db    # Test database connection", Colors.WHITE)
    print_colored("npm run test:ai    # Test AI services", Colors.WHITE)
    
    print_colored("\nApplication will be available at:", Colors.CYAN)
    print_colored("http://localhost:5005", Colors.WHITE)
    
    print_colored("\nLeviatanCode is ready to use!", Colors.GREEN)

def main() -> int:
    """Main setup function"""
    print_header("LeviatanCode Windows Setup")
    
    try:
        # Run setup steps
        if not check_prerequisites():
            return 1
        
        if not install_dependencies():
            return 1
        
        env_vars = load_environment()
        if not env_vars:
            return 1
        
        if not setup_database():
            return 1
        
        if not create_test_scripts():
            return 1
        
        if not test_database():
            return 1
        
        test_ai_services()
        
        if not update_package_json():
            return 1
        
        print_completion_message()
        return 0
        
    except KeyboardInterrupt:
        print_colored("\n[FAIL] Setup interrupted by user", Colors.RED)
        return 1
    except Exception as e:
        print_colored(f"\n[FAIL] Setup failed: {e}", Colors.RED)
        return 1

if __name__ == "__main__":
    sys.exit(main())