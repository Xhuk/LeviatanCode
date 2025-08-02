import { nanoid } from "nanoid";
import { storage } from "../storage";
import { aiService } from "./ai";
import type { Project } from "@shared/schema";
import { ProjectInsights, ProjectInsightsSchema, createDefaultInsights } from "@shared/insights-schema";
import * as fs from "fs";
import * as path from "path";
import yauzl from "yauzl";
import { Readable } from "stream";

interface ImportedFile {
  name: string;
  content: string;
  path: string;
  size: number;
}

interface AnalysisResult {
  projectType: string;
  framework: string;
  language: string;
  runCommand: string;
  setupInstructions: string[];
  dependencies: Record<string, string>;
  description: string;
}

class ProjectImportService {
  
  // Extract ZIP files and return file contents
  private async extractZipFile(zipBuffer: Buffer): Promise<ImportedFile[]> {
    return new Promise((resolve, reject) => {
      const extractedFiles: ImportedFile[] = [];
      
      yauzl.fromBuffer(zipBuffer, { lazyEntries: true }, (err, zipfile) => {
        if (err) {
          reject(new Error(`Failed to read ZIP file: ${err.message}`));
          return;
        }
        
        if (!zipfile) {
          reject(new Error('Invalid ZIP file'));
          return;
        }
        
        zipfile.readEntry();
        
        zipfile.on('entry', (entry) => {
          // Skip directories and common build/cache paths
          if (/\/$/.test(entry.fileName)) {
            zipfile.readEntry();
            return;
          }
          
          // Skip large files and unwanted directories
          const skipPaths = [
            'node_modules/', 'dist/', 'build/', 'target/', 'bin/', 'obj/',
            '.git/', '.svn/', '.hg/', '.next/', '.nuxt/', '.cache/',
            'vendor/', 'packages/', 'libs/', '__pycache__/', '.pytest_cache/',
            'coverage/', '.coverage/', '.nyc_output/', 'temp/', 'tmp/',
            '.idea/', '.vscode/', '.vs/'
          ];
          
          const shouldSkip = skipPaths.some(skipPath => 
            entry.fileName.toLowerCase().includes(skipPath.toLowerCase())
          );
          
          if (shouldSkip || entry.uncompressedSize > 5 * 1024 * 1024) { // Skip files > 5MB
            zipfile.readEntry();
            return;
          }
          
          // Only process text files and common code files
          const allowedExtensions = [
            '.js', '.ts', '.jsx', '.tsx', '.vue', '.svelte',
            '.py', '.java', '.c', '.cpp', '.h', '.hpp', '.cs',
            '.php', '.rb', '.go', '.rs', '.swift', '.kt',
            '.html', '.css', '.scss', '.sass', '.less',
            '.json', '.xml', '.yaml', '.yml', '.toml', '.ini',
            '.md', '.txt', '.config', '.env', '.gitignore',
            '.dockerfile', 'Dockerfile', 'Makefile', '.lock'
          ];
          
          const fileExt = path.extname(entry.fileName).toLowerCase();
          const fileName = path.basename(entry.fileName).toLowerCase();
          
          const isAllowedFile = allowedExtensions.includes(fileExt) || 
                               ['dockerfile', 'makefile', 'package.json', 'requirements.txt', 'composer.json', 'cargo.toml', 'go.mod'].includes(fileName);
          
          if (!isAllowedFile) {
            zipfile.readEntry();
            return;
          }
          
          zipfile.openReadStream(entry, (err, readStream) => {
            if (err) {
              console.warn(`Failed to read ${entry.fileName}:`, err);
              zipfile.readEntry();
              return;
            }
            
            if (!readStream) {
              zipfile.readEntry();
              return;
            }
            
            const chunks: Buffer[] = [];
            
            readStream.on('data', (chunk) => {
              chunks.push(chunk);
            });
            
            readStream.on('end', () => {
              try {
                const content = Buffer.concat(chunks).toString('utf8');
                
                extractedFiles.push({
                  name: path.basename(entry.fileName),
                  content: content,
                  path: entry.fileName,
                  size: entry.uncompressedSize
                });
              } catch (error) {
                console.warn(`Failed to decode ${entry.fileName} as UTF-8:`, error);
              }
              
              zipfile.readEntry();
            });
            
            readStream.on('error', (error) => {
              console.warn(`Stream error for ${entry.fileName}:`, error);
              zipfile.readEntry();
            });
          });
        });
        
        zipfile.on('end', () => {
          resolve(extractedFiles);
        });
        
        zipfile.on('error', (error) => {
          reject(new Error(`ZIP processing error: ${error.message}`));
        });
      });
    });
  }

