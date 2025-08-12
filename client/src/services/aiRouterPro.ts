// Smart budget-aware AI router with cost estimation and auto-escalation
interface AIModelPricing {
  input: number;  // per 1M tokens
  output: number; // per 1M tokens
}

// Current AI model pricing (USD per 1M tokens)
const AI_PRICING: Record<string, AIModelPricing> = {
  "gpt-4o": { input: 2.50, output: 10.00 },
  "gpt-4o-mini": { input: 0.15, output: 0.60 },
  "gemini-pro": { input: 1.25, output: 5.00 },
  "gemini-flash": { input: 0.075, output: 0.30 },
  "ollama-llama3": { input: 0.00, output: 0.00 } // Local model - free
};

export type TaskComplexity = 'simple' | 'medium' | 'complex';
export type AIModel = keyof typeof AI_PRICING;

interface RouterOptions {
  maxBudgetUSD?: number;
  desiredTemp?: number;
  forceComplexity?: TaskComplexity;
  preferLocal?: boolean; // Prefer Ollama when available
}

interface RouteResult {
  model: AIModel;
  estimatedCost: number;
  taskComplexity: TaskComplexity;
  reasoning: string;
  confidence: number;
  escalated?: boolean;
}

export class AIRouterPro {
  private static instance: AIRouterPro;
  
  public static getInstance(): AIRouterPro {
    if (!AIRouterPro.instance) {
      AIRouterPro.instance = new AIRouterPro();
    }
    return AIRouterPro.instance;
  }

  /**
   * Estimate token count from text (rough approximation)
   */
  public estimateTokens(text: string): number {
    if (!text) return 0;
    // Average ~4 chars per token, with slight bonus for code/formatting
    return Math.ceil((text.length / 4) * 1.05);
  }

  /**
   * Calculate estimated cost for a request
   */
  public estimateCost(options: {
    model: AIModel;
    inputTokens: number;
    outputTokens?: number;
  }): number {
    const { model, inputTokens, outputTokens = 800 } = options;
    const pricing = AI_PRICING[model];
    
    if (!pricing) return Infinity;
    
    const inputCost = (inputTokens / 1_000_000) * pricing.input;
    const outputCost = (outputTokens / 1_000_000) * pricing.output;
    
    return Number((inputCost + outputCost).toFixed(6));
  }

  /**
   * Classify task complexity based on prompt content and length
   */
  public classifyTask(prompt: string): TaskComplexity {
    const tokenCount = this.estimateTokens(prompt);
    const lowerPrompt = prompt.toLowerCase();

    const complexKeywords = [
      'architect', 'architecture', 'refactor project', 'microservice',
      'design pattern', 'migrate', 'debug production', 'memory leak',
      'concurrency', 'race condition', 'database schema', 'monorepo',
      'performance optimization', 'scalability', 'security audit'
    ];

    const mediumKeywords = [
      'refactor', 'unit test', 'integration test', 'optimize', 'performance',
      'bug', 'error', 'stack trace', 'vite config', 'webpack', 'eslint',
      'component', 'hook', 'api integration', 'database query'
    ];

    const hasKeywords = (keywords: string[]) => 
      keywords.some(keyword => lowerPrompt.includes(keyword));

    // Complex tasks: Large prompts or complex keywords
    if (tokenCount > 8000 || hasKeywords(complexKeywords)) {
      return 'complex';
    }
    
    // Medium tasks: Moderate prompts or medium keywords
    if (tokenCount > 2000 || hasKeywords(mediumKeywords)) {
      return 'medium';
    }
    
    // Simple tasks: Short prompts, basic operations
    return 'simple';
  }

