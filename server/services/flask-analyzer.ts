import { z } from "zod";

// Flask Analyzer Response Schema
const FlaskAnalysisSchema = z.object({
  success: z.boolean(),
  analysis: z.object({
    timestamp: z.string(),
    project_path: z.string(),
    basic_info: z.object({
      name: z.string(),
      size_bytes: z.number(),
      file_count: z.number(),
      directory_count: z.number(),
      created_date: z.string().nullable(),
      modified_date: z.string().nullable()
    }),
    technologies: z.object({
      primary_language: z.string(),
      languages_detected: z.array(z.string()),
      language_stats: z.record(z.number()),
      file_counts: z.record(z.number()),
      total_code_size: z.number()
    }),
    structure: z.object({
      tree: z.array(z.any()),
      common_directories: z.array(z.string()),
      estimated_project_type: z.string()
    }),
    dependencies: z.record(z.any()),
    frameworks: z.array(z.string()),
    build_systems: z.array(z.string()),
    execution_methods: z.array(z.object({
      type: z.string(),
      command: z.string(),
      description: z.string()
    })),
    code_metrics: z.object({
      total_lines: z.number(),
      code_lines: z.number(),
      comment_lines: z.number(),
      blank_lines: z.number(),
      files_analyzed: z.number(),
      largest_file: z.object({
        path: z.string(),
        lines: z.number()
      }),
      complexity_estimate: z.string()
    }),
    quality_assessment: z.object({
      has_tests: z.boolean(),
      has_documentation: z.boolean(),
      has_ci_cd: z.boolean(),
      has_linting: z.boolean(),
      documentation_coverage: z.string(),
      test_coverage: z.string(),
      quality_score: z.number()
    }),
    recommendations: z.array(z.string()),
    insights: z.object({
      summary: z.string(),
      architecture_analysis: z.string(),
      improvement_suggestions: z.array(z.string()),
      technology_recommendations: z.array(z.string()),
      ai_service_used: z.string().nullable()
    })
  }),
  metadata: z.object({
    analysis_duration: z.string(),
    project_path: z.string().optional(),
    temp_path_used: z.string().optional(),
    original_filename: z.string().optional()
  })
});

export type FlaskAnalysisResult = z.infer<typeof FlaskAnalysisSchema>;

class FlaskAnalyzerService {
  private readonly flaskUrl: string;
  private readonly timeout: number;

