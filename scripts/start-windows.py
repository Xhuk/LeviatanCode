#!/usr/bin/env python3
"""
LeviatanCode Windows Python Startup Script
Ensures Flask loads completely before starting the main application
Reads .env file for configuration
"""

import os
import sys
import time
import subprocess
import requests
import threading
from pathlib import Path
from dotenv import load_dotenv

def obfuscate_value(value, show_fraction=3):
    """Obfuscate sensitive values by showing only first 1/3"""
    if not value or len(value) < 6:
        return value  # Don't obfuscate short values
    
    show_chars = len(value) // show_fraction
    if show_chars < 3:
        show_chars = 3
    
    return value[:show_chars] + "..." + ("*" * (len(value) - show_chars))

def load_environment():
    """Load environment variables - prioritizing vault over .env"""
    project_root = Path(__file__).parent.parent
    
    print("🔐 Checking for encrypted secrets vault...")
    # Try to use vault first
    vault_script = project_root / 'scripts' / 'start-with-secrets-manager.py'
    if vault_script.exists():
        print("✅ Found vault startup script - consider using that instead!")
        print("   Run: python scripts/start-with-secrets-manager.py")
        print("   This script will continue with .env fallback...")
    
    # Fallback to .env file
    env_file = project_root / '.env'
    if env_file.exists():
        print(f"⚠️  Using .env file as fallback: {env_file}")
        print("   Consider migrating to encrypted vault for better security")
        load_dotenv(env_file)
        print("✅ Environment variables loaded from .env")
    else:
        print(f"❌ No configuration found - neither vault nor .env file")
        print("   Run 'python scripts/migrate-to-vault.py' to set up secure storage")
    
    # Set default values
    os.environ.setdefault('NODE_ENV', 'development')
    os.environ.setdefault('PORT', '5005')
    os.environ.setdefault('FLASK_PORT', '5001')
    
    # Print environment variables with obfuscation for sensitive ones
    print("\n📋 Environment Variables:")
    print("-" * 40)
    
    # Non-sensitive variables (show full value)
    non_sensitive = ['NODE_ENV', 'PORT', 'FLASK_PORT']
    for var in non_sensitive:
        value = os.environ.get(var, 'Not set')
        print(f"{var}: {value}")
    
    # Sensitive variables (show obfuscated)
    sensitive_vars = [
        'DATABASE_URL', 'SESSION_SECRET', 'OPENAI_API_KEY', 'GEMINI_API_KEY',
        'SUPABASE_URL', 'SUPABASE_ANON_KEY', 'JWT_SECRET', 'API_KEY'
    ]
    
    for var in sensitive_vars:
        value = os.environ.get(var)
        if value:
            obfuscated = obfuscate_value(value)
            print(f"{var}: {obfuscated}")
        else:
            print(f"{var}: Not set")
    
    # Check for other .env variables that might be sensitive
    env_vars = {k: v for k, v in os.environ.items() 
                if not k.startswith('_') and k not in non_sensitive + sensitive_vars}
    
    if env_vars:
        print("\n📋 Additional Environment Variables:")
        for var, value in sorted(env_vars.items()):
            if any(keyword in var.upper() for keyword in ['KEY', 'SECRET', 'TOKEN', 'PASSWORD', 'URL']):
                obfuscated = obfuscate_value(value) if value else 'Not set'
                print(f"{var}: {obfuscated}")
            else:
                print(f"{var}: {value}")
    
    print("-" * 40)
    return project_root

def check_dependencies():
    """Check if required dependencies are available"""
    print("Checking dependencies...")
    
    # Check Python
    try:
        result = subprocess.run(['python', '--version'], capture_output=True, text=True)
        print(f"✅ Python: {result.stdout.strip()}")
    except FileNotFoundError:
        print("❌ Python not found in PATH")
        return False
    
    # Check Node.js/npm
    try:
        result = subprocess.run(['node', '--version'], capture_output=True, text=True)
        print(f"✅ Node.js: {result.stdout.strip()}")
    except FileNotFoundError:
        print("❌ Node.js not found in PATH")
        return False
    
    # Check npx
    try:
        result = subprocess.run(['npx', '--version'], capture_output=True, text=True)
        print(f"✅ npx: {result.stdout.strip()}")
    except FileNotFoundError:
        print("❌ npx not found in PATH")
        return False
    
    return True

