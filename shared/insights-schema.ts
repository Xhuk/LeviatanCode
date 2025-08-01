import { z } from "zod";

// Schema for the insightsproject.ia file
export const ProjectInsightsSchema = z.object({
  // Project metadata
  projectId: z.string(),
  projectName: z.string(),
  projectPath: z.string(),
  description: z.string().optional(),
  
  // Analysis results
  projectType: z.string(),
  framework: z.string(),
  language: z.string(),
  runCommand: z.string(),
  buildCommand: z.string().optional(),
  testCommand: z.string().optional(),
  
  // Dependencies and configuration
  dependencies: z.record(z.string()),
  devDependencies: z.record(z.string()).optional(),
  packageManager: z.enum(["npm", "yarn", "pnpm", "bun"]).optional(),
  
  // Setup and deployment
  setupInstructions: z.array(z.string()),
  deploymentNotes: z.string().optional(),
  environmentVariables: z.array(z.string()).optional(),
  
  // File structure insights
  entryPoint: z.string().optional(),
  configFiles: z.array(z.string()),
  sourceDirectories: z.array(z.string()),
  assetDirectories: z.array(z.string()).optional(),
  
  // AI Analysis context
  codeComplexity: z.enum(["low", "medium", "high"]).optional(),
  architecture: z.string().optional(),
  patterns: z.array(z.string()).optional(),
  recommendations: z.array(z.string()).optional(),
  
  // Metadata
  createdAt: z.string(),
  updatedAt: z.string(),
  importedFrom: z.enum(["files", "git"]),
  gitUrl: z.string().optional(),
  lastAnalyzed: z.string().optional(),
});

export type ProjectInsights = z.infer<typeof ProjectInsightsSchema>;

// Default template for new projects
export const createDefaultInsights = (
  projectId: string,
  projectName: string,
  projectPath: string,
  importedFrom: "files" | "git"
): Partial<ProjectInsights> => ({
  projectId,
  projectName,
  projectPath,
  description: "",
  projectType: "unknown",
  framework: "unknown",
  language: "unknown",
  runCommand: "npm start",
  dependencies: {},
  setupInstructions: [],
  configFiles: [],
  sourceDirectories: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  importedFrom,
});