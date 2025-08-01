import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { FileText, Edit3, Save, RefreshCw, Brain, Database, Code, Server } from "lucide-react";
import type { ProjectDocumentation } from "../../../shared/schema";

interface ProjectDocumentationPanelProps {
  projectId: string;
}

export function ProjectDocumentationPanel({ projectId }: ProjectDocumentationPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedDoc, setEditedDoc] = useState<ProjectDocumentation | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: documentation, isLoading } = useQuery({
    queryKey: [`/api/projects/${projectId}/documentation`],
    enabled: !!projectId,
  });

  const updateDocMutation = useMutation({
    mutationFn: async (doc: ProjectDocumentation) => {
      const response = await fetch(`/api/projects/${projectId}/documentation`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(doc),
      });
      if (!response.ok) throw new Error("Failed to update documentation");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/documentation`] });
      setIsEditing(false);
      setEditedDoc(null);
      toast({
        title: "Documentation updated",
        description: "Project documentation has been saved successfully",
      });
    },
    onError: () => {
      toast({
        title: "Failed to update",
        description: "Could not save documentation changes",
        variant: "destructive",
      });
    },
  });

  const generateDocMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/documentation/generate`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to generate documentation");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/documentation`] });
      toast({
        title: "Documentation generated",
        description: "AI has analyzed your project and generated new documentation",
      });
    },
    onError: () => {
      toast({
        title: "Generation failed",
        description: "Could not generate documentation",
        variant: "destructive",
      });
    },
  });

  const startEditing = () => {
    const defaultDoc: ProjectDocumentation = {
      overview: "",
      techStack: [],
      architecture: "",
      dependencies: [],
      setupInstructions: "",
      deploymentInfo: "",
      apis: [],
      databases: [],
      keyFiles: {},
      features: [],
      notes: ""
    };
    setEditedDoc(documentation || defaultDoc);
    setIsEditing(true);
  };

  const saveChanges = () => {
    if (editedDoc) {
      updateDocMutation.mutate(editedDoc);
    }
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditedDoc(null);
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <div className="h-4 bg-muted rounded animate-pulse" />
        <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
        <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
      </div>
    );
  }

  const currentDoc = isEditing ? editedDoc : documentation;

  if (!currentDoc) {
    return (
      <div className="p-4 text-center space-y-4">
        <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
        <div>
          <h3 className="text-lg font-semibold">No Documentation</h3>
          <p className="text-muted-foreground">
            This project doesn't have AI-readable documentation yet.
          </p>
        </div>
        <Button
          onClick={() => generateDocMutation.mutate()}
          disabled={generateDocMutation.isPending}
        >
          <Brain className="mr-2 h-4 w-4" />
          {generateDocMutation.isPending ? "Generating..." : "Generate with AI"}
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FileText className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Project Documentation</h2>
        </div>
        <div className="flex space-x-2">
          {!isEditing ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => generateDocMutation.mutate()}
                disabled={generateDocMutation.isPending}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                {generateDocMutation.isPending ? "Regenerating..." : "Regenerate"}
              </Button>
              <Button variant="outline" size="sm" onClick={startEditing}>
                <Edit3 className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={cancelEditing}>
                Cancel
              </Button>
              <Button 
                size="sm" 
                onClick={saveChanges}
                disabled={updateDocMutation.isPending}
              >
                <Save className="mr-2 h-4 w-4" />
                {updateDocMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </>
          )}
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="technical">Technical</TabsTrigger>
          <TabsTrigger value="setup">Setup</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span>Project Overview</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Textarea
                  value={currentDoc.overview}
                  onChange={(e) => setEditedDoc(prev => prev ? { ...prev, overview: e.target.value } : null)}
                  placeholder="Describe what this project does, its purpose, and main goals..."
                  rows={6}
                />
              ) : (
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {currentDoc.overview || "No overview available"}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Features</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-2">
                  <Label>Features (one per line)</Label>
                  <Textarea
                    value={currentDoc.features?.join('\n') || ''}
                    onChange={(e) => setEditedDoc(prev => prev ? { 
                      ...prev, 
                      features: e.target.value.split('\n').filter(f => f.trim()) 
                    } : null)}
                    placeholder="User authentication&#10;Data visualization&#10;Real-time updates"
                    rows={4}
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  {currentDoc.features && currentDoc.features.length > 0 ? (
                    <ul className="list-disc list-inside space-y-1">
                      {currentDoc.features.map((feature, index) => (
                        <li key={index} className="text-muted-foreground">{feature}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground">No features documented</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="technical" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Code className="h-4 w-4" />
                <span>Technology Stack</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-2">
                  <Label>Technologies (comma-separated)</Label>
                  <Input
                    value={currentDoc.techStack?.join(', ') || ''}
                    onChange={(e) => setEditedDoc(prev => prev ? { 
                      ...prev, 
                      techStack: e.target.value.split(',').map(t => t.trim()).filter(t => t) 
                    } : null)}
                    placeholder="React, Node.js, PostgreSQL, TypeScript"
                  />
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {currentDoc.techStack && currentDoc.techStack.length > 0 ? (
                    currentDoc.techStack.map((tech, index) => (
                      <Badge key={index} variant="secondary">{tech}</Badge>
                    ))
                  ) : (
                    <p className="text-muted-foreground">No technologies listed</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Server className="h-4 w-4" />
                <span>Architecture</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Textarea
                  value={currentDoc.architecture}
                  onChange={(e) => setEditedDoc(prev => prev ? { ...prev, architecture: e.target.value } : null)}
                  placeholder="Describe the system architecture, patterns used, and how components interact..."
                  rows={6}
                />
              ) : (
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {currentDoc.architecture || "No architecture documentation"}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="h-4 w-4" />
                <span>APIs & Databases</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">APIs</Label>
                {isEditing ? (
                  <Input
                    value={currentDoc.apis?.join(', ') || ''}
                    onChange={(e) => setEditedDoc(prev => prev ? { 
                      ...prev, 
                      apis: e.target.value.split(',').map(a => a.trim()).filter(a => a) 
                    } : null)}
                    placeholder="REST API, GraphQL, WebSocket"
                    className="mt-1"
                  />
                ) : (
                  <div className="mt-1">
                    {currentDoc.apis && currentDoc.apis.length > 0 ? (
                      currentDoc.apis.map((api, index) => (
                        <Badge key={index} variant="outline" className="mr-2">{api}</Badge>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-sm">No APIs documented</p>
                    )}
                  </div>
                )}
              </div>

              <Separator />

              <div>
                <Label className="text-sm font-medium">Databases</Label>
                {isEditing ? (
                  <Input
                    value={currentDoc.databases?.join(', ') || ''}
                    onChange={(e) => setEditedDoc(prev => prev ? { 
                      ...prev, 
                      databases: e.target.value.split(',').map(d => d.trim()).filter(d => d) 
                    } : null)}
                    placeholder="PostgreSQL, Redis, MongoDB"
                    className="mt-1"
                  />
                ) : (
                  <div className="mt-1">
                    {currentDoc.databases && currentDoc.databases.length > 0 ? (
                      currentDoc.databases.map((db, index) => (
                        <Badge key={index} variant="outline" className="mr-2">{db}</Badge>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-sm">No databases documented</p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="setup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Setup Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Textarea
                  value={currentDoc.setupInstructions}
                  onChange={(e) => setEditedDoc(prev => prev ? { ...prev, setupInstructions: e.target.value } : null)}
                  placeholder="Step-by-step instructions to set up and run this project..."
                  rows={8}
                />
              ) : (
                <pre className="text-muted-foreground whitespace-pre-wrap text-sm bg-muted p-3 rounded">
                  {currentDoc.setupInstructions || "No setup instructions available"}
                </pre>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Deployment Information</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Textarea
                  value={currentDoc.deploymentInfo}
                  onChange={(e) => setEditedDoc(prev => prev ? { ...prev, deploymentInfo: e.target.value } : null)}
                  placeholder="How to deploy this project to production..."
                  rows={6}
                />
              ) : (
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {currentDoc.deploymentInfo || "No deployment information available"}
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="files" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Key Files</CardTitle>
              <CardDescription>
                Important files and their purposes in this project
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-3">
                  {Object.entries(currentDoc.keyFiles || {}).map(([filePath, description], index) => (
                    <div key={index} className="grid grid-cols-2 gap-2">
                      <Input
                        value={filePath}
                        onChange={(e) => {
                          const newKeyFiles = { ...(currentDoc.keyFiles || {}) };
                          delete newKeyFiles[filePath];
                          newKeyFiles[e.target.value] = description;
                          setEditedDoc(prev => prev ? { ...prev, keyFiles: newKeyFiles } : null);
                        }}
                        placeholder="path/to/file.js"
                      />
                      <Input
                        value={description}
                        onChange={(e) => {
                          setEditedDoc(prev => prev ? { 
                            ...prev, 
                            keyFiles: { ...(prev.keyFiles || {}), [filePath]: e.target.value } 
                          } : null);
                        }}
                        placeholder="File description"
                      />
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditedDoc(prev => prev ? { 
                        ...prev, 
                        keyFiles: { ...(prev.keyFiles || {}), "": "" } 
                      } : null);
                    }}
                  >
                    Add File
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {Object.entries(currentDoc.keyFiles || {}).length > 0 ? (
                    Object.entries(currentDoc.keyFiles || {}).map(([filePath, description]) => (
                      <div key={filePath} className="border-l-2 border-muted pl-3">
                        <code className="text-sm bg-muted px-2 py-1 rounded">{filePath}</code>
                        <p className="text-muted-foreground text-sm mt-1">{description}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground">No key files documented</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Textarea
                  value={currentDoc.notes}
                  onChange={(e) => setEditedDoc(prev => prev ? { ...prev, notes: e.target.value } : null)}
                  placeholder="Additional notes, gotchas, or important information..."
                  rows={4}
                />
              ) : (
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {currentDoc.notes || "No additional notes"}
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}