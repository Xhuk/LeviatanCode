import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  X, 
  Sparkles, 
  FolderPlus, 
  FileText, 
  Layers,
  CheckCircle,
  Loader2,
  Code,
  Database,
  Palette
} from "lucide-react";
import { queryClient } from "@/lib/queryClient";

interface NewProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface GeneratedStructure {
  name: string;
  description: string;
  technologies: string[];
  files: Array<{
    path: string;
    type: "file" | "folder";
    content?: string;
  }>;
}

export function NewProjectDialog({ open, onOpenChange }: NewProjectDialogProps) {
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [technologies, setTechnologies] = useState<string[]>([]);
  const [techInput, setTechInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedStructure, setGeneratedStructure] = useState<GeneratedStructure | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const commonTechnologies = [
    "Vite", "React", "TypeScript", "JavaScript", "Tailwind CSS", "Supabase", 
    "Node.js", "Express", "Next.js", "Vue.js", "Angular", "Svelte",
    "MongoDB", "PostgreSQL", "MySQL", "Firebase", "Prisma", "Drizzle",
    "shadcn/ui", "Material-UI", "Chakra UI", "Bootstrap", "SCSS", "CSS3",
    "Python", "Flask", "Django", "FastAPI", "Java", "Spring Boot",
    "C#", ".NET", "PHP", "Laravel", "Ruby", "Rails"
  ];

  const addTechnology = (tech: string) => {
    if (tech.trim() && !technologies.includes(tech.trim())) {
      setTechnologies([...technologies, tech.trim()]);
      setTechInput("");
    }
  };

  const removeTechnology = (tech: string) => {
    setTechnologies(technologies.filter(t => t !== tech));
  };

  const generateProjectStructure = async () => {
    if (!projectName.trim()) {
      toast({
        title: "Project name required",
        description: "Please enter a project name",
        variant: "destructive"
      });
      return;
    }

    if (technologies.length === 0) {
      toast({
        title: "Technologies required",
        description: "Please select at least one technology",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch("/api/projects/generate-structure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: projectName,
          description: projectDescription,
          technologies
        })
      });

      if (!response.ok) {
        throw new Error("Failed to generate project structure");
      }

      const structure = await response.json();
      setGeneratedStructure(structure);
      
      toast({
        title: "Structure generated!",
        description: `AI created ${structure.files.length} files and folders for your ${projectName} project`,
      });
    } catch (error) {
      console.error("Error generating structure:", error);
      toast({
        title: "Generation failed",
        description: "Failed to generate project structure. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const createProject = async () => {
    if (!generatedStructure) return;

    setIsCreating(true);
    try {
      const response = await fetch("/api/projects/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: projectName,
          description: projectDescription,
          technologies,
          structure: generatedStructure.files
        })
      });

      if (!response.ok) {
        throw new Error("Failed to create project");
      }

      const project = await response.json();
      
      // Invalidate queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/workspace/folders"] });
      
      toast({
        title: "Project created!",
        description: `${projectName} has been created successfully with ${generatedStructure.files.length} files`,
      });

      // Reset form and close dialog
      setProjectName("");
      setProjectDescription("");
      setTechnologies([]);
      setGeneratedStructure(null);
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating project:", error);
      toast({
        title: "Creation failed",
        description: "Failed to create project. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    setProjectName("");
    setProjectDescription("");
    setTechnologies([]);
    setTechInput("");
    setGeneratedStructure(null);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) resetForm();
    }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FolderPlus className="h-5 w-5 text-blue-500" />
            <span>Create New Project</span>
          </DialogTitle>
          <DialogDescription>
            AI-powered project generation with intelligent folder and file structure based on your technology stack
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col space-y-6 overflow-hidden">
          {!generatedStructure ? (
            // Project Configuration Form
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-6">
                {/* Project Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Code className="h-4 w-4" />
                      Project Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="project-name">Project Name</Label>
                      <Input
                        id="project-name"
                        data-testid="input-project-name"
                        placeholder="my-awesome-app"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="project-description">Description (Optional)</Label>
                      <Textarea
                        id="project-description"
                        data-testid="textarea-project-description"
                        placeholder="A brief description of your project..."
                        value={projectDescription}
                        onChange={(e) => setProjectDescription(e.target.value)}
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Technology Stack */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Layers className="h-4 w-4" />
                      Technology Stack
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="tech-input">Add Technologies</Label>
                      <div className="flex gap-2">
                        <Input
                          id="tech-input"
                          data-testid="input-technology"
                          placeholder="Type a technology..."
                          value={techInput}
                          onChange={(e) => setTechInput(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === "Enter") {
                              addTechnology(techInput);
                            }
                          }}
                        />
                        <Button 
                          data-testid="button-add-technology"
                          onClick={() => addTechnology(techInput)} 
                          variant="outline"
                          size="sm"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Common Technologies */}
                    <div>
                      <Label className="text-sm font-medium">Quick Add:</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {commonTechnologies.map((tech) => (
                          <Badge
                            key={tech}
                            variant={technologies.includes(tech) ? "default" : "outline"}
                            className="cursor-pointer"
                            data-testid={`badge-tech-${tech.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                            onClick={() => {
                              if (technologies.includes(tech)) {
                                removeTechnology(tech);
                              } else {
                                addTechnology(tech);
                              }
                            }}
                          >
                            {tech}
                            {technologies.includes(tech) && (
                              <X className="h-3 w-3 ml-1" />
                            )}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Selected Technologies */}
                    {technologies.length > 0 && (
                      <div>
                        <Label className="text-sm font-medium">Selected Technologies:</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {technologies.map((tech) => (
                            <Badge key={tech} variant="default" className="bg-green-500 hover:bg-green-600">
                              {tech}
                              <X 
                                className="h-3 w-3 ml-1 cursor-pointer" 
                                onClick={() => removeTechnology(tech)}
                              />
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Generate Button */}
                <div className="flex justify-end space-x-3">
                  <Button variant="outline" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={generateProjectStructure} 
                    disabled={isGenerating}
                    data-testid="button-generate-structure"
                    className="bg-blue-500 hover:bg-blue-600"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate Structure
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </ScrollArea>
          ) : (
            // Generated Structure Preview
            <div className="flex flex-col space-y-4 flex-1 overflow-hidden">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Generated Project Structure
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      <strong>{generatedStructure.name}</strong> - {generatedStructure.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {generatedStructure.technologies.map((tech) => (
                        <Badge key={tech} variant="outline">{tech}</Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="flex-1 overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    File Structure ({generatedStructure.files.length} items)
                  </CardTitle>
                </CardHeader>
                <CardContent className="overflow-hidden">
                  <ScrollArea className="h-64">
                    <div className="space-y-1">
                      {generatedStructure.files.map((file, index) => (
                        <div 
                          key={index} 
                          className="flex items-center gap-2 py-1 px-2 rounded hover:bg-muted/50"
                          data-testid={`file-item-${index}`}
                        >
                          {file.type === "folder" ? (
                            <FolderPlus className="h-4 w-4 text-blue-500" />
                          ) : (
                            <FileText className="h-4 w-4 text-gray-500" />
                          )}
                          <span className="text-sm font-mono">{file.path}</span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => setGeneratedStructure(null)}
                  data-testid="button-back-to-config"
                >
                  ← Back to Configuration
                </Button>
                <div className="space-x-3">
                  <Button variant="outline" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={createProject} 
                    disabled={isCreating}
                    data-testid="button-create-project"
                    className="bg-green-500 hover:bg-green-600"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Create Project
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}