  async importFromFiles(files: any[], projectName: string, description?: string, projectPath?: string): Promise<{ projectId: string; analysis: AnalysisResult; insights: ProjectInsights }> {
    const projectId = nanoid();
    const actualProjectPath = projectPath || process.cwd();
    
    // Process uploaded files - handle ZIP files specially
    let importedFiles: ImportedFile[] = [];
    
    for (const file of files) {
      if (file.originalname.toLowerCase().endsWith('.zip')) {
        console.log(`Extracting ZIP file: ${file.originalname}`);
        try {
          const extractedFiles = await this.extractZipFile(file.buffer);
          importedFiles.push(...extractedFiles);
          console.log(`Extracted ${extractedFiles.length} files from ${file.originalname}`);
        } catch (error) {
          console.error(`Failed to extract ZIP file ${file.originalname}:`, error);
          // Continue with other files
        }
      } else {
        // Regular file processing
        try {
          importedFiles.push({
            name: file.originalname,
            content: file.buffer.toString('utf8'),
            path: file.originalname,
            size: file.size
          });
        } catch (error) {
          console.warn(`Failed to process file ${file.originalname}:`, error);
        }
      }
    }
    
    // Check for existing insightsproject.ia file
    let existingInsights: Partial<ProjectInsights> | null = null;
    const insightsFile = files.find(file => file.originalname === 'insightsproject.ia');
    
    if (insightsFile) {
      try {
        const insightsContent = insightsFile.buffer.toString('utf8');
        existingInsights = JSON.parse(insightsContent);
        console.log("Found existing insightsproject.ia file with project data");
      } catch (error) {
        console.warn("Failed to parse existing insightsproject.ia file:", error);
      }
    }
    
    // Analyze project structure with AI
    const analysis = await this.analyzeProjectStructure(importedFiles);
    
    // Create or update project insights
    const insights = await this.createOrUpdateInsights(
      projectId,
      projectName,
      actualProjectPath,
      description,
      analysis,
      existingInsights,
      "files"
    );
    
    // Create project in storage
    const project: Omit<Project, 'createdAt' | 'updatedAt'> = {
      id: projectId,
      name: projectName,
      description: description || analysis.description,
      userId: "demo-user",
      files: importedFiles as any,
      config: {
        framework: analysis.framework,
        language: analysis.language,
        runCommand: analysis.runCommand,
        dependencies: analysis.dependencies
      },
      documentation: {
        setupInstructions: analysis.setupInstructions.join('\n'),
        architecture: `This is a ${analysis.framework} project using ${analysis.language}.`,
        apiDocs: null,
        deployment: "Run using: " + analysis.runCommand
      }
    };
    
    await storage.createProject(project);
    
    // Save insights file to project root
    await this.saveInsightsFile(actualProjectPath, insights);
    
    return { projectId, analysis, insights };
  }
  
