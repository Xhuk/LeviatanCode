import { aiRouter } from "./aiRouterPro";

export interface ArtifactPattern {
  id: string;
  name: string;
  category: string;
  description: string;
  implementation: {
    files: Record<string, string>;
    dependencies: string[];
    structure: string;
    keyFeatures: string[];
  };
  usage: {
    examples: string[];
    installationSteps: string[];
    configurationNotes: string[];
  };
  metadata: {
    complexity: 'simple' | 'medium' | 'complex';
    frameworks: string[];
    lastAnalyzed: Date;
    usageCount: number;
  };
}

export interface AnalysisRequest {
  type: 'component' | 'feature' | 'pattern' | 'full-app';
  name: string;
  description?: string;
  referenceArtifact?: string; // "like dailycalendar" or "similar to dashboard"
}

class ArtifactAnalyzer {
  private patterns: Map<string, ArtifactPattern> = new Map();
  private analysisHistory: Array<{
    request: AnalysisRequest;
    result: ArtifactPattern;
    timestamp: Date;
  }> = [];

  constructor() {
    this.loadExistingPatterns();
  }

  /**
   * Analyze and store implementation patterns from existing code
   */
  async analyzeImplementation(files: Record<string, string>, metadata: {
    name: string;
    category: string;
    description: string;
  }): Promise<ArtifactPattern> {
    const analysisPrompt = `
    Analyze this implementation and create a reusable pattern template:

    Name: ${metadata.name}
    Category: ${metadata.category}  
    Description: ${metadata.description}

    Files:
    ${Object.entries(files).map(([path, content]) => `
    === ${path} ===
    ${content}
    `).join('\n')}

    Please provide:
    1. Key architectural patterns and design decisions
    2. Reusable code structures and components
    3. Dependencies and installation requirements
    4. Configuration and setup steps
    5. Usage examples and best practices
    6. Complexity assessment and framework dependencies

    Format as detailed implementation guide for future reference.
    `;

    const routing = await aiRouter.routeRequest(analysisPrompt, {
      maxBudgetUSD: 0.05, // Higher budget for complex analysis
      forceComplexity: 'complex'
    });

    const analysis = await aiRouter.executeRequest(analysisPrompt, {
      maxBudgetUSD: 0.05,
      forceComplexity: 'complex'
    });

    // Extract patterns from AI analysis
    const pattern: ArtifactPattern = {
      id: `pattern-${Date.now()}`,
      name: metadata.name,
      category: metadata.category,
      description: metadata.description,
      implementation: {
        files,
        dependencies: this.extractDependencies(files),
        structure: this.analyzeStructure(files),
        keyFeatures: this.extractKeyFeatures(analysis.response)
      },
      usage: {
        examples: this.extractExamples(analysis.response),
        installationSteps: this.extractInstallSteps(analysis.response),
        configurationNotes: this.extractConfigNotes(analysis.response)
      },
      metadata: {
        complexity: this.assessComplexity(files),
        frameworks: this.detectFrameworks(files),
        lastAnalyzed: new Date(),
        usageCount: 0
      }
    };

    // Store pattern for future use
    this.patterns.set(pattern.id, pattern);
    this.savePatterns();

    return pattern;
  }

  /**
   * Find similar patterns based on request
   */
  async findSimilarPatterns(request: AnalysisRequest): Promise<ArtifactPattern[]> {
    const candidates: ArtifactPattern[] = [];

    // Direct reference match (e.g., "like dailycalendar")
    if (request.referenceArtifact) {
      const reference = this.findPatternByName(request.referenceArtifact);
      if (reference) {
        candidates.push(reference);
      }
    }

    // Category match
    const categoryMatches = Array.from(this.patterns.values())
      .filter(p => p.category.toLowerCase().includes(request.type.toLowerCase()));
    candidates.push(...categoryMatches);

    // Semantic similarity using AI
    if (candidates.length === 0) {
      const similarityPrompt = `
      Find patterns similar to: "${request.name} - ${request.description || ''}"
      
      Available patterns:
      ${Array.from(this.patterns.values()).map(p => 
        `${p.name} (${p.category}): ${p.description}`
      ).join('\n')}
      
      Return the most relevant pattern names (up to 3).
      `;

      const routing = await aiRouter.routeRequest(similarityPrompt, {
        maxBudgetUSD: 0.01,
        forceComplexity: 'simple'
      });

      const similarity = await aiRouter.executeRequest(similarityPrompt, {
        maxBudgetUSD: 0.01,
        forceComplexity: 'simple'
      });

      // Parse AI response to find matching patterns
      const suggestedNames = this.parseSimilarityResponse(similarity.response);
      for (const name of suggestedNames) {
        const pattern = this.findPatternByName(name);
        if (pattern) candidates.push(pattern);
      }
    }

    return candidates.slice(0, 3); // Return top 3 matches
  }

