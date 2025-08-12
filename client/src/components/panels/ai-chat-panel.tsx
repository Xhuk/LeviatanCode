import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Send, Bot, User } from "lucide-react";

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
  const queryClient = useQueryClient();

  const { data: chatsData = [], isLoading, error } = useQuery<AiMessage[]>({
    queryKey: [`/api/projects/${projectId}/ai-chats`],
  });

  // Ensure chats is always an array with debugging
  const chats = (() => {
    console.log('AI Chat Panel - Raw data:', chatsData);
    console.log('AI Chat Panel - Is array?', Array.isArray(chatsData));
    console.log('AI Chat Panel - Type:', typeof chatsData);
    
    if (Array.isArray(chatsData)) {
      return chatsData;
    }
    
    console.warn('AI Chat Panel - Data is not an array, falling back to empty array');
    return [];
  })();

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
      await sendMessageMutation.mutateAsync(newMessage);
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
            (Array.isArray(chats) ? chats : []).map((chat) => (
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