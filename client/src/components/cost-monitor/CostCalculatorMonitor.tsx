import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Calculator, 
  TrendingUp, 
  AlertTriangle, 
  DollarSign, 
  Zap,
  Brain,
  Settings,
  ChevronUp,
  ChevronDown
} from 'lucide-react';

// AI Model pricing per 1M tokens (in USD)
const AI_PRICING = {
  "gpt-4o": { input: 2.50, output: 10.00, icon: "🤖", color: "text-green-500" },
  "gpt-4o-mini": { input: 0.15, output: 0.60, icon: "🤖", color: "text-green-400" },
  "gemini-pro": { input: 1.25, output: 5.00, icon: "✨", color: "text-blue-500" },
  "gemini-flash": { input: 0.075, output: 0.30, icon: "✨", color: "text-blue-400" },
  "ollama-llama3": { input: 0.00, output: 0.00, icon: "🦙", color: "text-purple-500" }
};

interface UsageStats {
  model: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  timestamp: Date;
  taskType: 'simple' | 'medium' | 'complex';
}

interface BudgetSettings {
  dailyLimit: number;
  weeklyLimit: number;
  monthlyLimit: number;
  warningThreshold: number; // percentage
}

export function CostCalculatorMonitor() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [usageHistory, setUsageHistory] = useState<UsageStats[]>([]);
  const [budgetSettings, setBudgetSettings] = useState<BudgetSettings>({
    dailyLimit: 1.00,
    weeklyLimit: 5.00, 
    monthlyLimit: 15.00,
    warningThreshold: 80
  });
  const [showSettings, setShowSettings] = useState(false);

  // Load usage data from localStorage on mount
  useEffect(() => {
    const savedUsage = localStorage.getItem('ai-usage-history');
    const savedBudget = localStorage.getItem('ai-budget-settings');
    
    if (savedUsage) {
      try {
        const parsed = JSON.parse(savedUsage);
        setUsageHistory(parsed.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        })));
      } catch (e) {
        console.warn('Failed to load usage history:', e);
      }
    }
    
    if (savedBudget) {
      try {
        setBudgetSettings(JSON.parse(savedBudget));
      } catch (e) {
        console.warn('Failed to load budget settings:', e);
      }
    }
  }, []);

  // Save to localStorage when data changes
  useEffect(() => {
    localStorage.setItem('ai-usage-history', JSON.stringify(usageHistory));
  }, [usageHistory]);

  useEffect(() => {
    localStorage.setItem('ai-budget-settings', JSON.stringify(budgetSettings));
  }, [budgetSettings]);

  // Utility functions
  const estimateTokens = (text: string): number => {
    if (!text) return 0;
    return Math.ceil((text.length / 4) * 1.05); // ~4 chars per token
  };

  const calculateCost = (model: string, inputTokens: number, outputTokens: number): number => {
    const pricing = AI_PRICING[model as keyof typeof AI_PRICING];
    if (!pricing) return 0;
    
    const inputCost = (inputTokens / 1_000_000) * pricing.input;
    const outputCost = (outputTokens / 1_000_000) * pricing.output;
    return Number((inputCost + outputCost).toFixed(6));
  };

  const classifyTaskComplexity = (prompt: string): 'simple' | 'medium' | 'complex' => {
    const tokenCount = estimateTokens(prompt);
    const lowerPrompt = prompt.toLowerCase();
    
    const complexKeywords = [
      'architect', 'architecture', 'refactor project', 'microservice',
      'design pattern', 'migrate', 'debug production', 'memory leak',
      'concurrency', 'race condition', 'database schema', 'monorepo'
    ];
    
    const mediumKeywords = [
      'refactor', 'unit test', 'integration test', 'optimize', 'performance',
      'bug', 'error', 'stack trace', 'vite config', 'webpack', 'eslint'
    ];

    if (tokenCount > 8000 || complexKeywords.some(k => lowerPrompt.includes(k))) {
      return 'complex';
    }
    if (tokenCount > 2000 || mediumKeywords.some(k => lowerPrompt.includes(k))) {
      return 'medium';
    }
    return 'simple';
  };

  const recommendModel = (taskType: 'simple' | 'medium' | 'complex', budgetLimit: number): string => {
    const models = taskType === 'complex' 
      ? ['gpt-4o', 'gemini-pro', 'gpt-4o-mini']
      : taskType === 'medium' 
      ? ['gpt-4o-mini', 'gemini-flash', 'gpt-4o']
      : ['gemini-flash', 'gpt-4o-mini', 'ollama-llama3'];
      
    // Find cheapest model within budget
    for (const model of models) {
      const estimatedCost = calculateCost(model, 2000, 800); // Average estimate
      if (estimatedCost <= budgetLimit) return model;
    }
    
    return 'ollama-llama3'; // Fallback to free local model
  };

  // Calculate current usage
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart.getTime() - (todayStart.getDay() * 24 * 60 * 60 * 1000));
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const dailyUsage = usageHistory
    .filter(u => u.timestamp >= todayStart)
    .reduce((sum, u) => sum + u.cost, 0);
    
  const weeklyUsage = usageHistory
    .filter(u => u.timestamp >= weekStart)
    .reduce((sum, u) => sum + u.cost, 0);
    
  const monthlyUsage = usageHistory
    .filter(u => u.timestamp >= monthStart)
    .reduce((sum, u) => sum + u.cost, 0);

  // Calculate percentages
  const dailyPercent = (dailyUsage / budgetSettings.dailyLimit) * 100;
  const weeklyPercent = (weeklyUsage / budgetSettings.weeklyLimit) * 100;
  const monthlyPercent = (monthlyUsage / budgetSettings.monthlyLimit) * 100;

  // Check if over threshold
  const isWarning = dailyPercent > budgetSettings.warningThreshold || 
                   weeklyPercent > budgetSettings.warningThreshold ||
                   monthlyPercent > budgetSettings.warningThreshold;

  // Get model usage breakdown
  const modelBreakdown = Object.keys(AI_PRICING).map(model => {
    const usage = usageHistory.filter(u => u.model === model);
    const totalCost = usage.reduce((sum, u) => sum + u.cost, 0);
    const totalCalls = usage.length;
    return { model, totalCost, totalCalls };
  }).filter(m => m.totalCalls > 0);

  const logUsage = (model: string, inputTokens: number, outputTokens: number, prompt: string) => {
    const cost = calculateCost(model, inputTokens, outputTokens);
    const taskType = classifyTaskComplexity(prompt);
    
    const newUsage: UsageStats = {
      model,
      inputTokens,
      outputTokens,
      cost,
      timestamp: new Date(),
      taskType
    };
    
    setUsageHistory(prev => [...prev.slice(-99), newUsage]); // Keep last 100 entries
  };

  // Expose logUsage to global scope for use by AI services
  useEffect(() => {
    (window as any).logAIUsage = logUsage;
  }, []);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t z-40">
      {/* Collapsed View */}
      <div className="flex items-center justify-between p-2 px-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4" />
            <span className="text-sm font-medium">AI Cost Monitor</span>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">Today:</span>
              <Badge variant={dailyPercent > budgetSettings.warningThreshold ? "destructive" : "secondary"} className="text-xs">
                ${dailyUsage.toFixed(3)}
              </Badge>
            </div>
            
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">Month:</span>
              <Badge variant={monthlyPercent > budgetSettings.warningThreshold ? "destructive" : "secondary"} className="text-xs">
                ${monthlyUsage.toFixed(2)}
              </Badge>
            </div>
            
            {isWarning && (
              <AlertTriangle className="w-4 h-4 text-orange-500" />
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
            className="h-7 px-2"
          >
            <Settings className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-7 px-2"
          >
            {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
          </Button>
        </div>
      </div>

      {/* Expanded View */}
      {isExpanded && (
        <div className="border-t bg-muted/30 p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Daily Usage */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium">Daily Usage</h4>
                  <DollarSign className="w-4 h-4 text-green-500" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>${dailyUsage.toFixed(3)}</span>
                    <span className="text-muted-foreground">/ ${budgetSettings.dailyLimit.toFixed(2)}</span>
                  </div>
                  <Progress value={Math.min(dailyPercent, 100)} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Weekly Usage */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium">Weekly Usage</h4>
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>${weeklyUsage.toFixed(3)}</span>
                    <span className="text-muted-foreground">/ ${budgetSettings.weeklyLimit.toFixed(2)}</span>
                  </div>
                  <Progress value={Math.min(weeklyPercent, 100)} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Monthly Usage */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium">Monthly Usage</h4>
                  <Brain className="w-4 h-4 text-purple-500" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>${monthlyUsage.toFixed(2)}</span>
                    <span className="text-muted-foreground">/ ${budgetSettings.monthlyLimit.toFixed(2)}</span>
                  </div>
                  <Progress value={Math.min(monthlyPercent, 100)} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Model Breakdown */}
          {modelBreakdown.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-2">Model Usage Breakdown</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {modelBreakdown.map(({ model, totalCost, totalCalls }) => {
                  const pricing = AI_PRICING[model as keyof typeof AI_PRICING];
                  return (
                    <div key={model} className="flex items-center gap-2 text-xs p-2 bg-background rounded border">
                      <span className={pricing.color}>{pricing.icon}</span>
                      <div className="flex-1">
                        <div className="font-medium">{model}</div>
                        <div className="text-muted-foreground">{totalCalls} calls • ${totalCost.toFixed(3)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Smart Recommendations */}
          <div className="text-xs text-muted-foreground">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-3 h-3" />
              <span className="font-medium">Smart Recommendations:</span>
            </div>
            <div className="ml-5">
              • For simple tasks: Use {recommendModel('simple', dailyUsage < budgetSettings.dailyLimit * 0.5 ? 0.01 : 0.001)}
              • For debugging: Use {recommendModel('medium', dailyUsage < budgetSettings.dailyLimit * 0.7 ? 0.02 : 0.005)}
              • For architecture: Use {recommendModel('complex', dailyUsage < budgetSettings.dailyLimit * 0.9 ? 0.05 : 0.01)}
            </div>
          </div>
        </div>
      )}

      {/* Budget Settings Modal */}
      {showSettings && (
        <div className="absolute bottom-full left-0 right-0 bg-background border-t border-b p-4 shadow-lg">
          <h4 className="font-medium mb-3">Budget Settings</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Daily Limit ($)</label>
              <input 
                type="number" 
                step="0.01" 
                value={budgetSettings.dailyLimit}
                onChange={(e) => setBudgetSettings(prev => ({ ...prev, dailyLimit: Number(e.target.value) }))}
                className="w-full p-1 border rounded text-xs"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Weekly Limit ($)</label>
              <input 
                type="number" 
                step="0.01" 
                value={budgetSettings.weeklyLimit}
                onChange={(e) => setBudgetSettings(prev => ({ ...prev, weeklyLimit: Number(e.target.value) }))}
                className="w-full p-1 border rounded text-xs"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Monthly Limit ($)</label>
              <input 
                type="number" 
                step="0.01" 
                value={budgetSettings.monthlyLimit}
                onChange={(e) => setBudgetSettings(prev => ({ ...prev, monthlyLimit: Number(e.target.value) }))}
                className="w-full p-1 border rounded text-xs"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Warning at (%)</label>
              <input 
                type="number" 
                value={budgetSettings.warningThreshold}
                onChange={(e) => setBudgetSettings(prev => ({ ...prev, warningThreshold: Number(e.target.value) }))}
                className="w-full p-1 border rounded text-xs"
              />
            </div>
          </div>
          <div className="flex justify-end mt-3">
            <Button variant="outline" size="sm" onClick={() => setShowSettings(false)}>
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}