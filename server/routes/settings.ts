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
      .filter(item => item.isDirectory())
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

export default router;