  /**
   * Generate implementation based on reference patterns
   */
  async generateFromPattern(request: AnalysisRequest, referencePatterns: ArtifactPattern[]): Promise<{
    files: Record<string, string>;
    instructions: string;
    dependencies: string[];
  }> {
    const generationPrompt = `
    Create a ${request.type} called "${request.name}" ${request.description ? `(${request.description})` : ''}
    
    Base it on these reference patterns:
    ${referencePatterns.map(p => `
    === ${p.name} Pattern ===
    Category: ${p.category}
    Key Features: ${p.implementation.keyFeatures.join(', ')}
    Structure: ${p.implementation.structure}
    Dependencies: ${p.implementation.dependencies.join(', ')}
    
    Example Files:
    ${Object.entries(p.implementation.files).slice(0, 2).map(([path, content]) => `
    ${path}:
    ${content.substring(0, 500)}...
    `).join('')}
    `).join('\n')}
    
    Generate:
    1. Complete file implementations adapted for "${request.name}"
    2. Installation and setup instructions
    3. Required dependencies list
    4. Configuration notes
    
    Follow the same patterns but customize for the new requirements.
    `;

    const routing = await aiRouter.routeRequest(generationPrompt, {
      maxBudgetUSD: 0.08, // Higher budget for generation
      forceComplexity: 'complex'
    });

    const generation = await aiRouter.executeRequest(generationPrompt, {
      maxBudgetUSD: 0.08,
      forceComplexity: 'complex'
    });

    // Parse generated content
    const result = this.parseGenerationResponse(generation.response);
    
    // Update usage count for referenced patterns
    referencePatterns.forEach(p => {
      p.metadata.usageCount++;
      this.patterns.set(p.id, p);
    });
    this.savePatterns();

    // Store analysis history
    this.analysisHistory.push({
      request,
      result: referencePatterns[0], // Primary reference
      timestamp: new Date()
    });

    return result;
  }

