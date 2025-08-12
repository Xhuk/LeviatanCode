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
   * Check if Ollama is available for local processing with detailed status
   */
  private async isOllamaAvailable(): Promise<{available: boolean, status: string, needsFallback: boolean}> {
    try {
      // Check if Ollama service is available via our backend
      const response = await fetch('/api/ai/ollama/status', {
        method: 'GET',
        headers: { 'Cache-Control': 'no-cache' }
      });
      
      if (response.ok) {
        const status = await response.json();
        const isConnected = status.status === 'connected';
        const isCrashing = status.failures >= 3 || status.status === 'disconnected';
        
        return {
          available: isConnected,
          status: status.status || 'unknown',
          needsFallback: isCrashing
        };
      }
      
      return {
        available: false,
        status: 'service_unavailable',
        needsFallback: true
      };
    } catch (error) {
      return {
        available: false,
        status: 'network_error',
        needsFallback: true
      };
    }
  }

  /**
   * Choose optimal model based on task complexity, budget, and availability with Ollama crash monitoring
   */
  public async routeRequest(prompt: string, options: RouterOptions = {}): Promise<RouteResult & {ollamaStatus?: any}> {
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
    
    // Check Ollama status with detailed crash monitoring
    const ollamaStatus = await this.isOllamaAvailable();
    
    // Define model preferences by complexity with crash-aware fallback
    const modelCandidates: AIModel[] = (() => {
      // If Ollama is crashing/failed, prioritize ChatGPT models
      if (ollamaStatus.needsFallback) {
        switch (taskComplexity) {
          case 'complex':
            return ['gpt-4o', 'gpt-4o-mini', 'gemini-pro'];
          case 'medium':
            return ['gpt-4o-mini', 'gpt-4o', 'gemini-flash'];
          case 'simple':
          default:
            return ['gpt-4o-mini', 'gemini-flash', 'gpt-4o'];
        }
      }
      
      // If prefer local and Ollama is available, try it first
      if (preferLocal && ollamaStatus.available) {
        return ['ollama-llama3', 'gpt-4o-mini', 'gemini-flash'];
      }
      
      switch (taskComplexity) {
        case 'complex':
          return ['gpt-4o', 'gemini-pro', 'gpt-4o-mini'];
        case 'medium':
          return ['gpt-4o-mini', 'gemini-flash', 'gpt-4o'];
        case 'simple':
        default:
          return ollamaStatus.available 
            ? ['ollama-llama3', 'gemini-flash', 'gpt-4o-mini']
            : ['gpt-4o-mini', 'gemini-flash', 'gpt-4o'];
      }
    })();

    // Find best model within budget
    let chosenModel: AIModel = 'gpt-4o-mini'; // Default fallback to cheapest ChatGPT
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

    // Generate reasoning with Ollama status awareness
    if (chosenModel === 'ollama-llama3') {
      if (ollamaStatus.available) {
        reasoning = 'Using free local Ollama model - no API costs';
      } else {
        reasoning = `Ollama ${ollamaStatus.status}, falling back to ChatGPT`;
        chosenModel = 'gpt-4o-mini'; // Force fallback
        estimatedCost = this.estimateCost({ model: chosenModel, inputTokens });
      }
    } else if (estimatedCost === 0) {
      reasoning = `Free local model selected for ${taskComplexity} task`;
    } else {
      const statusMsg = ollamaStatus.needsFallback ? ' (Ollama crashed, using paid API)' : '';
      reasoning = `${chosenModel} selected for ${taskComplexity} task (est. $${estimatedCost.toFixed(4)})${statusMsg}`;
    }

    // Calculate confidence based on model suitability and Ollama status
    const confidence = (() => {
      let baseConfidence = 0.7;
      
      if (taskComplexity === 'simple' && ['gemini-flash', 'gpt-4o-mini', 'ollama-llama3'].includes(chosenModel)) {
        baseConfidence = 0.9;
      } else if (taskComplexity === 'medium' && ['gpt-4o-mini', 'gemini-flash', 'gpt-4o'].includes(chosenModel)) {
        baseConfidence = 0.85;
      } else if (taskComplexity === 'complex' && ['gpt-4o', 'gemini-pro'].includes(chosenModel)) {
        baseConfidence = 0.9;
      }
      
      // Reduce confidence if Ollama was preferred but is unavailable
      if (preferLocal && !ollamaStatus.available && chosenModel !== 'ollama-llama3') {
        baseConfidence -= 0.1;
      }
      
      return Math.max(0.5, baseConfidence);
    })();

    return {
      model: chosenModel,
      estimatedCost,
      taskComplexity,
      reasoning,
      confidence,
      ollamaStatus
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