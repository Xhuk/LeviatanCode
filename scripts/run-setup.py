#!/usr/bin/env python3
"""
Simple setup runner script for LeviatanCode
Entry point for Windows setup
"""

import os
import sys
import subprocess
from pathlib import Path

def print_colored(text: str, color_code: str = "") -> None:
    """Print colored text"""
    if color_code:
        print(f"{color_code}{text}\033[0m")
    else:
        print(text)

def main():
    """Main entry point"""
    print_colored("🚀 LeviatanCode Setup Starting...", "\033[92m")
    
    # Ensure we're in the right directory
    if not Path("package.json").exists():
        print_colored("❌ package.json not found. Please run from project root.", "\033[91m")
        return 1
    
    # Create scripts directory if needed
    Path("scripts").mkdir(exist_ok=True)
    print_colored("✅ Scripts directory ready", "\033[92m")
    
    # Run the main setup script
    try:
        if sys.platform == "win32":
            # On Windows, use python.exe explicitly
            result = subprocess.run([sys.executable, "scripts/setup-windows.py"], check=True)
        else:
            # On other platforms
            result = subprocess.run(["python3", "scripts/setup-windows.py"], check=True)
        
        print_colored("✨ Setup completed! Run 'npm run windev' to start.", "\033[92m")
        return result.returncode
        
    except subprocess.CalledProcessError as e:
        print_colored(f"❌ Setup failed with code {e.returncode}", "\033[91m")
        return e.returncode
    except FileNotFoundError:
        print_colored("❌ Python not found. Please install Python 3.8+", "\033[91m")
        return 1

if __name__ == "__main__":
    sys.exit(main())