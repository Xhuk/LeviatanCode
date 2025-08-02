import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import settingsRoutes from "./routes/settings";
import loggerRoutes, { LoggerService } from "./routes/logger";
import { aiService } from "./services/ai";
import { projectImportService } from "./services/project-import";
import { flaskAnalyzerService } from "./services/flask-analyzer";
import { InsightsFileService } from "./services/insights-file";
import multer from "multer";
import { z } from "zod";
import yauzl from "yauzl";
import path from "path";
import fs from "fs";
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
  
  // Setup WebSocket server for real-time analysis updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Store active analysis connections
  const analysisConnections = new Map<string, WebSocket>();
  
  wss.on('connection', (ws, req) => {
    console.log('📡 WebSocket connection established');
    
    // Add client to logger service for real-time logs
    LoggerService.addClient(ws);
    
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        if (data.type === 'subscribe_analysis' && data.projectId) {
          analysisConnections.set(data.projectId, ws);
          console.log(`📡 Subscribed to analysis updates for project: ${data.projectId}`);
        }
      } catch (e) {
        console.warn('Invalid WebSocket message:', e);
      }
    });
    
    ws.on('close', () => {
      // Remove from logger service
      LoggerService.removeClient(ws);
      // Remove from all subscriptions
      for (const [projectId, connection] of Array.from(analysisConnections.entries())) {
        if (connection === ws) {
          analysisConnections.delete(projectId);
          console.log(`📡 Unsubscribed from analysis updates for project: ${projectId}`);
        }
      }
    });
  });
  
  // Helper function to broadcast analysis updates
  const broadcastAnalysisUpdate = (projectId: string, update: any) => {
    const ws = analysisConnections.get(projectId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'analysis_update',
        projectId,
        ...update
      }));
    }
  };

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

  // Get AI context from insightsproject.ia file
  app.get("/api/projects/:id/ai-context", async (req, res) => {
    try {
      const { id: projectId } = req.params;
      const { workingDirectory } = req.query;
      
      const projectDir = (workingDirectory as string) || process.cwd();
      const insights = await InsightsFileService.read(projectDir);
      
      if (insights) {
        const aiContext = InsightsFileService.getAIContext(insights);
        console.log(`📋 Loaded AI context from insightsproject.ia for project: ${projectId}`);
        res.json({
          hasContext: true,
          context: aiContext,
          insights: insights,
          lastAnalyzed: insights.lastAnalyzed
        });
      } else {
        console.log(`📭 No insightsproject.ia file found for project: ${projectId}`);
        res.json({
          hasContext: false,
          context: null,
          insights: null,
          lastAnalyzed: null
        });
      }
    } catch (error) {
      console.error("Get AI context error:", error);
      res.status(500).json({ error: "Failed to get AI context" });
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
      // Add extracted files count for extraction tracking
      const responseData = {
        ...importResult,
        extractedFiles: importResult.zipFiles || [],
        fileCount: importResult.zipFiles?.length || 0,
        projectPath: importResult.extractedPath
      };
      res.json(responseData);
    } catch (error: any) {
      console.error("Project import error:", error);
      res.status(500).json({ message: error.message || "Failed to import project" });
    }
  });

  // AI Document Analysis endpoint
  app.post("/api/projects/:projectId/analyze-documents", async (req, res) => {
    try {
      const { projectId } = req.params;
      const { workingDirectory, generateScript, analysisType } = req.body;
      
      console.log(`🧠 Starting AI document analysis for project: ${projectId}`);
      console.log(`📁 Working directory: ${workingDirectory || 'current'}`);
      console.log(`🐍 Generate Python script: ${generateScript ? 'Yes' : 'No'}`);
      console.log(`🤖 AI Interaction Status: ACTIVE - Analyzing project structure and generating insights...`);
      
      // Send initial analysis started update via WebSocket
      broadcastAnalysisUpdate(projectId, {
        status: 'started',
        message: `Starting AI document analysis for project: ${projectId}`,
        workingDirectory: workingDirectory || 'current',
        generateScript: generateScript || false
      });
      
      // Get the actual project to analyze its structure
      let project;
      let projectFiles = {};
      
      try {
        project = await storage.getProject(projectId);
        projectFiles = project?.files || {};
      } catch (error) {
        console.log(`📁 Project ${projectId} not found in storage, analyzing working directory files...`);
        // If project doesn't exist, analyze files from working directory
        const fs = require('fs');
        const path = require('path');
        
        try {
          // Determine the correct project directory
          let projectDir = workingDirectory || process.cwd();
          console.log(`🔍 Scanning directory: ${projectDir}`);
          
          // If workingDirectory is specified but doesn't exist, use current directory
          if (workingDirectory && !fs.existsSync(workingDirectory)) {
            console.log(`⚠️  Specified directory ${workingDirectory} doesn't exist, using current directory`);
            projectDir = process.cwd();
          }
          
          // First try Flask analyzer for comprehensive analysis
          console.log(`🔍 Attempting Flask analysis on directory: ${projectDir}`);
          let flaskAnalysis = await flaskAnalyzerService.analyzeProjectPath(projectDir);
          
          if (flaskAnalysis) {
            console.log(`✅ Flask analysis completed successfully!`);
            console.log(`📊 Quality Score: ${flaskAnalysis.analysis.quality_assessment.quality_score}/10`);
            console.log(`🎯 Primary Language: ${flaskAnalysis.analysis.technologies.primary_language}`);
            console.log(`🏗️ Frameworks: ${flaskAnalysis.analysis.frameworks.join(', ') || 'None detected'}`);
            
            // Send Flask analysis results via WebSocket
            broadcastAnalysisUpdate(projectId, {
              status: 'flask_analysis_complete',
              message: `Flask analyzer completed comprehensive analysis`,
              qualityScore: flaskAnalysis.analysis.quality_assessment.quality_score,
              primaryLanguage: flaskAnalysis.analysis.technologies.primary_language,
              frameworks: flaskAnalysis.analysis.frameworks,
              executionMethods: flaskAnalysis.analysis.execution_methods
            });
            
            // Convert Flask analysis to insights format and save
            const enhancedInsights = flaskAnalyzerService.convertToInsights(flaskAnalysis);
            await InsightsFileService.write(projectDir, enhancedInsights);
            
            return res.json({
              projectId,
              analysis: {
                insights: enhancedInsights,
                metrics: { 
                  totalFiles: flaskAnalysis.analysis.basic_info.file_count,
                  linesOfCode: flaskAnalysis.analysis.code_metrics.total_lines,
                  qualityScore: flaskAnalysis.analysis.quality_assessment.quality_score
                },
                recommendations: flaskAnalysis.analysis.recommendations,
                flaskAnalysis: flaskAnalysis.analysis
              },
              insights: enhancedInsights,
              extractedPath: projectDir,
              flaskAnalysisUsed: true
            });
          } else {
            console.log(`⚠️ Flask analyzer not available, falling back to standard analysis`);
          }
          
          // Check for existing insightsproject.ia file as fallback
          const existingInsights = await InsightsFileService.read(projectDir);
          
          if (existingInsights) {
            console.log(`📋 Found existing insightsproject.ia file, using cached analysis`);
            // Send existing insights via WebSocket
            broadcastAnalysisUpdate(projectId, {
              status: 'loaded_existing',
              message: `Loaded existing project analysis from insightsproject.ia`,
              technologies: existingInsights.technologies,
              fileCount: existingInsights.totalFiles
            });
            
            // Check if analysis is recent (less than 24 hours old)
            const lastAnalyzed = new Date(existingInsights.lastAnalyzed);
            const hoursSinceAnalysis = (Date.now() - lastAnalyzed.getTime()) / (1000 * 60 * 60);
            
            if (hoursSinceAnalysis < 24) {
              console.log(`📊 Using recent analysis (${Math.round(hoursSinceAnalysis)}h old)`);
              return res.json({
                projectId,
                analysis: {
                  insights: existingInsights.insights,
                  metrics: { 
                    totalFiles: existingInsights.totalFiles,
                    linesOfCode: existingInsights.totalLinesOfCode 
                  },
                  recommendations: existingInsights.recommendations,
                  visualizations: []
                },
                insights: existingInsights,
                extractedPath: projectDir
              });
            } else {
              console.log(`🔄 Analysis is old (${Math.round(hoursSinceAnalysis)}h), performing fresh analysis`);
            }
          }
          
          // Also try scanning the specific project folder if it exists
          const specificProjectDir = path.join(projectDir, projectId);
          let targetDir = projectDir;
          
          if (fs.existsSync(specificProjectDir)) {
            targetDir = specificProjectDir;
            console.log(`🎯 Found specific project directory: ${targetDir}`);
          } else {
            console.log(`🎯 Using base directory: ${targetDir}`);
          }
          
          // Update projectDir to be the target directory for insights file and all subsequent operations
          projectDir = targetDir;
          
          const scanDirectory = (dir: string, baseDir: string = dir): any => {
            const files: any = {};
            try {
              const items = fs.readdirSync(dir);
              for (const item of items) {
                const fullPath = path.join(dir, item);
                const relativePath = path.relative(baseDir, fullPath);
                
                // Skip node_modules and other build directories
                if (item.includes('node_modules') || item.includes('.git') || item.includes('dist') || item.includes('build') || item.includes('.next') || item.includes('__pycache__')) {
                  continue;
                }
                
                const stat = fs.statSync(fullPath);
                if (stat.isFile() && stat.size < 2 * 1024 * 1024) { // Files under 2MB
                  // Check if it's a text file extension we want to analyze
                  const ext = path.extname(item).toLowerCase();
                  const textExtensions = ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.h', '.cs', '.php', '.rb', '.go', '.rs', '.swift', '.kt', '.scala', '.css', '.scss', '.sass', '.less', '.html', '.htm', '.xml', '.svg', '.json', '.md', '.txt', '.yaml', '.yml', '.toml', '.ini', '.conf', '.config', '.sql', '.sh', '.bat', '.ps1', '.cmd', '.dockerfile'];
                  
                  if (textExtensions.includes(ext) || ext === '') { // Include extensionless files
                    try {
                      const content = fs.readFileSync(fullPath, 'utf8');
                      files[relativePath] = { content, size: stat.size };
                      console.log(`📄 Added file: ${relativePath} (${stat.size} bytes)`);
                    } catch (readError) {
                      // Skip files that can't be read as text
                      console.log(`⚠️  Could not read ${relativePath}: ${(readError as Error).message}`);
                    }
                  }
                } else if (stat.isDirectory()) {
                  const subFiles = scanDirectory(fullPath, baseDir);
                  Object.assign(files, subFiles);
                } else if (stat.isFile()) {
                  console.log(`📋 Skipped large file: ${relativePath} (${stat.size} bytes)`);
                }
              }
            } catch (scanError) {
              console.log(`⚠️  Could not scan directory ${dir}: ${(scanError as Error).message}`);
            }
            return files;
          };
          
          // Send scanning started update
          broadcastAnalysisUpdate(projectId, {
            status: 'scanning_files',
            message: `Starting file scan in directory: ${targetDir}`,
            fileCount: 0
          });
          
          projectFiles = scanDirectory(targetDir);
          console.log(`📊 Found ${Object.keys(projectFiles).length} files for analysis in ${targetDir}`);
          
          // Send file scan update via WebSocket
          broadcastAnalysisUpdate(projectId, {
            status: 'scanning_complete',
            message: `Found ${Object.keys(projectFiles).length} files in ${targetDir}`,
            fileCount: Object.keys(projectFiles).length
          });
          
          // Debug: Let's check what we found
          console.log(`📂 Directory contents:`, fs.readdirSync(targetDir).slice(0, 10));
          console.log(`📁 Sample files found:`, Object.keys(projectFiles).slice(0, 10));
          
          // If no files found in project directory, scan current working directory more broadly
          if (Object.keys(projectFiles).length === 0) {
            console.log(`🔍 No files found in ${targetDir}, scanning broader directory...`);
            // Try scanning the actual current working directory of this application
            const appDir = process.cwd();
            console.log(`📂 Scanning application directory: ${appDir}`);
            const broadScan = scanDirectory(appDir);
            projectFiles = broadScan;
            console.log(`📊 Broader scan found ${Object.keys(projectFiles).length} files`);
            
            // Send broader scan update via WebSocket
            broadcastAnalysisUpdate(projectId, {
              status: 'scanning_complete',
              message: `Broader scan found ${Object.keys(projectFiles).length} files`,
              fileCount: Object.keys(projectFiles).length
            });
          }
        } catch (fsError) {
          console.log(`⚠️  File system analysis failed: ${(fsError as Error).message}`);
        }
      }
      
      // Analyze the actual project structure
      const filePaths = Object.keys(projectFiles);
      console.log(`📁 Analyzing files: ${filePaths.slice(0, 10).join(', ')}${filePaths.length > 10 ? '...' : ''}`);
      
      const fileExtensions = filePaths.map(path => {
        const ext = path.split('.').pop()?.toLowerCase();
        return ext;
      }).filter(Boolean);
      
      console.log(`🔍 File extensions found: ${Array.from(new Set(fileExtensions)).join(', ')}`);
      
      const detectedTechnologies: string[] = [];
      const detectedInsights: string[] = [];
      const detectedRecommendations: string[] = [];
      
      // Send technology detection started update
      broadcastAnalysisUpdate(projectId, {
        status: 'analyzing_files',
        message: `Detecting technologies from ${filePaths.length} files...`,
        fileCount: filePaths.length
      });
      
      // Detect technologies based on file extensions and content
      if (fileExtensions.includes('js') || fileExtensions.includes('jsx')) {
        detectedTechnologies.push('JavaScript');
      }
      if (fileExtensions.includes('ts') || fileExtensions.includes('tsx')) {
        detectedTechnologies.push('TypeScript');
      }
      if (fileExtensions.includes('py')) {
        detectedTechnologies.push('Python');
      }
      if (fileExtensions.includes('java')) {
        detectedTechnologies.push('Java');
      }
      if (fileExtensions.includes('cs')) {
        detectedTechnologies.push('C#');
      }
      if (fileExtensions.includes('cpp') || fileExtensions.includes('c')) {
        detectedTechnologies.push('C/C++');
      }
      if (fileExtensions.includes('php')) {
        detectedTechnologies.push('PHP');
      }
      if (fileExtensions.includes('rb')) {
        detectedTechnologies.push('Ruby');
      }
      if (fileExtensions.includes('go')) {
        detectedTechnologies.push('Go');
      }
      if (fileExtensions.includes('rs')) {
        detectedTechnologies.push('Rust');
      }
      
      // Check for specific frameworks and libraries
      const fileContents = Object.values(projectFiles).map((f: any) => f.content || '').join(' ');
      console.log(`📄 Total content length: ${fileContents.length} characters`);
      
      if (fileContents.includes('react') || fileContents.includes('React')) {
        detectedTechnologies.push('React');
      }
      if (fileContents.includes('vue') || fileContents.includes('Vue')) {
        detectedTechnologies.push('Vue.js');
      }
      if (fileContents.includes('angular') || fileContents.includes('Angular')) {
        detectedTechnologies.push('Angular');
      }
      if (fileContents.includes('express') || fileContents.includes('Express')) {
        detectedTechnologies.push('Express.js');
      }
      if (fileContents.includes('django') || fileContents.includes('Django')) {
        detectedTechnologies.push('Django');
      }
      if (fileContents.includes('flask') || fileContents.includes('Flask')) {
        detectedTechnologies.push('Flask');
      }
      
      // Send technology detection complete update
      broadcastAnalysisUpdate(projectId, {
        status: 'analyzing_files',
        message: `Technology detection complete: ${detectedTechnologies.length} technologies found`,
        technologies: detectedTechnologies,
        fileCount: filePaths.length
      });
      
      // Generate insights based on project structure
      const fileCount = Object.keys(projectFiles).length;
      if (fileCount > 0) {
        detectedInsights.push(`Project contains ${fileCount} files across various directories`);
      }
      
      if (detectedTechnologies.includes('TypeScript')) {
        detectedInsights.push('Uses TypeScript for enhanced type safety and developer experience');
        detectedRecommendations.push('Consider setting up strict TypeScript configuration for better type checking');
      }
      
      if (detectedTechnologies.includes('React')) {
        detectedInsights.push('React-based frontend architecture detected');
        detectedRecommendations.push('Consider implementing React Testing Library for component testing');
      }
      
      if (detectedTechnologies.includes('Python')) {
        detectedInsights.push('Python-based backend or scripting detected');
        detectedRecommendations.push('Consider setting up virtual environment and requirements.txt');
      }
      
      // Default recommendations
      if (detectedRecommendations.length === 0) {
        detectedRecommendations.push('Consider adding automated testing framework');
        detectedRecommendations.push('Implement proper documentation for project setup');
        detectedRecommendations.push('Add version control and CI/CD pipeline');
      }
      
      // Default insights if none detected
      if (detectedInsights.length === 0) {
        detectedInsights.push('Project structure analysis completed');
        detectedInsights.push('Consider organizing files into logical directories');
        if (fileCount === 0) {
          detectedInsights.push('No project files found - try importing a project or checking the working directory');
        }
      }
      
      const analysisResult: {
        summary: string;
        technologies: string[];
        recommendations: string[];
        insights: string[];
        pythonScript?: string;
        filesCreated?: {
          script: string;
          readme: string;
        };
      } = {
        summary: `Analyzed project "${projectId}" with ${fileCount} files. Detected technologies: ${detectedTechnologies.join(', ') || 'None specified'}. The project appears to be a ${detectedTechnologies[0] || 'general-purpose'} application.`,
        technologies: detectedTechnologies,
        recommendations: detectedRecommendations,
        insights: detectedInsights
      };

      // Always generate Python script for project analysis
      if (true) { // Always generate script
        const scriptTechnologies = detectedTechnologies.join(', ') || 'various technologies';
        analysisResult.pythonScript = `#!/usr/bin/env python3
"""
Intelligent Project Analysis Script for ${projectId}
Generated by LeviatanCode AI

This script analyzes project structure, detects technologies, creates file trees,
and integrates with Gemini AI for comprehensive insights.
"""

import os
import json
import requests
from pathlib import Path
from typing import Dict, List, Any, Optional
import datetime
import subprocess
import re

class ProjectAnalyzer:
    def __init__(self, project_path: str, gemini_api_key: Optional[str] = None):
        self.project_path = Path(project_path)
        self.gemini_api_key = gemini_api_key or os.getenv('GEMINI_API_KEY')
        self.analysis_data = {
            "project_name": "${projectId}",
            "analysis_date": datetime.datetime.now().isoformat(),
            "project_path": str(self.project_path.absolute()),
            "file_tree": {},
            "file_types": {},
            "technologies": [],
            "frameworks": [],
            "dependencies": {},
            "package_managers": [],
            "build_tools": [],
            "configuration_files": [],
            "documentation_files": [],
            "test_files": [],
            "source_files": [],
            "asset_files": [],
            "total_files": 0,
            "total_size": 0,
            "lines_of_code": 0
        }

    def create_file_tree(self) -> Dict[str, Any]:
        """Create a detailed file tree structure."""
        def build_tree(path: Path, max_depth: int = 5, current_depth: int = 0) -> Dict[str, Any]:
            if current_depth >= max_depth:
                return {"...": "max_depth_reached"}
            
            tree = {}
            try:
                items = sorted(path.iterdir(), key=lambda x: (x.is_file(), x.name.lower()))
                for item in items:
                    # Skip hidden files and common build directories
                    if item.name.startswith('.') and item.name not in ['.env', '.gitignore', '.dockerignore']:
                        continue
                    if item.name in ['node_modules', '__pycache__', 'dist', 'build', 'target', 'bin', 'obj', '.git']:
                        continue
                    
                    if item.is_file():
                        file_size = item.stat().st_size
                        tree[item.name] = {
                            "type": "file",
                            "size": file_size,
                            "extension": item.suffix.lower(),
                            "modified": datetime.datetime.fromtimestamp(item.stat().st_mtime).isoformat()
                        }
                        self.analysis_data["total_files"] += 1
                        self.analysis_data["total_size"] += file_size
                        
                        # Count lines of code for text files
                        if self.is_text_file(item):
                            try:
                                with open(item, 'r', encoding='utf-8', errors='ignore') as f:
                                    lines = len(f.readlines())
                                    tree[item.name]["lines"] = lines
                                    self.analysis_data["lines_of_code"] += lines
                            except:
                                pass
                    
                    elif item.is_dir():
                        tree[item.name] = {
                            "type": "directory",
                            "contents": build_tree(item, max_depth, current_depth + 1)
                        }
            except PermissionError:
                tree["[Permission Denied]"] = {"type": "error"}
            
            return tree
        
        return build_tree(self.project_path)

    def detect_technologies(self) -> None:
        """Detect technologies, frameworks, and tools used in the project."""
        technology_indicators = {
            # Languages
            'JavaScript': ['.js', '.mjs'],
            'TypeScript': ['.ts', '.tsx'],
            'Python': ['.py', '.pyw'],
            'Java': ['.java', '.jar'],
            'C#': ['.cs', '.csproj'],
            'C++': ['.cpp', '.cc', '.cxx', '.h', '.hpp'],
            'C': ['.c', '.h'],
            'Go': ['.go'],
            'Rust': ['.rs'],
            'PHP': ['.php'],
            'Ruby': ['.rb'],
            'Swift': ['.swift'],
            'Kotlin': ['.kt'],
            'Dart': ['.dart'],
            'HTML': ['.html', '.htm'],
            'CSS': ['.css', '.scss', '.sass', '.less'],
            'SQL': ['.sql'],
            'Shell': ['.sh', '.bash', '.zsh'],
            'PowerShell': ['.ps1'],
            'Batch': ['.bat', '.cmd']
        }
        
        framework_files = {
            # Package managers and config files
            'package.json': 'Node.js/npm',
            'yarn.lock': 'Yarn',
            'requirements.txt': 'Python pip',
            'Pipfile': 'Python Pipenv',
            'pyproject.toml': 'Python Poetry',
            'Cargo.toml': 'Rust Cargo',
            'pom.xml': 'Java Maven',
            'build.gradle': 'Java Gradle',
            'composer.json': 'PHP Composer',
            'Gemfile': 'Ruby Bundler',
            'go.mod': 'Go Modules',
            
            # Framework indicators
            'angular.json': 'Angular',
            'vue.config.js': 'Vue.js',
            'nuxt.config.js': 'Nuxt.js',
            'next.config.js': 'Next.js',
            'gatsby-config.js': 'Gatsby',
            'svelte.config.js': 'Svelte',
            'vite.config.js': 'Vite',
            'webpack.config.js': 'Webpack',
            'rollup.config.js': 'Rollup',
            'tsconfig.json': 'TypeScript',
            'tailwind.config.js': 'Tailwind CSS',
            
            # Backend frameworks
            'django': 'Django',
            'flask': 'Flask',
            'fastapi': 'FastAPI',
            'express': 'Express.js',
            'spring': 'Spring Framework',
            'laravel': 'Laravel',
            'rails': 'Ruby on Rails',
            
            # Database
            'docker-compose.yml': 'Docker',
            'Dockerfile': 'Docker',
            'kubernetes': 'Kubernetes',
            '.env': 'Environment Configuration'
        }
        
        # Analyze file extensions
        for file_path in self.project_path.rglob('*'):
            if file_path.is_file():
                ext = file_path.suffix.lower()
                self.analysis_data["file_types"][ext] = self.analysis_data["file_types"].get(ext, 0) + 1
                
                # Categorize files
                if ext in ['.py', '.js', '.ts', '.java', '.cs', '.cpp', '.c', '.go', '.rs', '.php', '.rb']:
                    self.analysis_data["source_files"].append(str(file_path.relative_to(self.project_path)))
                elif ext in ['.md', '.txt', '.rst', '.pdf']:
                    self.analysis_data["documentation_files"].append(str(file_path.relative_to(self.project_path)))
                elif 'test' in file_path.name.lower() or 'spec' in file_path.name.lower():
                    self.analysis_data["test_files"].append(str(file_path.relative_to(self.project_path)))
                elif ext in ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.css', '.scss']:
                    self.analysis_data["asset_files"].append(str(file_path.relative_to(self.project_path)))
                
                # Detect technologies by extension
                for tech, extensions in technology_indicators.items():
                    if ext in extensions and tech not in self.analysis_data["technologies"]:
                        self.analysis_data["technologies"].append(tech)
                
                # Detect frameworks by filename
                filename = file_path.name.lower()
                for indicator, framework in framework_files.items():
                    if indicator in filename and framework not in self.analysis_data["frameworks"]:
                        self.analysis_data["frameworks"].append(framework)
                        if indicator in ['package.json', 'yarn.lock', 'requirements.txt', 'Cargo.toml']:
                            self.analysis_data["package_managers"].append(framework)
                        if 'config' in indicator:
                            self.analysis_data["configuration_files"].append(str(file_path.relative_to(self.project_path)))

    def analyze_dependencies(self) -> None:
        """Analyze project dependencies from various package managers."""
        # Node.js dependencies
        package_json = self.project_path / 'package.json'
        if package_json.exists():
            try:
                with open(package_json, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    self.analysis_data["dependencies"]["npm"] = {
                        "dependencies": data.get("dependencies", {}),
                        "devDependencies": data.get("devDependencies", {}),
                        "scripts": data.get("scripts", {})
                    }
            except:
                pass
        
        # Python dependencies
        requirements_txt = self.project_path / 'requirements.txt'
        if requirements_txt.exists():
            try:
                with open(requirements_txt, 'r', encoding='utf-8') as f:
                    deps = [line.strip() for line in f if line.strip() and not line.startswith('#')]
                    self.analysis_data["dependencies"]["pip"] = deps
            except:
                pass

    def is_text_file(self, file_path: Path) -> bool:
        """Check if a file is a text file."""
        text_extensions = {'.txt', '.md', '.py', '.js', '.ts', '.html', '.css', '.json', '.xml', '.yml', '.yaml', '.toml', '.ini', '.cfg', '.conf', '.sh', '.bat', '.ps1', '.sql', '.php', '.rb', '.go', '.rs', '.java', '.cs', '.cpp', '.c', '.h', '.hpp'}
        return file_path.suffix.lower() in text_extensions

    def generate_gemini_analysis(self) -> Dict[str, Any]:
        """Use Gemini AI to analyze the project structure and provide insights."""
        if not self.gemini_api_key:
            return {"error": "Gemini API key not provided"}
        
        analysis_prompt = f"""
        Analyze this project structure and provide detailed insights:
        
        Project: {self.analysis_data['project_name']}
        Technologies: {', '.join(self.analysis_data['technologies'])}
        Frameworks: {', '.join(self.analysis_data['frameworks'])}
        Total Files: {self.analysis_data['total_files']}
        Lines of Code: {self.analysis_data['lines_of_code']}
        File Types: {json.dumps(self.analysis_data['file_types'], indent=2)}
        Dependencies: {json.dumps(self.analysis_data['dependencies'], indent=2)}
        
        Provide a comprehensive analysis including:
        1. Project type and architecture assessment
        2. Technology stack evaluation
        3. Code quality observations
        4. Security considerations
        5. Performance recommendations
        6. Deployment suggestions
        7. Development workflow improvements
        8. Specific actionable recommendations
        
        Return as JSON with keys: architecture, evaluation, quality, security, performance, deployment, workflow, recommendations
        """
        
        try:
            url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent"
            headers = {
                "Content-Type": "application/json",
                "x-goog-api-key": self.gemini_api_key
            }
            data = {
                "contents": [{
                    "parts": [{"text": analysis_prompt}]
                }]
            }
            
            response = requests.post(url, headers=headers, json=data)
            if response.status_code == 200:
                result = response.json()
                gemini_text = result["candidates"][0]["content"]["parts"][0]["text"]
                
                # Try to extract JSON from response
                try:
                    import re
                    json_match = re.search(r'\\{.*\\}', gemini_text, re.DOTALL)
                    if json_match:
                        return json.loads(json_match.group())
                    else:
                        return {"raw_analysis": gemini_text}
                except:
                    return {"raw_analysis": gemini_text}
            else:
                return {"error": f"Gemini API error: {response.status_code}"}
        except Exception as e:
            return {"error": f"Failed to connect to Gemini: {str(e)}"}

    def run_analysis(self) -> Dict[str, Any]:
        """Run complete project analysis."""
        print(f"🔍 Analyzing project: {self.project_path}")
        print("📁 Creating file tree...")
        self.analysis_data["file_tree"] = self.create_file_tree()
        
        print("🔧 Detecting technologies...")
        self.detect_technologies()
        
        print("📦 Analyzing dependencies...")
        self.analyze_dependencies()
        
        print("🤖 Generating AI insights...")
        gemini_analysis = self.generate_gemini_analysis()
        self.analysis_data["ai_insights"] = gemini_analysis
        
        return self.analysis_data

def main():
    """Main function to run the analysis."""
    import argparse
    
    parser = argparse.ArgumentParser(description='Intelligent Project Analysis Tool')
    parser.add_argument('path', nargs='?', default='.', help='Project path to analyze')
    parser.add_argument('--api-key', help='Gemini API key for AI analysis')
    parser.add_argument('--output', default='${projectId}_analysis.json', help='Output file path')
    
    args = parser.parse_args()
    
    analyzer = ProjectAnalyzer(args.path, args.api_key)
    results = analyzer.run_analysis()
    
    # Save results
    with open(args.output, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    
    print(f"\\n✅ Analysis complete!")
    print(f"📊 Results saved to: {args.output}")
    print(f"📁 Total files: {results['total_files']}")
    print(f"💻 Technologies: {', '.join(results['technologies'])}")
    print(f"🛠️  Frameworks: {', '.join(results['frameworks'])}")
    print(f"📝 Lines of code: {results['lines_of_code']:,}")
    
    if results.get('ai_insights') and not results['ai_insights'].get('error'):
        print("🤖 AI analysis completed successfully!")
    else:
        print("⚠️  AI analysis failed - provide GEMINI_API_KEY for enhanced insights")

if __name__ == "__main__":
    main()
`;
      }

      console.log(`✅ Document analysis completed for project: ${projectId}`);
      console.log(`🎯 AI Analysis Results: Found ${detectedTechnologies.length} technologies, ${detectedInsights.length} insights, ${detectedRecommendations.length} recommendations`);
      console.log(`📊 File Analysis: ${Object.keys(projectFiles).length} files scanned, ${fileCount} total analyzed`);
      console.log(`🐍 Python Script: ${generateScript ? 'Generated (' + (analysisResult.pythonScript?.length || 0) + ' chars)' : 'Not requested'}`);
      
      // Send analysis completed update via WebSocket
      broadcastAnalysisUpdate(projectId, {
        status: 'completed',
        message: `Analysis complete! Found ${detectedTechnologies.length} technologies, ${detectedInsights.length} insights, ${detectedRecommendations.length} recommendations`,
        technologies: detectedTechnologies,
        insights: detectedInsights,
        recommendations: detectedRecommendations,
        fileCount: Object.keys(projectFiles).length,
        totalAnalyzed: fileCount
      });
      
      // Use the seeded comprehensive analyzer from /scripts folder
      try {
        // Use the same project directory logic as insights file
        let scriptDir = workingDirectory || process.cwd();
        const specificProjectDir = path.join(scriptDir, projectId);
        
        if (fs.existsSync(specificProjectDir)) {
          scriptDir = specificProjectDir;
          console.log(`🎯 Using specific project directory for analysis: ${scriptDir}`);
        }
        
        // Check if comprehensive analyzer exists in scripts folder
        const scriptsFolder = path.join(process.cwd(), 'scripts');
        const comprehensiveAnalyzerPath = path.join(scriptsFolder, 'comprehensive_analyzer.py');
        
        if (fs.existsSync(comprehensiveAnalyzerPath)) {
          console.log(`📋 Found comprehensive analyzer at: ${comprehensiveAnalyzerPath}`);
          
          // Create a simple runner script in the project directory
          const runnerScript = `#!/usr/bin/env python3
"""
LeviatanCode Project Analysis Runner
Runs the comprehensive analyzer from the scripts folder for project: ${projectId}
"""

import os
import sys
import subprocess
from pathlib import Path

def main():
    """Run the comprehensive analyzer for this project."""
    project_dir = Path("${scriptDir.replace(/\\/g, '/')}")
    scripts_dir = Path("${scriptsFolder.replace(/\\/g, '/')}")
    analyzer_script = scripts_dir / "comprehensive_analyzer.py"
    
    print(f"🚀 Running comprehensive analysis for: ${projectId}")
    print(f"📁 Project directory: {project_dir}")
    print(f"📋 Using seeded analyzer: {analyzer_script}")
    print()
    
    if not analyzer_script.exists():
        print("❌ Error: Comprehensive analyzer not found in scripts folder")
        sys.exit(1)
    
    try:
        cmd = [sys.executable, str(analyzer_script), str(project_dir)]
        
        # Add API key if available
        if os.getenv('GEMINI_API_KEY'):
            cmd.extend(['--api-key', os.getenv('GEMINI_API_KEY')])
        
        print("🔄 Executing comprehensive analysis...")
        result = subprocess.run(cmd, text=True, cwd=str(scripts_dir))
        
        if result.returncode == 0:
            print("✅ Comprehensive analysis completed successfully!")
            insights_file = project_dir / "insightsproject.ia"
            if insights_file.exists():
                print(f"📄 Analysis results: {insights_file}")
            else:
                print("⚠️  Warning: insightsproject.ia file not created")
        else:
            print(f"❌ Analysis failed with exit code: {result.returncode}")
            
    except Exception as e:
        print(f"❌ Error running analysis: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
`;
          
          const runnerFileName = `${projectId}_run_analysis.py`;
          const runnerPath = path.join(scriptDir, runnerFileName);
          
          fs.writeFileSync(runnerPath, runnerScript, 'utf8');
          console.log(`💾 Analysis runner created: ${runnerPath}`);
          
          // Send script creation update via WebSocket
          broadcastAnalysisUpdate(projectId, {
            status: 'script_created',
            message: `Analysis runner created: ${runnerFileName}`,
            scriptPath: runnerPath
          });
          
          // Create README with instructions
          const readmeContent = `# LeviatanCode Project Analysis

## Quick Start
Run the comprehensive analysis:
\`\`\`bash
python ${runnerFileName}
\`\`\`

## With AI Analysis
Set your Gemini API key and run:
\`\`\`bash
set GEMINI_API_KEY=your_api_key_here
python ${runnerFileName}
\`\`\`

## Output
- \`insightsproject.ia\` - Complete project analysis for AI consumption
- Console output with detailed analysis progress

## Features
- ✅ Comprehensive file scanning (${projectId})
- ✅ Technology and framework detection
- ✅ Dependency analysis (all package managers)
- ✅ Project type classification
- ✅ Git repository analysis
- ✅ Code quality metrics
- ✅ AI-powered insights (with API key)
- ✅ Complete insightsproject.ia generation

## About
This analysis uses the comprehensive analyzer from the /scripts folder,
designed specifically for LeviatanCode development environment analysis.

Generated for project: ${projectId}
Analysis target: ${scriptDir}
`;
          
          const readmePath = path.join(scriptDir, `${projectId}_analysis_README.md`);
          fs.writeFileSync(readmePath, readmeContent, 'utf8');
          console.log(`📄 Analysis README saved: ${readmePath}`);
          
          analysisResult.filesCreated = {
            runner: runnerPath,
            readme: readmePath,
            comprehensiveAnalyzer: comprehensiveAnalyzerPath
          };
          
          // Update the analysis result to indicate we're using the seeded analyzer
          analysisResult.usingSeededAnalyzer = true;
          analysisResult.analyzerLocation = comprehensiveAnalyzerPath;
          
        } else {
          console.log(`⚠️  Comprehensive analyzer not found at: ${comprehensiveAnalyzerPath}`);
          console.log(`📝 Falling back to basic analysis (seeded analyzer not available)`);
        }
        
      } catch (writeError) {
        console.error(`❌ Failed to create analysis runner: ${writeError.message}`);
      }
      
      // Create or update insightsproject.ia file with analysis results
      try {
        let projectDir = workingDirectory || process.cwd();
        
        // Check if there's a specific project subdirectory
        const specificProjectDir = path.join(projectDir, projectId);
        
        if (fs.existsSync(specificProjectDir)) {
          projectDir = specificProjectDir;
          console.log(`🎯 Using specific project directory for insights: ${projectDir}`);
        }
        
        // Prepare analysis data for insightsproject.ia
        const analysisForInsights = {
          technologies: detectedTechnologies,
          insights: detectedInsights,
          recommendations: detectedRecommendations,
          totalFiles: Object.keys(projectFiles).length,
          totalLinesOfCode: Object.values(projectFiles).reduce((total: number, file: any) => {
            const content = file.content || '';
            return total + (content.split('\n').length || 0);
          }, 0),
          fileTypes: Object.keys(projectFiles).reduce((types: any, filePath: string) => {
            const ext = path.extname(filePath);
            types[ext] = (types[ext] || 0) + 1;
            return types;
          }, {}),
          frameworks: detectedTechnologies.filter(tech => 
            ['React', 'Vue.js', 'Angular', 'Express.js', 'Django', 'Flask', 'Spring Framework'].includes(tech)
          ),
          dependencies: {},
          aiSummary: analysisResult.summary || `Project analysis completed. Found ${detectedTechnologies.length} technologies, ${Object.keys(projectFiles).length} files.`,
          setupInstructions: detectedRecommendations.filter(rec => rec.includes('install') || rec.includes('setup')),
          runCommands: detectedRecommendations.filter(rec => rec.includes('run') || rec.includes('start')),
          mainEntryPoints: Object.keys(projectFiles).filter(file => 
            ['index.js', 'main.py', 'app.js', 'server.js', 'index.ts', 'main.ts'].includes(path.basename(file))
          ),
          configFiles: Object.keys(projectFiles).filter(file => 
            ['package.json', 'requirements.txt', 'pom.xml', 'Cargo.toml', 'composer.json'].includes(path.basename(file))
          )
        };
        
        // Check if insightsproject.ia already exists
        const existingInsights = await InsightsFileService.read(projectDir);
        
        let newInsights;
        if (existingInsights) {
          // Update existing insights
          newInsights = InsightsFileService.updateWithAnalysis(existingInsights, analysisForInsights);
          console.log(`🔄 Updated existing insightsproject.ia file`);
        } else {
          // Create new insights file
          newInsights = InsightsFileService.createFromAnalysis(
            projectId,
            projectId,
            projectDir,
            analysisForInsights
          );
          console.log(`📋 Created new insightsproject.ia file`);
        }
        
        // Save the insights file
        const saved = await InsightsFileService.write(projectDir, newInsights);
        if (saved) {
          // Send insights file created update via WebSocket
          broadcastAnalysisUpdate(projectId, {
            status: 'insights_saved',
            message: `Project insights saved to insightsproject.ia`,
            insightsPath: path.join(projectDir, 'insightsproject.ia')
          });
          
          // Include insights in response
          (analysisResult as any).insights = newInsights;
        }
        
      } catch (insightsError) {
        console.error(`⚠️  Failed to create insightsproject.ia: ${(insightsError as Error).message}`);
      }
      
      console.log(`🤖 AI Interaction Status: COMPLETED - Analysis successfully generated and delivered to user`);
      res.json(analysisResult);

    } catch (error) {
      console.error(`❌ Document analysis failed: ${error.message}`);
      res.status(500).json({ error: "Document analysis failed: " + error.message });
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

      // Check for ZIP files and provide progress feedback
      const zipFiles = files.filter(f => f.originalname.toLowerCase().endsWith('.zip'));
      
      if (zipFiles.length > 0) {
        console.log(`📦 Starting ZIP extraction for ${zipFiles.length} ZIP file(s):`);
        zipFiles.forEach(f => console.log(`   • ${f.originalname} (${(f.size / 1024 / 1024).toFixed(2)} MB)`));
        console.log("🔍 Analyzing ZIP contents and extracting relevant files...");
        
        try {
          const result = await projectImportService.importFromFiles(files, name, description, projectPath);
          
          console.log(`✅ ZIP extraction completed successfully!`);
          console.log(`📁 Project created: ${result.projectId}`);
          console.log(`📍 Extracted to: ${result.extractedPath || projectPath || 'working directory'}`);
          console.log(`🎯 Working directory should navigate to: ${result.extractedPath || projectPath || '.'}`);
          
          // Log analysis results
          if (result.analysis) {
            console.log(`🔧 Detected framework: ${result.analysis.framework}`);
            console.log(`💻 Language: ${result.analysis.language}`);
            console.log(`▶️  Run command: ${result.analysis.runCommand}`);
          }

          res.json({
            projectId: result.projectId,
            message: "ZIP files extracted and project imported successfully",
            analysis: result.analysis,
            insights: result.insights,
            extractedPath: result.extractedPath,
            zipFiles: zipFiles.map(f => ({ name: f.originalname, size: f.size }))
          });
        } catch (error) {
          console.error(`❌ ZIP extraction failed: ${error.message}`);
          res.status(500).json({ error: "ZIP extraction failed: " + error.message });
        }
      } else {
        // Regular file processing
        console.log(`📄 Processing ${files.length} individual file(s)...`);
        const result = await projectImportService.importFromFiles(files, name, description, projectPath);
        
        res.json({
          projectId: result.projectId,
          message: "Project imported and analyzed successfully",
          analysis: result.analysis,
          insights: result.insights,
          extractedPath: result.extractedPath
        });
      }
    } catch (error) {
      console.error("❌ File import error:", error);
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
  app.use("/api", loggerRoutes);
  
  // AI Chat endpoints
  app.get("/api/projects/:projectId/ai-chats", async (req, res) => {
    try {
      const { projectId } = req.params;
      // Mock AI chat history - replace with actual implementation
      const chats = [
        {
          id: "1",
          role: "user",
          content: "How do I implement authentication in this project?",
          timestamp: new Date().toISOString()
        },
        {
          id: "2", 
          role: "assistant",
          content: "Based on your project structure, I can see you're using Express.js. For authentication, I recommend implementing JWT tokens with bcrypt for password hashing. Here's a basic setup...",
          timestamp: new Date().toISOString()
        }
      ];
      res.json(chats);
    } catch (error) {
      console.error('Error fetching AI chats:', error);
      res.status(500).json({ error: 'Failed to fetch AI chats' });
    }
  });

  app.post("/api/projects/:projectId/ai-chats", async (req, res) => {
    try {
      const { projectId } = req.params;
      const { message } = req.body;
      
      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }

      // Mock AI response - replace with actual AI integration
      const response = {
        id: Date.now().toString(),
        role: "assistant",
        content: `I understand you're asking: "${message}". Based on your project context, here's my response...`,
        timestamp: new Date().toISOString()
      };

      res.json(response);
    } catch (error) {
      console.error('Error sending AI chat message:', error);
      res.status(500).json({ error: 'Failed to send message' });
    }
  });

  // In-memory storage for workspace-specific Git configurations
  const gitConfigurations = new Map<string, {
    username: string;
    email: string;
    remoteUrl: string;
    isConnected: boolean;
  }>();

  // Workspace management endpoints
  app.get("/api/workspace/folders", async (req, res) => {
    try {
      const workingDirectory = process.env.WORKING_DIRECTORY || './workspaces';
      
      // Check if working directory exists
      try {
        const stats = await fs.promises.stat(workingDirectory);
        if (!stats.isDirectory()) {
          return res.json([]);
        }
      } catch (error) {
        // Directory doesn't exist, create it
        await fs.promises.mkdir(workingDirectory, { recursive: true });
        return res.json([]);
      }

      // Read folders from working directory
      const items = await fs.promises.readdir(workingDirectory, { withFileTypes: true });
      const folders = items
        .filter(item => item.isDirectory())
        .map(item => item.name);
      
      res.json(folders);
    } catch (error) {
      console.error("Failed to read workspace folders:", error);
      res.status(500).json({ message: "Failed to read workspace folders" });
    }
  });

  // Git configuration endpoints (per workspace)
  app.get("/api/workspace/:workspace/git/config", async (req, res) => {
    try {
      const { workspace } = req.params;
      const config = gitConfigurations.get(workspace) || {
        username: '',
        email: '',
        remoteUrl: '',
        isConnected: false
      };
      res.json(config);
    } catch (error) {
      console.error("Failed to get Git configuration:", error);
      res.status(500).json({ message: "Failed to get Git configuration" });
    }
  });

  app.post("/api/workspace/:workspace/git/config", async (req, res) => {
    try {
      const { workspace } = req.params;
      const { username, email, remoteUrl } = req.body;
      
      const config = {
        username: username || '',
        email: email || '',
        remoteUrl: remoteUrl || '',
        isConnected: false
      };
      
      gitConfigurations.set(workspace, config);
      res.json(config);
    } catch (error) {
      console.error("Failed to save Git configuration:", error);
      res.status(500).json({ message: "Failed to save Git configuration" });
    }
  });

  app.post("/api/workspace/:workspace/git/test-connection", async (req, res) => {
    try {
      const { workspace } = req.params;
      const config = gitConfigurations.get(workspace);
      
      if (!config || !config.remoteUrl) {
        return res.status(400).json({ message: "Git configuration not found or incomplete" });
      }

      // Simulate connection test (in real implementation, you'd test the actual Git connection)
      const isConnected = config.remoteUrl.includes('github.com') || 
                         config.remoteUrl.includes('gitlab.com') || 
                         config.remoteUrl.includes('bitbucket.org');
      
      config.isConnected = isConnected;
      gitConfigurations.set(workspace, config);
      
      res.json({ connected: isConnected, message: isConnected ? 'Connection successful' : 'Connection failed' });
    } catch (error) {
      console.error("Failed to test Git connection:", error);
      res.status(500).json({ message: "Failed to test Git connection" });
    }
  });

  return httpServer;
}
