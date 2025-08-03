#!/usr/bin/env python3
"""
Migrate from .env file to encrypted secrets vault
Helps users transition from .env files to the secure vault system
"""

import os
import sys
import json
from pathlib import Path
from datetime import datetime

def main():
    """Migrate .env to vault and update startup preferences"""
    project_root = Path(__file__).parent.parent
    env_file = project_root / '.env'
    
    print("🔄 LeviatanCode Migration: .env → Encrypted Vault")
    print("=" * 60)
    
    if not env_file.exists():
        print("❌ No .env file found to migrate")
        return 1
    
    print(f"📂 Found .env file: {env_file}")
    
    # Read .env file
    env_vars = {}
    with open(env_file, 'r') as f:
        for line_num, line in enumerate(f, 1):
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                key = key.strip()
                value = value.strip().strip('"').strip("'")
                env_vars[key] = value
                print(f"  Found: {key}")
    
    print(f"\n📊 Found {len(env_vars)} environment variables to migrate")
    
    if not env_vars:
        print("❌ No valid environment variables found in .env file")
        return 1
    
    # Show what will be migrated
    print("\n🔍 Variables to migrate:")
    for key, value in env_vars.items():
        # Obfuscate sensitive values
        if any(keyword in key.upper() for keyword in ['URL', 'SECRET', 'KEY', 'TOKEN']):
            show_chars = max(3, len(value) // 3) if len(value) > 6 else len(value)
            display_value = value[:show_chars] + "..." + ("*" * max(0, len(value) - show_chars))
        else:
            display_value = value
        print(f"  {key}: {display_value}")
    
    # Ask for confirmation
    print(f"\n❓ Migrate these {len(env_vars)} variables to encrypted vault?")
    response = input("Type 'yes' to continue: ").lower().strip()
    
    if response != 'yes':
        print("❌ Migration cancelled")
        return 1
    
    # Create migration data file
    migration_data = {
        'migration_info': {
            'source': str(env_file),
            'timestamp': datetime.now().isoformat(),
            'variables_count': len(env_vars)
        },
        'secrets': {}
    }
    
    for key, value in env_vars.items():
        migration_data['secrets'][key] = {
            'value': value,
            'modified': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'source': 'migrated_from_env'
        }
    
    # Save migration data
    migration_file = project_root / 'migration_data.json'
    with open(migration_file, 'w') as f:
        json.dump(migration_data, f, indent=2)
    
    print(f"✅ Migration data prepared: {migration_file}")
    
    # Instructions
    print("\n📋 Next Steps:")
    print("=" * 40)
    print("1. Run: python secrets_manager.py")
    print("2. Set up a master password")
    print("3. Use 'Import .env' button to load your variables")
    print("4. Use 'python scripts/start-with-secrets-manager.py' to start the app")
    print(f"5. Optional: Backup your .env file and delete it")
    
    # Create backup of .env
    backup_file = project_root / f'.env.backup.{datetime.now().strftime("%Y%m%d_%H%M%S")}'
    with open(env_file, 'r') as src, open(backup_file, 'w') as dst:
        dst.write(src.read())
    
    print(f"\n💾 Created backup: {backup_file}")
    
    # Update replit.md to reflect vault usage
    replit_md = project_root / 'replit.md'
    if replit_md.exists():
        print("\n📝 Updating replit.md...")
        with open(replit_md, 'r') as f:
            content = f.read()
        
        # Add vault information to user preferences
        if 'Startup scripts:' in content:
            content = content.replace(
                'Startup scripts: Enhanced Python scripts with .env loading and security obfuscation (January 2025)',
                'Startup scripts: Enhanced Python scripts with encrypted vault as primary config source (January 2025)\nSecrets management: Encrypted vault with master password protection for all environment variables'
            )
        
        with open(replit_md, 'w') as f:
            f.write(content)
        
        print("✅ Updated project documentation")
    
    print("\n🎉 Migration preparation complete!")
    print("Your .env data is ready to import into the encrypted vault.")
    
    return 0

if __name__ == '__main__':
    sys.exit(main())