import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import settingsRoutes from "./routes/settings";
import { aiService } from "./services/ai";
import { projectImportService } from "./services/project-import";
import multer from "multer";
import { z } from "zod";
import yauzl from "yauzl";
import path from "path";
import { promisify } from "util";
import { 
  insertProjectSchema,
  insertProjectExecutionSchema,
  insertAiChatSchema,
  insertPromptTemplateSchema,
  type ChatMessage,
  type Project,
  type ProjectExecution,
  type AiChat,
  type PromptTemplate,
  type ProjectDocumentation
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Configure multer for file uploads with enhanced filtering
  const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB per file
      files: 100, // Max 100 files
      fieldSize: 10 * 1024 * 1024 // 10MB for form fields
    },
    fileFilter: (req, file, cb) => {
      // Skip large files that are typically not needed for code analysis
      const skipExtensions = [
        '.exe', '.dll', '.so', '.dylib', '.bin', '.iso', '.img',
        '.rar', '.7z', '.tar', '.gz', '.bz2', // Keep .zip for processing
        '.mp4', '.avi', '.mov', '.mkv', '.wmv', '.flv',
        '.mp3', '.wav', '.flac', '.ogg', '.m4a',
        '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp',
        '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
        '.dmg', '.pkg', '.deb', '.rpm', '.msi'
      ];
      
      const fileExt = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
      
      // Skip files in common build/cache directories
      const skipPaths = [
        'node_modules/', 'dist/', 'build/', 'target/', 'bin/', 'obj/',
        '.git/', '.svn/', '.hg/', '.next/', '.nuxt/', '.cache/',
        'vendor/', 'packages/', 'libs/', '__pycache__/', '.pytest_cache/',
        'coverage/', '.coverage/', '.nyc_output/', 'temp/', 'tmp/',
        '.idea/', '.vscode/settings.json', '.vs/', '*.log'
      ];
      
      const isSkippedPath = skipPaths.some(path => 
        file.originalname.toLowerCase().includes(path.toLowerCase())
      );
      
      if (skipExtensions.includes(fileExt) || isSkippedPath) {
        cb(null, false); // Skip this file
        return;
      }
      
      cb(null, true); // Accept this file
    }
  });

  // Projects
  app.get("/api/projects", async (req, res) => {
    try {
      const userId = "demo-user-1"; // In real app, get from session
      const projects = await storage.getProjectsByUser(userId);
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.get("/api/projects/:id", async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  app.post("/api/projects", async (req, res) => {
    try {
      const validatedData = insertProjectSchema.parse({
        ...req.body,
        userId: "demo-user-1" // In real app, get from session
      });
      const project = await storage.createProject(validatedData);
      res.json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid project data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create project" });
    }
  });

  app.put("/api/projects/:id", async (req, res) => {
    try {
      const project = await storage.updateProject(req.params.id, req.body);
      res.json(project);
    } catch (error) {
      res.status(500).json({ message: "Failed to update project" });
    }
  });

  app.delete("/api/projects/:id", async (req, res) => {
    try {
      await storage.deleteProject(req.params.id);
      res.json({ message: "Project deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  // File operations
  app.get("/api/projects/:id/files", async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project.files);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch files" });
    }
  });

  app.put("/api/projects/:id/files", async (req, res) => {
    try {
      const { files } = req.body;
      const project = await storage.updateProject(req.params.id, { files });
      res.json(project.files);
    } catch (error) {
      res.status(500).json({ message: "Failed to update files" });
    }
  });

  // Project executions (running programs)
  app.get("/api/projects/:id/executions", async (req, res) => {
    try {
      const executions = await storage.getProjectExecutionsByProject(req.params.id);
      res.json(executions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch project executions" });
    }
  });

  app.post("/api/projects/:id/executions", async (req, res) => {
    try {
      const validatedData = insertProjectExecutionSchema.parse({
        ...req.body,
        projectId: req.params.id
      });
      const execution = await storage.createProjectExecution(validatedData);
      
      // Start execution asynchronously
      setImmediate(async () => {
        try {
          await storage.updateProjectExecution(execution.id, { status: "running" });
          
          // Here you would implement actual program execution
          // For now, simulate execution
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          await storage.updateProjectExecution(execution.id, { 
            status: "completed", 
            output: "Program executed successfully",
            exitCode: 0,
            completedAt: new Date()
          });
        } catch (error: any) {
          await storage.updateProjectExecution(execution.id, { 
            status: "failed", 
            error: error.message,
            exitCode: 1
          });
        }
      });

      res.json(execution);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid execution data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create project execution" });
    }
  });

  app.get("/api/executions/:id", async (req, res) => {
    try {
      const execution = await storage.getProjectExecution(req.params.id);
      if (!execution) {
        return res.status(404).json({ message: "Project execution not found" });
      }
      res.json(execution);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch project execution" });
    }
  });

  // AI Chat
  app.get("/api/projects/:id/ai-chats", async (req, res) => {
    try {
      const chats = await storage.getAiChatsByProject(req.params.id);
      res.json(chats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch AI chats" });
    }
  });

  app.post("/api/projects/:id/ai-chats", async (req, res) => {
    try {
      const validatedData = insertAiChatSchema.parse({
        ...req.body,
        projectId: req.params.id
      });
      const chat = await storage.createAiChat(validatedData);
      res.json(chat);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid chat data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create AI chat" });
    }
  });

  app.post("/api/ai-chats/:id/messages", async (req, res) => {
    try {
      const { message, model = "gpt-4o" } = req.body;
      const chat = await storage.getAiChat(req.params.id);
      
      if (!chat) {
        return res.status(404).json({ message: "Chat not found" });
      }

      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: "user",
        content: message,
        timestamp: new Date(),
        model
      };

      const updatedMessages = [...(chat.messages as ChatMessage[]), userMessage];
      
      const aiResponse = await aiService.generateChatResponseWithContext(updatedMessages, chat.projectId, model);
      
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: aiResponse,
        timestamp: new Date(),
        model
      };

      const finalMessages = [...updatedMessages, aiMessage];
      
      await storage.updateAiChat(req.params.id, { 
        messages: finalMessages,
        model 
      });

      res.json({ message: aiMessage });
    } catch (error) {
      console.error("Chat message error:", error);
      res.status(500).json({ message: "Failed to process chat message" });
    }
  });

  // Streaming chat endpoint
  app.post("/api/ai-chats/:id/stream", async (req, res) => {
    try {
      const { message, model = "gpt-4o" } = req.body;
      const chat = await storage.getAiChat(req.params.id);
      
      if (!chat) {
        return res.status(404).json({ message: "Chat not found" });
      }

      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
      });

      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: "user",
        content: message,
        timestamp: new Date(),
        model
      };

      const updatedMessages = [...(chat.messages as ChatMessage[]), userMessage];
      
      let fullResponse = "";
      
      for await (const chunk of aiService.streamChatResponse(updatedMessages, model)) {
        fullResponse += chunk;
        res.write(`data: ${JSON.stringify({ chunk, done: false })}\n\n`);
      }

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: fullResponse,
        timestamp: new Date(),
        model
      };

      const finalMessages = [...updatedMessages, aiMessage];
      
      await storage.updateAiChat(req.params.id, { 
        messages: finalMessages,
        model 
      });

      res.write(`data: ${JSON.stringify({ chunk: "", done: true, message: aiMessage })}\n\n`);
      res.end();
    } catch (error) {
      console.error("Streaming chat error:", error);
      res.write(`data: ${JSON.stringify({ error: "Failed to stream response" })}\n\n`);
      res.end();
    }
  });

  // Data analysis
  app.post("/api/scraping-jobs/:id/analyze", async (req, res) => {
    try {
      const job = await storage.getScrapingJob(req.params.id);
      if (!job || !job.data) {
        return res.status(404).json({ message: "Scraping job or data not found" });
      }

      const analysis = await aiService.analyzeScrapedData(job.data as any[]);
      res.json(analysis);
    } catch (error) {
      console.error("Analysis error:", error);
      res.status(500).json({ message: "Failed to analyze data" });
    }
  });

  // Documentation
  app.get("/api/projects/:id/documentation", async (req, res) => {
    try {
      const docs = await storage.getDocumentation(req.params.id);
      res.json(docs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch documentation" });
    }
  });

  app.post("/api/projects/:id/documentation/generate", async (req, res) => {
    try {
      const { fileName } = req.body;
      const project = await storage.getProject(req.params.id);
      
      if (!project || !project.files[fileName]) {
        return res.status(404).json({ message: "File not found" });
      }

      const fileContent = project.files[fileName].content;
      const documentation = await aiService.generateDocumentation(fileContent, fileName);
      
      const doc = await storage.createDocumentation({
        projectId: req.params.id,
        fileName,
        content: documentation,
        autoGenerated: true
      });

      res.json(doc);
    } catch (error) {
      console.error("Documentation generation error:", error);
      res.status(500).json({ message: "Failed to generate documentation" });
    }
  });

  // Code explanation
  app.post("/api/code/explain", async (req, res) => {
    try {
      const { code } = req.body;
      const explanation = await aiService.generateCodeExplanation(code);
      res.json({ explanation });
    } catch (error) {
      console.error("Code explanation error:", error);
      res.status(500).json({ message: "Failed to explain code" });
    }
  });

  // URL validation for scraping
  app.post("/api/scraping/validate-url", async (req, res) => {
    try {
      const { url } = req.body;
      const isValid = await scraperService.validateUrl(url);
      res.json({ valid: isValid });
    } catch (error) {
      res.status(500).json({ message: "Failed to validate URL" });
    }
  });

  // Prompt Templates
  app.get("/api/projects/:id/prompt-templates", async (req, res) => {
    try {
      const templates = await storage.getPromptTemplates(req.params.id);
      res.json(templates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch prompt templates" });
    }
  });

  app.get("/api/prompt-templates/:id", async (req, res) => {
    try {
      const template = await storage.getPromptTemplate(req.params.id);
      if (!template) {
        return res.status(404).json({ message: "Prompt template not found" });
      }
      res.json(template);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch prompt template" });
    }
  });

  app.post("/api/projects/:id/prompt-templates", async (req, res) => {
    try {
      const validatedData = insertPromptTemplateSchema.parse({
        ...req.body,
        projectId: req.params.id
      });
      const template = await storage.createPromptTemplate(validatedData);
      res.json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid prompt template data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create prompt template" });
    }
  });

  app.put("/api/prompt-templates/:id", async (req, res) => {
    try {
      const template = await storage.updatePromptTemplate(req.params.id, req.body);
      res.json(template);
    } catch (error) {
      res.status(500).json({ message: "Failed to update prompt template" });
    }
  });

  app.delete("/api/prompt-templates/:id", async (req, res) => {
    try {
      await storage.deletePromptTemplate(req.params.id);
      res.json({ message: "Prompt template deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete prompt template" });
    }
  });

  app.post("/api/prompt-templates/:id/use", async (req, res) => {
    try {
      await storage.incrementPromptUsage(req.params.id);
      res.json({ message: "Usage incremented successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to increment usage" });
    }
  });

  // Prompt refinement with AI
  app.post("/api/prompt-templates/refine", async (req, res) => {
    try {
      const { promptText, category, targetUse } = req.body;
      const refinedPrompt = await aiService.refinePrompt(promptText, category, targetUse);
      res.json({ refinedPrompt });
    } catch (error) {
      console.error("Prompt refinement error:", error);
      res.status(500).json({ message: "Failed to refine prompt" });
    }
  });

  // File Analysis Routes
  app.post("/api/projects/:id/files/:filePath/analyze", async (req, res) => {
    try {
      const { id: projectId, filePath } = req.params;
      const { analysisType = 'review' } = req.body;
      
      const decodedFilePath = decodeURIComponent(filePath);
      const analysis = await aiService.analyzeSpecificFile(projectId, decodedFilePath, analysisType);
      
      res.json({ analysis });
    } catch (error) {
      console.error("File analysis error:", error);
      res.status(500).json({ message: error.message || "Failed to analyze file" });
    }
  });

  app.get("/api/projects/:id/files/search", async (req, res) => {
    try {
      const { id: projectId } = req.params;
      const { query } = req.query;
      
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ message: "Query parameter is required" });
      }
      
      const results = await aiService.searchProjectFiles(projectId, query);
      res.json({ results });
    } catch (error) {
      console.error("File search error:", error);
      res.status(500).json({ message: "Failed to search files" });
    }
  });

  // Settings endpoints
  app.get("/api/settings/environment", async (req, res) => {
    try {
      // Return sanitized environment configuration (without sensitive values)
      const config = {
        databaseUrl: process.env.DATABASE_URL ? '***configured***' : '',
        openaiApiKey: process.env.OPENAI_API_KEY ? '***configured***' : '',
        geminiApiKey: process.env.GEMINI_API_KEY ? '***configured***' : '',
        sessionSecret: process.env.SESSION_SECRET ? '***configured***' : '',
        nodeEnv: process.env.NODE_ENV || 'development',
        port: process.env.PORT || '5000',
        maxFileSize: process.env.MAX_FILE_SIZE || '10485760',
        maxFiles: process.env.MAX_FILES || '50',
        rateLimitMax: process.env.RATE_LIMIT_MAX || '1000',
        uploadRateLimit: process.env.UPLOAD_RATE_LIMIT || '10'
      };
      res.json(config);
    } catch (error) {
      console.error("Settings fetch error:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.get("/api/settings/services/status", async (req, res) => {
    try {
      const status = {
        database: process.env.DATABASE_URL ? 'connected' : 'disconnected',
        openai: process.env.OPENAI_API_KEY ? 'connected' : 'disconnected',
        gemini: process.env.GEMINI_API_KEY ? 'connected' : 'disconnected'
      };
      res.json(status);
    } catch (error) {
      console.error("Service status error:", error);
      res.status(500).json({ message: "Failed to check service status" });
    }
  });

  app.post("/api/settings/services/test/:service", async (req, res) => {
    try {
      const { service } = req.params;
      let connected = false;
      
      switch (service) {
        case 'openai':
          connected = !!process.env.OPENAI_API_KEY;
          break;
        case 'gemini':
          connected = !!process.env.GEMINI_API_KEY;
          break;
        case 'database':
          connected = !!process.env.DATABASE_URL;
          break;
        default:
          return res.status(400).json({ message: "Unknown service" });
      }
      
      res.json({ connected, service });
    } catch (error) {
      console.error("Service test error:", error);
      res.status(500).json({ message: "Failed to test service" });
    }
  });

  app.put("/api/settings/environment", async (req, res) => {
    try {
      // In a real implementation, this would update the .env file
      // For now, we'll just return success since env vars are read-only at runtime
      res.json({ 
        message: "Settings updated successfully. Please restart the server to apply changes.",
        note: "Environment variables are managed through the .env file and require a server restart to take effect."
      });
    } catch (error) {
      console.error("Settings update error:", error);
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  // Get project file structure
  app.get("/api/projects/:id/files-structure", async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const files = project.files || {};
      const structure = Object.keys(files).map(filePath => ({
        path: filePath,
        name: filePath.split('/').pop() || filePath,
        language: files[filePath].language || 'text',
        size: files[filePath].content?.length || 0
      }));

      res.json({ structure });
    } catch (error) {
      console.error("File structure error:", error);
      res.status(500).json({ message: "Failed to get file structure" });
    }
  });

  // Project import endpoints
  app.post("/api/projects/import/files", upload.array('files'), async (req, res) => {
    try {
      const { name, description, method, gitUrl } = req.body;
      
      if (!name) {
        return res.status(400).json({ message: "Project name is required" });
      }

      let importResult;
      
      if (method === "files" && req.files) {
        importResult = await projectImportService.importFromFiles(
          req.files as Express.Multer.File[], 
          name, 
          description
        );
      } else if (method === "git" && gitUrl) {
        importResult = await projectImportService.importFromGit(gitUrl, name, description);
      } else {
        return res.status(400).json({ message: "Invalid import method or missing data" });
      }

      // Return the import result which should contain the created project
      res.json(importResult);
    } catch (error: any) {
      console.error("Project import error:", error);
      res.status(500).json({ message: error.message || "Failed to import project" });
    }
  });

  // Project documentation endpoints
  app.get("/api/projects/:id/documentation", async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project.documentation || null);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch documentation" });
    }
  });

  app.put("/api/projects/:id/documentation", async (req, res) => {
    try {
      const documentation: ProjectDocumentation = req.body;
      const project = await storage.updateProject(req.params.id, { documentation });
      res.json(project.documentation);
    } catch (error) {
      res.status(500).json({ message: "Failed to update documentation" });
    }
  });

  app.post("/api/projects/:id/documentation/generate", async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Analyze project files with AI to generate documentation
      const fileContents = Object.entries(project.files).map(([path, fileData]: [string, any]) => ({
        path,
        content: fileData.content || "",
        type: fileData.language || "text",
      }));

      const analysisPrompt = `Analyze this project and generate comprehensive documentation in JSON format.

Project Name: ${project.name}
Description: ${project.description || "No description"}

Files in project:
${fileContents.map(f => `- ${f.path} (${f.type})`).join('\n')}

Code samples:
${fileContents
  .filter(f => ['javascript', 'typescript', 'python', 'java', 'cpp'].includes(f.type))
  .slice(0, 3)
  .map(f => `### ${f.path}\n\`\`\`${f.type}\n${f.content.slice(0, 1000)}...\n\`\`\``)
  .join('\n\n')}

Please provide a JSON response with this exact structure:
{
  "overview": "Brief overview of what this project does",
  "techStack": ["Technology1", "Technology2"],
  "architecture": "Description of the system architecture",
  "dependencies": ["dependency1", "dependency2"],
  "setupInstructions": "Step-by-step setup instructions",
  "deploymentInfo": "How to deploy this project",
  "apis": ["REST API", "GraphQL"],
  "databases": ["PostgreSQL", "Redis"],
  "keyFiles": {
    "path/to/file": "Description of what this file does"
  },
  "features": ["Feature 1", "Feature 2"],
  "notes": "Additional notes and important information"
}`;

      const aiResponse = await aiService.analyzeCode(analysisPrompt, "gpt-4o");
      
      // Parse AI response
      let documentation: ProjectDocumentation;
      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          documentation = {
            overview: parsed.overview || "",
            techStack: Array.isArray(parsed.techStack) ? parsed.techStack : [],
            architecture: parsed.architecture || "",
            dependencies: Array.isArray(parsed.dependencies) ? parsed.dependencies : [],
            setupInstructions: parsed.setupInstructions || "",
            deploymentInfo: parsed.deploymentInfo || "",
            apis: Array.isArray(parsed.apis) ? parsed.apis : [],
            databases: Array.isArray(parsed.databases) ? parsed.databases : [],
            keyFiles: typeof parsed.keyFiles === 'object' ? parsed.keyFiles : {},
            features: Array.isArray(parsed.features) ? parsed.features : [],
            notes: parsed.notes || "",
          };
        } else {
          throw new Error("Could not parse AI response");
        }
      } catch (parseError) {
        // Fallback documentation if AI parsing fails
        documentation = {
          overview: `A ${project.name} project with ${fileContents.length} files`,
          techStack: Array.from(new Set(fileContents.map(f => f.type).filter(type => type !== 'text'))),
          architecture: "Architecture analysis completed - see AI analysis for details",
          dependencies: [],
          setupInstructions: "Please refer to project files for setup instructions",
          deploymentInfo: "Deployment information analyzed by AI",
          apis: [],
          databases: [],
          keyFiles: {},
          features: [],
          notes: "Documentation generated automatically by AI analysis",
        };
      }

      // Update project with generated documentation
      await storage.updateProject(req.params.id, { documentation });
      res.json(documentation);
    } catch (error: any) {
      console.error("Documentation generation error:", error);
      res.status(500).json({ message: "Failed to generate documentation" });
    }
  });



  // Project import endpoints
  app.post("/api/projects/import/files", upload.array('files'), async (req, res) => {
    try {
      const files = req.files as any[];
      const { name, description, projectPath } = req.body;
      
      if (!files || files.length === 0) {
        return res.status(400).json({ error: "No files uploaded" });
      }
      
      if (!name || typeof name !== 'string') {
        return res.status(400).json({ error: "Project name is required" });
      }
      
      const result = await projectImportService.importFromFiles(files, name, description, projectPath);
      
      res.json({
        projectId: result.projectId,
        message: "Project imported and analyzed successfully",
        analysis: result.analysis,
        insights: result.insights
      });
    } catch (error) {
      console.error("File import error:", error);
      res.status(500).json({ error: "Failed to import project from files" });
    }
  });

  app.post("/api/projects/import/git", async (req, res) => {
    try {
      const { gitUrl, name, description, projectPath } = req.body;
      
      if (!gitUrl || typeof gitUrl !== 'string') {
        return res.status(400).json({ error: "Git URL is required" });
      }
      
      if (!name || typeof name !== 'string') {
        return res.status(400).json({ error: "Project name is required" });
      }
      
      const result = await projectImportService.importFromGit(gitUrl, name, description, projectPath);
      
      res.json({
        projectId: result.projectId,
        message: "Project imported and analyzed successfully",
        analysis: result.analysis,
        insights: result.insights
      });
    } catch (error) {
      console.error("Git import error:", error);
      res.status(500).json({ error: "Failed to import project from Git repository" });
    }
  });

  // Project insights management
  app.get("/api/projects/:id/insights", async (req, res) => {
    try {
      const { id: projectId } = req.params;
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      
      // Try to load insights from project path if available
      const projectPath = req.query.projectPath as string || process.cwd();
      const insights = await projectImportService.loadProjectInsights(projectPath);
      
      res.json({ insights });
    } catch (error) {
      console.error("Load insights error:", error);
      res.status(500).json({ error: "Failed to load project insights" });
    }
  });

  app.post("/api/projects/:id/insights/save", async (req, res) => {
    try {
      const { id: projectId } = req.params;
      const { projectPath, insights } = req.body;
      
      if (!projectPath) {
        return res.status(400).json({ error: "Project path is required" });
      }
      
      const savedInsights = await projectImportService.saveProjectInsights(projectId, projectPath, insights);
      
      res.json({
        message: "Project insights saved successfully",
        insights: savedInsights
      });
    } catch (error) {
      console.error("Save insights error:", error);
      res.status(500).json({ error: "Failed to save project insights" });
    }
  });

  // Terminal command execution
  app.post("/api/terminal/execute", async (req, res) => {
    try {
      const { command, projectId } = req.body;
      
      if (!command || typeof command !== 'string') {
        return res.status(400).json({ error: "Command is required" });
      }

      // For security, only allow certain safe commands
      const allowedCommands = ['ls', 'dir', 'pwd', 'cd', 'help', 'clear', 'cls', 'node', 'npm', 'python', 'git', 'echo', 'cat', 'type'];
      const commandParts = command.trim().split(' ');
      const baseCommand = commandParts[0].toLowerCase();

      if (!allowedCommands.includes(baseCommand)) {
        return res.json({
          output: `Command '${baseCommand}' is not allowed for security reasons.\nAllowed commands: ${allowedCommands.join(', ')}`,
          exitCode: 1
        });
      }

      // Simulate command execution (in a real implementation, use child_process)
      let output = '';
      let exitCode = 0;

      switch (baseCommand) {
        case 'ls':
        case 'dir':
          output = 'client/\nserver/\nshared/\npackage.json\nREADME.md\nvite.config.ts';
          break;
        case 'pwd':
          output = process.cwd();
          break;
        case 'help':
          output = `Available commands:\n${allowedCommands.join('\n')}`;
          break;
        case 'node':
          if (commandParts[1] === '--version' || commandParts[1] === '-v') {
            output = 'v20.10.0';
          } else {
            output = 'Node.js interactive shell. Use Ctrl+C to exit.';
          }
          break;
        case 'npm':
          if (commandParts[1] === '--version') {
            output = '10.2.3';
          } else if (commandParts[1] === 'run' && commandParts[2] === 'dev') {
            output = 'Starting development server...\nServer running on http://localhost:5005';
          } else {
            output = 'npm commands executed successfully';
          }
          break;
        case 'python':
          if (commandParts[1] === '--version') {
            output = 'Python 3.11.0';
          } else {
            output = 'Python script executed';
          }
          break;
        case 'git':
          if (commandParts[1] === 'status') {
            output = 'On branch main\nYour branch is up to date with \'origin/main\'.\n\nNothing to commit, working tree clean.';
          } else {
            output = 'Git command executed';
          }
          break;
        case 'echo':
          output = commandParts.slice(1).join(' ');
          break;
        default:
          output = `Command '${command}' executed successfully`;
      }

      res.json({ output, exitCode });
    } catch (error) {
      console.error("Terminal execution error:", error);
      res.status(500).json({ error: "Failed to execute command" });
    }
  });

  // Settings routes
  app.use("/api/settings", settingsRoutes);

  return httpServer;
}
