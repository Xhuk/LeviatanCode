import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import type { PromptTemplate } from "@shared/schema";

interface UsePromptTemplatesOptions {
  projectId: string;
}

interface TemplateVariable {
  name: string;
  value: string;
  required: boolean;
}

export function usePromptTemplates({ projectId }: UsePromptTemplatesOptions) {
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null);
  const [templateVariables, setTemplateVariables] = useState<TemplateVariable[]>([]);
  const queryClient = useQueryClient();

  // Fetch prompt templates
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["/api/projects", projectId, "prompt-templates"],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/prompt-templates`);
      return response.json();
    },
  });

  // Increment usage mutation
  const incrementUsageMutation = useMutation({
    mutationFn: (templateId: string) =>
      fetch(`/api/prompt-templates/${templateId}/use`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "prompt-templates"] });
    }
  });

  // Extract variables from prompt text
  const extractVariables = useCallback((promptText: string): string[] => {
    const variableRegex = /\{\{(\w+)\}\}/g;
    const variables: string[] = [];
    let match;
    
    while ((match = variableRegex.exec(promptText)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1]);
      }
    }
    
    return variables;
  }, []);

  // Replace variables in prompt text
  const replaceVariables = useCallback((promptText: string, variables: Record<string, string>): string => {
    let result = promptText;
    
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      result = result.replace(regex, value);
    });
    
    return result;
  }, []);

  // Select and prepare template for use
  const selectTemplate = useCallback((template: PromptTemplate) => {
    setSelectedTemplate(template);
    
    const variables = extractVariables(template.promptText);
    const templateVars: TemplateVariable[] = variables.map(varName => ({
      name: varName,
      value: "",
      required: true
    }));
    
    setTemplateVariables(templateVars);
  }, [extractVariables]);

  // Update variable value
  const updateVariable = useCallback((variableName: string, value: string) => {
    setTemplateVariables(prev => 
      prev.map(variable => 
        variable.name === variableName 
          ? { ...variable, value }
          : variable
      )
    );
  }, []);

  // Generate final prompt with variables replaced
  const generatePrompt = useCallback(() => {
    if (!selectedTemplate) return "";
    
    const variableMap = templateVariables.reduce((acc, variable) => {
      acc[variable.name] = variable.value;
      return acc;
    }, {} as Record<string, string>);
    
    // Check if all required variables have values
    const missingVariables = templateVariables
      .filter(variable => variable.required && !variable.value.trim())
      .map(variable => variable.name);
    
    if (missingVariables.length > 0) {
      toast({
        title: "Missing required variables",
        description: `Please provide values for: ${missingVariables.join(", ")}`,
        variant: "destructive"
      });
      return "";
    }
    
    // Increment usage count
    incrementUsageMutation.mutate(selectedTemplate.id);
    
    return replaceVariables(selectedTemplate.promptText, variableMap);
  }, [selectedTemplate, templateVariables, replaceVariables, incrementUsageMutation]);

  // Get templates by category
  const getTemplatesByCategory = useCallback((category: string) => {
    return (templates as PromptTemplate[]).filter(template => 
      template.category === category && template.isActive
    );
  }, [templates]);

  // Get default templates
  const getDefaultTemplates = useCallback(() => {
    return (templates as PromptTemplate[]).filter(template => 
      template.isDefault && template.isActive
    );
  }, [templates]);

  // Get popular templates (by usage count)
  const getPopularTemplates = useCallback(() => {
    return (templates as PromptTemplate[])
      .filter(template => template.isActive)
      .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
      .slice(0, 5);
  }, [templates]);

  // Quick use template (auto-fill common variables)
  const quickUseTemplate = useCallback((template: PromptTemplate, autoFillData?: Record<string, string>) => {
    selectTemplate(template);
    
    if (autoFillData) {
      Object.entries(autoFillData).forEach(([key, value]) => {
        updateVariable(key, value);
      });
    }
    
    return generatePrompt();
  }, [selectTemplate, updateVariable, generatePrompt]);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedTemplate(null);
    setTemplateVariables([]);
  }, []);

  return {
    // Data
    templates: templates as PromptTemplate[],
    selectedTemplate,
    templateVariables,
    isLoading,
    
    // Actions
    selectTemplate,
    updateVariable,
    generatePrompt,
    clearSelection,
    quickUseTemplate,
    
    // Helpers
    getTemplatesByCategory,
    getDefaultTemplates,
    getPopularTemplates,
    extractVariables,
    replaceVariables,
  };
}

// Helper function for common auto-fill scenarios
export function getAutoFillData(context: {
  fileName?: string;
  fileContent?: string;
  language?: string;
  dataSource?: string;
  dataContent?: string;
}): Record<string, string> {
  const autoFill: Record<string, string> = {};
  
  if (context.fileName) autoFill.fileName = context.fileName;
  if (context.fileContent) autoFill.codeContent = context.fileContent;
  if (context.language) autoFill.language = context.language;
  if (context.dataSource) autoFill.dataSource = context.dataSource;
  if (context.dataContent) autoFill.dataContent = context.dataContent;
  
  return autoFill;
}