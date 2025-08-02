#!/usr/bin/env python3
"""
Complete Windows validation with better error handling
"""

import os
import sys
import json
import subprocess
from pathlib import Path

def test_basic_setup():
    """Test basic setup requirements"""
    print("[INFO] Testing Basic Setup")
    
    # Check .env
    if not Path(".env").exists():
        print("[FAIL] .env file not found")
        print("       Create .env file with DATABASE_URL and other config")
        return False
    print("[OK] .env file exists")
    
    # Check package.json
    if not Path("package.json").exists():
        print("[FAIL] package.json not found")
        return False
    print("[OK] package.json exists")
    
    # Check node_modules
    if not Path("node_modules").exists():
        print("[FAIL] node_modules not found - run npm install")
        return False
    print("[OK] node_modules exists")
    
    return True

def test_environment():
    """Test environment variables"""
    print("\n[INFO] Testing Environment Variables")
    
    env_vars = {}
    try:
        with open(".env", "r", encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, value = line.split("=", 1)
                    env_vars[key.strip()] = value.strip()
    except Exception as e:
        print(f"[FAIL] Cannot read .env file: {e}")
        return False
    
    # Check DATABASE_URL
    if "DATABASE_URL" not in env_vars or not env_vars["DATABASE_URL"]:
        print("[FAIL] DATABASE_URL not configured")
        return False
    
    # Validate DATABASE_URL format
    db_url = env_vars["DATABASE_URL"]
    if not db_url.startswith("postgresql://"):
        print("[FAIL] DATABASE_URL must start with postgresql://")
        return False
    
    print("[OK] DATABASE_URL configured and formatted correctly")
    return True

def test_scripts():
    """Test npm scripts"""
    print("\n[INFO] Testing NPM Scripts")
    
    try:
        with open("package.json", "r", encoding='utf-8') as f:
            package_data = json.load(f)
    except Exception as e:
        print(f"[FAIL] Cannot read package.json: {e}")
        return False
    
    scripts = package_data.get("scripts", {})
    required = ["windev", "test:db", "test:ai"]
    
    for script in required:
        if script not in scripts:
            print(f"[FAIL] Missing script: {script}")
            return False
        print(f"[OK] Script '{script}' available")
    
    return True

def test_database():
    """Test database connection"""
    print("\n[INFO] Testing Database Connection")
    
    try:
        result = subprocess.run(
            ["node", "scripts/test-db-simple.js"],
            capture_output=True,
            text=True,
            timeout=20,
            encoding='utf-8',
            errors='replace'
        )
        
        if result.returncode == 0:
            print("[OK] Database connection successful")
            return True
        else:
            print("[FAIL] Database connection failed")
            if result.stderr:
                print(f"       Error: {result.stderr[:150]}...")
            return False
            
    except subprocess.TimeoutExpired:
        print("[FAIL] Database test timed out")
        return False
    except Exception as e:
        print(f"[FAIL] Database test error: {e}")
        return False

def main():
    """Run all tests"""
    print("=" * 50)
    print("LeviatanCode Windows Setup Validation")
    print("=" * 50)
    
    tests = [
        ("Basic Setup", test_basic_setup),
        ("Environment", test_environment),
        ("NPM Scripts", test_scripts),
        ("Database", test_database)
    ]
    
    passed = 0
    total = len(tests)
    
    for name, test_func in tests:
        try:
            if test_func():
                passed += 1
            else:
                # Print troubleshooting hint
                if name == "Database":
                    print("       Hint: Check your Supabase connection string")
                    print("       Format: postgresql://user:pass@host:port/db")
        except Exception as e:
            print(f"[FAIL] {name} test crashed: {e}")
    
    print(f"\n{'='*50}")
    print(f"Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("[OK] All tests passed! Ready for development")
        print("     Run: npm run windev")
        return 0
    else:
        print(f"[FAIL] {total - passed} tests failed")
        print("       Fix the issues above before proceeding")
        return 1

if __name__ == "__main__":
    sys.exit(main())