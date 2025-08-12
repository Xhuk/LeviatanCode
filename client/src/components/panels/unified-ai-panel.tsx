import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, Bot, User, Zap, DollarSign, AlertTriangle, Code, FileText, Search, Bug, Cog, Brain, MessageSquare, Settings } from "lucide-react";
import { aiRouter } from "@/services/aiRouterPro";
import { OllamaCrashConfirmDialog } from "@/components/dialogs/OllamaCrashConfirmDialog";

interface UnifiedAiPanelProps {
  projectId: string;
}

interface AiMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  model?: string;
  type: 'chat' | 'development' | 'system';
  metadata?: {
    cost?: number;
    tokensUsed?: number;
    toolCalls?: any[];
    executionTime?: number;
  };
}

interface AgentStatus {
  status: 'idle' | 'working' | 'creating' | 'reviewing' | 'editing' | 'executing' | 'analyzing' | 'debugging' | 'thinking';
  message: string;
  progress?: number;
}

type InteractionMode = 'auto' | 'chat' | 'development';

export function UnifiedAiPanel({ projectId }: UnifiedAiPanelProps) {
  const [newMessage, setNewMessage] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [mode, setMode] = useState<InteractionMode>('auto');
  const [lastRouting, setLastRouting] = useState<any>(null);
  const [showOllamaCrashDialog, setShowOllamaCrashDialog] = useState(false);
  const [pendingMessage, setPendingMessage] = useState("");
  const [crashDialogData, setCrashDialogData] = useState<any>(null);
  const [agentStatus, setAgentStatus] = useState<AgentStatus>({ status: 'idle', message: '' });
  const [conversationHistory, setConversationHistory] = useState<AiMessage[]>([]);
  const queryClient = useQueryClient();

  const updateAgentStatus = (status: AgentStatus['status'], message: string, progress?: number) => {
    setAgentStatus({ status, message, progress });
  };

  const getStatusIcon = (status: AgentStatus['status']) => {
    switch (status) {
      case 'thinking': return <Brain className="w-4 h-4 animate-pulse" />;
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
      case 'thinking': return 'text-purple-500';
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

  // Intelligent routing function to determine interaction type
  const classifyInteraction = (message: string): 'chat' | 'development' => {
    const lowerMessage = message.toLowerCase();
    
    // Development keywords - actions that require code execution
    const devKeywords = [
      'create', 'build', 'implement', 'add', 'fix', 'debug', 'refactor',
      'install', 'setup', 'configure', 'deploy', 'test', 'run', 'execute',
      'generate', 'modify', 'update', 'delete', 'remove', 'migrate',
      'write code', 'make changes', 'edit file', 'new component', 'new function'
    ];

    // Chat keywords - questions and discussions
    const chatKeywords = [
      'what is', 'how does', 'why', 'explain', 'help me understand',
      'tell me about', 'can you explain', 'what are the benefits',
      'comparison', 'difference between', 'pros and cons', 'best practice'
    ];

    // Check for development indicators
    const hasDevKeywords = devKeywords.some(keyword => lowerMessage.includes(keyword));
    const hasChatKeywords = chatKeywords.some(keyword => lowerMessage.includes(keyword));
    
    // File/code specific indicators
    const hasFileReferences = /\.(js|ts|jsx|tsx|py|css|html|json|md)/.test(lowerMessage);
    const hasCodeReferences = /function|class|import|export|const|let|var|def|if|for|while/.test(lowerMessage);
    
    // Development action indicators
    if (hasDevKeywords || hasFileReferences || hasCodeReferences) {
      return 'development';
    }
    
    // Pure chat/question indicators
    if (hasChatKeywords && !hasDevKeywords) {
      return 'chat';
    }
    
    // Default to development if unclear (better to have more capabilities)
    return 'development';
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isGenerating) return;

    const userMessage: AiMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: newMessage,
      timestamp: new Date().toISOString(),
      type: mode === 'auto' ? classifyInteraction(newMessage) : mode === 'chat' ? 'chat' : 'development'
    };

    setConversationHistory(prev => [...prev, userMessage]);
    
    try {
      setIsGenerating(true);
      updateAgentStatus('thinking', 'Understanding your request...');
      
      const interactionType = userMessage.type;
      
      if (interactionType === 'development') {
        updateAgentStatus('analyzing', 'Planning development approach...');
        
        // Use developer agent for development tasks
        const response = await fetch('/api/developer-agent/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            instruction: newMessage,
            projectId 
          })
        });

        if (!response.ok) throw new Error('Failed to execute development task');
        
        const result = await response.json();
        
        const assistantMessage: AiMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: result.response || result.logs?.join('\n') || 'Task completed successfully',
          timestamp: new Date().toISOString(),
          type: 'development',
          model: 'developer-agent',
          metadata: {
            executionTime: result.executionTime,
            toolCalls: result.toolCalls
          }
        };
        
        setConversationHistory(prev => [...prev, assistantMessage]);
        
      } else {
        updateAgentStatus('analyzing', 'Routing to optimal AI service...');
        
        // Use AI Router for chat conversations
        const result = await aiRouter.chat(newMessage, {
          projectId,
          userId: 'demo-user',
          onRouting: (routing) => {
            setLastRouting(routing);
            updateAgentStatus('executing', `Using ${routing.model} for conversation...`);
          },
          onOllamaFailure: (crashData) => {
            setCrashDialogData(crashData);
            setShowOllamaCrashDialog(true);
            setPendingMessage(newMessage);
            updateAgentStatus('working', 'Switching to backup AI service...');
          }
        });

        if (result) {
          const assistantMessage: AiMessage = {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: result.response,
            timestamp: new Date().toISOString(),
            type: 'chat',
            model: result.model,
            metadata: {
              cost: result.actualCost,
              tokensUsed: result.tokensUsed
            }
          };
          
          setConversationHistory(prev => [...prev, assistantMessage]);
          
          // Save to chat history
          await fetch(`/api/projects/${projectId}/ai-chats`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              message: newMessage,
              response: result.response,
              model: result.model,
              cost: result.actualCost,
              tokensUsed: result.tokensUsed
            })
          });
          
          queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/ai-chats`] });
        }
      }
      
      setNewMessage("");
      updateAgentStatus('idle', '');
      
    } catch (error) {
      console.error('Error processing message:', error);
      const errorMessage: AiMessage = {
        id: `error-${Date.now()}`,
        role: 'system',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
        timestamp: new Date().toISOString(),
        type: 'system'
      };
      setConversationHistory(prev => [...prev, errorMessage]);
      updateAgentStatus('idle', '');
    } finally {
      setIsGenerating(false);
    }
  };

  const getMessageTypeIcon = (type: string) => {
    switch (type) {
      case 'development': return <Code className="w-4 h-4 text-green-500" />;
      case 'chat': return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case 'system': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default: return <Bot className="w-4 h-4" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-replit-panel">
      {/* Header with Mode Selector */}
      <div className="flex items-center justify-between p-4 border-b border-replit-border bg-replit-elevated">
        <div className="flex items-center space-x-2">
          <Bot className="w-5 h-5 text-replit-blue" />
          <h2 className="text-lg font-semibold text-replit-text-primary">AI Assistant</h2>
          <Badge variant="secondary">Unified</Badge>
        </div>
        
        <div className="flex items-center space-x-2">
          <label className="text-sm text-replit-text-secondary">Mode:</label>
          <select 
            value={mode} 
            onChange={(e) => setMode(e.target.value as InteractionMode)}
            className="text-sm bg-replit-elevated border border-replit-border rounded px-2 py-1"
          >
            <option value="auto">🧠 Auto-Detect</option>
            <option value="chat">💬 Chat Only</option>
            <option value="development">🔧 Development Only</option>
          </select>
        </div>
      </div>

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
          {conversationHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Bot className="w-16 h-16 text-replit-text-muted mb-4" />
              <h3 className="text-lg font-medium text-replit-text-secondary mb-2">
                Unified AI Assistant
              </h3>
              <p className="text-sm text-replit-text-muted max-w-md">
                Ask questions, request explanations, or give development instructions. 
                I'll automatically choose the best approach for your needs.
              </p>
              <div className="flex items-center gap-4 mt-4 text-xs text-replit-text-muted">
                <div className="flex items-center gap-1">
                  <MessageSquare className="w-4 h-4" />
                  <span>Questions & Chat</span>
                </div>
                <div className="flex items-center gap-1">
                  <Code className="w-4 h-4" />
                  <span>Development Tasks</span>
                </div>
              </div>
            </div>
          ) : (
            conversationHistory.map((message) => (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-lg p-3 ${
                  message.role === 'user' 
                    ? 'bg-replit-blue text-white' 
                    : message.role === 'system'
                    ? 'bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700'
                    : 'bg-replit-elevated border border-replit-border'
                }`}>
                  <div className="flex items-start space-x-2">
                    {message.role === 'assistant' && (
                      <div className="flex items-center space-x-1">
                        <Bot className="w-4 h-4 text-replit-blue mt-0.5 flex-shrink-0" />
                        {getMessageTypeIcon(message.type)}
                      </div>
                    )}
                    {message.role === 'user' && (
                      <User className="w-4 h-4 text-white mt-0.5 flex-shrink-0" />
                    )}
                    {message.role === 'system' && (
                      <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        {message.model && (
                          <Badge variant="outline" className="text-xs">
                            {message.model}
                          </Badge>
                        )}
                        {message.type !== 'system' && (
                          <Badge variant={message.type === 'development' ? 'default' : 'secondary'} className="text-xs">
                            {message.type}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs opacity-70">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </p>
                        {message.metadata && (
                          <div className="flex items-center space-x-2 text-xs opacity-70">
                            {message.metadata.cost && (
                              <span>${message.metadata.cost.toFixed(4)}</span>
                            )}
                            {message.metadata.tokensUsed && (
                              <span>{message.metadata.tokensUsed} tokens</span>
                            )}
                          </div>
                        )}
                      </div>
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
      {lastRouting && (
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

      {/* Input Area */}
      <div className="p-4 border-t border-replit-border bg-replit-elevated">
        <div className="flex space-x-2">
          <Textarea
            placeholder={
              mode === 'auto' 
                ? "Ask a question or give a development instruction..." 
                : mode === 'chat'
                ? "Ask a question or request an explanation..."
                : "Give a development instruction (create, fix, build, etc.)..."
            }
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            className="flex-1 min-h-[40px] max-h-32 resize-none"
            rows={1}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || isGenerating}
            size="sm"
            className="self-end"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        
        {mode === 'auto' && newMessage.trim() && (
          <div className="mt-2 text-xs text-replit-text-muted">
            Will route to: <strong>{classifyInteraction(newMessage)}</strong> mode
          </div>
        )}
      </div>

      {/* Dialogs */}
      <OllamaCrashConfirmDialog
        open={showOllamaCrashDialog}
        onOpenChange={setShowOllamaCrashDialog}
        onConfirm={async (useChatGPT: boolean) => {
          setShowOllamaCrashDialog(false);
          if (useChatGPT) {
            updateAgentStatus('working', 'Switching to ChatGPT...');
            // Force use ChatGPT with the stored routing data
            const routing = await aiRouter.routeRequest(pendingMessage, {
              maxBudgetUSD: 0.02,
              forceModel: 'chatgpt-4o'
            });
            
            const result = await aiRouter.chat(pendingMessage, {
              projectId,
              userId: 'demo-user',
              routingOverride: routing
            });
            
            if (result) {
              const assistantMessage: AiMessage = {
                id: `assistant-${Date.now()}`,
                role: 'assistant',
                content: result.response,
                timestamp: new Date().toISOString(),
                type: 'chat',
                model: result.model,
                metadata: {
                  cost: result.actualCost,
                  tokensUsed: result.tokensUsed
                }
              };
              
              setConversationHistory(prev => [...prev, assistantMessage]);
            }
          } else {
            updateAgentStatus('working', 'Retrying with Ollama...');
            // Try Ollama again - force routing with preferLocal = true
            const routing = await aiRouter.routeRequest(pendingMessage, {
              maxBudgetUSD: 0.02,
              preferLocal: true,
              forceComplexity: crashDialogData?.taskComplexity
            });
            
            const result = await aiRouter.chat(pendingMessage, {
              projectId,
              userId: 'demo-user',
              routingOverride: routing
            });
            
            if (result) {
              const assistantMessage: AiMessage = {
                id: `assistant-${Date.now()}`,
                role: 'assistant',
                content: result.response,
                timestamp: new Date().toISOString(),
                type: 'chat',
                model: result.model,
                metadata: {
                  cost: result.actualCost,
                  tokensUsed: result.tokensUsed
                }
              };
              
              setConversationHistory(prev => [...prev, assistantMessage]);
            }
          }
          
          setPendingMessage("");
          setCrashDialogData(null);
          updateAgentStatus('idle', '');
        }}
        ollamaStatus={crashDialogData?.ollamaStatus || { status: 'disconnected', needsFallback: true }}
        estimatedCost={crashDialogData?.estimatedCost || 0.001}
        taskComplexity={crashDialogData?.taskComplexity || 'medium'}
        recommendedModel={crashDialogData?.recommendedModel || 'gpt-4o'}
      />
    </div>
  );
}