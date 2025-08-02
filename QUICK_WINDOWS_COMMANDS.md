# Quick Windows Setup Commands

## The file exists! Try these commands:

```bash
# Option 1: Check current directory
dir scripts\setup-windows-fixed.py

# Option 2: Run with full path
python .\scripts\setup-windows-fixed.py

# Option 3: Change to project root first
cd C:\ReactProjects\LeviatanCode
python scripts\setup-windows-fixed.py

# Option 4: Use the complete test instead
python scripts\windows-complete-test.py
```

## If setup-windows-fixed.py doesn't exist, use existing files:

```bash
# Use the original setup (might have Unicode issues)
python scripts\setup-windows.py

# Or use the validation script
python scripts\windows-complete-test.py

# Or manual setup
npm install
npm run windev
```

## Quick diagnostic:

```bash
# Check what scripts are available
dir scripts\*.py

# Check if you're in the right directory  
dir package.json

# Test if Python can find the file
python -c "import os; print(os.path.exists('scripts/setup-windows-fixed.py'))"
```

Try the commands above and let me know what works!