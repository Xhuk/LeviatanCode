#!/usr/bin/env python3
"""
Simple Windows-optimized validation script
"""

import os
import sys
import json
import subprocess
from pathlib import Path

def print_status(message, success=None):
    """Print status with simple ASCII characters"""
    if success is True:
        print(f"[OK] {message}")
    elif success is False:
        print(f"[FAIL] {message}")
    else:
        print(f"[INFO] {message}")

def test_environment():
    """Test environment configuration"""
    print_status("Testing Environment Configuration")
    
    if not Path(".env").exists():
        print_status(".env file not found", False)
        return False
    
    # Check for required variables
    env_vars = {}
    with open(".env", "r", encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, value = line.split("=", 1)
                env_vars[key.strip()] = value.strip()
    
    required = ["DATABASE_URL"]
    for var in required:
        if var not in env_vars or not env_vars[var]:
            print_status(f"Missing {var}", False)
            return False
        print_status(f"{var} configured", True)
    
    return True

def test_scripts():
    """Test package.json scripts"""
    print_status("Testing Package Scripts")
    
    try:
        with open("package.json", "r", encoding='utf-8') as f:
            package_data = json.load(f)
        
        scripts = package_data.get("scripts", {})
        required_scripts = ["windev", "test:db", "test:ai"]
        
        for script in required_scripts:
            if script in scripts:
                print_status(f"Script '{script}' available", True)
            else:
                print_status(f"Missing script: {script}", False)
                return False
        
        return True
    except Exception as e:
        print_status(f"Script validation failed: {e}", False)
        return False

def test_database_simple():
    """Simple database test"""
    print_status("Testing Database Connection")
    
    try:
        # Simple test without complex output parsing
        result = subprocess.run(
            ["node", "scripts/test-db.js"],
            capture_output=True,
            text=True,
            timeout=15,
            encoding='utf-8',
            errors='replace'
        )
        
        if result.returncode == 0:
            print_status("Database connection successful", True)
            return True
        else:
            print_status("Database connection failed", False)
            if result.stderr:
                print(f"Error: {result.stderr[:200]}...")
            return False
            
    except Exception as e:
        print_status(f"Database test error: {e}", False)
        return False

def main():
    """Main validation"""
    print_status("LeviatanCode Windows Validation")
    print("-" * 40)
    
    tests = [
        ("Environment", test_environment),
        ("Scripts", test_scripts),
        ("Database", test_database_simple)
    ]
    
    passed = 0
    total = len(tests)
    
    for name, test_func in tests:
        print(f"\n{name} Test:")
        if test_func():
            passed += 1
    
    print(f"\nResults: {passed}/{total} tests passed")
    
    if passed == total:
        print_status("All tests passed! Ready for development", True)
        print_status("Run: npm run windev")
        return 0
    else:
        print_status(f"{total - passed} tests failed", False)
        return 1

if __name__ == "__main__":
    sys.exit(main())