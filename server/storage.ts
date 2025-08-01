import { 
  type User, 
  type InsertUser, 
  type Project, 
  type InsertProject,
  type ScrapingJob,
  type InsertScrapingJob,
  type AiChat,
  type InsertAiChat,
  type Documentation,
  type InsertDocumentation,
  type PromptTemplate,
  type InsertPromptTemplate,
  type ChatMessage,
  type FileSystemItem
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Projects
  getProject(id: string): Promise<Project | undefined>;
  getProjectsByUser(userId: string): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, updates: Partial<Project>): Promise<Project>;
  deleteProject(id: string): Promise<void>;
  
  // Scraping Jobs
  getScrapingJob(id: string): Promise<ScrapingJob | undefined>;
  getScrapingJobsByProject(projectId: string): Promise<ScrapingJob[]>;
  createScrapingJob(job: InsertScrapingJob): Promise<ScrapingJob>;
  updateScrapingJob(id: string, updates: Partial<ScrapingJob>): Promise<ScrapingJob>;
  
  // AI Chats
  getAiChat(id: string): Promise<AiChat | undefined>;
  getAiChatsByProject(projectId: string): Promise<AiChat[]>;
  createAiChat(chat: InsertAiChat): Promise<AiChat>;
  updateAiChat(id: string, updates: Partial<AiChat>): Promise<AiChat>;
  
  // Documentation
  getDocumentation(projectId: string): Promise<Documentation[]>;
  createDocumentation(doc: InsertDocumentation): Promise<Documentation>;
  updateDocumentation(id: string, updates: Partial<Documentation>): Promise<Documentation>;
  
  // Prompt Templates
  getPromptTemplates(projectId: string): Promise<PromptTemplate[]>;
  getPromptTemplate(id: string): Promise<PromptTemplate | undefined>;
  createPromptTemplate(template: InsertPromptTemplate): Promise<PromptTemplate>;
  updatePromptTemplate(id: string, updates: Partial<PromptTemplate>): Promise<PromptTemplate>;
  deletePromptTemplate(id: string): Promise<void>;
  incrementPromptUsage(id: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private projects: Map<string, Project> = new Map();
  private scrapingJobs: Map<string, ScrapingJob> = new Map();
  private aiChats: Map<string, AiChat> = new Map();
  private documentation: Map<string, Documentation> = new Map();
  private promptTemplates: Map<string, PromptTemplate> = new Map();

  constructor() {
    // Initialize with demo data
    this.initializeDemoData();
  }

  private initializeDemoData() {
    // Create demo user
    const demoUser: User = {
      id: "demo-user-1",
      username: "demo",
      password: "demo123"
    };
    this.users.set(demoUser.id, demoUser);

    // Create demo project
    const demoProject: Project = {
      id: "demo-project-1",
      name: "ProductData_Analysis",
      description: "AI-powered product data scraping and analysis",
      userId: demoUser.id,
      files: {
        "scrapers/linkedin_scraper.py": {
          content: `import time\nimport pandas as pd\nfrom selenium import webdriver\n\ndef scrape_profiles(max_profiles=100):\n    """Scrapes LinkedIn profiles with rate limiting"""\n    driver = webdriver.Chrome()\n    profiles = []\n    \n    for i in range(max_profiles):\n        # Rate limiting\n        time.sleep(2)\n        # Scraping logic here\n        \n    return pd.DataFrame(profiles)`,
          language: "python"
        },
        "scrapers/twitter_api.js": {
          content: `const axios = require('axios');\n\nclass TwitterScraper {\n  constructor(apiKey) {\n    this.apiKey = apiKey;\n  }\n  \n  async scrapeUserData(username) {\n    // Twitter API integration\n    return {};\n  }\n}`,
          language: "javascript"
        },
        "data/product_data.csv": {
          content: "name,price,rating,reviews\nProduct A,29.99,4.5,127\nProduct B,39.99,4.2,89",
          language: "csv"
        },
        "config/settings.json": {
          content: `{\n  "rateLimit": 2000,\n  "maxRetries": 3,\n  "outputFormat": "csv"\n}`,
          language: "json"
        }
      },
      config: {
        theme: "dark",
        aiModel: "gpt-4o",
        autoSave: true
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.projects.set(demoProject.id, demoProject);

    // Create demo prompt templates
    const promptTemplates: PromptTemplate[] = [
      {
        id: "prompt-1",
        projectId: demoProject.id,
        name: "Code Analysis",
        description: "Analyze code quality, performance, and suggest improvements",
        category: "code_analysis",
        promptText: "Analyze the following {{language}} code in file {{fileName}}:\n\n{{codeContent}}\n\nProvide detailed feedback on:\n1. Code quality and style\n2. Performance optimizations\n3. Security considerations\n4. Best practices recommendations\n5. Potential bugs or issues",
        variables: ["language", "fileName", "codeContent"],
        isActive: true,
        isDefault: true,
        usageCount: 15,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "prompt-2",
        projectId: demoProject.id,
        name: "Documentation Generator",
        description: "Generate comprehensive documentation for code files",
        category: "documentation",
        promptText: "Generate documentation for the {{language}} file {{fileName}}:\n\n{{codeContent}}\n\nCreate:\n1. Overview and purpose\n2. Function/class descriptions\n3. Parameter explanations\n4. Usage examples\n5. Return value descriptions\n\nFormat as markdown.",
        variables: ["language", "fileName", "codeContent"],
        isActive: true,
        isDefault: true,
        usageCount: 8,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "prompt-3",
        projectId: demoProject.id,
        name: "Data Analysis",
        description: "Analyze scraped data and provide insights",
        category: "data_analysis",
        promptText: "Analyze the following data from {{dataSource}}:\n\n{{dataContent}}\n\nProvide insights on:\n1. Data patterns and trends\n2. Statistical summary\n3. Data quality assessment\n4. Actionable recommendations\n5. Visualization suggestions",
        variables: ["dataSource", "dataContent"],
        isActive: true,
        isDefault: false,
        usageCount: 5,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "prompt-4",
        projectId: demoProject.id,
        name: "Scraping Strategy",
        description: "Plan and optimize web scraping approaches",
        category: "data_analysis",
        promptText: "Help me develop a scraping strategy for {{targetSite}}:\n\nTarget data: {{targetData}}\nCurrent approach: {{currentApproach}}\n\nProvide:\n1. Optimal scraping methodology\n2. Rate limiting recommendations\n3. Data extraction techniques\n4. Error handling strategies\n5. Legal and ethical considerations",
        variables: ["targetSite", "targetData", "currentApproach"],
        isActive: true,
        isDefault: false,
        usageCount: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    promptTemplates.forEach(template => {
      this.promptTemplates.set(template.id, template);
    });
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Projects
  async getProject(id: string): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async getProjectsByUser(userId: string): Promise<Project[]> {
    return Array.from(this.projects.values()).filter(project => project.userId === userId);
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const id = randomUUID();
    const project: Project = { 
      ...insertProject, 
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.projects.set(id, project);
    return project;
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project> {
    const project = this.projects.get(id);
    if (!project) throw new Error("Project not found");
    
    const updatedProject = { 
      ...project, 
      ...updates, 
      updatedAt: new Date()
    };
    this.projects.set(id, updatedProject);
    return updatedProject;
  }

  async deleteProject(id: string): Promise<void> {
    this.projects.delete(id);
  }

  // Scraping Jobs
  async getScrapingJob(id: string): Promise<ScrapingJob | undefined> {
    return this.scrapingJobs.get(id);
  }

  async getScrapingJobsByProject(projectId: string): Promise<ScrapingJob[]> {
    return Array.from(this.scrapingJobs.values()).filter(job => job.projectId === projectId);
  }

  async createScrapingJob(insertJob: InsertScrapingJob): Promise<ScrapingJob> {
    const id = randomUUID();
    const job: ScrapingJob = {
      ...insertJob,
      id,
      status: "pending",
      createdAt: new Date(),
      completedAt: null,
      data: {},
      error: null
    };
    this.scrapingJobs.set(id, job);
    return job;
  }

  async updateScrapingJob(id: string, updates: Partial<ScrapingJob>): Promise<ScrapingJob> {
    const job = this.scrapingJobs.get(id);
    if (!job) throw new Error("Scraping job not found");
    
    const updatedJob = { ...job, ...updates };
    this.scrapingJobs.set(id, updatedJob);
    return updatedJob;
  }

  // AI Chats
  async getAiChat(id: string): Promise<AiChat | undefined> {
    return this.aiChats.get(id);
  }

  async getAiChatsByProject(projectId: string): Promise<AiChat[]> {
    return Array.from(this.aiChats.values()).filter(chat => chat.projectId === projectId);
  }

  async createAiChat(insertChat: InsertAiChat): Promise<AiChat> {
    const id = randomUUID();
    const chat: AiChat = {
      ...insertChat,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.aiChats.set(id, chat);
    return chat;
  }

  async updateAiChat(id: string, updates: Partial<AiChat>): Promise<AiChat> {
    const chat = this.aiChats.get(id);
    if (!chat) throw new Error("AI chat not found");
    
    const updatedChat = { 
      ...chat, 
      ...updates, 
      updatedAt: new Date()
    };
    this.aiChats.set(id, updatedChat);
    return updatedChat;
  }

  // Documentation
  async getDocumentation(projectId: string): Promise<Documentation[]> {
    return Array.from(this.documentation.values()).filter(doc => doc.projectId === projectId);
  }

  async createDocumentation(insertDoc: InsertDocumentation): Promise<Documentation> {
    const id = randomUUID();
    const doc: Documentation = {
      ...insertDoc,
      id,
      lastUpdated: new Date()
    };
    this.documentation.set(id, doc);
    return doc;
  }

  async updateDocumentation(id: string, updates: Partial<Documentation>): Promise<Documentation> {
    const doc = this.documentation.get(id);
    if (!doc) throw new Error("Documentation not found");
    
    const updatedDoc = { 
      ...doc, 
      ...updates, 
      lastUpdated: new Date()
    };
    this.documentation.set(id, updatedDoc);
    return updatedDoc;
  }

  // Prompt Templates
  async getPromptTemplates(projectId: string): Promise<PromptTemplate[]> {
    return Array.from(this.promptTemplates.values()).filter(template => template.projectId === projectId);
  }

  async getPromptTemplate(id: string): Promise<PromptTemplate | undefined> {
    return this.promptTemplates.get(id);
  }

  async createPromptTemplate(insertTemplate: InsertPromptTemplate): Promise<PromptTemplate> {
    const id = randomUUID();
    const template: PromptTemplate = {
      ...insertTemplate,
      id,
      usageCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.promptTemplates.set(id, template);
    return template;
  }

  async updatePromptTemplate(id: string, updates: Partial<PromptTemplate>): Promise<PromptTemplate> {
    const template = this.promptTemplates.get(id);
    if (!template) throw new Error("Prompt template not found");
    
    const updatedTemplate = { 
      ...template, 
      ...updates, 
      updatedAt: new Date()
    };
    this.promptTemplates.set(id, updatedTemplate);
    return updatedTemplate;
  }

  async deletePromptTemplate(id: string): Promise<void> {
    if (!this.promptTemplates.has(id)) {
      throw new Error("Prompt template not found");
    }
    this.promptTemplates.delete(id);
  }

  async incrementPromptUsage(id: string): Promise<void> {
    const template = this.promptTemplates.get(id);
    if (!template) throw new Error("Prompt template not found");
    
    template.usageCount = (template.usageCount || 0) + 1;
    template.updatedAt = new Date();
    this.promptTemplates.set(id, template);
  }
}

export const storage = new MemStorage();
