import { eq, and, sql } from "drizzle-orm";
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
  type InsertUser,
  type InsertProject,
  type InsertProjectExecution,
  type InsertAiChat,
  type InsertDocumentation,
  type InsertPromptTemplate,
  type InsertVaultSecret,
  type User,
  type Project,
  type ProjectExecution,
  type AiChat,
  type Documentation,
  type PromptTemplate,
  type VaultSecret
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
  
  // AI-related methods (for backward compatibility)
  getAIChats(projectId: string): Promise<any[]>;
  getProjectInsights(projectId: string): Promise<any>;
  
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
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const newUser = {
      id: randomUUID(),
      ...user,
      createdAt: new Date()
    };
    
    const result = await db.insert(users).values(newUser).returning();
    return result[0];
  }

  // Projects
  async getProject(id: string): Promise<Project | undefined> {
    const result = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
    return result[0];
  }

  async getProjectsByUser(userId: string): Promise<Project[]> {
    return await db.select().from(projects).where(eq(projects.userId, userId));
  }

  async createProject(project: InsertProject): Promise<Project> {
    const newProject = {
      id: randomUUID(),
      ...project,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.insert(projects).values(newProject).returning();
    return result[0];
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project> {
    const result = await db.update(projects)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return result[0];
  }

  async deleteProject(id: string): Promise<void> {
    await db.delete(projects).where(eq(projects.id, id));
  }

  // Project Executions
  async getProjectExecution(id: string): Promise<ProjectExecution | undefined> {
    const result = await db.select().from(projectExecutions).where(eq(projectExecutions.id, id)).limit(1);
    return result[0];
  }

  async getProjectExecutionsByProject(projectId: string): Promise<ProjectExecution[]> {
    return await db.select().from(projectExecutions).where(eq(projectExecutions.projectId, projectId));
  }

  async createProjectExecution(execution: InsertProjectExecution): Promise<ProjectExecution> {
    const newExecution = {
      id: randomUUID(),
      ...execution,
      createdAt: new Date()
    };
    
    const result = await db.insert(projectExecutions).values(newExecution).returning();
    return result[0];
  }

  async updateProjectExecution(id: string, updates: Partial<ProjectExecution>): Promise<ProjectExecution> {
    const result = await db.update(projectExecutions)
      .set(updates)
      .where(eq(projectExecutions.id, id))
      .returning();
    return result[0];
  }

  // AI Chats
  async getAiChat(id: string): Promise<AiChat | undefined> {
    const result = await db.select().from(aiChats).where(eq(aiChats.id, id)).limit(1);
    return result[0];
  }

  async getAiChatsByProject(projectId: string): Promise<AiChat[]> {
    return await db.select().from(aiChats).where(eq(aiChats.projectId, projectId));
  }

  async createAiChat(chat: InsertAiChat): Promise<AiChat> {
    const newChat = {
      id: randomUUID(),
      ...chat,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.insert(aiChats).values(newChat).returning();
    return result[0];
  }

  async updateAiChat(id: string, updates: Partial<AiChat>): Promise<AiChat> {
    const result = await db.update(aiChats)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(aiChats.id, id))
      .returning();
    return result[0];
  }

  // AI-related backward compatibility methods
  async getAIChats(projectId: string): Promise<any[]> {
    return await this.getAiChatsByProject(projectId);
  }

  async getProjectInsights(projectId: string): Promise<any> {
    // Return null for now as insights are stored in files
    return null;
  }

  // Documentation
  async getDocumentation(projectId: string): Promise<Documentation[]> {
    return await db.select().from(documentation).where(eq(documentation.projectId, projectId));
  }

  async createDocumentation(doc: InsertDocumentation): Promise<Documentation> {
    const newDoc = {
      id: randomUUID(),
      ...doc,
      lastUpdated: new Date()
    };
    
    const result = await db.insert(documentation).values(newDoc).returning();
    return result[0];
  }

  async updateDocumentation(id: string, updates: Partial<Documentation>): Promise<Documentation> {
    const result = await db.update(documentation)
      .set({ ...updates, lastUpdated: new Date() })
      .where(eq(documentation.id, id))
      .returning();
    return result[0];
  }

  // Prompt Templates
  async getPromptTemplates(projectId: string): Promise<PromptTemplate[]> {
    return await db.select().from(promptTemplates).where(eq(promptTemplates.projectId, projectId));
  }

  async getPromptTemplate(id: string): Promise<PromptTemplate | undefined> {
    const result = await db.select().from(promptTemplates).where(eq(promptTemplates.id, id)).limit(1);
    return result[0];
  }

  async createPromptTemplate(template: InsertPromptTemplate): Promise<PromptTemplate> {
    const newTemplate = {
      id: randomUUID(),
      ...template,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.insert(promptTemplates).values(newTemplate).returning();
    return result[0];
  }

  async updatePromptTemplate(id: string, updates: Partial<PromptTemplate>): Promise<PromptTemplate> {
    const result = await db.update(promptTemplates)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(promptTemplates.id, id))
      .returning();
    return result[0];
  }

  async deletePromptTemplate(id: string): Promise<void> {
    await db.delete(promptTemplates).where(eq(promptTemplates.id, id));
  }

  async incrementPromptUsage(id: string): Promise<void> {
    await db.update(promptTemplates)
      .set({ usageCount: sql`usage_count + 1` })
      .where(eq(promptTemplates.id, id));
  }

  // Vault Secrets
  async getVaultSecrets(workspace: string): Promise<VaultSecret[]> {
    return await db.select().from(vaultSecrets).where(eq(vaultSecrets.workspace, workspace));
  }

  async getVaultSecret(workspace: string, id: string): Promise<VaultSecret | undefined> {
    const result = await db.select().from(vaultSecrets)
      .where(and(eq(vaultSecrets.workspace, workspace), eq(vaultSecrets.id, id)))
      .limit(1);
    return result[0];
  }

  async createVaultSecret(secret: InsertVaultSecret): Promise<VaultSecret> {
    const newSecret = {
      id: randomUUID(),
      ...secret,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.insert(vaultSecrets).values(newSecret).returning();
    return result[0];
  }

  async updateVaultSecret(workspace: string, id: string, updates: Partial<VaultSecret>): Promise<VaultSecret | undefined> {
    const result = await db.update(vaultSecrets)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(vaultSecrets.workspace, workspace), eq(vaultSecrets.id, id)))
      .returning();
    return result[0];
  }

  async deleteVaultSecret(workspace: string, id: string): Promise<boolean> {
    const result = await db.delete(vaultSecrets)
      .where(and(eq(vaultSecrets.workspace, workspace), eq(vaultSecrets.id, id)))
      .returning();
    return result.length > 0;
  }
}

// Create and export storage instance
export const storage = new DatabaseStorage();