  async importFromGit(gitUrl: string, projectName: string, description?: string, projectPath?: string): Promise<{ projectId: string; analysis: AnalysisResult; insights: ProjectInsights }> {
    // For demo purposes, simulate git clone and analysis
    // In a real implementation, you would use git commands or APIs
    
    const projectId = nanoid();
    const actualProjectPath = projectPath || process.cwd();
    
    // Simulate common project files based on Git URL patterns
    const mockFiles = this.generateMockFilesFromGitUrl(gitUrl);
    const analysis = await this.analyzeProjectStructure(mockFiles);
    
    // Create project insights
    const insights = await this.createOrUpdateInsights(
      projectId,
      projectName,
      actualProjectPath,
      description,
      analysis,
      null,
      "git",
      gitUrl
    );
    
    const project: Omit<Project, 'createdAt' | 'updatedAt'> = {
      id: projectId,
      name: projectName,
      description: description || analysis.description,
      userId: "demo-user",
      files: mockFiles as any,
      config: {
        framework: analysis.framework,
        language: analysis.language,
        runCommand: analysis.runCommand,
        dependencies: analysis.dependencies,
        gitUrl: gitUrl
      },
      documentation: {
        setupInstructions: [
          `git clone ${gitUrl}`,
          "cd " + projectName.toLowerCase().replace(/\s+/g, '-'),
          ...analysis.setupInstructions
        ].join('\n'),
        architecture: `This is a ${analysis.framework} project cloned from ${gitUrl}.`,
        apiDocs: null,
        deployment: "Run using: " + analysis.runCommand
      }
    };
    
    await storage.createProject(project);
    
    // Save insights file to project root
    await this.saveInsightsFile(actualProjectPath, insights);
    
    return { projectId, analysis, insights };
  }
  
  private async analyzeProjectStructure(files: ImportedFile[]): Promise<AnalysisResult> {
    // Analyze file structure to determine project type
    const fileNames = files.map(f => f.name.toLowerCase());
    const hasPackageJson = fileNames.some(name => name.includes('package.json'));
    const hasRequirementsTxt = fileNames.some(name => name.includes('requirements.txt'));
    const hasPomXml = fileNames.some(name => name.includes('pom.xml'));
    const hasCargoToml = fileNames.some(name => name.includes('cargo.toml'));
    const hasGoMod = fileNames.some(name => name.includes('go.mod'));
    
    // Determine language and framework
    let language = "Unknown";
    let framework = "Unknown";
    let runCommand = "echo 'Run command not detected'";
    let setupInstructions: string[] = [];
    let dependencies: Record<string, string> = {};
    
    if (hasPackageJson) {
      language = "JavaScript/TypeScript";
      const packageFile = files.find(f => f.name.toLowerCase().includes('package.json'));
      if (packageFile) {
        try {
          const packageData = JSON.parse(packageFile.content);
          dependencies = packageData.dependencies || {};
          
          // Detect framework
          if (packageData.dependencies?.react || packageData.devDependencies?.react) {
            framework = "React";
            runCommand = packageData.scripts?.dev || packageData.scripts?.start || "npm start";
          } else if (packageData.dependencies?.vue || packageData.devDependencies?.vue) {
            framework = "Vue.js";
            runCommand = packageData.scripts?.dev || packageData.scripts?.serve || "npm run dev";
          } else if (packageData.dependencies?.next || packageData.devDependencies?.next) {
            framework = "Next.js";
            runCommand = packageData.scripts?.dev || "npm run dev";
          } else if (packageData.dependencies?.express) {
            framework = "Express.js";
            runCommand = packageData.scripts?.start || "node index.js";
          } else {
            framework = "Node.js";
            runCommand = packageData.scripts?.start || "node index.js";
          }
          
          setupInstructions = [
            "npm install",
            runCommand
          ];
        } catch (e) {
          console.error("Error parsing package.json:", e);
        }
      }
    } else if (hasRequirementsTxt) {
      language = "Python";
      framework = "Python Application";
      setupInstructions = [
        "pip install -r requirements.txt",
        "python main.py"
      ];
      runCommand = "python main.py";
      
      const reqFile = files.find(f => f.name.toLowerCase().includes('requirements.txt'));
      if (reqFile) {
        // Parse requirements.txt for basic dependency info
        const lines = reqFile.content.split('\n').filter(line => line.trim());
        lines.forEach(line => {
          const [pkg] = line.split('==');
          if (pkg) dependencies[pkg.trim()] = "latest";
        });
        
        // Detect Python frameworks
        if (reqFile.content.includes('django')) {
          framework = "Django";
          runCommand = "python manage.py runserver";
          setupInstructions = [
            "pip install -r requirements.txt",
            "python manage.py migrate",
            "python manage.py runserver"
          ];
        } else if (reqFile.content.includes('flask')) {
          framework = "Flask";
          runCommand = "flask run";
        }
      }
    } else if (hasPomXml) {
      language = "Java";
      framework = "Maven Project";
      setupInstructions = [
        "mvn clean install",
        "mvn spring-boot:run"
      ];
      runCommand = "mvn spring-boot:run";
    } else if (hasCargoToml) {
      language = "Rust";
      framework = "Cargo Project";
      setupInstructions = [
        "cargo build",
        "cargo run"
      ];
      runCommand = "cargo run";
    } else if (hasGoMod) {
      language = "Go";
      framework = "Go Module";
      setupInstructions = [
        "go mod tidy",
        "go run main.go"
      ];
      runCommand = "go run main.go";
    }
    
    // Use AI to enhance analysis if possible
    try {
      const fileList = files.map(f => `${f.name} (${f.size} bytes)`).join('\n');
      const prompt = `Analyze this project structure and provide insights:

Files:
${fileList}

Current detection:
- Language: ${language}
- Framework: ${framework}
- Run command: ${runCommand}

Please provide a brief project description based on the file structure.`;

      const aiAnalysis = await aiService.generateCompletion(prompt);
      
      return {
        projectType: framework,
        framework,
        language,
        runCommand,
        setupInstructions,
        dependencies,
        description: aiAnalysis || `A ${language} project using ${framework}`
      };
    } catch (error) {
      console.error("AI analysis failed:", error);
      return {
        projectType: framework,
        framework,
        language,
        runCommand,
        setupInstructions,
        dependencies,
        description: `A ${language} project using ${framework}`
      };
    }
  }
  