  /**
   * Get current usage from cost monitor
   */
  private getCurrentUsage(): { daily: number; weekly: number; monthly: number } {
    try {
      const usageHistory = JSON.parse(localStorage.getItem('ai-usage-history') || '[]');
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(todayStart.getTime() - (todayStart.getDay() * 24 * 60 * 60 * 1000));
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      return {
        daily: usageHistory
          .filter((u: any) => new Date(u.timestamp) >= todayStart)
          .reduce((sum: number, u: any) => sum + u.cost, 0),
        weekly: usageHistory
          .filter((u: any) => new Date(u.timestamp) >= weekStart)
          .reduce((sum: number, u: any) => sum + u.cost, 0),
        monthly: usageHistory
          .filter((u: any) => new Date(u.timestamp) >= monthStart)
          .reduce((sum: number, u: any) => sum + u.cost, 0)
      };
    } catch {
      return { daily: 0, weekly: 0, monthly: 0 };
    }
  }

  /**
   * Get budget limits from cost monitor
   */
  private getBudgetLimits(): { daily: number; weekly: number; monthly: number } {
    try {
      const settings = JSON.parse(localStorage.getItem('ai-budget-settings') || '{}');
      return {
        daily: settings.dailyLimit || 1.00,
        weekly: settings.weeklyLimit || 5.00,
        monthly: settings.monthlyLimit || 15.00
      };
    } catch {
      return { daily: 1.00, weekly: 5.00, monthly: 15.00 };
    }
  }