def install_flask_dependencies(project_root):
    """Install Flask dependencies if needed"""
    flask_analyzer_dir = project_root / 'flask_analyzer'
    requirements_file = flask_analyzer_dir / 'requirements.txt'
    
    if not flask_analyzer_dir.exists():
        print("❌ flask_analyzer directory not found")
        return False
    
    if not requirements_file.exists():
        print("❌ requirements.txt not found in flask_analyzer directory")
        return False
    
    print("Installing Flask dependencies...")
    try:
        os.chdir(flask_analyzer_dir)
        result = subprocess.run([
            'python', '-m', 'pip', 'install', '-r', 'requirements.txt', '--quiet'
        ], capture_output=True, text=True)
        
        if result.returncode == 0:
            print("✅ Flask dependencies installed successfully")
            return True
        else:
            print(f"⚠️  Warning: pip install had issues: {result.stderr}")
            print("Continuing anyway...")
            return True
    except Exception as e:
        print(f"⚠️  Warning: Could not install dependencies: {e}")
        print("Continuing anyway...")
        return True
    finally:
        os.chdir(project_root)

def start_flask_server(project_root):
    """Start Flask server in background"""
    flask_analyzer_dir = project_root / 'flask_analyzer'
    flask_port = os.environ.get('FLASK_PORT', '5001')
    
    print(f"Starting Flask server on port {flask_port}...")
    
    def run_flask():
        try:
            os.chdir(flask_analyzer_dir)
            # Set Flask environment variables
            env = os.environ.copy()
            env['FLASK_PORT'] = flask_port
            env['FLASK_DEBUG'] = 'true'
            
            # Start Flask server
            subprocess.run(['python', 'run_server.py'], env=env)
        except Exception as e:
            print(f"❌ Flask server error: {e}")
        finally:
            os.chdir(project_root)
    
    # Start Flask in background thread
    flask_thread = threading.Thread(target=run_flask, daemon=True)
    flask_thread.start()
    
    return flask_thread

def wait_for_flask_ready(max_attempts=30, delay=2):
    """Wait for Flask to be ready by checking health endpoint"""
    flask_port = os.environ.get('FLASK_PORT', '5001')
    health_url = f"http://127.0.0.1:{flask_port}/health"
    
    print(f"Waiting for Flask to be ready at {health_url}...")
    
    for attempt in range(1, max_attempts + 1):
        print(f"Attempt {attempt}/{max_attempts}: Checking Flask health...")
        
        try:
            response = requests.get(health_url, timeout=3)
            if response.status_code == 200:
                print("✅ Flask Analyzer is ready!")
                return True
        except (requests.exceptions.RequestException, requests.exceptions.Timeout):
            pass
        
        if attempt < max_attempts:
            print(f"Flask not ready yet, waiting {delay} seconds...")
            time.sleep(delay)
    
    print(f"❌ Flask failed to start after {max_attempts} attempts")
    return False

def start_main_application(project_root):
    """Start the main Node.js application"""
    print("Starting LeviatanCode main server...")
    port = os.environ.get('PORT', '5005')
    print(f"Server will be available at: http://localhost:{port}")
    
    try:
        os.chdir(project_root)
        
        # Set environment for Node.js
        env = os.environ.copy()
        env['NODE_ENV'] = os.environ.get('NODE_ENV', 'development')
        env['PORT'] = port
        
        # Start main application
        subprocess.run(['npx', 'tsx', 'server/index.ts'], env=env)
        
    except KeyboardInterrupt:
        print("\n🔄 Shutting down LeviatanCode...")
    except Exception as e:
        print(f"❌ Error starting main application: {e}")
        return False
    
    return True

def main():
    """Main startup sequence"""
    print("=" * 60)
    print("🚀 Starting LeviatanCode with proper Flask sequencing...")
    print("=" * 60)
    
    try:
        # Step 1: Load environment
        print("\n[1/5] Loading environment configuration...")
        project_root = load_environment()
        
        # Step 2: Check dependencies
        print("\n[2/5] Checking system dependencies...")
        if not check_dependencies():
            print("❌ Dependency check failed")
            return 1
        
        # Step 3: Install Flask dependencies
        print("\n[3/5] Installing Flask dependencies...")
        if not install_flask_dependencies(project_root):
            print("❌ Flask dependency installation failed")
            return 1
        
        # Step 4: Start Flask and wait for it to be ready
        print("\n[4/5] Starting Flask Analyzer service...")
        flask_thread = start_flask_server(project_root)
        
        if not wait_for_flask_ready():
            print("❌ Flask startup failed")
            return 1
        
        # Step 5: Start main application
        print("\n[5/5] Starting main application...")
        if not start_main_application(project_root):
            print("❌ Main application startup failed")
            return 1
        
        print("\n✅ LeviatanCode has stopped gracefully.")
        return 0
        
    except KeyboardInterrupt:
        print("\n🔄 Interrupted by user")
        return 0
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        return 1

if __name__ == '__main__':
    sys.exit(main())