  private generateMockFilesFromGitUrl(gitUrl: string): ImportedFile[] {
    // Generate realistic mock files based on Git URL patterns
    // This is a simplified demo - real implementation would clone the repo
    
    const repoName = gitUrl.split('/').pop()?.replace('.git', '') || 'project';
    
    if (gitUrl.includes('react') || gitUrl.includes('nextjs') || gitUrl.includes('frontend')) {
      return [
        {
          name: 'package.json',
          content: JSON.stringify({
            name: repoName,
            version: "1.0.0",
            scripts: {
              dev: "next dev",
              build: "next build",
              start: "next start"
            },
            dependencies: {
              react: "^18.0.0",
              "react-dom": "^18.0.0",
              next: "^13.0.0"
            }
          }, null, 2),
          path: 'package.json',
          size: 500
        },
        {
          name: 'README.md',
          content: `# ${repoName}\n\nA React/Next.js application cloned from ${gitUrl}`,
          path: 'README.md',
          size: 100
        }
      ];
    } else if (gitUrl.includes('python') || gitUrl.includes('django') || gitUrl.includes('flask')) {
      return [
        {
          name: 'requirements.txt',
          content: 'django>=4.0\nrequests>=2.28.0\nnumpy>=1.21.0',
          path: 'requirements.txt',
          size: 100
        },
        {
          name: 'main.py',
          content: '# Main Python application\nprint("Hello from imported project!")',
          path: 'main.py',
          size: 80
        },
        {
          name: 'README.md',
          content: `# ${repoName}\n\nA Python application cloned from ${gitUrl}`,
          path: 'README.md',
          size: 100
        }
      ];
    } else {
      // Generic project
      return [
        {
          name: 'README.md',
          content: `# ${repoName}\n\nProject cloned from ${gitUrl}`,
          path: 'README.md',
          size: 80
        },
        {
          name: 'index.js',
          content: 'console.log("Hello from imported project!");',
          path: 'index.js',
          size: 50
        }
      ];
    }
  }