  constructor() {
    this.flaskUrl = process.env.FLASK_ANALYZER_URL || 'http://localhost:5001';
    this.timeout = 60000; // 60 seconds timeout
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.flaskUrl}/health`, {
        method: 'GET',
        timeout: 5000
      });
      return response.ok;
    } catch (error) {
      console.warn('Flask analyzer service not available:', error);
      return false;
    }
  }

  async analyzeProjectPath(projectPath: string): Promise<FlaskAnalysisResult | null> {
    try {
      console.log(`🔍 Analyzing project with Flask: ${projectPath}`);
      
      const response = await fetch(`${this.flaskUrl}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ project_path: projectPath }),
        timeout: this.timeout
      });

      if (!response.ok) {
        throw new Error(`Flask analyzer returned ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      const validated = FlaskAnalysisSchema.parse(result);
      
      console.log(`✅ Flask analysis completed for ${projectPath}`);
      console.log(`📊 Quality Score: ${validated.analysis.quality_assessment.quality_score}/10`);
      console.log(`🎯 Primary Language: ${validated.analysis.technologies.primary_language}`);
      console.log(`🏗️ Frameworks: ${validated.analysis.frameworks.join(', ') || 'None detected'}`);
      
      return validated;
    } catch (error) {
      console.error('Flask analyzer error:', error);
      if (error instanceof z.ZodError) {
        console.error('Invalid Flask response format:', error.errors);
      }
      return null;
    }
  }

  async analyzeZipFile(zipBuffer: Buffer, originalFilename: string): Promise<FlaskAnalysisResult | null> {
    try {
      console.log(`🔍 Analyzing ZIP file with Flask: ${originalFilename}`);
      
      // Create FormData for file upload
      const formData = new FormData();
      const blob = new Blob([zipBuffer], { type: 'application/zip' });
      formData.append('file', blob, originalFilename);

      const response = await fetch(`${this.flaskUrl}/analyze`, {
        method: 'POST',
        body: formData,
        timeout: this.timeout
      });

      if (!response.ok) {
        throw new Error(`Flask analyzer returned ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      const validated = FlaskAnalysisSchema.parse(result);
      
      console.log(`✅ Flask analysis completed for ${originalFilename}`);
      console.log(`📊 Quality Score: ${validated.analysis.quality_assessment.quality_score}/10`);
      console.log(`🎯 Primary Language: ${validated.analysis.technologies.primary_language}`);
      console.log(`🏗️ Frameworks: ${validated.analysis.frameworks.join(', ') || 'None detected'}`);
      
      return validated;
    } catch (error) {
      console.error('Flask analyzer error:', error);
      if (error instanceof z.ZodError) {
        console.error('Invalid Flask response format:', error.errors);
      }
      return null;
    }
  }

  // Convert Flask analysis to enhanced project insights
  convertToInsights(flaskResult: FlaskAnalysisResult, existingInsights?: any): any {
    const analysis = flaskResult.analysis;
    
    return {
      // Basic project info
      name: analysis.basic_info.name,
      type: analysis.structure.estimated_project_type,
      language: analysis.technologies.primary_language,
      framework: analysis.frameworks[0] || 'unknown',
      
      // Enhanced from Flask analysis
      qualityScore: analysis.quality_assessment.quality_score,
      complexity: analysis.code_metrics.complexity_estimate,
      technologies: analysis.technologies.languages_detected,
      frameworks: analysis.frameworks,
      buildSystems: analysis.build_systems,
      
      // Execution methods
      runCommands: analysis.execution_methods.map(method => ({
        command: method.command,
        description: method.description,
        type: method.type
      })),
      
      // Code metrics
      codeMetrics: {
        totalLines: analysis.code_metrics.total_lines,
        codeLines: analysis.code_metrics.code_lines,
        filesAnalyzed: analysis.code_metrics.files_analyzed,
        largestFile: analysis.code_metrics.largest_file
      },
      
      // Quality assessment
      quality: {
        hasTests: analysis.quality_assessment.has_tests,
        hasDocumentation: analysis.quality_assessment.has_documentation,
        hasCiCd: analysis.quality_assessment.has_ci_cd,
        hasLinting: analysis.quality_assessment.has_linting,
        score: analysis.quality_assessment.quality_score
      },
      
      // AI insights
      aiInsights: {
        summary: analysis.insights.summary,
        architectureAnalysis: analysis.insights.architecture_analysis,
        improvements: analysis.insights.improvement_suggestions,
        techRecommendations: analysis.insights.technology_recommendations,
        aiService: analysis.insights.ai_service_used
      },
      
      // Recommendations
      recommendations: analysis.recommendations,
      
      // Dependencies
      dependencies: analysis.dependencies,
      
      // Structure info
      projectStructure: {
        type: analysis.structure.estimated_project_type,
        commonDirectories: analysis.structure.common_directories,
        fileCount: analysis.basic_info.file_count
      },
      
      // Flask analysis metadata
      flaskAnalysis: {
        timestamp: analysis.timestamp,
        analysisCompleted: true,
        serviceUsed: 'flask_analyzer'
      },
      
      // Preserve existing insights if any
      ...existingInsights
    };
  }

  // Generate comprehensive project description using Flask analysis
  generateProjectDescription(flaskResult: FlaskAnalysisResult): string {
    const analysis = flaskResult.analysis;
    
    let description = `${analysis.basic_info.name} - `;
    
    if (analysis.technologies.primary_language) {
      description += `${analysis.technologies.primary_language.charAt(0).toUpperCase() + analysis.technologies.primary_language.slice(1)} `;
    }
    
    if (analysis.frameworks.length > 0) {
      description += `${analysis.frameworks[0]} `;
    }
    
    description += `application`;
    
    if (analysis.structure.estimated_project_type !== 'general_project') {
      description += ` (${analysis.structure.estimated_project_type.replace('_', ' ')})`;
    }
    
    description += `. Quality score: ${analysis.quality_assessment.quality_score}/10`;
    
    if (analysis.insights.summary) {
      description += `. ${analysis.insights.summary}`;
    }
    
    return description;
  }

  // Extract setup instructions from Flask analysis
  generateSetupInstructions(flaskResult: FlaskAnalysisResult): string[] {
    const analysis = flaskResult.analysis;
    const instructions: string[] = [];
    
    // Add dependency installation instructions
    if (analysis.dependencies['npm/node']) {
      instructions.push('Run "npm install" to install Node.js dependencies');
    }
    
    if (analysis.dependencies['pip']) {
      instructions.push('Run "pip install -r requirements.txt" to install Python dependencies');
    }
    
    if (analysis.dependencies['maven']) {
      instructions.push('Run "mvn install" to install Maven dependencies');
    }
    
    if (analysis.dependencies['gradle']) {
      instructions.push('Run "./gradlew build" to build the project');
    }
    
    // Add execution instructions
    if (analysis.execution_methods.length > 0) {
      const primaryMethod = analysis.execution_methods[0];
      instructions.push(`Run "${primaryMethod.command}" to start the application`);
    }
    
    // Add recommendations as setup steps
    instructions.push(...analysis.recommendations.slice(0, 3));
    
    return instructions;
  }
}

export const flaskAnalyzerService = new FlaskAnalyzerService();