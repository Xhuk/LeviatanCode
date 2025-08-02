#!/usr/bin/env python3
"""
Virtual Environment Setup Script for Flask Analyzer
Automatically creates and configures the Python virtual environment
"""

import os
import sys
import subprocess
import platform
from pathlib import Path

def run_command(command, shell=True):
    """Run a command and return success status"""
    try:
        result = subprocess.run(command, shell=shell, check=True, capture_output=True, text=True)
        return True, result.stdout
    except subprocess.CalledProcessError as e:
        return False, e.stderr

def setup_virtual_environment():
    """Setup virtual environment and install dependencies"""
    current_dir = Path(__file__).parent
    venv_path = current_dir / "venv"
    requirements_path = current_dir / "requirements.txt"
    
    print("🔧 Setting up Flask Analyzer virtual environment...")
    
    # Determine Python executable
    python_cmd = "python" if platform.system() == "Windows" else "python3"
    
    # Check if Python is available
    success, output = run_command(f"{python_cmd} --version")
    if not success:
        print(f"❌ Python not found. Please install Python 3.7+")
        return False
    
    print(f"✅ Found Python: {output.strip()}")
    
    # Create virtual environment if it doesn't exist
    if not venv_path.exists():
        print("📦 Creating virtual environment...")
        success, output = run_command(f"{python_cmd} -m venv {venv_path}")
        if not success:
            print(f"❌ Failed to create virtual environment: {output}")
            return False
        print("✅ Virtual environment created")
    else:
        print("✅ Virtual environment already exists")
    
    # Determine pip and python paths in virtual environment
    if platform.system() == "Windows":
        pip_path = venv_path / "Scripts" / "pip"
        python_venv_path = venv_path / "Scripts" / "python"
    else:
        pip_path = venv_path / "bin" / "pip"
        python_venv_path = venv_path / "bin" / "python"
    
    # Install requirements
    if requirements_path.exists():
        print("📦 Installing dependencies...")
        success, output = run_command(f"{pip_path} install -r {requirements_path}")
        if not success:
            print(f"❌ Failed to install dependencies: {output}")
            return False
        print("✅ Dependencies installed successfully")
    else:
        print("⚠️ requirements.txt not found, installing Flask manually...")
        success, output = run_command(f"{pip_path} install flask flask-cors requests python-dotenv")
        if not success:
            print(f"❌ Failed to install Flask: {output}")
            return False
        print("✅ Flask installed successfully")
    
    print("🎉 Virtual environment setup complete!")
    print(f"📍 Virtual environment location: {venv_path}")
    print(f"🐍 Python executable: {python_venv_path}")
    print(f"📦 Pip executable: {pip_path}")
    
    return True

if __name__ == "__main__":
    success = setup_virtual_environment()
    sys.exit(0 if success else 1)