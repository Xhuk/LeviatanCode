import * as fs from 'fs';
import * as path from 'path';
import { ProjectInsightsFile } from '../../shared/schema';

/**
 * Service for managing insightsproject.ia files
 * These files store AI analysis context and project metadata for enhanced AI interactions
 */
export class InsightsFileService {
  private static readonly INSIGHTS_FILENAME = 'insightsproject.ia';

  /**
   * Check if an insightsproject.ia file exists in the given directory
   */
  static exists(projectPath: string): boolean {
    try {
      const insightsPath = path.join(projectPath, this.INSIGHTS_FILENAME);
      return fs.existsSync(insightsPath);
    } catch (error) {
      return false;
    }
  }

  /**
   * Read and parse an existing insightsproject.ia file
   */
  static async read(projectPath: string): Promise<ProjectInsightsFile | null> {
    try {
      const insightsPath = path.join(projectPath, this.INSIGHTS_FILENAME);
      
      if (!fs.existsSync(insightsPath)) {
        return null;
      }

      const content = fs.readFileSync(insightsPath, 'utf8');
      const insights: ProjectInsightsFile = JSON.parse(content);
      
      // Validate basic structure
      if (!insights.version || !insights.projectId) {
        console.log(`⚠️  Invalid insightsproject.ia file format in ${projectPath}`);
        return null;
      }

      return insights;
    } catch (error) {
      console.log(`⚠️  Failed to read insightsproject.ia in ${projectPath}: ${(error as Error).message}`);
      return null;
    }
  }

  /**
   * Create or update an insightsproject.ia file with analysis results
   */
  static async write(projectPath: string, insights: ProjectInsightsFile): Promise<boolean> {
    try {
      const insightsPath = path.join(projectPath, this.INSIGHTS_FILENAME);
      
      // Ensure the directory exists
      if (!fs.existsSync(projectPath)) {
        fs.mkdirSync(projectPath, { recursive: true });
      }

      // Update last modified timestamp
      insights.lastModified = new Date().toISOString();

      // Write the insights file with proper formatting
      const content = JSON.stringify(insights, null, 2);
      fs.writeFileSync(insightsPath, content, 'utf8');
      
      console.log(`💾 Created/updated insightsproject.ia in ${projectPath}`);
      return true;
    } catch (error) {
      console.log(`❌ Failed to write insightsproject.ia in ${projectPath}: ${(error as Error).message}`);
      return false;
    }
  }

  /**
   * Create a new insightsproject.ia file from analysis results
   */
  static createFromAnalysis(
    projectId: string,
    projectName: string,
    projectPath: string,
    analysisResults: {
      technologies: string[];
      insights: string[];
      recommendations: string[];
      totalFiles: number;
      totalLinesOfCode: number;
      fileTypes: Record<string, number>;
      frameworks: string[];
      dependencies: Record<string, string>;
      aiSummary: string;
      setupInstructions: string[];
      runCommands: string[];
      mainEntryPoints: string[];
      configFiles: string[];
    }
  ): ProjectInsightsFile {
    const timestamp = new Date().toISOString();
    
    return {
      version: '1.0.0',
      projectId,
      projectName,
      projectPath,
      createdAt: timestamp,
      lastAnalyzed: timestamp,
      lastModified: timestamp,
      
      // Core project metadata
      projectType: this.detectProjectType(analysisResults.technologies, analysisResults.frameworks),
      primaryLanguages: analysisResults.technologies.filter(tech => 
        ['JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust', 'PHP', 'Ruby'].includes(tech)
      ),
      frameworks: analysisResults.frameworks,
      dependencies: analysisResults.dependencies,
      
      // File structure and content analysis
      totalFiles: analysisResults.totalFiles,
      totalLinesOfCode: analysisResults.totalLinesOfCode,
      fileTypes: analysisResults.fileTypes,
      
      // AI analysis results
      aiSummary: analysisResults.aiSummary,
      technologies: analysisResults.technologies,
      insights: analysisResults.insights,
      recommendations: analysisResults.recommendations,
      setupInstructions: analysisResults.setupInstructions,
      runCommands: analysisResults.runCommands,
      
      // Context for AI conversations
      projectContext: this.generateProjectContext(analysisResults),
      previousAnalyses: [{
        timestamp,
        summary: analysisResults.aiSummary,
        changes: ['Initial analysis']
      }],
      
      // Development environment
      workingDirectory: projectPath,
      mainEntryPoints: analysisResults.mainEntryPoints,
      configFiles: analysisResults.configFiles,
      
      // User preferences and notes
      userNotes: '',
      customSettings: {}
    };
  }

