#!/usr/bin/env python3
"""
LeviatanCode Secrets Manager
A secure local application for managing environment variables on Windows
Features: Encryption, GUI, Backup, Import/Export, Registry integration
"""

import os
import sys
import json
import base64
import hashlib
import tkinter as tk
from tkinter import ttk, messagebox, filedialog
from pathlib import Path
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
try:
    import winreg
except ImportError:
    winreg = None
from datetime import datetime

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

class SecretsManager:
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("LeviatanCode Secrets Manager")
        self.root.geometry("800x600")
        self.root.configure(bg='#2b2b2b')
        
        # Data storage
        self.secrets = {}
        self.master_password = ""
        self.cipher_suite = None
        
        # Paths
        self.app_dir = Path.home() / ".leviatancode"
        self.secrets_file = self.app_dir / "secrets.encrypted"
        self.backup_dir = self.app_dir / "backups"
        
        # Ensure directories exist
        self.app_dir.mkdir(exist_ok=True)
        self.backup_dir.mkdir(exist_ok=True)
        
        self.setup_ui()
        self.load_secrets()
    
    def derive_key(self, password: str, salt: bytes) -> bytes:
        """Derive encryption key from password"""
        return derive_key(password, salt)
    
    def setup_ui(self):
        """Setup the GUI interface"""
        # Style configuration
        style = ttk.Style()
        style.theme_use('clam')
        style.configure('Title.TLabel', font=('Arial', 16, 'bold'), background='#2b2b2b', foreground='#ffffff')
        style.configure('Heading.TLabel', font=('Arial', 12, 'bold'), background='#2b2b2b', foreground='#ffffff')
        
        # Main frame
        main_frame = ttk.Frame(self.root)
        main_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # Title
        title_label = ttk.Label(main_frame, text="🔐 LeviatanCode Secrets Manager", style='Title.TLabel')
        title_label.pack(pady=(0, 20))
        
        # Toolbar
        toolbar_frame = ttk.Frame(main_frame)
        toolbar_frame.pack(fill=tk.X, pady=(0, 10))
        
        ttk.Button(toolbar_frame, text="Add Secret", command=self.add_secret).pack(side=tk.LEFT, padx=(0, 5))
        ttk.Button(toolbar_frame, text="Edit Selected", command=self.edit_secret).pack(side=tk.LEFT, padx=(0, 5))
        ttk.Button(toolbar_frame, text="Delete Selected", command=self.delete_secret).pack(side=tk.LEFT, padx=(0, 5))
        ttk.Button(toolbar_frame, text="Import .env", command=self.import_env_file).pack(side=tk.LEFT, padx=(0, 10))
        ttk.Button(toolbar_frame, text="Export .env", command=self.export_env_file).pack(side=tk.LEFT, padx=(0, 5))
        ttk.Button(toolbar_frame, text="Set System Env", command=self.set_system_env).pack(side=tk.LEFT, padx=(0, 5))
        ttk.Button(toolbar_frame, text="Backup", command=self.create_backup).pack(side=tk.RIGHT)
        
        # Secrets list
        list_frame = ttk.Frame(main_frame)
        list_frame.pack(fill=tk.BOTH, expand=True, pady=(0, 10))
        
        # Treeview for secrets
        columns = ('Key', 'Value', 'Type', 'Modified')
        self.tree = ttk.Treeview(list_frame, columns=columns, show='headings', height=15)
        
        # Column headings
        self.tree.heading('Key', text='Environment Variable')
        self.tree.heading('Value', text='Value (Obfuscated)')
        self.tree.heading('Type', text='Type')
        self.tree.heading('Modified', text='Last Modified')
        
        # Column widths
        self.tree.column('Key', width=200)
        self.tree.column('Value', width=300)
        self.tree.column('Type', width=100)
        self.tree.column('Modified', width=150)
        
        # Scrollbar
        scrollbar = ttk.Scrollbar(list_frame, orient=tk.VERTICAL, command=self.tree.yview)
        self.tree.configure(yscrollcommand=scrollbar.set)
        
        self.tree.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        
        # Status bar
        self.status_var = tk.StringVar()
        self.status_var.set("Ready")
        status_bar = ttk.Label(main_frame, textvariable=self.status_var, relief=tk.SUNKEN)
        status_bar.pack(fill=tk.X, pady=(10, 0))
        
        # Bind double-click to edit
        self.tree.bind('<Double-1>', lambda e: self.edit_secret())
    
    def obfuscate_value(self, value: str) -> str:
        """Obfuscate sensitive values for display"""
        if not value or len(value) < 6:
            return value
        show_chars = max(3, len(value) // 3)
        return value[:show_chars] + "..." + ("*" * min(10, len(value) - show_chars))
    
    def get_secret_type(self, key: str) -> str:
        """Determine the type of secret based on key name"""
        key_upper = key.upper()
        if 'URL' in key_upper or 'URI' in key_upper:
            return 'URL'
        elif 'KEY' in key_upper or 'TOKEN' in key_upper:
            return 'API Key'
        elif 'SECRET' in key_upper or 'PASSWORD' in key_upper:
            return 'Secret'
        elif 'PORT' in key_upper:
            return 'Port'
        else:
            return 'Config'
    
    def authenticate(self) -> bool:
        """Authenticate user with master password"""
        dialog = tk.Toplevel(self.root)
        dialog.title("Master Password")
        dialog.geometry("300x150")
        dialog.configure(bg='#2b2b2b')
        dialog.transient(self.root)
        dialog.grab_set()
        
        # Center the dialog
        dialog.geometry("+%d+%d" % (self.root.winfo_rootx() + 50, self.root.winfo_rooty() + 50))
        
        tk.Label(dialog, text="Enter Master Password:", bg='#2b2b2b', fg='white').pack(pady=10)
        
        password_var = tk.StringVar()
        password_entry = tk.Entry(dialog, textvariable=password_var, show='*', font=('Arial', 12))
        password_entry.pack(pady=5, padx=20, fill=tk.X)
        password_entry.focus()
        
        result = {'password': ""}
        
        def on_ok():
            result['password'] = password_var.get()
            dialog.destroy()
        
        def on_cancel():
            dialog.destroy()
        
        button_frame = tk.Frame(dialog, bg='#2b2b2b')
        button_frame.pack(pady=10)
        
        tk.Button(button_frame, text="OK", command=on_ok).pack(side=tk.LEFT, padx=5)
        tk.Button(button_frame, text="Cancel", command=on_cancel).pack(side=tk.LEFT, padx=5)
        
        password_entry.bind('<Return>', lambda e: on_ok())
        
        dialog.wait_window()
        
        if result['password']:
            self.master_password = result['password']
            return True
        return False
    
    def setup_encryption(self, password: str) -> None:
        """Setup encryption with given password"""
        salt = b'leviatancode_salt_2025'  # In production, use random salt per file
        key = self.derive_key(password, salt)
        self.cipher_suite = Fernet(key)
    
    def load_secrets(self):
        """Load secrets from encrypted file"""
        if not self.secrets_file.exists():
            return
        
        if not self.authenticate():
            return
        
        try:
            if self.master_password:
                self.setup_encryption(self.master_password)
            else:
                return
            
            with open(self.secrets_file, 'rb') as f:
                encrypted_data = f.read()
            
            if self.cipher_suite:
                decrypted_data = self.cipher_suite.decrypt(encrypted_data)
                self.secrets = json.loads(decrypted_data.decode())
                
                self.refresh_tree()
                self.status_var.set(f"Loaded {len(self.secrets)} secrets")
            
        except Exception as e:
            messagebox.showerror("Error", f"Failed to load secrets: {e}")
    
    def save_secrets(self):
        """Save secrets to encrypted file"""
        if not self.cipher_suite:
            if not self.authenticate():
                return False
            if self.master_password:
                self.setup_encryption(self.master_password)
            else:
                return False
        
        try:
            # Add metadata
            data_to_save = {
                'secrets': self.secrets,
                'metadata': {
                    'created': datetime.now().isoformat(),
                    'version': '1.0',
                    'count': len(self.secrets)
                }
            }
            
            json_data = json.dumps(data_to_save, indent=2)
            if self.cipher_suite:
                encrypted_data = self.cipher_suite.encrypt(json_data.encode())
                
                with open(self.secrets_file, 'wb') as f:
                    f.write(encrypted_data)
                
                self.status_var.set("Secrets saved successfully")
                return True
            
        except Exception as e:
            messagebox.showerror("Error", f"Failed to save secrets: {e}")
            return False
    
    def refresh_tree(self):
        """Refresh the secrets tree view"""
        for item in self.tree.get_children():
            self.tree.delete(item)
        
        for key, data in self.secrets.items():
            value = data.get('value', '')
            modified = data.get('modified', 'Unknown')
            secret_type = self.get_secret_type(key)
            obfuscated_value = self.obfuscate_value(value)
            
            self.tree.insert('', tk.END, values=(key, obfuscated_value, secret_type, modified))
    
    def add_secret(self):
        """Add a new secret"""
        self.edit_secret_dialog()
    
    def edit_secret(self):
        """Edit selected secret"""
        selected = self.tree.selection()
        if not selected:
            messagebox.showwarning("Warning", "Please select a secret to edit")
            return
        
        item = self.tree.item(selected[0])
        key = item['values'][0]
        value = self.secrets.get(key, {}).get('value', '')
        
        self.edit_secret_dialog(key, value)
    
    def edit_secret_dialog(self, key='', value=''):
        """Dialog for editing secrets"""
        dialog = tk.Toplevel(self.root)
        dialog.title("Edit Secret" if key else "Add Secret")
        dialog.geometry("500x300")
        dialog.configure(bg='#2b2b2b')
        dialog.transient(self.root)
        dialog.grab_set()
        
        # Key field
        tk.Label(dialog, text="Environment Variable Name:", bg='#2b2b2b', fg='white').pack(pady=5)
        key_var = tk.StringVar(value=key)
        key_entry = tk.Entry(dialog, textvariable=key_var, font=('Arial', 12))
        key_entry.pack(pady=5, padx=20, fill=tk.X)
        
        # Value field
        tk.Label(dialog, text="Value:", bg='#2b2b2b', fg='white').pack(pady=5)
        value_var = tk.StringVar(value=value)
        value_entry = tk.Text(dialog, font=('Arial', 10), height=8)
        value_entry.pack(pady=5, padx=20, fill=tk.BOTH, expand=True)
        value_entry.insert('1.0', value)
        
        def on_save():
            new_key = key_var.get().strip()
            new_value = value_entry.get('1.0', tk.END).strip()
            
            if not new_key:
                messagebox.showerror("Error", "Environment variable name is required")
                return
            
            # Remove old key if renamed
            if key and key != new_key and key in self.secrets:
                del self.secrets[key]
            
            self.secrets[new_key] = {
                'value': new_value,
                'modified': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                'type': self.get_secret_type(new_key)
            }
            
            if self.save_secrets():
                self.refresh_tree()
                dialog.destroy()
        
        def on_cancel():
            dialog.destroy()
        
        button_frame = tk.Frame(dialog, bg='#2b2b2b')
        button_frame.pack(pady=10)
        
        tk.Button(button_frame, text="Save", command=on_save).pack(side=tk.LEFT, padx=5)
        tk.Button(button_frame, text="Cancel", command=on_cancel).pack(side=tk.LEFT, padx=5)
        
        key_entry.focus()
    
    def delete_secret(self):
        """Delete selected secret"""
        selected = self.tree.selection()
        if not selected:
            messagebox.showwarning("Warning", "Please select a secret to delete")
            return
        
        item = self.tree.item(selected[0])
        key = item['values'][0]
        
        if messagebox.askyesno("Confirm Delete", f"Are you sure you want to delete '{key}'?"):
            del self.secrets[key]
            if self.save_secrets():
                self.refresh_tree()
    
    def import_env_file(self):
        """Import from .env file"""
        file_path = filedialog.askopenfilename(
            title="Select .env file",
            filetypes=[("Environment files", "*.env"), ("All files", "*.*")]
        )
        
        if not file_path:
            return
        
        try:
            with open(file_path, 'r') as f:
                lines = f.readlines()
            
            imported_count = 0
            for line in lines:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    key = key.strip()
                    value = value.strip().strip('"').strip("'")
                    
                    self.secrets[key] = {
                        'value': value,
                        'modified': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                        'type': self.get_secret_type(key)
                    }
                    imported_count += 1
            
            if self.save_secrets():
                self.refresh_tree()
                messagebox.showinfo("Success", f"Imported {imported_count} environment variables")
            
        except Exception as e:
            messagebox.showerror("Error", f"Failed to import .env file: {e}")
    
    def export_env_file(self):
        """Export to .env file"""
        file_path = filedialog.asksaveasfilename(
            title="Save .env file",
            defaultextension=".env",
            filetypes=[("Environment files", "*.env"), ("All files", "*.*")]
        )
        
        if not file_path:
            return
        
        try:
            with open(file_path, 'w') as f:
                f.write("# LeviatanCode Environment Variables\n")
                f.write(f"# Exported: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
                
                for key, data in sorted(self.secrets.items()):
                    value = data.get('value', '')
                    f.write(f"{key}={value}\n")
            
            messagebox.showinfo("Success", f"Exported {len(self.secrets)} variables to {file_path}")
            
        except Exception as e:
            messagebox.showerror("Error", f"Failed to export .env file: {e}")
    
    def set_system_env(self):
        """Set environment variables in Windows system"""
        if not self.secrets:
            messagebox.showwarning("Warning", "No secrets to set")
            return
        
        if not messagebox.askyesno("Confirm", "This will set environment variables in Windows system. Continue?"):
            return
        
        if not winreg:
            messagebox.showerror("Error", "Windows registry access not available on this system")
            return
        
        try:
            success_count = 0
            for key, data in self.secrets.items():
                value = data.get('value', '')
                try:
                    # Set user environment variable
                    with winreg.OpenKey(winreg.HKEY_CURRENT_USER, "Environment", 0, winreg.KEY_SET_VALUE) as reg_key:
                        winreg.SetValueEx(reg_key, key, 0, winreg.REG_SZ, value)
                    success_count += 1
                except Exception as e:
                    print(f"Failed to set {key}: {e}")
            
            messagebox.showinfo("Success", f"Set {success_count} environment variables in Windows registry")
            
        except Exception as e:
            messagebox.showerror("Error", f"Failed to set system environment variables: {e}")
    
    def create_backup(self):
        """Create backup of secrets"""
        if not self.secrets:
            messagebox.showwarning("Warning", "No secrets to backup")
            return
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_file = self.backup_dir / f"secrets_backup_{timestamp}.json"
        
        try:
            backup_data = {
                'secrets': self.secrets,
                'backup_info': {
                    'created': datetime.now().isoformat(),
                    'version': '1.0',
                    'count': len(self.secrets)
                }
            }
            
            with open(backup_file, 'w') as f:
                json.dump(backup_data, f, indent=2)
            
            messagebox.showinfo("Success", f"Backup created: {backup_file}")
            
        except Exception as e:
            messagebox.showerror("Error", f"Failed to create backup: {e}")
    
    def run(self):
        """Run the application"""
        self.root.mainloop()

def main():
    """Main entry point"""
    app = SecretsManager()
    app.run()

def handle_vault_api_commands():
    """Handle API commands for frontend integration"""
    import sys
    import json
    
    if '--list-secrets' in sys.argv:
        # List all secrets
        app_dir = Path.home() / ".leviatancode"
        secrets_file = app_dir / "secrets.encrypted"
        
        if not secrets_file.exists():
            print(json.dumps({"secrets": {}}))
            return
            
        master_password = os.environ.get('LEVIATAN_MASTER_PASSWORD')
        if not master_password:
            master_password = input("Enter master password: ")
            
        try:
            # Debug password verification
            import hashlib
            password_hash = hashlib.sha256(master_password.encode()).hexdigest()
            print(f"DEBUG: Input password length: {len(master_password)}", file=sys.stderr)
            print(f"DEBUG: Input password hash (SHA256): {password_hash[:16]}...", file=sys.stderr)
            
            salt = b'leviatancode_salt_2025'
            key = derive_key(master_password, salt)
            cipher_suite = Fernet(key)
            
            print(f"DEBUG: Derived key (first 16 chars): {key.decode()[:16]}...", file=sys.stderr)
            print(f"DEBUG: Attempting to decrypt vault file...", file=sys.stderr)
            
            with open(secrets_file, 'rb') as f:
                encrypted_data = f.read()
            
            print(f"DEBUG: Encrypted file size: {len(encrypted_data)} bytes", file=sys.stderr)
            
            decrypted_data = cipher_suite.decrypt(encrypted_data)
            data = json.loads(decrypted_data.decode())
            
            print(f"DEBUG: Decryption successful! Found {len(data.get('secrets', {}))} secrets", file=sys.stderr)
            print(json.dumps(data))
        except Exception as e:
            print(f"DEBUG: Decryption failed - {str(e)}", file=sys.stderr)
            print(json.dumps({"error": str(e)}))
            
    elif '--get-secret' in sys.argv:
        # Get specific secret value
        if len(sys.argv) < 3:
            print(json.dumps({"error": "Secret name required"}))
            return
            
        secret_name = sys.argv[2]
        
        app_dir = Path.home() / ".leviatancode"
        secrets_file = app_dir / "secrets.encrypted"
        
        if not secrets_file.exists():
            print(json.dumps({"error": "No secrets file found"}))
            return
            
        master_password = os.environ.get('LEVIATAN_MASTER_PASSWORD')
        if not master_password:
            master_password = input("Enter master password: ")
            
        try:
            salt = b'leviatancode_salt_2025'
            key = derive_key(master_password, salt)
            cipher_suite = Fernet(key)
            
            with open(secrets_file, 'rb') as f:
                encrypted_data = f.read()
            
            decrypted_data = cipher_suite.decrypt(encrypted_data)
            data = json.loads(decrypted_data.decode())
            
            secrets = data.get('secrets', {})
            if secret_name in secrets:
                print(json.dumps({"value": secrets[secret_name]['value']}))
            else:
                print(json.dumps({"error": "Secret not found"}))
                
        except Exception as e:
            print(json.dumps({"error": str(e)}))
            
    elif '--add-secret' in sys.argv:
        # Add new secret
        if len(sys.argv) < 5:
            print(json.dumps({"error": "Usage: --add-secret <name> <value> <category> [description]"}))
            return
            
        secret_name = sys.argv[2]
        secret_value = sys.argv[3]
        secret_category = sys.argv[4]
        secret_description = sys.argv[5] if len(sys.argv) > 5 else ""
        
        app_dir = Path.home() / ".leviatancode"
        secrets_file = app_dir / "secrets.encrypted"
        
        # Load existing data or create new
        data = {"secrets": {}}
        if secrets_file.exists():
            master_password = os.environ.get('LEVIATAN_MASTER_PASSWORD')
            if not master_password:
                master_password = input("Enter master password: ")
                
            try:
                salt = b'leviatancode_salt_2025'
                key = derive_key(master_password, salt)
                cipher_suite = Fernet(key)
                
                with open(secrets_file, 'rb') as f:
                    encrypted_data = f.read()
                
                decrypted_data = cipher_suite.decrypt(encrypted_data)
                data = json.loads(decrypted_data.decode())
                
            except Exception as e:
                print(json.dumps({"error": f"Failed to load existing secrets: {e}"}))
                return
        else:
            master_password = os.environ.get('LEVIATAN_MASTER_PASSWORD')
            if not master_password:
                master_password = input("Enter master password for new vault: ")
        
        # Add the new secret
        data['secrets'][secret_name] = {
            'value': secret_value,
            'category': secret_category,
            'description': secret_description,
            'modified': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }
        
        # Save back to file
        try:
            salt = b'leviatancode_salt_2025'
            key = derive_key(master_password, salt)
            cipher_suite = Fernet(key)
            
            app_dir.mkdir(exist_ok=True)
            encrypted_data = cipher_suite.encrypt(json.dumps(data).encode())
            
            with open(secrets_file, 'wb') as f:
                f.write(encrypted_data)
                
            print(json.dumps({"success": True}))
            
        except Exception as e:
            print(json.dumps({"error": f"Failed to save secret: {e}"}))

if __name__ == '__main__':
    import sys
    
    # Check for API commands first
    if len(sys.argv) > 1 and ('--list-secrets' in sys.argv or '--get-secret' in sys.argv or '--add-secret' in sys.argv):
        handle_vault_api_commands()
    else:
        main()