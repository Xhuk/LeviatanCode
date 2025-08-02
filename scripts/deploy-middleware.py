#!/usr/bin/env python3
"""
Python script to deploy Node.js middleware for file handling
Handles zip files, attachments, and file processing operations
"""

import os
import sys
import json
import subprocess
import shutil
from pathlib import Path

def run_command(cmd, cwd=None):
    """Run a command and return the result"""
    try:
        result = subprocess.run(cmd, shell=True, cwd=cwd, capture_output=True, text=True)
        if result.returncode != 0:
            print(f"ERROR: {result.stderr}")
            return False
        print(result.stdout)
        return True
    except Exception as e:
        print(f"ERROR running command: {e}")
        return False

def create_middleware_package():
    """Create a Node.js package for middleware"""
    middleware_dir = Path("middleware-package")
    middleware_dir.mkdir(exist_ok=True)
    
    # Create package.json
    package_json = {
        "name": "leviatancode-middleware",
        "version": "1.0.0",
        "description": "Middleware for LeviatanCode file processing",
        "main": "index.js",
        "type": "module",
        "scripts": {
            "start": "node index.js",
            "dev": "node --watch index.js"
        },
        "dependencies": {
            "express": "^4.18.2",
            "multer": "^1.4.5-lts.1",
            "cors": "^2.8.5",
            "helmet": "^7.1.0",
            "express-rate-limit": "^7.1.5",
            "yauzl": "^2.10.0",
            "archiver": "^6.0.1",
            "mime-types": "^2.1.35"
        }
    }
    
    with open(middleware_dir / "package.json", "w") as f:
        json.dump(package_json, f, indent=2)
    
    # Create main middleware file
    middleware_code = '''
import express from 'express';
import multer from 'multer';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import yauzl from 'yauzl';
import archiver from 'archiver';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.MIDDLEWARE_PORT || 3001;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false // Allow for development
}));

app.use(cors({
  origin: ['http://localhost:5000', 'http://localhost:5005'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});
app.use('/api/', limiter);

// File upload configuration
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
    files: 20
  },
  fileFilter: (req, file, cb) => {
    // Allow all file types for now
    cb(null, true);
  }
});

// Upload directory
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Routes
app.post('/api/upload/files', upload.array('files'), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const uploadedFiles = [];
    
    req.files.forEach((file, index) => {
      const filename = `${Date.now()}_${index}_${file.originalname}`;
      const filepath = path.join(uploadDir, filename);
      
      fs.writeFileSync(filepath, file.buffer);
      
      uploadedFiles.push({
        originalName: file.originalname,
        filename: filename,
        path: filepath,
        size: file.size,
        mimetype: file.mimetype
      });
    });

    res.json({
      success: true,
      files: uploadedFiles,
      count: uploadedFiles.length
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Extract ZIP files
app.post('/api/extract/zip', upload.single('zipFile'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No ZIP file provided' });
    }

    const extractDir = path.join(uploadDir, `extracted_${Date.now()}`);
    fs.mkdirSync(extractDir, { recursive: true });

    const zipBuffer = req.file.buffer;
    const tempZipPath = path.join(uploadDir, `temp_${Date.now()}.zip`);
    fs.writeFileSync(tempZipPath, zipBuffer);

    yauzl.open(tempZipPath, { lazyEntries: true }, (err, zipfile) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to open ZIP file' });
      }

      const extractedFiles = [];
      
      zipfile.readEntry();
      zipfile.on('entry', (entry) => {
        if (/\\/$/.test(entry.fileName)) {
          // Directory entry
          const dirPath = path.join(extractDir, entry.fileName);
          fs.mkdirSync(dirPath, { recursive: true });
          zipfile.readEntry();
        } else {
          // File entry
          zipfile.openReadStream(entry, (err, readStream) => {
            if (err) throw err;
            
            const filePath = path.join(extractDir, entry.fileName);
            const dirPath = path.dirname(filePath);
            fs.mkdirSync(dirPath, { recursive: true });
            
            const writeStream = fs.createWriteStream(filePath);
            readStream.pipe(writeStream);
            
            writeStream.on('close', () => {
              extractedFiles.push({
                name: entry.fileName,
                path: filePath,
                size: entry.uncompressedSize
              });
              zipfile.readEntry();
            });
          });
        }
      });

      zipfile.on('end', () => {
        // Clean up temp ZIP file
        fs.unlinkSync(tempZipPath);
        
        res.json({
          success: true,
          extractedTo: extractDir,
          files: extractedFiles,
          count: extractedFiles.length
        });
      });
    });

  } catch (error) {
    console.error('ZIP extraction error:', error);
    res.status(500).json({ error: 'ZIP extraction failed' });
  }
});

// Create ZIP from files
app.post('/api/create/zip', (req, res) => {
  try {
    const { files, zipName } = req.body;
    
    if (!files || !Array.isArray(files)) {
      return res.status(400).json({ error: 'Files array required' });
    }

    const zipPath = path.join(uploadDir, zipName || `archive_${Date.now()}.zip`);
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      res.json({
        success: true,
        zipPath: zipPath,
        size: archive.pointer()
      });
    });

    archive.on('error', (err) => {
      res.status(500).json({ error: 'ZIP creation failed' });
    });

    archive.pipe(output);

    files.forEach(file => {
      if (fs.existsSync(file.path)) {
        archive.file(file.path, { name: file.name || path.basename(file.path) });
      }
    });

    archive.finalize();

  } catch (error) {
    console.error('ZIP creation error:', error);
    res.status(500).json({ error: 'ZIP creation failed' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    middleware: 'LeviatanCode File Processing',
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// File listing
app.get('/api/files', (req, res) => {
  try {
    const files = fs.readdirSync(uploadDir).map(filename => {
      const filepath = path.join(uploadDir, filename);
      const stats = fs.statSync(filepath);
      return {
        name: filename,
        path: filepath,
        size: stats.size,
        isDirectory: stats.isDirectory(),
        modified: stats.mtime
      };
    });

    res.json({ files });
  } catch (error) {
    res.status(500).json({ error: 'Failed to list files' });
  }
});

app.listen(PORT, () => {
  console.log(`\\n🚀 LeviatanCode Middleware running on port ${PORT}`);
  console.log(`📁 Upload directory: ${uploadDir}`);
  console.log(`🔒 Security middleware active`);
  console.log(`⚡ Ready for file processing operations\\n`);
});

export default app;
'''
    
    with open(middleware_dir / "index.js", "w") as f:
        f.write(middleware_code)
    
    return middleware_dir

def deploy_middleware():
    """Deploy the middleware package"""
    print("🔧 Creating Node.js middleware package...")
    middleware_dir = create_middleware_package()
    
    print("📦 Installing dependencies...")
    if not run_command("npm install", cwd=middleware_dir):
        return False
    
    print("✅ Middleware package created successfully!")
    print(f"📁 Location: {middleware_dir.absolute()}")
    print("\n🚀 To start the middleware:")
    print(f"   cd {middleware_dir}")
    print("   npm start")
    print("\n🔄 For development with auto-reload:")
    print("   npm run dev")
    
    return True

if __name__ == "__main__":
    print("🌟 LeviatanCode Middleware Deployment Script")
    print("=" * 50)
    
    if deploy_middleware():
        print("\n✅ Deployment completed successfully!")
        print("🎯 Middleware is ready for file processing operations")
    else:
        print("\n❌ Deployment failed!")
        sys.exit(1)