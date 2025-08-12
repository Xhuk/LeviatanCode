import { 
  type User, 
  type InsertUser, 
  type Project, 
  type InsertProject,
  type ProjectExecution,
  type InsertProjectExecution,
  type AiChat,
  type InsertAiChat,
  type Documentation,
  type InsertDocumentation,
  type PromptTemplate,
  type InsertPromptTemplate,
  type VaultSecret,
  type InsertVaultSecret,
  type ChatMessage,
  type FileSystemItem,
  insertAiUsageLogSchema,
  insertAiCostSummarySchema,
  insertAiBudgetSettingsSchema
} from "@shared/schema";
import { randomUUID } from "crypto";
import { sql } from "drizzle-orm";

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
  
  // Project Executions
  getProjectExecution(id: string): Promise<ProjectExecution | undefined>;
  getProjectExecutionsByProject(projectId: string): Promise<ProjectExecution[]>;
  createProjectExecution(execution: InsertProjectExecution): Promise<ProjectExecution>;
  updateProjectExecution(id: string, updates: Partial<ProjectExecution>): Promise<ProjectExecution>;
  
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
  
  // Vault Secrets
  getVaultSecrets(workspace: string): Promise<VaultSecret[]>;
  getVaultSecret(workspace: string, id: string): Promise<VaultSecret | undefined>;
  createVaultSecret(secret: InsertVaultSecret): Promise<VaultSecret>;
  updateVaultSecret(workspace: string, id: string, updates: Partial<VaultSecret>): Promise<VaultSecret | undefined>;
  deleteVaultSecret(workspace: string, id: string): Promise<boolean>;

  // AI Cost Tracking
  logAiUsage(usage: any): Promise<any>;
  getAiUsageLogs(userId: string, projectId?: string, dateRange?: { start: Date; end: Date }): Promise<any[]>;
  getAiCostSummary(userId: string, period: 'daily' | 'weekly' | 'monthly', projectId?: string): Promise<any>;
  updateAiCostSummary(userId: string, period: 'daily' | 'weekly' | 'monthly', projectId?: string): Promise<any>;
  getBudgetSettings(userId: string): Promise<any>;
  updateBudgetSettings(userId: string, settings: any): Promise<any>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private projects: Map<string, Project> = new Map();
  private projectExecutions: Map<string, ProjectExecution> = new Map();
  private aiChats: Map<string, AiChat> = new Map();
  private documentation: Map<string, Documentation> = new Map();
  private promptTemplates: Map<string, PromptTemplate> = new Map();
  private vaultSecrets: Map<string, VaultSecret> = new Map();
  private aiUsageLogs: Map<string, any> = new Map();
  private aiCostSummaries: Map<string, any> = new Map();
  private aiBudgetSettings: Map<string, any> = new Map();

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

  // Project Executions
  async getProjectExecution(id: string): Promise<ProjectExecution | undefined> {
    return this.projectExecutions.get(id);
  }

  async getProjectExecutionsByProject(projectId: string): Promise<ProjectExecution[]> {
    return Array.from(this.projectExecutions.values()).filter(exec => exec.projectId === projectId);
  }

  async createProjectExecution(insertExecution: InsertProjectExecution): Promise<ProjectExecution> {
    const id = randomUUID();
    const execution: ProjectExecution = {
      ...insertExecution,
      id,
      status: "pending",
      createdAt: new Date(),
      completedAt: null,
      output: null,
      error: null,
      exitCode: null
    };
    this.projectExecutions.set(id, execution);
    return execution;
  }

  async updateProjectExecution(id: string, updates: Partial<ProjectExecution>): Promise<ProjectExecution> {
    const execution = this.projectExecutions.get(id);
    if (!execution) throw new Error("Project execution not found");
    
    const updatedExecution = { ...execution, ...updates };
    this.projectExecutions.set(id, updatedExecution);
    return updatedExecution;
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

  // Vault Secrets
  async getVaultSecrets(workspace: string): Promise<VaultSecret[]> {
    return Array.from(this.vaultSecrets.values()).filter(secret => secret.workspace === workspace);
  }

  async getVaultSecret(workspace: string, id: string): Promise<VaultSecret | undefined> {
    const secret = this.vaultSecrets.get(id);
    return secret && secret.workspace === workspace ? secret : undefined;
  }

  async createVaultSecret(insertSecret: InsertVaultSecret): Promise<VaultSecret> {
    const id = randomUUID();
    const secret: VaultSecret = {
      ...insertSecret,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.vaultSecrets.set(id, secret);
    return secret;
  }

  async updateVaultSecret(workspace: string, id: string, updates: Partial<VaultSecret>): Promise<VaultSecret | undefined> {
    const secret = this.vaultSecrets.get(id);
    if (!secret || secret.workspace !== workspace) {
      return undefined;
    }
    
    const updatedSecret = { 
      ...secret, 
      ...updates, 
      updatedAt: new Date()
    };
    this.vaultSecrets.set(id, updatedSecret);
    return updatedSecret;
  }

  async deleteVaultSecret(workspace: string, id: string): Promise<boolean> {
    const secret = this.vaultSecrets.get(id);
    if (!secret || secret.workspace !== workspace) {
      return false;
    }
    
    return this.vaultSecrets.delete(id);
  }

  // AI Cost Tracking Implementation
  async logAiUsage(usage: any): Promise<any> {
    const id = randomUUID();
    const log = { id, ...usage, timestamp: new Date() };
    this.aiUsageLogs.set(id, log);
    return log;
  }

  async getAiUsageLogs(userId: string, projectId?: string, dateRange?: { start: Date; end: Date }): Promise<any[]> {
    return Array.from(this.aiUsageLogs.values()).filter(log => {
      if (log.userId !== userId) return false;
      if (projectId && log.projectId !== projectId) return false;
      if (dateRange) {
        const logDate = new Date(log.timestamp);
        if (logDate < dateRange.start || logDate > dateRange.end) return false;
      }
      return true;
    });
  }

  async getAiCostSummary(userId: string, period: 'daily' | 'weekly' | 'monthly', projectId?: string): Promise<any> {
    const key = `${userId}-${period}-${projectId || 'all'}`;
    return this.aiCostSummaries.get(key) || null;
  }

  async updateAiCostSummary(userId: string, period: 'daily' | 'weekly' | 'monthly', projectId?: string): Promise<any> {
    const key = `${userId}-${period}-${projectId || 'all'}`;
    const summary = this.aiCostSummaries.get(key) || {
      id: randomUUID(),
      userId,
      projectId,
      period,
      totalRequests: 0,
      totalTokens: 0,
      totalCost: "0.00",
      costByService: {},
      costByModel: {},
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    summary.updatedAt = new Date();
    this.aiCostSummaries.set(key, summary);
    return summary;
  }

  async getBudgetSettings(userId: string): Promise<any> {
    return this.aiBudgetSettings.get(userId) || {
      id: randomUUID(),
      userId,
      dailyLimit: "1.00",
      weeklyLimit: "5.00",
      monthlyLimit: "15.00",
      alertThresholds: { daily: 80, weekly: 80, monthly: 80 },
      budgetResetDay: 1,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  async updateBudgetSettings(userId: string, settings: any): Promise<any> {
    const existing = await this.getBudgetSettings(userId);
    const updated = { ...existing, ...settings, updatedAt: new Date() };
    this.aiBudgetSettings.set(userId, updated);
    return updated;
  }
}

import { db } from "./db";
import { 
  users, 
  projects, 
  projectExecutions, 
  aiChats, 
  messages,
  documentation, 
  promptTemplates, 
  vaultSecrets,
  configurations,
  aiUsageLogs,
  aiCostSummaries,
  aiBudgetSettings
} from "@shared/schema";
import { eq, and } from "drizzle-orm";

export class DbStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  // Projects
  async getProject(id: string): Promise<Project | undefined> {
    const result = await db.select().from(projects).where(eq(projects.id, id));
    return result[0];
  }

  async getProjectsByUser(userId: string): Promise<Project[]> {
    return await db.select().from(projects).where(eq(projects.userId, userId));
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const result = await db.insert(projects).values(insertProject).returning();
    return result[0];
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project> {
    const result = await db
      .update(projects)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    
    if (!result[0]) throw new Error("Project not found");
    return result[0];
  }

  async deleteProject(id: string): Promise<void> {
    await db.delete(projects).where(eq(projects.id, id));
  }

  // Project Executions
  async getProjectExecution(id: string): Promise<ProjectExecution | undefined> {
    const result = await db.select().from(projectExecutions).where(eq(projectExecutions.id, id));
    return result[0];
  }

  async getProjectExecutionsByProject(projectId: string): Promise<ProjectExecution[]> {
    return await db.select().from(projectExecutions).where(eq(projectExecutions.projectId, projectId));
  }

  async createProjectExecution(insertExecution: InsertProjectExecution): Promise<ProjectExecution> {
    const result = await db.insert(projectExecutions).values(insertExecution).returning();
    return result[0];
  }

  async updateProjectExecution(id: string, updates: Partial<ProjectExecution>): Promise<ProjectExecution> {
    const result = await db
      .update(projectExecutions)
      .set(updates)
      .where(eq(projectExecutions.id, id))
      .returning();
    
    if (!result[0]) throw new Error("Project execution not found");
    return result[0];
  }

  // AI Chats
  async getAiChat(id: string): Promise<AiChat | undefined> {
    const result = await db.select().from(aiChats).where(eq(aiChats.id, id));
    return result[0];
  }

  async getAiChatsByProject(projectId: string): Promise<AiChat[]> {
    return await db.select().from(aiChats).where(eq(aiChats.projectId, projectId));
  }

  async createAiChat(insertChat: InsertAiChat): Promise<AiChat> {
    const result = await db.insert(aiChats).values(insertChat).returning();
    return result[0];
  }

  async updateAiChat(id: string, updates: Partial<AiChat>): Promise<AiChat> {
    const result = await db
      .update(aiChats)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(aiChats.id, id))
      .returning();
    
    if (!result[0]) throw new Error("AI chat not found");
    return result[0];
  }

  // Documentation
  async getDocumentation(projectId: string): Promise<Documentation[]> {
    return await db.select().from(documentation).where(eq(documentation.projectId, projectId));
  }

  async createDocumentation(insertDoc: InsertDocumentation): Promise<Documentation> {
    const result = await db.insert(documentation).values(insertDoc).returning();
    return result[0];
  }

  async updateDocumentation(id: string, updates: Partial<Documentation>): Promise<Documentation> {
    const result = await db
      .update(documentation)
      .set({ ...updates, lastUpdated: new Date() })
      .where(eq(documentation.id, id))
      .returning();
    
    if (!result[0]) throw new Error("Documentation not found");
    return result[0];
  }

  // Prompt Templates
  async getPromptTemplates(projectId: string): Promise<PromptTemplate[]> {
    return await db.select().from(promptTemplates).where(eq(promptTemplates.projectId, projectId));
  }

  async getPromptTemplate(id: string): Promise<PromptTemplate | undefined> {
    const result = await db.select().from(promptTemplates).where(eq(promptTemplates.id, id));
    return result[0];
  }

  async createPromptTemplate(insertTemplate: InsertPromptTemplate): Promise<PromptTemplate> {
    const result = await db.insert(promptTemplates).values(insertTemplate).returning();
    return result[0];
  }

  async updatePromptTemplate(id: string, updates: Partial<PromptTemplate>): Promise<PromptTemplate> {
    const result = await db
      .update(promptTemplates)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(promptTemplates.id, id))
      .returning();
    
    if (!result[0]) throw new Error("Prompt template not found");
    return result[0];
  }

  async deletePromptTemplate(id: string): Promise<void> {
    await db.delete(promptTemplates).where(eq(promptTemplates.id, id));
  }

  async incrementPromptUsage(id: string): Promise<void> {
    await db
      .update(promptTemplates)
      .set({ 
        usageCount: sql`${promptTemplates.usageCount} + 1`,
        updatedAt: new Date()
      })
      .where(eq(promptTemplates.id, id));
  }

  // Vault Secrets
  async getVaultSecrets(workspace: string): Promise<VaultSecret[]> {
    return await db.select().from(vaultSecrets).where(eq(vaultSecrets.workspace, workspace));
  }

  async getVaultSecret(workspace: string, id: string): Promise<VaultSecret | undefined> {
    const result = await db
      .select()
      .from(vaultSecrets)
      .where(and(eq(vaultSecrets.workspace, workspace), eq(vaultSecrets.id, id)));
    return result[0];
  }

  async createVaultSecret(insertSecret: InsertVaultSecret): Promise<VaultSecret> {
    const result = await db.insert(vaultSecrets).values(insertSecret).returning();
    return result[0];
  }

  async updateVaultSecret(workspace: string, id: string, updates: Partial<VaultSecret>): Promise<VaultSecret | undefined> {
    const result = await db
      .update(vaultSecrets)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(vaultSecrets.workspace, workspace), eq(vaultSecrets.id, id)))
      .returning();
    
    return result[0];
  }

  async deleteVaultSecret(workspace: string, id: string): Promise<boolean> {
    const result = await db
      .delete(vaultSecrets)
      .where(and(eq(vaultSecrets.workspace, workspace), eq(vaultSecrets.id, id)))
      .returning();
    
    return result.length > 0;
  }

  // AI Cost Tracking Implementation
  async logAiUsage(usage: any): Promise<any> {
    const result = await db.insert(aiUsageLogs).values(usage).returning();
    return result[0];
  }

  async getAiUsageLogs(userId: string, projectId?: string, dateRange?: { start: Date; end: Date }): Promise<any[]> {
    let query = db.select().from(aiUsageLogs).where(eq(aiUsageLogs.userId, userId));
    
    if (projectId) {
      query = query.where(eq(aiUsageLogs.projectId, projectId));
    }
    
    // For date range filtering, we would need more complex where conditions
    // This is a simplified implementation
    return await query;
  }

  async getAiCostSummary(userId: string, period: 'daily' | 'weekly' | 'monthly', projectId?: string): Promise<any> {
    let query = db
      .select()
      .from(aiCostSummaries)
      .where(and(eq(aiCostSummaries.userId, userId), eq(aiCostSummaries.period, period)));
    
    if (projectId) {
      query = query.where(eq(aiCostSummaries.projectId, projectId));
    }
    
    const result = await query;
    return result[0] || null;
  }

  async updateAiCostSummary(userId: string, period: 'daily' | 'weekly' | 'monthly', projectId?: string): Promise<any> {
    const existing = await this.getAiCostSummary(userId, period, projectId);
    
    if (existing) {
      const result = await db
        .update(aiCostSummaries)
        .set({ updatedAt: new Date() })
        .where(eq(aiCostSummaries.id, existing.id))
        .returning();
      return result[0];
    } else {
      const newSummary = {
        userId,
        projectId,
        period,
        periodStart: new Date(),
        periodEnd: new Date(),
        totalRequests: 0,
        totalTokens: 0,
        totalCost: "0.00",
        costByService: {},
        costByModel: {},
        usageStats: {}
      };
      const result = await db.insert(aiCostSummaries).values(newSummary).returning();
      return result[0];
    }
  }

  async getBudgetSettings(userId: string): Promise<any> {
    const result = await db.select().from(aiBudgetSettings).where(eq(aiBudgetSettings.userId, userId));
    return result[0] || {
      userId,
      dailyLimit: "1.00",
      weeklyLimit: "5.00",
      monthlyLimit: "15.00",
      alertThresholds: { daily: 80, weekly: 80, monthly: 80 },
      budgetResetDay: 1,
      isActive: true
    };
  }

  async updateBudgetSettings(userId: string, settings: any): Promise<any> {
    const existing = await this.getBudgetSettings(userId);
    
    if (existing.id) {
      const result = await db
        .update(aiBudgetSettings)
        .set({ ...settings, updatedAt: new Date() })
        .where(eq(aiBudgetSettings.userId, userId))
        .returning();
      return result[0];
    } else {
      const newSettings = { userId, ...settings };
      const result = await db.insert(aiBudgetSettings).values(newSettings).returning();
      return result[0];
    }
  }
}

// Initialize storage based on database availability
async function createStorage(): Promise<IStorage> {
  try {
    const { testDatabaseConnection } = await import("./db");
    await testDatabaseConnection();
    console.log("🗄️  Attempting to use database storage (Supabase)...");
    return new DbStorage();
  } catch (error) {
    console.warn("⚠️  Database connection failed, using memory storage:", error);
    console.log("🧠 Using memory storage (fallback)");
    return new MemStorage();
  }
}

// Export storage promise - will be resolved when needed
export const storagePromise = createStorage();

// Legacy export for immediate use (will be memory storage initially)
export const storage = new MemStorage();
