#!/usr/bin/env python3
"""
Simple LeviatanCode Windows Startup Script
Minimal version with .env loading and Flask health checking
"""

import os
import time
import subprocess
import requests
from pathlib import Path
from dotenv import load_dotenv

# Load .env file
project_root = Path(__file__).parent.parent
env_file = project_root / '.env'

if env_file.exists():
    load_dotenv(env_file)
    print(f"✅ Loaded environment from {env_file}")
else:
    print(f"⚠️  .env file not found at {env_file}")

# Set defaults
os.environ.setdefault('NODE_ENV', 'development')
os.environ.setdefault('PORT', '5005')
os.environ.setdefault('FLASK_PORT', '5001')

print("=" * 50)
print("🚀 Starting LeviatanCode...")
print(f"NODE_ENV: {os.environ.get('NODE_ENV')}")
print(f"PORT: {os.environ.get('PORT')}")
print(f"FLASK_PORT: {os.environ.get('FLASK_PORT')}")
print("=" * 50)

# Change to project root
os.chdir(project_root)

# Start Flask in background
print("\n[1/3] Starting Flask Analyzer...")
flask_proc = subprocess.Popen([
    'python', '-m', 'flask_analyzer.run_server'
], env=os.environ)

# Wait for Flask to be ready
flask_port = os.environ.get('FLASK_PORT', '5001')
health_url = f"http://127.0.0.1:{flask_port}/health"

print(f"[2/3] Waiting for Flask at {health_url}...")
for attempt in range(1, 31):
    try:
        response = requests.get(health_url, timeout=3)
        if response.status_code == 200:
            print("✅ Flask is ready!")
            break
    except:
        pass
    
    if attempt == 30:
        print("❌ Flask failed to start after 30 attempts")
        flask_proc.terminate()
        exit(1)
    
    print(f"Attempt {attempt}/30: Flask not ready, waiting...")
    time.sleep(2)

# Start main application
print("\n[3/3] Starting main application...")
try:
    subprocess.run(['npx', 'tsx', 'server/index.ts'], env=os.environ)
except KeyboardInterrupt:
    print("\n🔄 Shutting down...")
finally:
    flask_proc.terminate()
    print("✅ Stopped")