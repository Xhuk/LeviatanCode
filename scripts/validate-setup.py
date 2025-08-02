#!/usr/bin/env python3
"""
LeviatanCode Setup Validation Script
Validates that all components are working correctly
"""

import os
import sys
import json
import subprocess
import requests
import time
from pathlib import Path
from typing import Dict, List, Tuple

class Colors:
    GREEN = '\033[92m'
    CYAN = '\033[96m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    WHITE = '\033[97m'
    END = '\033[0m'

def print_colored(text: str, color: str = Colors.WHITE) -> None:
    """Print colored text"""
    print(f"{color}{text}{Colors.END}")

def print_header(text: str) -> None:
    """Print validation header"""
    print_colored(f"\n{'='*50}", Colors.CYAN)
    print_colored(text, Colors.CYAN)
    print_colored('='*50, Colors.CYAN)

def run_command(cmd: List[str], timeout: int = 30) -> Tuple[bool, str]:
    """Run command and return success status and output"""
    try:
        result = subprocess.run(
            cmd, 
            check=True, 
            capture_output=True, 
            text=True, 
            timeout=timeout,
            shell=True
        )
        return True, result.stdout
    except Exception as e:
        return False, str(e)

def validate_environment() -> bool:
    """Validate environment configuration"""
    print_header("🔧 Environment Validation")
    
    # Check .env file exists
    if not Path(".env").exists():
        print_colored("❌ .env file not found", Colors.RED)
        return False
    
    # Load environment variables
    env_vars = {}
    try:
        with open(".env", "r") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, value = line.split("=", 1)
                    env_vars[key.strip()] = value.strip()
    except Exception as e:
        print_colored(f"❌ Failed to read .env: {e}", Colors.RED)
        return False
    
    # Validate required variables
    required = ["DATABASE_URL", "SESSION_SECRET"]
    optional = ["OPENAI_API_KEY", "GEMINI_API_KEY", "PORT"]
    
    for var in required:
        if var not in env_vars or not env_vars[var]:
            print_colored(f"❌ Missing required variable: {var}", Colors.RED)
            return False
        print_colored(f"✅ {var} configured", Colors.GREEN)
    
    # Check optional variables
    port = env_vars.get("PORT", "5005")
    print_colored(f"✅ PORT set to {port}", Colors.GREEN)
    
    ai_keys = [var for var in optional[:-1] if var in env_vars and env_vars[var]]
    if ai_keys:
        print_colored(f"✅ AI keys: {', '.join(ai_keys)}", Colors.GREEN)
    else:
        print_colored("⚠️ No AI keys configured", Colors.YELLOW)
    
    return True

def validate_dependencies() -> bool:
    """Validate npm dependencies"""
    print_header("📦 Dependencies Validation")
    
    # Check package.json
    if not Path("package.json").exists():
        print_colored("❌ package.json not found", Colors.RED)
        return False
    
    # Check node_modules
    if not Path("node_modules").exists():
        print_colored("❌ node_modules not found. Run npm install", Colors.RED)
        return False
    
    # Check critical dependencies
    critical_deps = [
        "express", "drizzle-orm", "react", "typescript", 
        "bcrypt", "cross-env", "@neondatabase/serverless"
    ]
    
    try:
        with open("package.json", "r") as f:
            package_data = json.load(f)
        
        all_deps = {**package_data.get("dependencies", {}), **package_data.get("devDependencies", {})}
        
        for dep in critical_deps:
            if dep in all_deps:
                print_colored(f"✅ {dep} installed", Colors.GREEN)
            else:
                print_colored(f"❌ Missing dependency: {dep}", Colors.RED)
                return False
                
    except Exception as e:
        print_colored(f"❌ Failed to validate dependencies: {e}", Colors.RED)
        return False
    
    return True

def validate_database() -> bool:
    """Validate database connection and schema"""
    print_header("🗄️ Database Validation")
    
    # Test database connection script
    success, output = run_command(["node", "scripts/test-db.js"])
    
    if success:
        print_colored("✅ Database connection successful", Colors.GREEN)
        return True
    else:
        print_colored(f"❌ Database connection failed: {output}", Colors.RED)
        return False

def validate_ai_services() -> bool:
    """Validate AI service connections"""
    print_header("🤖 AI Services Validation")
    
    success, output = run_command(["node", "scripts/test-ai.js"])
    
    # AI test might partially succeed
    if "OpenAI connection successful" in output or "Gemini connection successful" in output:
        print_colored("✅ At least one AI service working", Colors.GREEN)
        return True
    elif "No AI API keys configured" in output:
        print_colored("⚠️ No AI services configured", Colors.YELLOW)
        return True
    else:
        print_colored("❌ AI services validation failed", Colors.RED)
        return False

def validate_server_startup() -> bool:
    """Validate server can start"""
    print_header("🚀 Server Startup Validation")
    
    print_colored("Testing server startup...", Colors.CYAN)
    
    # Start server in background
    try:
        process = subprocess.Popen(
            ["npm", "run", "windev"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        # Wait for server to start
        max_wait = 30
        for i in range(max_wait):
            try:
                response = requests.get("http://localhost:5005", timeout=2)
                if response.status_code == 200:
                    print_colored("✅ Server started successfully on port 5005", Colors.GREEN)
                    process.terminate()
                    process.wait(timeout=5)
                    return True
            except:
                pass
            
            time.sleep(1)
            print_colored(f"Waiting for server... ({i+1}/{max_wait})", Colors.YELLOW)
        
        print_colored("❌ Server failed to start within 30 seconds", Colors.RED)
        process.terminate()
        process.wait(timeout=5)
        return False
        
    except Exception as e:
        print_colored(f"❌ Server startup test failed: {e}", Colors.RED)
        return False

def validate_scripts() -> bool:
    """Validate package.json scripts"""
    print_header("📜 Scripts Validation")
    
    try:
        with open("package.json", "r") as f:
            package_data = json.load(f)
        
        required_scripts = ["windev", "test:db", "test:ai", "seed:db"]
        scripts = package_data.get("scripts", {})
        
        for script in required_scripts:
            if script in scripts:
                print_colored(f"✅ Script '{script}' available", Colors.GREEN)
            else:
                print_colored(f"❌ Missing script: {script}", Colors.RED)
                return False
                
        return True
        
    except Exception as e:
        print_colored(f"❌ Scripts validation failed: {e}", Colors.RED)
        return False

def main() -> int:
    """Main validation function"""
    print_header("🔍 LeviatanCode Setup Validation")
    
    validations = [
        ("Environment", validate_environment),
        ("Dependencies", validate_dependencies), 
        ("Scripts", validate_scripts),
        ("Database", validate_database),
        ("AI Services", validate_ai_services),
        ("Server Startup", validate_server_startup)
    ]
    
    results = []
    for name, validator in validations:
        try:
            result = validator()
            results.append((name, result))
        except Exception as e:
            print_colored(f"❌ {name} validation error: {e}", Colors.RED)
            results.append((name, False))
    
    # Summary
    print_header("📊 Validation Summary")
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        color = Colors.GREEN if result else Colors.RED
        print_colored(f"{status} {name}", color)
    
    print_colored(f"\nValidation Results: {passed}/{total} passed", 
                 Colors.GREEN if passed == total else Colors.YELLOW)
    
    if passed == total:
        print_colored("\n🎉 All validations passed! LeviatanCode is ready!", Colors.GREEN)
        print_colored("Run 'npm run windev' to start development", Colors.CYAN)
        return 0
    else:
        print_colored(f"\n⚠️ {total - passed} validations failed. Please fix issues above.", Colors.YELLOW)
        return 1

if __name__ == "__main__":
    sys.exit(main())