  /**
   * Analyze existing project components and store as patterns
   */
  async analyzeProjectComponents(projectPath: string): Promise<ArtifactPattern[]> {
    try {
      // Get project file structure
      const response = await fetch(`/api/workspace/file-tree/${projectPath}`);
      const fileTree = await response.json();
      
      const patterns: ArtifactPattern[] = [];
      
      // Analyze key components
      const componentPaths = this.findComponentPaths(fileTree);
      
      for (const componentPath of componentPaths) {
        try {
          const fileResponse = await fetch(`/api/workspace/file-content`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: componentPath })
          });
          
          if (fileResponse.ok) {
            const fileContent = await fileResponse.text();
            const componentName = componentPath.split('/').pop()?.replace(/\.(tsx?|jsx?)$/, '') || 'Unknown';
            
            const pattern = await this.analyzeImplementation(
              { [componentPath]: fileContent },
              {
                name: componentName,
                category: this.categorizeComponent(componentPath),
                description: `Auto-analyzed from ${componentPath}`
              }
            );
            
            patterns.push(pattern);
          }
        } catch (error) {
          console.warn(`Failed to analyze ${componentPath}:`, error);
        }
      }
      
      return patterns;
    } catch (error) {
      console.error('Failed to analyze project components:', error);
      return [];
    }
  }

  // Helper methods
  private extractDependencies(files: Record<string, string>): string[] {
    const deps = new Set<string>();
    Object.values(files).forEach(content => {
      const imports = content.match(/from ['"]([^'"]+)['"]/g) || [];
      imports.forEach(imp => {
        const dep = imp.match(/from ['"]([^'"]+)['"]/)?.[1];
        if (dep && !dep.startsWith('.') && !dep.startsWith('/')) {
          deps.add(dep);
        }
      });
    });
    return Array.from(deps);
  }

  private analyzeStructure(files: Record<string, string>): string {
    const paths = Object.keys(files);
    return paths.map(p => p.replace(/^.*\//, '')).join(', ');
  }

  private assessComplexity(files: Record<string, string>): 'simple' | 'medium' | 'complex' {
    const totalLines = Object.values(files).reduce((sum, content) => sum + content.split('\n').length, 0);
    const fileCount = Object.keys(files).length;
    
    if (totalLines > 1000 || fileCount > 10) return 'complex';
    if (totalLines > 300 || fileCount > 3) return 'medium';
    return 'simple';
  }

  private detectFrameworks(files: Record<string, string>): string[] {
    const frameworks = new Set<string>();
    const content = Object.values(files).join('\n');
    
    if (content.includes('react')) frameworks.add('React');
    if (content.includes('vue')) frameworks.add('Vue');
    if (content.includes('angular')) frameworks.add('Angular');
    if (content.includes('tailwind')) frameworks.add('Tailwind CSS');
    if (content.includes('shadcn')) frameworks.add('shadcn/ui');
    
    return Array.from(frameworks);
  }

  private findPatternByName(name: string): ArtifactPattern | undefined {
    return Array.from(this.patterns.values())
      .find(p => p.name.toLowerCase().includes(name.toLowerCase()));
  }

  private findComponentPaths(fileTree: any): string[] {
    const paths: string[] = [];
    
    const traverse = (node: any, currentPath: string = '') => {
      if (node.type === 'file' && /\.(tsx?|jsx?)$/.test(node.name)) {
        paths.push(`${currentPath}/${node.name}`);
      } else if (node.type === 'folder' && node.children) {
        Object.values(node.children).forEach((child: any) => {
          traverse(child, `${currentPath}/${node.name}`);
        });
      }
    };
    
    traverse(fileTree.root);
    return paths.filter(p => p.includes('component') || p.includes('page') || p.includes('panel'));
  }

  private categorizeComponent(path: string): string {
    if (path.includes('component')) return 'component';
    if (path.includes('page')) return 'page';
    if (path.includes('panel')) return 'panel';
    if (path.includes('dialog')) return 'dialog';
    if (path.includes('form')) return 'form';
    return 'utility';
  }

  private extractKeyFeatures(aiResponse: string): string[] {
    // Simple extraction - could be enhanced with better parsing
    const features: string[] = [];
    const lines = aiResponse.split('\n');
    lines.forEach(line => {
      if (line.includes('feature') || line.includes('capability') || line.includes('•')) {
        features.push(line.trim());
      }
    });
    return features.slice(0, 5);
  }

  private extractExamples(aiResponse: string): string[] {
    return ['Usage example extracted from AI analysis']; // Simplified
  }

  private extractInstallSteps(aiResponse: string): string[] {
    return ['Installation steps from AI analysis']; // Simplified
  }

  private extractConfigNotes(aiResponse: string): string[] {
    return ['Configuration notes from AI analysis']; // Simplified
  }

  private parseSimilarityResponse(response: string): string[] {
    // Extract pattern names from AI response
    return response.split('\n')
      .filter(line => line.trim().length > 0)
      .slice(0, 3);
  }

  private parseGenerationResponse(response: string): {
    files: Record<string, string>;
    instructions: string;
    dependencies: string[];
  } {
    // Simplified parsing - would need more sophisticated implementation
    return {
      files: { 'generated.tsx': response },
      instructions: 'Generated based on reference patterns',
      dependencies: ['react', '@/components/ui/button']
    };
  }

  private loadExistingPatterns(): void {
    // Load from localStorage or API
    const stored = localStorage.getItem('artifact-patterns');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        this.patterns = new Map(data.patterns);
        this.analysisHistory = data.history || [];
      } catch (error) {
        console.warn('Failed to load stored patterns:', error);
      }
    }
  }

  private savePatterns(): void {
    try {
      const data = {
        patterns: Array.from(this.patterns.entries()),
        history: this.analysisHistory
      };
      localStorage.setItem('artifact-patterns', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save patterns:', error);
    }
  }

  // Public API methods
  getPatterns(): ArtifactPattern[] {
    return Array.from(this.patterns.values());
  }

  getAnalysisHistory(): Array<{request: AnalysisRequest; result: ArtifactPattern; timestamp: Date}> {
    return this.analysisHistory;
  }

  clearPatterns(): void {
    this.patterns.clear();
    this.analysisHistory = [];
    localStorage.removeItem('artifact-patterns');
  }
}

export const artifactAnalyzer = new ArtifactAnalyzer();