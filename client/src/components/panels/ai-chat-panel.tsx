import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Send, Bot, User, Zap, DollarSign } from "lucide-react";
import { aiRouter } from "@/services/aiRouterPro";

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

export function AiChatPanel({ projectId }: AiChatPanelProps) {
  const [newMessage, setNewMessage] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [smartRoutingEnabled, setSmartRoutingEnabled] = useState(true);
  const [lastRouting, setLastRouting] = useState<any>(null);
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
    
    setIsGenerating(true);
    try {
      if (smartRoutingEnabled) {
        // Use smart budget-aware routing
        const routing = await aiRouter.routeRequest(newMessage, {
          maxBudgetUSD: 0.02, // 2 cents max per request
          preferLocal: true // Prefer Ollama when available
        });
        
        setLastRouting({
          model: routing.model,
          cost: routing.estimatedCost,
          complexity: routing.taskComplexity,
          confidence: routing.confidence,
          reasoning: routing.reasoning
        });

        // Execute the AI request with routing info
        const result = await aiRouter.executeRequest(newMessage, {
          maxBudgetUSD: 0.02,
          preferLocal: true
        });
        
        // Add the message to chat with routing info
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
        setNewMessage("");
      } else {
        // Use original direct API call
        await sendMessageMutation.mutateAsync(newMessage);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-replit-panel">
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
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-3 h-3 text-green-500" />
              <span className="text-replit-text-secondary">
                ${lastRouting.cost.toFixed(4)}
              </span>
              <span className="text-replit-text-muted">
                ({Math.round(lastRouting.confidence * 100)}% confidence)
              </span>
            </div>
          </div>
          <p className="text-xs text-replit-text-muted mt-1">{lastRouting.reasoning}</p>
        </div>
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