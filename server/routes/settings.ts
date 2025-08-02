import { Router } from "express";
import * as fs from "fs";
import * as path from "path";

const router = Router();

// Save working directory to .env file
router.post("/working-directory", async (req, res) => {
  try {
    const { workingDirectory } = req.body;
    
    if (!workingDirectory) {
      return res.status(400).json({ error: "Working directory is required" });
    }

    const envPath = path.join(process.cwd(), ".env");
    let envContent = "";
    
    // Read existing .env file if it exists
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, "utf8");
    }

    // Update or add WORKING_DIRECTORY
    const lines = envContent.split("\n");
    let found = false;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith("WORKING_DIRECTORY=")) {
        lines[i] = `WORKING_DIRECTORY="${workingDirectory}"`;
        found = true;
        break;
      }
    }
    
    if (!found) {
      lines.push(`WORKING_DIRECTORY="${workingDirectory}"`);
    }
    
    // Write back to .env
    fs.writeFileSync(envPath, lines.join("\n"));
    
    // Update process.env
    process.env.WORKING_DIRECTORY = workingDirectory;
    
    res.json({ success: true, workingDirectory });
  } catch (error) {
    console.error("Error saving working directory:", error);
    res.status(500).json({ error: "Failed to save working directory" });
  }
});

// Get current working directory
router.get("/working-directory", async (req, res) => {
  res.json({ 
    workingDirectory: process.env.WORKING_DIRECTORY || "" 
  });
});

// Get folders in working directory
router.get("/workspace-folders", async (req, res) => {
  try {
    const workingDir = process.env.WORKING_DIRECTORY;
    
    if (!workingDir || !fs.existsSync(workingDir)) {
      return res.json({ folders: [] });
    }
    
    const items = fs.readdirSync(workingDir, { withFileTypes: true });
    const folders = items
      .filter(item => item.isDirectory() && !item.name.startsWith('.'))
      .map(item => ({
        name: item.name,
        path: path.join(workingDir, item.name)
      }));
    
    res.json({ folders });
  } catch (error) {
    console.error("Error reading workspace folders:", error);
    res.json({ folders: [] });
  }
});

// Get file tree structure for a specific directory
router.get("/file-tree", async (req, res) => {
  try {
    const { dirPath } = req.query;
    const targetDir = dirPath || process.env.WORKING_DIRECTORY;
    
    if (!targetDir || !fs.existsSync(targetDir)) {
      return res.json({ tree: [], error: "Directory not found" });
    }

    const buildFileTree = (dirPath: string, maxDepth: number = 3, currentDepth: number = 0): any[] => {
      if (currentDepth >= maxDepth) return [];
      
      try {
        const items = fs.readdirSync(dirPath, { withFileTypes: true });
        
        return items
          .filter(item => !item.name.startsWith('.') && item.name !== 'node_modules')
          .map(item => {
            const fullPath = path.join(dirPath, item.name);
            const relativePath = path.relative(targetDir, fullPath);
            
            if (item.isDirectory()) {
              return {
                name: item.name,
                type: 'directory',
                path: relativePath,
                fullPath: fullPath,
                children: buildFileTree(fullPath, maxDepth, currentDepth + 1)
              };
            } else {
              const stats = fs.statSync(fullPath);
              return {
                name: item.name,
                type: 'file',
                path: relativePath,
                fullPath: fullPath,
                size: stats.size,
                extension: path.extname(item.name).toLowerCase(),
                modified: stats.mtime
              };
            }
          })
          .sort((a, b) => {
            // Directories first, then files, both alphabetically
            if (a.type === 'directory' && b.type === 'file') return -1;
            if (a.type === 'file' && b.type === 'directory') return 1;
            return a.name.localeCompare(b.name);
          });
      } catch (error) {
        console.error(`Error reading directory ${dirPath}:`, error);
        return [];
      }
    };

    const tree = buildFileTree(targetDir);
    res.json({ 
      tree, 
      rootPath: targetDir,
      totalItems: tree.length 
    });
    
  } catch (error) {
    console.error("Error building file tree:", error);
    res.status(500).json({ error: "Failed to build file tree" });
  }
});

// Read file content
router.get("/file-content", async (req, res) => {
  try {
    const { filePath } = req.query;
    const workingDir = process.env.WORKING_DIRECTORY;
    
    if (!filePath || !workingDir) {
      return res.status(400).json({ error: "File path and working directory required" });
    }
    
    const fullPath = path.join(workingDir, filePath);
    
    // Security check: ensure file is within working directory
    if (!fullPath.startsWith(workingDir)) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: "File not found" });
    }
    
    const stats = fs.statSync(fullPath);
    if (stats.isDirectory()) {
      return res.status(400).json({ error: "Path is a directory" });
    }
    
    // Check file size (limit to 1MB for text files)
    if (stats.size > 1024 * 1024) {
      return res.status(413).json({ error: "File too large" });
    }
    
    const content = fs.readFileSync(fullPath, 'utf8');
    res.json({ 
      content,
      fileName: path.basename(fullPath),
      size: stats.size,
      modified: stats.mtime
    });
    
  } catch (error) {
    console.error("Error reading file:", error);
    res.status(500).json({ error: "Failed to read file" });
  }
});

export default router;