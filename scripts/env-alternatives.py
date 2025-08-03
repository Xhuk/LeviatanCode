#!/usr/bin/env python3
"""
Environment Variable Management Alternatives
Shows multiple ways to handle environment variables for LeviatanCode
"""

import os
import json
from pathlib import Path

def show_current_env_location():
    """Show where .env files are located"""
    print("🔍 Environment File Locations:")
    print("=" * 50)
    
    project_root = Path(__file__).parent.parent
    print(f"Project root: {project_root.absolute()}")
    
    # Check for .env files
    env_files = [
        project_root / '.env',
        project_root / '.env.local',
        project_root / '.env.development',
        project_root / '.env.production',
        Path.home() / '.env',
    ]
    
    for env_file in env_files:
        if env_file.exists():
            print(f"✅ Found: {env_file.absolute()}")
            with open(env_file, 'r') as f:
                lines = f.readlines()
                print(f"   Lines: {len(lines)}")
        else:
            print(f"❌ Not found: {env_file.absolute()}")
    print()

def option1_system_env():
    """Option 1: System Environment Variables"""
    print("📋 Option 1: System Environment Variables")
    print("=" * 50)
    print("Set variables directly in your system:")
    print("Windows:")
    print("  set DATABASE_URL=your_database_url")
    print("  set PORT=5005")
    print("  set SESSION_SECRET=your_secret")
    print()
    print("PowerShell:")
    print("  $env:DATABASE_URL='your_database_url'")
    print("  $env:PORT='5005'")
    print("  $env:SESSION_SECRET='your_secret'")
    print()

def option2_config_file():
    """Option 2: JSON Configuration File"""
    print("📋 Option 2: JSON Configuration File")
    print("=" * 50)
    
    config_file = Path(__file__).parent.parent / 'config.json'
    sample_config = {
        "database": {
            "url": "postgresql://your_database_url",
            "pool_size": 5
        },
        "server": {
            "port": 5005,
            "host": "localhost"
        },
        "flask": {
            "port": 5001,
            "debug": True
        },
        "security": {
            "session_secret": "your-session-secret-here"
        }
    }
    
    print(f"Create: {config_file}")
    print("Content:")
    print(json.dumps(sample_config, indent=2))
    print()

def option3_vault_file():
    """Option 3: Encrypted Vault File"""
    print("📋 Option 3: Encrypted Secrets Vault")
    print("=" * 50)
    vault_file = Path(__file__).parent.parent / 'secrets.vault'
    print(f"Create encrypted file: {vault_file}")
    print("Use tools like:")
    print("  - ansible-vault")
    print("  - sops (Secrets OPerationS)")
    print("  - age encryption")
    print("  - Custom encryption with Python cryptography")
    print()

def option4_registry_windows():
    """Option 4: Windows Registry (Windows only)"""
    print("📋 Option 4: Windows Registry")
    print("=" * 50)
    print("Store in Windows Registry:")
    print("Key: HKEY_CURRENT_USER\\Environment\\LeviatanCode")
    print("Or: HKEY_LOCAL_MACHINE\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Environment")
    print()
    print("PowerShell commands:")
    print("  [Environment]::SetEnvironmentVariable('DATABASE_URL', 'your_url', 'User')")
    print("  [Environment]::GetEnvironmentVariable('DATABASE_URL', 'User')")
    print()

def option5_cloud_secrets():
    """Option 5: Cloud Secret Management"""
    print("📋 Option 5: Cloud Secret Management")
    print("=" * 50)
    print("Use cloud providers:")
    print("  - AWS Secrets Manager")
    print("  - Azure Key Vault")
    print("  - Google Secret Manager")
    print("  - HashiCorp Vault")
    print()

def check_current_env():
    """Check current environment variables"""
    print("🔧 Current Environment Variables:")
    print("=" * 50)
    
    important_vars = [
        'DATABASE_URL', 'PORT', 'SESSION_SECRET', 'FLASK_PORT',
        'OPENAI_API_KEY', 'GEMINI_API_KEY', 'NODE_ENV'
    ]
    
    for var in important_vars:
        value = os.environ.get(var)
        if value:
            # Obfuscate sensitive values
            if any(keyword in var.upper() for keyword in ['URL', 'SECRET', 'KEY', 'TOKEN']):
                if len(value) > 6:
                    show_chars = max(3, len(value) // 3)
                    display_value = value[:show_chars] + "..." + ("*" * (len(value) - show_chars))
                else:
                    display_value = value
            else:
                display_value = value
            print(f"  {var}: {display_value}")
        else:
            print(f"  {var}: Not set")
    print()

def main():
    print("🚀 LeviatanCode Environment Variable Management")
    print("=" * 60)
    print()
    
    show_current_env_location()
    check_current_env()
    option1_system_env()
    option2_config_file()
    option3_vault_file()
    option4_registry_windows()
    option5_cloud_secrets()
    
    print("💡 Recommendations:")
    print("=" * 50)
    print("1. For development: Use .env files (current method)")
    print("2. For production: Use system environment variables or cloud secrets")
    print("3. For teams: Use encrypted vault files with version control")
    print("4. For Windows: Use PowerShell profile or registry")
    print("5. For security: Never commit secrets to git repositories")

if __name__ == '__main__':
    main()