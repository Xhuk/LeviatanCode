import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { aiService } from "./services/ai";
import { scraperService } from "./services/scraper";
import { 
  insertProjectSchema,
  insertScrapingJobSchema,
  insertAiChatSchema,
  insertPromptTemplateSchema,
  type ChatMessage,
  type Project,
  type ScrapingJob,
  type AiChat,
  type PromptTemplate
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

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

  // Scraping jobs
  app.get("/api/projects/:id/scraping-jobs", async (req, res) => {
    try {
      const jobs = await storage.getScrapingJobsByProject(req.params.id);
      res.json(jobs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch scraping jobs" });
    }
  });

  app.post("/api/projects/:id/scraping-jobs", async (req, res) => {
    try {
      const validatedData = insertScrapingJobSchema.parse({
        ...req.body,
        projectId: req.params.id
      });
      const job = await storage.createScrapingJob(validatedData);
      
      // Start scraping asynchronously
      setImmediate(async () => {
        try {
          await storage.updateScrapingJob(job.id, { status: "running" });
          const result = await scraperService.scrapeWebsite(job.url, job.config as any);
          await storage.updateScrapingJob(job.id, { 
            status: "completed", 
            data: result,
            completedAt: new Date()
          });
        } catch (error: any) {
          await storage.updateScrapingJob(job.id, { 
            status: "failed", 
            error: error.message 
          });
        }
      });

      res.json(job);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid scraping job data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create scraping job" });
    }
  });

  app.get("/api/scraping-jobs/:id", async (req, res) => {
    try {
      const job = await storage.getScrapingJob(req.params.id);
      if (!job) {
        return res.status(404).json({ message: "Scraping job not found" });
      }
      res.json(job);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch scraping job" });
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
      
      const aiResponse = await aiService.generateChatResponse(updatedMessages, model);
      
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

  return httpServer;
}
