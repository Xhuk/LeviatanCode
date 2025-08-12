import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Send, Bot, User, Zap, DollarSign, AlertTriangle, Code, FileText, Search, Bug, Cog } from "lucide-react";
import { aiRouter } from "@/services/aiRouterPro";
import { OllamaCrashConfirmDialog } from "@/components/dialogs/OllamaCrashConfirmDialog";

interface AiChatPanelProps {
  projectId: string;
}

interface AiMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  model?: string;
}

interface AgentStatus {
  status: 'idle' | 'working' | 'creating' | 'reviewing' | 'editing' | 'executing' | 'analyzing' | 'debugging';
  message: string;
  progress?: number;
}

export function AiChatPanel({ projectId }: AiChatPanelProps) {
  const [newMessage, setNewMessage] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [smartRoutingEnabled, setSmartRoutingEnabled] = useState(true);
  const [lastRouting, setLastRouting] = useState<any>(null);
  const [showOllamaCrashDialog, setShowOllamaCrashDialog] = useState(false);
  const [pendingMessage, setPendingMessage] = useState("");
  const [crashDialogData, setCrashDialogData] = useState<any>(null);
  const [agentStatus, setAgentStatus] = useState<AgentStatus>({ status: 'idle', message: '' });

  // Helper function to simulate realistic status updates
  const updateAgentStatus = (status: AgentStatus['status'], message: string, progress?: number) => {
    setAgentStatus({ status, message, progress });
  };

  const getStatusIcon = (status: AgentStatus['status']) => {
    switch (status) {
      case 'working': return <Cog className="w-4 h-4 animate-spin" />;
      case 'creating': return <FileText className="w-4 h-4 animate-pulse" />;
      case 'reviewing': return <Search className="w-4 h-4 animate-pulse" />;
      case 'editing': return <Code className="w-4 h-4 animate-pulse" />;
      case 'executing': return <Zap className="w-4 h-4 animate-pulse" />;
      case 'analyzing': return <Search className="w-4 h-4 animate-pulse" />;
      case 'debugging': return <Bug className="w-4 h-4 animate-pulse" />;
      default: return <Bot className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: AgentStatus['status']) => {
    switch (status) {
      case 'working': return 'text-blue-500';
      case 'creating': return 'text-green-500';
      case 'reviewing': return 'text-yellow-500';
      case 'editing': return 'text-purple-500';
      case 'executing': return 'text-orange-500';
      case 'analyzing': return 'text-cyan-500';
      case 'debugging': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };
  const queryClient = useQueryClient();

  const { data: chatsData = [], isLoading, error } = useQuery<AiMessage[]>({
    queryKey: [`/api/projects/${projectId}/ai-chats`],
  });

  // Ensure chats is always an array
  const chats = Array.isArray(chatsData) ? chatsData : [];

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await fetch(`/api/projects/${projectId}/ai-chats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/ai-chats`] });
      setNewMessage("");
    },
  });

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sendMessageMutation.isPending) return;
    
    if (smartRoutingEnabled) {
      updateAgentStatus('analyzing', 'Checking AI routing options...');
      
      // Check routing first - if Ollama needs fallback, show confirmation dialog
      const routing = await aiRouter.routeRequest(newMessage, {
        maxBudgetUSD: 0.02,
        preferLocal: true
      });
      
      // If Ollama needs fallback and would cost money, confirm with user
      if (routing.ollamaStatus?.needsFallback && routing.estimatedCost > 0) {
        updateAgentStatus('idle', '');
        setPendingMessage(newMessage);
        setCrashDialogData({
          routing,
          ollamaStatus: routing.ollamaStatus,
          estimatedCost: routing.estimatedCost,
          taskComplexity: routing.taskComplexity,
          recommendedModel: routing.model
        });
        setShowOllamaCrashDialog(true);
        return; // Wait for user confirmation
      }
      
      // Proceed with sending the message
      await executeChatRequest(newMessage, routing);
    } else {
      // Use original direct API call
      setIsGenerating(true);
      updateAgentStatus('executing', 'Sending to AI service...');
      
      try {
        await sendMessageMutation.mutateAsync(newMessage);
      } finally {
        setIsGenerating(false);
        updateAgentStatus('idle', '');
      }
    }
  };

  const executeChatRequest = async (message: string, routing?: any) => {
    setIsGenerating(true);
    updateAgentStatus('working', 'Processing your request...');
    
    try {
      if (routing) {
        updateAgentStatus('analyzing', 'Analyzing task complexity...');
        
        setLastRouting({
          model: routing.model,
          cost: routing.estimatedCost,
          complexity: routing.taskComplexity,
          confidence: routing.confidence,
          reasoning: routing.reasoning,
          ollamaStatus: routing.ollamaStatus
        });

        updateAgentStatus('executing', `Using ${routing.model} for ${routing.taskComplexity} task...`);
        
        // Execute the AI request with routing info
        const result = await aiRouter.executeRequest(message, {
          maxBudgetUSD: 0.02,
          preferLocal: true
        });
        
        updateAgentStatus('reviewing', 'Finalizing response...');
        
        // Add the message to chat with routing info
        await fetch(`/api/projects/${projectId}/ai-chats`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            message: message,
            response: result.response,
            model: result.model,
            cost: result.actualCost,
            tokensUsed: result.tokensUsed
          })
        });
        
        queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/ai-chats`] });
        setNewMessage("");
      }
    } finally {
      setIsGenerating(false);
      updateAgentStatus('idle', '');
    }
  };

  const handleOllamaConfirmation = async (useChatGPT: boolean) => {
    setShowOllamaCrashDialog(false);
    
    if (useChatGPT) {
      updateAgentStatus('working', 'Switching to ChatGPT...');
      // Force use ChatGPT with the stored routing data
      await executeChatRequest(pendingMessage, crashDialogData.routing);
    } else {
      updateAgentStatus('working', 'Retrying with Ollama...');
      // Try Ollama again - force routing with preferLocal = true
      const routing = await aiRouter.routeRequest(pendingMessage, {
        maxBudgetUSD: 0.02,
        preferLocal: true,
        forceComplexity: crashDialogData.taskComplexity
      });
      
      await executeChatRequest(pendingMessage, routing);
    }
    
    setPendingMessage("");
    setCrashDialogData(null);
  };

  return (
    <div className="flex flex-col h-full bg-replit-panel">
      {/* Agent Status Bar */}
      {agentStatus.status !== 'idle' && (
        <div className="px-4 py-2 bg-replit-elevated border-b border-replit-border">
          <div className="flex items-center space-x-2">
            <div className={getStatusColor(agentStatus.status)}>
              {getStatusIcon(agentStatus.status)}
            </div>
            <span className="text-sm font-medium text-replit-text-primary capitalize">
              {agentStatus.status}
            </span>
            <span className="text-sm text-replit-text-secondary">
              {agentStatus.message}
            </span>
            {agentStatus.progress !== undefined && (
              <div className="flex-1 max-w-32">
                <div className="w-full bg-replit-border rounded-full h-1.5">
                  <div 
                    className="bg-replit-blue h-1.5 rounded-full transition-all duration-300" 
                    style={{ width: `${agentStatus.progress}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Chat Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {error ? (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <Bot className="w-12 h-12 text-red-400 mb-4" />
              <h3 className="text-sm font-medium text-red-400 mb-2">
                Error loading chat history
              </h3>
              <p className="text-xs text-replit-text-muted max-w-xs">
                Unable to connect to chat service
              </p>
            </div>
          ) : isLoading ? (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <Bot className="w-12 h-12 text-replit-text-muted mb-4 animate-pulse" />
              <h3 className="text-sm font-medium text-replit-text-secondary mb-2">
                Loading chat history...
              </h3>
            </div>
          ) : chats.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <Bot className="w-12 h-12 text-replit-text-muted mb-4" />
              <h3 className="text-sm font-medium text-replit-text-secondary mb-2">
                Start a conversation with your AI assistant
              </h3>
              <p className="text-xs text-replit-text-muted max-w-xs">
                Ask about your code, get debugging help, or request explanations
              </p>
            </div>
          ) : (
            chats.map((chat) => (
              <div key={chat.id} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-lg p-3 ${
                  chat.role === 'user' 
                    ? 'bg-replit-blue text-white' 
                    : 'bg-replit-elevated border border-replit-border'
                }`}>
                  <div className="flex items-start space-x-2">
                    {chat.role === 'assistant' && (
                      <Bot className="w-4 h-4 text-replit-blue mt-0.5 flex-shrink-0" />
                    )}
                    {chat.role === 'user' && (
                      <User className="w-4 h-4 text-white mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm whitespace-pre-wrap">{chat.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(chat.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
          
          {isGenerating && (
            <div className="flex justify-start">
              <div className="bg-replit-elevated border border-replit-border rounded-lg p-3 max-w-[80%]">
                <div className="flex items-center space-x-2">
                  <Bot className="w-4 h-4 text-replit-blue animate-pulse" />
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-replit-blue rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-replit-blue rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-replit-blue rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Smart Routing Status */}
      {smartRoutingEnabled && lastRouting && (
        <div className="px-4 py-2 border-t border-replit-border bg-replit-elevated/50">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              {lastRouting.ollamaStatus?.needsFallback && (
                <AlertTriangle className="w-3 h-3 text-orange-500" />
              )}
              <Zap className="w-3 h-3 text-yellow-500" />
              <span className="text-replit-text-secondary">Smart Router:</span>
              <Badge variant="secondary" className="text-xs">
                {lastRouting.model}
              </Badge>
              <Badge variant={lastRouting.complexity === 'complex' ? 'destructive' : 
                             lastRouting.complexity === 'medium' ? 'default' : 'secondary'} 
                     className="text-xs">
                {lastRouting.complexity}
              </Badge>
              {lastRouting.model === 'ollama-llama3' && (
                <Badge variant="outline" className="text-xs text-green-600">
                  FREE
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-3 h-3 text-green-500" />
              <span className="text-replit-text-secondary">
                {lastRouting.cost === 0 ? 'FREE' : `$${lastRouting.cost.toFixed(4)}`}
              </span>
              <span className="text-replit-text-muted">
                ({Math.round(lastRouting.confidence * 100)}% confidence)
              </span>
            </div>
          </div>
          <p className="text-xs text-replit-text-muted mt-1">{lastRouting.reasoning}</p>
          {lastRouting.ollamaStatus?.needsFallback && (
            <div className="text-xs text-orange-600 mt-1 font-medium">
              ⚠️ Ollama {lastRouting.ollamaStatus.status} - Using paid API fallback
            </div>
          )}
        </div>
      )}

      {/* Ollama Crash Confirmation Dialog */}
      {showOllamaCrashDialog && crashDialogData && (
        <OllamaCrashConfirmDialog
          open={showOllamaCrashDialog}
          onOpenChange={setShowOllamaCrashDialog}
          onConfirm={handleOllamaConfirmation}
          ollamaStatus={crashDialogData.ollamaStatus}
          estimatedCost={crashDialogData.estimatedCost}
          taskComplexity={crashDialogData.taskComplexity}
          recommendedModel={crashDialogData.recommendedModel}
        />
      )}

      {/* Input Area */}
      <div className="p-4 border-t border-replit-border">
        <div className="flex space-x-2">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Ask AI about your project..."
            className="flex-1 min-h-[80px] bg-replit-elevated border-replit-border resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <Button 
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sendMessageMutation.isPending}
            className="bg-replit-blue hover:bg-replit-blue-secondary self-end"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}