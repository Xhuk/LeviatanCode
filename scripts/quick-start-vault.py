#!/usr/bin/env python3
"""
Quick Start with Vault - Simplified version for Windows
Just loads vault and shows instructions for manual startup
"""

import os
import sys
import json
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

def load_vault_secrets():
    """Load secrets from encrypted vault and set environment variables"""
    app_dir = Path.home() / ".leviatancode"
    secrets_file = app_dir / "secrets.encrypted"
    
    if not secrets_file.exists():
        print("❌ No encrypted vault found at:")
        print(f"   {secrets_file}")
        print("\n💡 First, run: python secrets_manager.py")
        print("   to create your encrypted vault")
        return False
    
    # Get master password
    master_password = input("🔐 Enter master password for secrets vault: ")
    
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
        
        print(f"✅ Loaded {len(secrets)} secrets from encrypted vault")
        
        # Show obfuscated values for verification
        print("\n🔍 Loaded environment variables:")
        for key, secret_data in secrets.items():
            value = secret_data.get('value', '')
            # Obfuscate for display
            if len(value) > 6:
                show_chars = max(3, len(value) // 3)
                display_value = value[:show_chars] + "..." + ("*" * min(10, len(value) - show_chars))
            else:
                display_value = value
            print(f"  {key}: {display_value}")
        
        return True
        
    except Exception as e:
        print(f"❌ Failed to load vault: {e}")
        print("💡 Check your master password and try again")
        return False

def main():
    """Quick start with vault loading"""
    print("🚀 LeviatanCode Quick Start with Encrypted Vault")
    print("=" * 60)
    
    project_root = Path(__file__).parent.parent
    os.chdir(project_root)
    
    # Load vault secrets
    if not load_vault_secrets():
        print("\n❌ Could not load vault secrets")
        print("\n📋 Alternative: Use .env file")
        env_file = project_root / '.env'
        if env_file.exists():
            print(f"   Found .env file: {env_file}")
            print("   Run: npm run dev (to start with .env)")
        return 1
    
    # Set defaults
    os.environ.setdefault('NODE_ENV', 'development')
    os.environ.setdefault('PORT', '5005')
    os.environ.setdefault('FLASK_PORT', '5001')
    
    print("\n✅ Environment loaded from encrypted vault!")
    print("\n📋 Next steps:")
    print("=" * 40)
    print("1. Keep this terminal open (environment variables are set)")
    print("2. Open a new terminal in the same directory") 
    print("3. Run: npm run dev")
    print("4. Or run: npx tsx server/index.ts")
    print("\n💡 The Flask analyzer will start automatically when you run the main app")
    
    input("\nPress Enter to exit (this will clear the environment variables)...")
    return 0

if __name__ == '__main__':
    sys.exit(main())