  private async createOrUpdateInsights(
    projectId: string,
    projectName: string,
    projectPath: string,
    description: string | undefined,
    analysis: AnalysisResult,
    existingInsights: Partial<ProjectInsights> | null,
    importedFrom: "files" | "git",
    gitUrl?: string
  ): Promise<ProjectInsights> {
    const baseInsights = createDefaultInsights(projectId, projectName, projectPath, importedFrom);
    
    const insights: ProjectInsights = {
      ...baseInsights,
      ...existingInsights,
      projectId,
      projectName,
      projectPath,
      description: description || existingInsights?.description || analysis.description,
      projectType: analysis.projectType,
      framework: analysis.framework,
      language: analysis.language,
      runCommand: analysis.runCommand,
      dependencies: analysis.dependencies,
      setupInstructions: analysis.setupInstructions,
      configFiles: this.extractConfigFiles(analysis),
      sourceDirectories: this.extractSourceDirectories(analysis),
      architecture: `This is a ${analysis.framework} project using ${analysis.language}.`,
      updatedAt: new Date().toISOString(),
      lastAnalyzed: new Date().toISOString(),
      gitUrl: gitUrl || existingInsights?.gitUrl,
    } as ProjectInsights;

    return insights;
  }

  private async saveInsightsFile(projectPath: string, insights: ProjectInsights): Promise<void> {
    try {
      const insightsFilePath = path.join(projectPath, 'insightsproject.ia');
      const insightsContent = JSON.stringify(insights, null, 2);
      
      // Ensure directory exists
      const dir = path.dirname(insightsFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(insightsFilePath, insightsContent, 'utf8');
      console.log(`Saved project insights to: ${insightsFilePath}`);
    } catch (error) {
      console.error("Failed to save insights file:", error);
      // Don't throw error as this is not critical for import process
    }
  }

  async saveProjectInsights(projectId: string, projectPath: string, updates: Partial<ProjectInsights>): Promise<ProjectInsights> {
    try {
      const insightsFilePath = path.join(projectPath, 'insightsproject.ia');
      let existingInsights: ProjectInsights | null = null;
      
      // Try to load existing insights
      if (fs.existsSync(insightsFilePath)) {
        try {
          const content = fs.readFileSync(insightsFilePath, 'utf8');
          existingInsights = JSON.parse(content);
        } catch (error) {
          console.warn("Failed to parse existing insights file:", error);
        }
      }
      
      // Merge updates with existing insights
      const updatedInsights: ProjectInsights = {
        ...existingInsights,
        ...updates,
        projectId,
        updatedAt: new Date().toISOString(),
      } as ProjectInsights;
      
      // Validate schema
      const validatedInsights = ProjectInsightsSchema.parse(updatedInsights);
      
      // Save to file
      await this.saveInsightsFile(projectPath, validatedInsights);
      
      return validatedInsights;
    } catch (error) {
      console.error("Failed to save project insights:", error);
      throw new Error("Failed to save project insights");
    }
  }

  async loadProjectInsights(projectPath: string): Promise<ProjectInsights | null> {
    try {
      const insightsFilePath = path.join(projectPath, 'insightsproject.ia');
      
      if (!fs.existsSync(insightsFilePath)) {
        return null;
      }
      
      const content = fs.readFileSync(insightsFilePath, 'utf8');
      const insights = JSON.parse(content);
      
      // Validate schema
      return ProjectInsightsSchema.parse(insights);
    } catch (error) {
      console.error("Failed to load project insights:", error);
      return null;
    }
  }

  private extractConfigFiles(analysis: AnalysisResult): string[] {
    const configFiles = [];
    if (analysis.framework.includes('react') || analysis.framework.includes('next')) {
      configFiles.push('package.json', 'tsconfig.json', 'next.config.js');
    }
    if (analysis.language === 'python') {
      configFiles.push('requirements.txt', 'setup.py', 'pyproject.toml');
    }
    if (analysis.language === 'java') {
      configFiles.push('pom.xml', 'build.gradle');
    }
    return configFiles;
  }

  private extractSourceDirectories(analysis: AnalysisResult): string[] {
    const sourceDirs = [];
    if (analysis.framework.includes('react') || analysis.framework.includes('next')) {
      sourceDirs.push('src', 'pages', 'components');
    }
    if (analysis.language === 'python') {
      sourceDirs.push('src', 'app', analysis.projectType);
    }
    if (analysis.language === 'java') {
      sourceDirs.push('src/main/java', 'src/test/java');
    }
    return sourceDirs;
  }
}

export const projectImportService = new ProjectImportService();