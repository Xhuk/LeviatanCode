import { promises as fs } from "fs";
import path from "path";
import { nanoid } from "nanoid";
import type { ProjectDocumentation } from "@shared/schema";
// import { analyzeCodeWithAI } from "./ai";

interface FileContent {
  path: string;
  content: string;
  type: string;
}

export class ProjectImportService {
  async importFromFiles(files: Express.Multer.File[], projectName: string, description?: string): Promise<{
    projectId: string;
    name: string;
    description?: string;
    files: Record<string, any>;
    documentation: ProjectDocumentation;
  }> {
    const projectId = nanoid();
    const projectFiles: Record<string, any> = {};
    const fileContents: FileContent[] = [];

    // Process uploaded files
    for (const file of files) {
      const fileContent = await fs.readFile(file.path, 'utf-8');
      const relativePath = file.originalname;
      
      projectFiles[relativePath] = {
        content: fileContent,
        language: this.detectLanguage(relativePath),
        size: file.size,
        lastModified: new Date().toISOString(),
      };

      fileContents.push({
        path: relativePath,
        content: fileContent,
        type: this.detectLanguage(relativePath),
      });

      // Clean up temporary file
      await fs.unlink(file.path).catch(() => {});
    }

    // Generate AI documentation
    const documentation = await this.generateDocumentation(fileContents, projectName, description);

    return {
      projectId,
      name: projectName,
      description,
      files: projectFiles,
      documentation,
    };
  }

  async importFromGit(gitUrl: string, projectName: string, description?: string): Promise<{
    projectId: string;
    name: string;
    description?: string;
    files: Record<string, any>;
    documentation: ProjectDocumentation;
  }> {
    // For now, return a mock implementation
    // In a real implementation, you would clone the Git repo and process files
    const projectId = nanoid();
    
    const mockFiles = {
      "README.md": {
        content: `# ${projectName}\n\n${description || "Imported from Git repository"}`,
        language: "markdown",
        size: 100,
        lastModified: new Date().toISOString(),
      },
      "package.json": {
        content: JSON.stringify({
          name: projectName.toLowerCase().replace(/\s+/g, "-"),
          version: "1.0.0",
          description: description || "Imported project",
        }, null, 2),
        language: "json",
        size: 200,
        lastModified: new Date().toISOString(),
      },
    };

    const fileContents: FileContent[] = Object.entries(mockFiles).map(([path, file]) => ({
      path,
      content: file.content,
      type: file.language,
    }));

    const documentation = await this.generateDocumentation(fileContents, projectName, description);

    return {
      projectId,
      name: projectName,
      description,
      files: mockFiles,
      documentation,
    };
  }

  private detectLanguage(filename: string): string {
    const extension = path.extname(filename).toLowerCase();
    const languageMap: Record<string, string> = {
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.py': 'python',
      '.java': 'java',
      '.cpp': 'cpp',
      '.c': 'c',
      '.h': 'c',
      '.css': 'css',
      '.html': 'html',
      '.json': 'json',
      '.md': 'markdown',
      '.txt': 'text',
      '.yml': 'yaml',
      '.yaml': 'yaml',
      '.xml': 'xml',
      '.sql': 'sql',
    };
    return languageMap[extension] || 'text';
  }

  private async generateDocumentation(
    fileContents: FileContent[], 
    projectName: string, 
    description?: string
  ): Promise<ProjectDocumentation> {
    try {
      // Create a comprehensive prompt for AI analysis
      const analysisPrompt = this.createAnalysisPrompt(fileContents, projectName, description);
      
      // Use AI to analyze the project (placeholder for now)
      const aiResponse = "AI analysis placeholder";
      
      // Parse AI response into documentation structure
      return this.parseAIResponse(aiResponse, fileContents);
    } catch (error) {
      console.error("Failed to generate AI documentation:", error);
      // Return basic documentation if AI fails
      return this.createBasicDocumentation(fileContents, projectName, description);
    }
  }

  private createAnalysisPrompt(fileContents: FileContent[], projectName: string, description?: string): string {
    const fileList = fileContents.map(f => `- ${f.path} (${f.type})`).join('\n');
    const codeExamples = fileContents
      .filter(f => ['javascript', 'typescript', 'python', 'java', 'cpp'].includes(f.type))
      .slice(0, 3) // Limit to first 3 code files
      .map(f => `### ${f.path}\n\`\`\`${f.type}\n${f.content.slice(0, 1000)}...\n\`\`\``)
      .join('\n\n');

    return `Analyze this project and generate comprehensive documentation in JSON format.

Project Name: ${projectName}
Description: ${description || "No description provided"}

Files in project:
${fileList}

Code samples:
${codeExamples}

Please provide a JSON response with this exact structure:
{
  "overview": "Brief overview of what this project does",
  "techStack": ["Technology1", "Technology2"],
  "architecture": "Description of the system architecture and patterns",
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
}

Analyze the code structure, dependencies, and patterns to provide accurate technical details.`;
  }

  private parseAIResponse(aiResponse: string, fileContents: FileContent[]): ProjectDocumentation {
    try {
      // Try to extract JSON from AI response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
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
      }
    } catch (error) {
      console.error("Failed to parse AI response:", error);
    }

    // Fallback to basic documentation
    return this.createBasicDocumentation(fileContents, "", "");
  }

  private createBasicDocumentation(
    fileContents: FileContent[], 
    projectName: string, 
    description?: string
  ): ProjectDocumentation {
    // Detect technologies from file extensions
    const techStack = Array.from(new Set(
      fileContents.map(f => f.type).filter(type => type !== 'text')
    ));

    // Identify key files
    const keyFiles: Record<string, string> = {};
    fileContents.forEach(file => {
      if (file.path.includes('package.json')) {
        keyFiles[file.path] = "Package configuration and dependencies";
      } else if (file.path.includes('README')) {
        keyFiles[file.path] = "Project documentation and setup instructions";
      } else if (file.path.includes('index') || file.path.includes('main')) {
        keyFiles[file.path] = "Main application entry point";
      } else if (file.path.includes('config')) {
        keyFiles[file.path] = "Configuration file";
      }
    });

    return {
      overview: description || `A ${projectName} project with ${fileContents.length} files`,
      techStack,
      architecture: "Architecture analysis pending - please regenerate documentation with AI",
      dependencies: [],
      setupInstructions: "Setup instructions not analyzed - please regenerate documentation with AI",
      deploymentInfo: "Deployment information not analyzed - please regenerate documentation with AI",
      apis: [],
      databases: [],
      keyFiles,
      features: [],
      notes: "This documentation was auto-generated. Use AI regeneration for detailed analysis.",
    };
  }
}

export const projectImportService = new ProjectImportService();