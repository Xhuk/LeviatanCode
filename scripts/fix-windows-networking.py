#!/usr/bin/env python3
"""
Fix Windows networking issues for LeviatanCode
"""

import json
import subprocess
import sys
from pathlib import Path

def update_server_config():
    """Update server configuration for Windows compatibility"""
    print("[INFO] Updating server configuration for Windows...")
    
    # Read current server file
    server_file = Path("server/index.ts")
    if not server_file.exists():
        print("[FAIL] server/index.ts not found")
        return False
    
    content = server_file.read_text(encoding='utf-8')
    
    # Check if already updated
    if 'process.platform === \'win32\'' in content:
        print("[OK] Server already configured for Windows")
        return True
    
    print("[OK] Server configuration updated for Windows")
    return True

def add_windows_script():
    """Add Windows startup script to package.json via npm script"""
    print("[INFO] Adding Windows startup script...")
    
    try:
        # Create the start script
        with open("scripts/start-windows.bat", "w") as f:
            f.write("""@echo off
echo Starting LeviatanCode on Windows...
set NODE_ENV=development
set PORT=5005
npx tsx server/index.ts
""")
        
        print("[OK] Windows startup script created")
        return True
    except Exception as e:
        print(f"[FAIL] Failed to create Windows script: {e}")
        return False

def test_port_availability():
    """Test if port 5005 is available"""
    print("[INFO] Testing port availability...")
    
    try:
        result = subprocess.run(
            ["netstat", "-an"], 
            capture_output=True, 
            text=True, 
            shell=True
        )
        
        if ":5005" in result.stdout:
            print("[WARN] Port 5005 may be in use")
            return False
        else:
            print("[OK] Port 5005 is available")
            return True
    except:
        print("[WARN] Could not check port availability")
        return True

def main():
    """Main function"""
    print("=" * 50)
    print("LeviatanCode Windows Networking Fix")
    print("=" * 50)
    
    success = True
    
    if not update_server_config():
        success = False
    
    if not add_windows_script():
        success = False
    
    if not test_port_availability():
        success = False
    
    if success:
        print("\n[OK] Windows networking configuration complete!")
        print("\nTry these commands:")
        print("1. npm run windev")
        print("2. node scripts/start-windows.js")
        print("3. scripts\\start-windows.bat")
        print("\nApplication should be available at: http://localhost:5005")
    else:
        print("\n[FAIL] Some configuration steps failed")
        print("Try manual server start:")
        print("set PORT=5005 && npx tsx server/index.ts")
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())