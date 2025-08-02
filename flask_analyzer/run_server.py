#!/usr/bin/env python3
"""
LeviatanCode Flask Analyzer - Server Runner
Simple script to start the Flask analysis server
"""

import os
import sys
from pathlib import Path

# Add the flask_analyzer directory to Python path
sys.path.insert(0, str(Path(__file__).parent))

# Set default environment variables
os.environ.setdefault('FLASK_PORT', '5001')
os.environ.setdefault('FLASK_DEBUG', 'true')

if __name__ == '__main__':
    try:
        from app import app, logger
        
        port = int(os.environ.get('FLASK_PORT', 5001))
        debug = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
        
        logger.info(f"🚀 Starting LeviatanCode Flask Analyzer API")
        logger.info(f"📍 Server running on: http://localhost:{port}")
        logger.info(f"🔧 Debug mode: {debug}")
        logger.info(f"🤖 OpenAI API configured: {bool(os.environ.get('OPENAI_API_KEY'))}")
        logger.info(f"🤖 Gemini API configured: {bool(os.environ.get('GEMINI_API_KEY'))}")
        logger.info(f"📊 Ready to analyze projects!")
        
        app.run(host='0.0.0.0', port=port, debug=debug)
        
    except ImportError as e:
        print(f"❌ Error importing Flask app: {e}")
        print("💡 Make sure you've installed requirements: pip install -r requirements.txt")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        sys.exit(1)