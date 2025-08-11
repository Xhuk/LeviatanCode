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
import threading
import signal
import atexit
try:
    import winreg
except ImportError:
    winreg = None
from pathlib import Path
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import base64

# Global process tracking for cleanup
active_processes = []

def cleanup_processes():
    """Clean up all spawned processes"""
    print("\n🔄 Cleaning up processes...")
    for proc_name, proc in active_processes:
        if proc and proc.poll() is None:
            print(f"  Stopping {proc_name}...")
            proc.terminate()
            try:
                proc.wait(timeout=5)
            except subprocess.TimeoutExpired:
                proc.kill()
    active_processes.clear()

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

class OllamaWorker:
    """Worker thread to manage Ollama service"""
    
    def __init__(self):
        self.ollama_process = None
        self.is_running = False
        self.thread = None
        
    def check_ollama_installed(self):
        """Check if Ollama is installed"""
        try:
            result = subprocess.run(['ollama', '--version'], 
                                  capture_output=True, text=True, timeout=10)
            return result.returncode == 0
        except (subprocess.TimeoutExpired, FileNotFoundError):
            return False
    
    def start_ollama_service(self):
        """Start Ollama service"""
        try:
            print("🦙 Starting Ollama service...")
            
            # Start Ollama serve in background
            if os.name == 'nt':  # Windows
                self.ollama_process = subprocess.Popen(['ollama', 'serve'], 
                                                     stdout=subprocess.DEVNULL, 
                                                     stderr=subprocess.DEVNULL,
                                                     creationflags=subprocess.CREATE_NEW_PROCESS_GROUP)
            else:  # Unix/Linux
                self.ollama_process = subprocess.Popen(['ollama', 'serve'], 
                                                     stdout=subprocess.DEVNULL, 
                                                     stderr=subprocess.DEVNULL,
                                                     preexec_fn=os.setsid)
            
            active_processes.append(("Ollama Service", self.ollama_process))
            
            # Wait for service to be ready
            max_attempts = 15
            for attempt in range(1, max_attempts + 1):
                try:
                    response = requests.get('http://localhost:11434/api/tags', timeout=3)
                    if response.status_code == 200:
                        print("✅ Ollama service is ready!")
                        return True
                except requests.RequestException:
                    pass
                
                if attempt == max_attempts:
                    print("❌ Ollama service failed to start")
                    return False
                
                print(f"   Waiting for Ollama service... ({attempt}/{max_attempts})")
                time.sleep(2)
                
        except Exception as e:
            print(f"❌ Failed to start Ollama service: {e}")
            return False
    
    def pull_llama3_model(self):
        """Pull Llama3 model if not already available"""
        try:
            print("🦙 Checking Llama3 model availability...")
            
            # Check if model exists
            response = requests.get('http://localhost:11434/api/tags', timeout=10)
            if response.status_code == 200:
                models = response.json().get('models', [])
                llama3_exists = any('llama3' in model.get('name', '') for model in models)
                
                if llama3_exists:
                    print("✅ Llama3 model already available")
                    return True
            
            print("🦙 Pulling Llama3 model (this may take a while)...")
            print("   Note: This is a one-time download that will be cached for future use")
            
            # Pull model in background with progress
            pull_process = subprocess.Popen(['ollama', 'pull', 'llama3'], 
                                          stdout=subprocess.PIPE, 
                                          stderr=subprocess.STDOUT,
                                          text=True)
            
            # Monitor pull progress
            while True:
                output = pull_process.stdout.readline()
                if output == '' and pull_process.poll() is not None:
                    break
                if output and ('pulling' in output.lower() or 'downloading' in output.lower()):
                    print(f"   {output.strip()}")
            
            if pull_process.returncode == 0:
                print("✅ Llama3 model ready!")
                return True
            else:
                print("❌ Failed to pull Llama3 model")
                return False
                
        except Exception as e:
            print(f"❌ Error pulling Llama3 model: {e}")
            return False
    
    def start(self):
        """Start Ollama worker in background thread"""
        if not self.check_ollama_installed():
            print("⚠️  Ollama not installed - AI dual mode will use ChatGPT only")
            print("   To install Ollama: https://ollama.ai/download")
            return False
        
        self.thread = threading.Thread(target=self._worker_thread, daemon=True)
        self.thread.start()
        return True
    
    def _worker_thread(self):
        """Background worker thread"""
        try:
            # Start Ollama service
            if not self.start_ollama_service():
                return
            
            # Pull Llama3 model
            if not self.pull_llama3_model():
                print("⚠️  Llama3 model not available - some AI features may be limited")
                return
            
            self.is_running = True
            print("🦙 Ollama worker ready - AI dual mode available")
            
            # Keep thread alive and monitor service
            while self.is_running:
                time.sleep(30)  # Check every 30 seconds
                if self.ollama_process and self.ollama_process.poll() is not None:
                    print("⚠️  Ollama service stopped unexpectedly")
                    break
                    
        except Exception as e:
            print(f"❌ Ollama worker error: {e}")
    
    def stop(self):
        """Stop Ollama worker"""
        self.is_running = False
        if self.ollama_process:
            try:
                self.ollama_process.terminate()
                self.ollama_process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self.ollama_process.kill()
            self.ollama_process = None
        
        if self.thread and self.thread.is_alive():
            self.thread.join(timeout=5)

