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
  getPromptTemplates(projectId:
