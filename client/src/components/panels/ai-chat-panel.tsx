import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Bot, User, Send, Paperclip, Mic, Plus, Loader2, Brain, Sparkles } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ChatMessage } from "@shared/schema";
import { usePromptTemplates } from "@/hooks/use-prompt-templates";
import { useFileSystem } from "@/hooks/use-file-system";
import { ServiceStatusIndicator } from "@/components/service-status-indicator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AiChatPanelProps {
  projectId: string;
}

export function AiChatPanel({ projectId }: AiChatPanelProps) {
  const [currentMessage, setCurrentMessage] = useState("");
  const [selectedModel, setSelectedModel] = useState("gpt-4o");
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  
  const {
    templates,
    selectedTemplate,
    templateVariables,
    selectTemplate,
    updateVariable,
    generatePrompt,
    clearSelection,
    getDefaultTemplates,
    getPopularTemplates,
  } = usePromptTemplates({ projectId });

  const {
    fileStructure,
    searchFiles,
    analyzeFile,
    isAnalyzing
  } = useFileSystem(projectId);

  const { data: chats } = useQuery({
    queryKey: ["/api/projects", projectId, "ai-chats"],
    enabled: !!projectId,
  });

  const { data: currentChat } = useQuery({
    queryKey: ["/api/ai-chats", currentChatId],
    enabled: !!currentChatId,
  });

  const createChatMutation = useMutation({
    mutationFn: (data: { model: string; messages: ChatMessage[] }) =>
      apiRequest("POST", `/api/projects/${projectId}/ai-chats`, data),
    onSuccess: (data) => {
      setCurrentChatId(data.id);
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "ai-chats"] });
    }
  });

  const sendMessageMutation = useMutation({
    mutationFn: (data: { message: string; model: string }) =>
      apiRequest("POST", `/api/ai-chats/${currentChatId}/messages`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai-chats", currentChatId] });
      setCurrentMessage("");
    }
  });

  // Create new chat session
  const createNewChat = () => {
    createChatMutation.mutate({
      model: selectedModel,
      messages: []
    });
  };

  // Auto-select first chat if available and none selected
  useEffect(() => {
    if (chats?.length > 0 && !currentChatId) {
      setCurrentChatId(chats[0].id);
    }
  }, [chats, currentChatId]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentChat?.messages]);

  const handleUseTemplate = () => {
    const prompt = generatePrompt();
    if (prompt) {
      setCurrentMessage(prompt);
      setShowTemplateDialog(false);
      clearSelection();
    }
  };

  const handleFileAnalysis = async (filePath: string, analysisType: 'debug' | 'review' | 'explain' | 'optimize') => {
    try {
      const analysis = await analyzeFile(filePath, analysisType);
      const fileName = filePath.split('/').pop() || filePath;
      const prompt = `Please analyze the file "${fileName}" for ${analysisType}:\n\n${analysis}`;
      setCurrentMessage(prompt);
    } catch (error) {
      console.error("File analysis failed:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || !currentChatId) return;

    const message = currentMessage.trim();
    setCurrentMessage("");
    
    try {
      setIsStreaming(true);
      await sendMessageMutation.mutateAsync({
        message,
        model: selectedModel
      });
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsStreaming(false);
    }
  };



  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const renderMessage = (message: ChatMessage) => (
    <div
      key={message.id}
      className={`chat-message rounded-lg p-3 ${
        message.role === "user" ? "user ml-8" : "ai"
      }`}
    >
      <div className="flex items-start space-x-2">
        {message.role === "assistant" && (
          <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <Bot size={12} className="text-white" />
          </div>
        )}
        <div className="flex-1">
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          {message.model && (
            <Badge variant="secondary" className="mt-2 text-xs">
              {message.model}
            </Badge>
          )}
        </div>
        {message.role === "user" && (
          <div className="w-6 h-6 bg-replit-blue rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <User size={12} className="text-white" />
          </div>
        )}
      </div>
    </div>
  );

  const renderLoadingMessage = () => (
    <div className="chat-message ai rounded-lg p-3">
      <div className="flex items-start space-x-2">
        <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
          <Bot size={12} className="text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <Loader2 size={14} className="animate-spin" />
            <span className="text-sm text-replit-text-secondary">AI is thinking...</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full replit-panel border-r border-replit-border flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-replit-border p-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <Bot size={16} className="text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">AI Assistant</h3>
              <p className="text-xs text-replit-text-secondary">
                {selectedModel === "gpt-4o" ? "GPT-4" : "Gemini Pro"}
              </p>
            </div>
          </div>
          <div className="flex space-x-1">
            <Button variant="ghost" size="sm" onClick={createNewChat} title="New Chat" disabled={createChatMutation.isPending}>
              <Plus size={12} className="text-replit-text-secondary" />
            </Button>
          </div>
        </div>
        
        <div className="space-y-2">
          <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger className="w-full bg-replit-elevated border-replit-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gpt-4o">GPT-4 Turbo</SelectItem>
              <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
              <SelectItem value="gemini-2.5-flash">Gemini Pro</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Service Status Indicator */}
          <ServiceStatusIndicator 
            service={selectedModel.startsWith("gpt") ? "openai" : "gemini"}
            model={selectedModel}
          />
        </div>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {!currentChat?.messages || currentChat.messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <Bot size={48} className="mx-auto mb-4 text-replit-text-muted" />
              <p className="text-replit-text-secondary">
                Start a conversation with your AI assistant
              </p>
              <p className="text-xs text-replit-text-muted mt-2">
                Ask about your data scraping project, code analysis, or optimization
              </p>
            </div>
          </div>
        ) : (
          <>
            {(currentChat.messages as ChatMessage[]).map(renderMessage)}
            {(isStreaming || sendMessageMutation.isPending) && renderLoadingMessage()}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input */}
      <div className="border-t border-replit-border p-3">
        <div className="space-y-2">
          <Textarea
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask AI about your data scraping project..."
            className="w-full bg-replit-elevated border-replit-border resize-none min-h-[60px]"
            rows={2}
          />
          <div className="flex items-center justify-between">
            <div className="flex space-x-1">
              <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" title="Use prompt template">
                    <Brain size={12} className="text-replit-text-secondary" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Select Prompt Template</DialogTitle>
                    <DialogDescription>
                      Choose a template and fill in the variables to generate your prompt
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    {!selectedTemplate ? (
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-medium mb-2">Popular Templates</h4>
                          <div className="grid gap-2">
                            {getPopularTemplates().slice(0, 3).map((template) => (
                              <Button
                                key={template.id}
                                variant="outline"
                                className="justify-start h-auto p-3"
                                onClick={() => selectTemplate(template)}
                              >
                                <div className="text-left">
                                  <div className="font-medium">{template.name}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {template.description}
                                  </div>
                                </div>
                              </Button>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-medium mb-2">All Templates</h4>
                          <div className="max-h-48 overflow-y-auto space-y-1">
                            {templates.filter(t => t.isActive).map((template) => (
                              <Button
                                key={template.id}
                                variant="ghost"
                                className="justify-start w-full"
                                onClick={() => selectTemplate(template)}
                              >
                                <Sparkles className="w-3 h-3 mr-2" />
                                {template.name}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{selectedTemplate.name}</h4>
                          <Button variant="ghost" size="sm" onClick={clearSelection}>
                            Back to templates
                          </Button>
                        </div>
                        
                        {templateVariables.length > 0 && (
                          <div className="space-y-3">
                            <p className="text-sm text-muted-foreground">
                              Fill in the variables for this template:
                            </p>
                            {templateVariables.map((variable) => (
                              <div key={variable.name} className="space-y-1">
                                <Label htmlFor={variable.name}>
                                  {variable.name}
                                  {variable.required && <span className="text-red-500">*</span>}
                                </Label>
                                <Input
                                  id={variable.name}
                                  value={variable.value}
                                  onChange={(e) => updateVariable(variable.name, e.target.value)}
                                  placeholder={`Enter ${variable.name}...`}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                        
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleUseTemplate}>
                            Use Template
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" title="Analyze project files">
                    <Paperclip size={12} className="text-replit-text-secondary" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Analyze Project Files</DialogTitle>
                    <DialogDescription>
                      Select a file and analysis type to get AI insights
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    {fileStructure.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No files found in project
                      </p>
                    ) : (
                      <ScrollArea className="h-48">
                        <div className="space-y-2">
                          {fileStructure.map((file) => (
                            <div key={file.path} className="border rounded p-2">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">{file.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {file.language}
                                </Badge>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs"
                                  onClick={() => handleFileAnalysis(file.path, 'review')}
                                  disabled={isAnalyzing}
                                >
                                  Review
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs"
                                  onClick={() => handleFileAnalysis(file.path, 'debug')}
                                  disabled={isAnalyzing}
                                >
                                  Debug
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs"
                                  onClick={() => handleFileAnalysis(file.path, 'explain')}
                                  disabled={isAnalyzing}
                                >
                                  Explain
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
              <Button variant="ghost" size="sm" title="Voice input">
                <Mic size={12} className="text-replit-text-secondary" />
              </Button>
            </div>
            <Button 
              onClick={handleSendMessage}
              disabled={!currentMessage.trim() || isStreaming || sendMessageMutation.isPending}
              className="bg-replit-blue hover:bg-replit-blue-secondary"
              size="sm"
            >
              {sendMessageMutation.isPending ? (
                <Loader2 size={12} className="animate-spin mr-1" />
              ) : (
                <Send size={12} className="mr-1" />
              )}
              Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