def main():
    """Main startup sequence"""
    print("🚀 Starting LeviatanCode with Secrets Manager...")
    print("=" * 60)
    
    # Register cleanup handlers
    atexit.register(cleanup_processes)
    signal.signal(signal.SIGINT, lambda s, f: cleanup_processes())
    signal.signal(signal.SIGTERM, lambda s, f: cleanup_processes())
    
    project_root = Path(__file__).parent.parent
    os.chdir(project_root)
    
    # Initialize Ollama worker
    ollama_worker = OllamaWorker()
    
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
    os.environ.setdefault('OLLAMA_URL', 'http://localhost:11434')
    os.environ.setdefault('OLLAMA_MODEL', 'llama3')
    
    # Start Ollama worker (non-blocking)
    print("\n[1/4] Starting Ollama AI Worker...")
    ollama_started = ollama_worker.start()
    if ollama_started:
        print("✅ Ollama worker started in background")
    else:
        print("⚠️  Ollama worker not available - will use ChatGPT only")
    
    # Start Flask
    print("\n[2/4] Starting Flask Analyzer...")
    flask_proc = subprocess.Popen([
        sys.executable, '-m', 'flask_analyzer.run_server'
    ], env=os.environ)
    active_processes.append(("Flask Analyzer", flask_proc))
    
    # Wait for Flask
    flask_port = os.environ.get('FLASK_PORT', '5001')
    health_url = f"http://127.0.0.1:{flask_port}/health"
    
    print(f"[3/4] Waiting for Flask at {health_url}...")
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
    print("\n[4/4] Starting main application...")
    if ollama_started:
        print("🦙 AI Dual Mode: ChatGPT (architecture) + Ollama Llama3 (development)")
    else:
        print("🤖 AI Mode: ChatGPT Only")
    try:
        # Try Windows-compatible commands first
        if os.name == 'nt':  # Windows
            # Try npm run dev first (most reliable on Windows)
            try:
                subprocess.run(['npm', 'run', 'dev'], env=os.environ, cwd=project_root)
            except FileNotFoundError:
                # Fallback to npx if npm is not found
                try:
                    subprocess.run(['npx.cmd', 'tsx', 'server/index.ts'], env=os.environ, cwd=project_root)
                except FileNotFoundError:
                    # Last resort: try npx without .cmd
                    subprocess.run(['npx', 'tsx', 'server/index.ts'], env=os.environ, cwd=project_root)
        else:
            # Unix/Linux systems
            subprocess.run(['npx', 'tsx', 'server/index.ts'], env=os.environ, cwd=project_root)
    except KeyboardInterrupt:
        print("\n🔄 Shutting down...")
    except FileNotFoundError as e:
        print(f"❌ Command not found: {e}")
        print("💡 Try running 'npm run dev' manually in the project directory")
    finally:
        print("\n🔄 Shutting down services...")
        ollama_worker.stop()
        cleanup_processes()
        print("✅ All services stopped")

def handle_vault_commands():
    """Handle vault-specific commands for frontend integration"""
    import sys
    
    if '--test-unlock' in sys.argv:
        # Test vault unlock for frontend integration
        if load_secrets_from_vault():
            print("✅ Vault unlock test successful")
            sys.exit(0)
        else:
            print("❌ Vault unlock test failed")
            sys.exit(1)
    elif '--list-secrets' in sys.argv:
        # List secrets for frontend integration
        if load_secrets_from_vault():
            # Load secrets file and output JSON
            app_dir = Path.home() / ".leviatancode"
            secrets_file = app_dir / "secrets.encrypted"
            if secrets_file.exists():
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
                    
                    print(json.dumps(data))
                    sys.exit(0)
                except Exception as e:
                    print(json.dumps({"error": str(e)}))
                    sys.exit(1)
        print(json.dumps({"secrets": {}}))
        sys.exit(0)

if __name__ == '__main__':
    import sys
    
    # Check for vault commands first
    if len(sys.argv) > 1 and ('--test-unlock' in sys.argv or '--list-secrets' in sys.argv):
        handle_vault_commands()
    
    # Normal startup
    sys.exit(main())
