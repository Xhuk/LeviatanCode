#!/usr/bin/env python3
"""
LeviatanCode Startup with Secrets Manager Integration
Loads secrets from encrypted vault instead of .env file
"""

import os
import sys
import json
import time
import subprocess
import requests
try:
    import winreg
except ImportError:
    winreg = None
from pathlib import Path
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import base64

def derive_key(password: str, salt: bytes) -> bytes:
    """Derive encryption key from password"""
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=100000,
    )
    key = base64.urlsafe_b64encode(kdf.derive(password.encode()))
    return key

def load_secrets_from_vault():
    """Load secrets from encrypted vault"""
    app_dir = Path.home() / ".leviatancode"
    secrets_file = app_dir / "secrets.encrypted"
    
    if not secrets_file.exists():
        print("❌ No secrets vault found. Please run Secrets Manager first.")
        return False
    
    # Try to get master password from environment or prompt
    master_password = os.environ.get('LEVIATAN_MASTER_PASSWORD')
    if not master_password:
        master_password = input("Enter master password for secrets vault: ")
    
    try:
        salt = b'leviatancode_salt_2025'
        key = derive_key(master_password, salt)
        cipher_suite = Fernet(key)
        
        with open(secrets_file, 'rb') as f:
            encrypted_data = f.read()
        
        decrypted_data = cipher_suite.decrypt(encrypted_data)
        data = json.loads(decrypted_data.decode())
        
        secrets = data.get('secrets', {})
        
        # Set environment variables
        for key, secret_data in secrets.items():
            os.environ[key] = secret_data.get('value', '')
        
        print(f"✅ Loaded {len(secrets)} secrets from vault")
        return True
        
    except Exception as e:
        print(f"❌ Failed to load secrets from vault: {e}")
        return False

def load_from_registry():
    """Load environment variables from Windows registry"""
    if not winreg:
        print("⚠️  Windows registry access not available")
        return False
    
    try:
        with winreg.OpenKey(winreg.HKEY_CURRENT_USER, "Environment") as reg_key:
            i = 0
            count = 0
            while True:
                try:
                    name, value, _ = winreg.EnumValue(reg_key, i)
                    os.environ[name] = value
                    count += 1
                    i += 1
                except WindowsError:
                    break
        print(f"✅ Loaded {count} environment variables from Windows registry")
        return count > 0
    except Exception as e:
        print(f"⚠️  Could not load from registry: {e}")
        return False

def main():
    """Main startup sequence"""
    print("🚀 Starting LeviatanCode with Secrets Manager...")
    print("=" * 60)
    
    project_root = Path(__file__).parent.parent
    os.chdir(project_root)
    
    # Try loading secrets - VAULT FIRST (as requested)
    secrets_loaded = False
    
    print("🔐 Primary method: Encrypted Secrets Vault")
    # 1. Try encrypted vault (PRIMARY METHOD)
    if load_secrets_from_vault():
        secrets_loaded = True
        print("✅ Using encrypted vault as primary configuration source")
    else:
        print("⚠️  Vault not available, trying fallback methods...")
        # 2. Try Windows registry
        if load_from_registry():
            secrets_loaded = True
            print("✅ Using Windows registry as fallback")
        # 3. Last resort: .env file
        else:
            env_file = project_root / '.env'
            if env_file.exists():
                try:
                    from dotenv import load_dotenv
                    load_dotenv(env_file)
                    print("⚠️  Using .env file as last resort - consider migrating to vault")
                    secrets_loaded = True
                except ImportError:
                    print("❌ python-dotenv not available")
    
    if not secrets_loaded:
        print("❌ No secrets loaded. Please set up Secrets Manager or .env file.")
        return 1
    
    # Set defaults
    os.environ.setdefault('NODE_ENV', 'development')
    os.environ.setdefault('PORT', '5005')
    os.environ.setdefault('FLASK_PORT', '5001')
    
    # Start Flask
    print("\n[1/3] Starting Flask Analyzer...")
    flask_proc = subprocess.Popen([
        sys.executable, '-m', 'flask_analyzer.run_server'
    ], env=os.environ)
    
    # Wait for Flask
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
            print("❌ Flask failed to start")
            flask_proc.terminate()
            return 1
        
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

if __name__ == '__main__':
    sys.exit(main())
