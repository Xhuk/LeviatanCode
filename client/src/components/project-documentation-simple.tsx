import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { FileText, Edit3, Save, RefreshCw, Brain } from "lucide-react";

interface ProjectDocumentationSimpleProps {
  projectId: string;
}

interface DocData {
  overview?: string;
  techStack?: string[];
  architecture?: string;
  setupInstructions?: string;
  features?: string[];
  keyFiles?: Record<string, string>;
  notes?: string;
}

export function ProjectDocumentationSimple({ projectId }: ProjectDocumentationSimpleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedDoc, setEditedDoc] = useState<DocData>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: documentation, isLoading } = useQuery({
    queryKey: [`/api/projects/${projectId}/documentation`],
    enabled: !!projectId,
  });

  const updateDocMutation = useMutation({
    mutationFn: async (doc: DocData) => {
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
      setEditedDoc({});
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
    setEditedDoc(documentation || {});
    setIsEditing(true);
  };

  const saveChanges = () => {
    updateDocMutation.mutate(editedDoc);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditedDoc({});
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

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <Textarea
                value={currentDoc.overview || ""}
                onChange={(e) => setEditedDoc(prev => ({ ...prev, overview: e.target.value }))}
                placeholder="Describe what this project does, its purpose, and main goals..."
                rows={4}
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
            <CardTitle>Technology Stack</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {currentDoc.techStack && currentDoc.techStack.length > 0 ? (
                currentDoc.techStack.map((tech: string, index: number) => (
                  <Badge key={index} variant="secondary">{tech}</Badge>
                ))
              ) : (
                <p className="text-muted-foreground">No technologies listed</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Setup Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <Textarea
                value={currentDoc.setupInstructions || ""}
                onChange={(e) => setEditedDoc(prev => ({ ...prev, setupInstructions: e.target.value }))}
                placeholder="Step-by-step instructions to set up and run this project..."
                rows={6}
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
            <CardTitle>Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {currentDoc.features && currentDoc.features.length > 0 ? (
                <ul className="list-disc list-inside space-y-1">
                  {currentDoc.features.map((feature: string, index: number) => (
                    <li key={index} className="text-muted-foreground">{feature}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">No features documented</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <Textarea
                value={currentDoc.notes || ""}
                onChange={(e) => setEditedDoc(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes, gotchas, or important information..."
                rows={3}
              />
            ) : (
              <p className="text-muted-foreground whitespace-pre-wrap">
                {currentDoc.notes || "No additional notes"}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}