  /**
   * Check if Ollama is available for local processing
   */
  private async isOllamaAvailable(): Promise<boolean> {
    try {
      // Check if Ollama service is available via our backend
      const response = await fetch('/api/ai/ollama/status');
      if (response.ok) {
        const status = await response.json();
        return status.status === 'connected';
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Choose optimal model based on task complexity, budget, and availability
   */
  public async routeRequest(prompt: string, options: RouterOptions = {}): Promise<RouteResult> {
    const {
      maxBudgetUSD = 0.01,
      forceComplexity,
      preferLocal = false
    } = options;

    const taskComplexity = forceComplexity || this.classifyTask(prompt);
    const inputTokens = this.estimateTokens(prompt);
    const currentUsage = this.getCurrentUsage();
    const budgetLimits = this.getBudgetLimits();
    
    // Check remaining budget
    const remainingDaily = Math.max(0, budgetLimits.daily - currentUsage.daily);
    const remainingWeekly = Math.max(0, budgetLimits.weekly - currentUsage.weekly);
    const remainingMonthly = Math.max(0, budgetLimits.monthly - currentUsage.monthly);
    
    const effectiveBudget = Math.min(maxBudgetUSD, remainingDaily, remainingWeekly, remainingMonthly);
    
    // Check if Ollama is available for free processing
    const ollamaAvailable = await this.isOllamaAvailable();
    
    // Define model preferences by complexity
    const modelCandidates: AIModel[] = (() => {
      if (preferLocal && ollamaAvailable) {
        return ['ollama-llama3', 'gpt-4o-mini', 'gemini-flash'];
      }
      
      switch (taskComplexity) {
        case 'complex':
          return ['gpt-4o', 'gemini-pro', 'gpt-4o-mini'];
        case 'medium':
          return ['gpt-4o-mini', 'gemini-flash', 'gpt-4o'];
        case 'simple':
        default:
          return ollamaAvailable 
            ? ['ollama-llama3', 'gemini-flash', 'gpt-4o-mini']
            : ['gemini-flash', 'gpt-4o-mini', 'gpt-4o'];
      }
    })();

    // Find best model within budget
    let chosenModel: AIModel = 'ollama-llama3'; // Fallback to free local
    let estimatedCost = 0;
    let reasoning = '';

    for (const model of modelCandidates) {
      const cost = this.estimateCost({ model, inputTokens });
      
      if (cost <= effectiveBudget || model === 'ollama-llama3') {
        chosenModel = model;
        estimatedCost = cost;
        break;
      }
    }

    // Generate reasoning
    if (chosenModel === 'ollama-llama3') {
      reasoning = ollamaAvailable 
        ? 'Using free local Ollama model - no API costs'
        : 'Budget exceeded, falling back to local processing';
    } else if (estimatedCost === 0) {
      reasoning = `Free local model selected for ${taskComplexity} task`;
    } else {
      reasoning = `${chosenModel} selected for ${taskComplexity} task (est. $${estimatedCost.toFixed(4)})`;
    }

    // Calculate confidence based on model suitability
    const confidence = (() => {
      if (taskComplexity === 'simple' && ['gemini-flash', 'gpt-4o-mini', 'ollama-llama3'].includes(chosenModel)) {
        return 0.9;
      }
      if (taskComplexity === 'medium' && ['gpt-4o-mini', 'gemini-flash', 'gpt-4o'].includes(chosenModel)) {
        return 0.85;
      }
      if (taskComplexity === 'complex' && ['gpt-4o', 'gemini-pro'].includes(chosenModel)) {
        return 0.9;
      }
      return 0.7; // Suboptimal match
    })();

    return {
      model: chosenModel,
      estimatedCost,
      taskComplexity,
      reasoning,
      confidence
    };
  }

  /**
   * Execute AI request with automatic cost tracking
   */
  public async executeRequest(
    prompt: string, 
    options: RouterOptions = {}
  ): Promise<{
    response: string;
    actualCost: number;
    model: AIModel;
    tokensUsed: { input: number; output: number };
  }> {
    const routing = await this.routeRequest(prompt, options);
    
    let response = '';
    let actualInputTokens = this.estimateTokens(prompt);
    let actualOutputTokens = 0;
    
    try {
      // Route to appropriate AI service based on selected model
      switch (routing.model) {
        case 'ollama-llama3':
          response = await this.callOllama(prompt);
          break;
        case 'gpt-4o':
        case 'gpt-4o-mini':
          response = await this.callOpenAI(prompt, routing.model);
          break;
        case 'gemini-pro':
        case 'gemini-flash':
          response = await this.callGemini(prompt, routing.model);
          break;
        default:
          throw new Error(`Unsupported model: ${routing.model}`);
      }
      
      actualOutputTokens = this.estimateTokens(response);
      
    } catch (error) {
      console.error('AI request failed:', error);
      
      // Try fallback to local Ollama if available
      if (routing.model !== 'ollama-llama3' && await this.isOllamaAvailable()) {
        console.log('Falling back to Ollama...');
        response = await this.callOllama(prompt);
        actualOutputTokens = this.estimateTokens(response);
        routing.model = 'ollama-llama3';
      } else {
        throw error;
      }
    }

    const actualCost = this.estimateCost({
      model: routing.model,
      inputTokens: actualInputTokens,
      outputTokens: actualOutputTokens
    });

    // Log usage to cost monitor
    if ((window as any).logAIUsage) {
      (window as any).logAIUsage(
        routing.model,
        actualInputTokens,
        actualOutputTokens,
        prompt
      );
    }

    return {
      response,
      actualCost,
      model: routing.model,
      tokensUsed: {
        input: actualInputTokens,
        output: actualOutputTokens
      }
    };
  }

  private async callOllama(prompt: string): Promise<string> {
    const response = await fetch('/api/ai/ollama/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        model: 'llama3',
        stream: false
      })
    });
    
    if (!response.ok) {
      throw new Error(`Ollama request failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.response || data.text || '';
  }

  private async callOpenAI(prompt: string, model: string): Promise<string> {
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: prompt }],
        model: model,
        temperature: 0.2
      })
    });
    
    if (!response.ok) {
      throw new Error(`OpenAI request failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.response || data.message?.content || '';
  }

  private async callGemini(prompt: string, model: string): Promise<string> {
    const response = await fetch('/api/ai/gemini/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        model: model === 'gemini-pro' ? 'gemini-1.5-pro' : 'gemini-1.5-flash'
      })
    });
    
    if (!response.ok) {
      throw new Error(`Gemini request failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.response || data.text || '';
  }
}

// Export singleton instance
export const aiRouter = AIRouterPro.getInstance();