  /**
   * Update an existing insightsproject.ia file with new analysis
   */
  static updateWithAnalysis(
    existingInsights: ProjectInsightsFile,
    analysisResults: {
      technologies: string[];
      insights: string[];
      recommendations: string[];
      totalFiles: number;
      totalLinesOfCode: number;
      fileTypes: Record<string, number>;
      frameworks: string[];
      dependencies: Record<string, string>;
      aiSummary: string;
      setupInstructions: string[];
      runCommands: string[];
      mainEntryPoints: string[];
      configFiles: string[];
    }
  ): ProjectInsightsFile {
    const timestamp = new Date().toISOString();
    
    // Detect changes from previous analysis
    const changes: string[] = [];
    if (JSON.stringify(existingInsights.technologies.sort()) !== JSON.stringify(analysisResults.technologies.sort())) {
      changes.push('Technologies detected changed');
    }
    if (existingInsights.totalFiles !== analysisResults.totalFiles) {
      changes.push(`File count changed from ${existingInsights.totalFiles} to ${analysisResults.totalFiles}`);
    }
    if (JSON.stringify(existingInsights.frameworks.sort()) !== JSON.stringify(analysisResults.frameworks.sort())) {
      changes.push('Frameworks detected changed');
    }

    return {
      ...existingInsights,
      lastAnalyzed: timestamp,
      lastModified: timestamp,
      
      // Update with new analysis results
      technologies: analysisResults.technologies,
      insights: analysisResults.insights,
      recommendations: analysisResults.recommendations,
      totalFiles: analysisResults.totalFiles,
      totalLinesOfCode: analysisResults.totalLinesOfCode,
      fileTypes: analysisResults.fileTypes,
      frameworks: analysisResults.frameworks,
      dependencies: analysisResults.dependencies,
      aiSummary: analysisResults.aiSummary,
      setupInstructions: analysisResults.setupInstructions,
      runCommands: analysisResults.runCommands,
      mainEntryPoints: analysisResults.mainEntryPoints,
      configFiles: analysisResults.configFiles,
      
      // Update context
      projectContext: this.generateProjectContext(analysisResults),
      
      // Add to analysis history
      previousAnalyses: [
        {
          timestamp,
          summary: analysisResults.aiSummary,
          changes
        },
        ...existingInsights.previousAnalyses.slice(0, 9) // Keep last 10 analyses
      ]
    };
  }

  /**
   * Detect project type based on technologies and frameworks
   */
  private static detectProjectType(technologies: string[], frameworks: string[]): string {
    if (frameworks.includes('React') || frameworks.includes('Vue.js') || frameworks.includes('Angular')) {
      return 'Frontend Web Application';
    }
    if (frameworks.includes('Express.js') || frameworks.includes('Django') || frameworks.includes('Flask')) {
      return 'Backend Web Application';
    }
    if (technologies.includes('Python')) {
      return 'Python Application';
    }
    if (technologies.includes('Java')) {
      return 'Java Application';
    }
    if (technologies.includes('JavaScript') || technologies.includes('TypeScript')) {
      return 'JavaScript Application';
    }
    return 'General Software Project';
  }

  /**
   * Generate comprehensive project context for AI conversations
   */
  private static generateProjectContext(analysisResults: {
    technologies: string[];
    frameworks: string[];
    aiSummary: string;
    totalFiles: number;
    fileTypes: Record<string, number>;
  }): string {
    const context = [
      `This is a ${analysisResults.technologies.join(', ')} project`,
      analysisResults.frameworks.length > 0 ? `using ${analysisResults.frameworks.join(', ')} frameworks` : '',
      `with ${analysisResults.totalFiles} files`,
      `containing ${Object.entries(analysisResults.fileTypes).map(([ext, count]) => `${count} ${ext} files`).join(', ')}`,
      analysisResults.aiSummary
    ].filter(Boolean).join('. ');
    
    return context;
  }

  /**
   * Get project context for AI chat initialization
   */
  static getAIContext(insights: ProjectInsightsFile): string {
    return `
Project: ${insights.projectName}
Type: ${insights.projectType}
Languages: ${insights.primaryLanguages.join(', ')}
Frameworks: ${insights.frameworks.join(', ')}
Total Files: ${insights.totalFiles}
Lines of Code: ${insights.totalLinesOfCode}

Summary: ${insights.aiSummary}

Context: ${insights.projectContext}

Setup Instructions:
${insights.setupInstructions.map(instruction => `- ${instruction}`).join('\n')}

Run Commands:
${insights.runCommands.map(cmd => `- ${cmd}`).join('\n')}

Recent Changes: ${insights.previousAnalyses[0]?.changes.join(', ') || 'Initial analysis'}

User Notes: ${insights.userNotes || 'None'}
    `.trim();
  }
}