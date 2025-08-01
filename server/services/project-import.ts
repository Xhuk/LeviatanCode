import { nanoid } from "nanoid";
import { storage } from "../storage";
import { aiService } from "./ai";
import type { Project } from "@shared/schema";

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
  async importFromFiles(files: any[], projectName: string, description?: string): Promise<{ projectId: string; analysis: AnalysisResult }> {
    const projectId = nanoid();
    
    // Process uploaded files
    const importedFiles: ImportedFile[] = files.map(file => ({
      name: file.originalname,
      content: file.buffer.toString('utf8'),
      path: file.originalname,
      size: file.size
    }));
    
    // Analyze project structure with AI
    const analysis = await this.analyzeProjectStructure(importedFiles);
    
    // Create project in storage
    const project: Omit<Project, 'createdAt' | 'updatedAt'> = {
      id: projectId,
      name: projectName,
      description: description || analysis.description,
      userId: "demo-user",
      files: importedFiles,
      config: {
        framework: analysis.framework,
        language: analysis.language,
        runCommand: analysis.runCommand,
        dependencies: analysis.dependencies
      },
      documentation: {
        setupInstructions: analysis.setupInstructions,
        architecture: `This is a ${analysis.framework} project using ${analysis.language}.`,
        apiDocs: null,
        deployment: "Run using: " + analysis.runCommand
      }
    };
    
    await storage.createProject(project);
    
    return { projectId, analysis };
  }
  
  async importFromGit(gitUrl: string, projectName: string, description?: string): Promise<{ projectId: string; analysis: AnalysisResult }> {
    // For demo purposes, simulate git clone and analysis
    // In a real implementation, you would use git commands or APIs
    
    const projectId = nanoid();
    
    // Simulate common project files based on Git URL patterns
    const mockFiles = this.generateMockFilesFromGitUrl(gitUrl);
    const analysis = await this.analyzeProjectStructure(mockFiles);
    
    const project: Omit<Project, 'createdAt' | 'updatedAt'> = {
      id: projectId,
      name: projectName,
      description: description || analysis.description,
      userId: "demo-user",
      files: mockFiles,
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
        ],
        architecture: `This is a ${analysis.framework} project cloned from ${gitUrl}.`,
        apiDocs: null,
        deployment: "Run using: " + analysis.runCommand
      }
    };
    
    await storage.createProject(project);
    
    return { projectId, analysis };
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

      const aiAnalysis = await aiService.generateText(prompt, "gpt-4o");
      
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
}

export const projectImportService = new ProjectImportService();