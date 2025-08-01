import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { 
  Brain, 
  Plus, 
  Edit, 
  Trash2, 
  Copy, 
  Star, 
  TrendingUp, 
  Wand2,
  Search,
  Filter,
  Tag
} from "lucide-react";
import type { PromptTemplate, InsertPromptTemplate } from "@shared/schema";

const promptCategories = [
  { value: "code_analysis", label: "Code Analysis", color: "bg-blue-500" },
  { value: "documentation", label: "Documentation", color: "bg-green-500" },
  { value: "data_analysis", label: "Data Analysis", color: "bg-purple-500" },
  { value: "general", label: "General", color: "bg-orange-500" },
  { value: "custom", label: "Custom", color: "bg-gray-500" }
];

const promptTemplateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  promptText: z.string().min(1, "Prompt text is required"),
  variables: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false)
});

type PromptTemplateForm = z.infer<typeof promptTemplateSchema>;

interface PromptTemplatesPanelProps {
  projectId: string;
}

export function PromptTemplatesPanel({ projectId }: PromptTemplatesPanelProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  
  const queryClient = useQueryClient();

  // Fetch prompt templates
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["/api/projects", projectId, "prompt-templates"],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/prompt-templates`);
      return response.json();
    },
  });

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: (data: PromptTemplateForm) => 
      fetch(`/api/projects/${projectId}/prompt-templates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "prompt-templates"] });
      setIsCreateDialogOpen(false);
      toast({ title: "Template created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to create template", description: error.message, variant: "destructive" });
    }
  });

  // Update template mutation
  const updateTemplateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PromptTemplate> }) =>
      fetch(`/api/prompt-templates/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "prompt-templates"] });
      setIsEditDialogOpen(false);
      toast({ title: "Template updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to update template", description: error.message, variant: "destructive" });
    }
  });

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: (id: string) => 
      fetch(`/api/prompt-templates/${id}`, { method: "DELETE" }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "prompt-templates"] });
      toast({ title: "Template deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to delete template", description: error.message, variant: "destructive" });
    }
  });

  // Refine prompt mutation
  const refinePromptMutation = useMutation({
    mutationFn: (data: { promptText: string; category: string; targetUse: string }) =>
      fetch("/api/prompt-templates/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      }).then(res => res.json()),
    onError: (error: any) => {
      toast({ title: "Failed to refine prompt", description: error.message, variant: "destructive" });
    }
  });

  // Filter templates
  const filteredTemplates = (templates as PromptTemplate[]).filter((template: PromptTemplate) => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || template.category === categoryFilter;
    const matchesActive = !showActiveOnly || template.isActive;
    
    return matchesSearch && matchesCategory && matchesActive;
  });

  // Extract variables from prompt text
  const extractVariables = (promptText: string): string[] => {
    const variableRegex = /\{\{(\w+)\}\}/g;
    const variables: string[] = [];
    let match;
    
    while ((match = variableRegex.exec(promptText)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1]);
      }
    }
    
    return variables;
  };

  const TemplateForm = ({ template, onSubmit, isLoading }: {
    template?: PromptTemplate;
    onSubmit: (data: PromptTemplateForm) => void;
    isLoading: boolean;
  }) => {
    const form = useForm<PromptTemplateForm>({
      resolver: zodResolver(promptTemplateSchema),
      defaultValues: template ? {
        name: template.name,
        description: template.description || "",
        category: template.category,
        promptText: template.promptText,
        variables: template.variables as string[],
        isActive: template.isActive,
        isDefault: template.isDefault
      } : {
        name: "",
        description: "",
        category: "general",
        promptText: "",
        variables: [],
        isActive: true,
        isDefault: false
      }
    });

    const promptText = form.watch("promptText");

    // Auto-detect variables from prompt text
    const handlePromptTextChange = (value: string) => {
      form.setValue("promptText", value);
      const detectedVariables = extractVariables(value);
      form.setValue("variables", detectedVariables);
    };

    const handleRefinePrompt = async () => {
      const currentPrompt = form.getValues("promptText");
      const category = form.getValues("category");
      
      if (!currentPrompt.trim()) {
        toast({ title: "Please enter a prompt to refine", variant: "destructive" });
        return;
      }

      try {
        const result = await refinePromptMutation.mutateAsync({
          promptText: currentPrompt,
          category,
          targetUse: template ? "editing existing template" : "creating new template"
        });
        
        form.setValue("promptText", (result as any).refinedPrompt);
        const newVariables = extractVariables((result as any).refinedPrompt);
        form.setValue("variables", newVariables);
        
        toast({ title: "Prompt refined successfully" });
      } catch (error) {
        // Error handled by mutation
      }
    };

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Template Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Code Review Prompt" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {promptCategories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${category.color}`} />
                            {category.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Brief description of what this prompt does" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="promptText"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center justify-between">
                  Prompt Text
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRefinePrompt}
                    disabled={refinePromptMutation.isPending}
                    className="flex items-center gap-1"
                  >
                    <Wand2 className="w-3 h-3" />
                    {refinePromptMutation.isPending ? "Refining..." : "Refine with AI"}
                  </Button>
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter your prompt template here. Use {{variableName}} for dynamic content."
                    className="min-h-[120px] font-mono text-sm"
                    value={field.value}
                    onChange={(e) => handlePromptTextChange(e.target.value)}
                  />
                </FormControl>
                <FormDescription>
                  Use double curly braces like {`{{variableName}}`} for dynamic content. Variables will be detected automatically.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {form.watch("variables").length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Detected Variables</label>
              <div className="flex flex-wrap gap-1">
                {form.watch("variables").map((variable) => (
                  <Badge key={variable} variant="secondary" className="text-xs">
                    <Tag className="w-3 h-3 mr-1" />
                    {variable}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center space-x-4">
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Active Template</FormLabel>
                    <FormDescription className="text-xs">
                      Active templates appear in suggestion lists
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isDefault"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Default Template</FormLabel>
                    <FormDescription className="text-xs">
                      Default templates are suggested first
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
                setIsEditDialogOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : template ? "Update Template" : "Create Template"}
            </Button>
          </div>
        </form>
      </Form>
    );
  };

  const getCategoryInfo = (category: string) => {
    return promptCategories.find(c => c.value === category) || promptCategories[promptCategories.length - 1];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Brain className="w-8 h-8 animate-pulse mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading prompt templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            <h2 className="text-lg font-semibold">Prompt Templates</h2>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="flex items-center gap-1">
                <Plus className="w-4 h-4" />
                New Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Prompt Template</DialogTitle>
                <DialogDescription>
                  Create a reusable prompt template for AI interactions
                </DialogDescription>
              </DialogHeader>
              <TemplateForm
                onSubmit={(data) => createTemplateMutation.mutate(data)}
                isLoading={createTemplateMutation.isPending}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {promptCategories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                checked={showActiveOnly}
                onCheckedChange={setShowActiveOnly}
                id="active-only"
              />
              <label htmlFor="active-only" className="text-sm font-medium">
                Active only
              </label>
            </div>
            
            <div className="text-sm text-muted-foreground">
              {filteredTemplates.length} of {(templates as PromptTemplate[]).length} templates
            </div>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-12">
              <Brain className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No templates found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery || categoryFilter !== "all" 
                  ? "Try adjusting your filters"
                  : "Create your first prompt template to get started"
                }
              </p>
              {!searchQuery && categoryFilter === "all" && (
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Template
                </Button>
              )}
            </div>
          ) : (
            filteredTemplates.map((template: PromptTemplate) => {
              const categoryInfo = getCategoryInfo(template.category);
              
              return (
                <Card 
                  key={template.id} 
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedTemplate?.id === template.id ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => setSelectedTemplate(template)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base">{template.name}</CardTitle>
                          {template.isDefault && (
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          )}
                          {!template.isActive && (
                            <Badge variant="secondary" className="text-xs">Inactive</Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline" 
                            className="text-xs"
                            style={{ backgroundColor: `${categoryInfo.color}20` }}
                          >
                            <div className={`w-2 h-2 rounded-full ${categoryInfo.color} mr-1`} />
                            {categoryInfo.label}
                          </Badge>
                          
                          <div className="flex items-center text-xs text-muted-foreground">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            {template.usageCount} uses
                          </div>
                        </div>

                        {template.description && (
                          <CardDescription className="text-sm">
                            {template.description}
                          </CardDescription>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <Dialog open={isEditDialogOpen && selectedTemplate?.id === template.id} 
                                onOpenChange={(open) => {
                                  setIsEditDialogOpen(open);
                                  if (open) setSelectedTemplate(template);
                                }}>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTemplate(template);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Edit Prompt Template</DialogTitle>
                              <DialogDescription>
                                Modify your prompt template
                              </DialogDescription>
                            </DialogHeader>
                            <TemplateForm
                              template={template}
                              onSubmit={(data) => updateTemplateMutation.mutate({ 
                                id: template.id, 
                                data 
                              })}
                              isLoading={updateTemplateMutation.isPending}
                            />
                          </DialogContent>
                        </Dialog>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(template.promptText);
                            toast({ title: "Prompt copied to clipboard" });
                          }}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm("Are you sure you want to delete this template?")) {
                              deleteTemplateMutation.mutate(template.id);
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-2">
                      <div className="text-sm font-mono text-muted-foreground bg-muted/50 p-2 rounded text-xs max-h-20 overflow-hidden">
                        {template.promptText.substring(0, 150)}
                        {template.promptText.length > 150 && "..."}
                      </div>
                      
                      {(template.variables as string[]).length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {(template.variables as string[]).map((variable) => (
                            <Badge key={variable} variant="outline" className="text-xs">
                              <Tag className="w-3 h-3 mr-1" />
                              {variable}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}