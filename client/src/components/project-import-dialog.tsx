import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, FolderOpen, CheckCircle } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface ImportStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

export function ProjectImportDialog() {
  const [open, setOpen] = useState(false);
  const [importMethod, setImportMethod] = useState<"file" | "url" | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [gitUrl, setGitUrl] = useState("");
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [importProgress, setImportProgress] = useState(0);
  const [importSteps, setImportSteps] = useState<ImportStep[]>([
    { id: "upload", title: "Upload Files", description: "Processing uploaded files", completed: false },
    { id: "analyze", title: "Analyze Structure", description: "Understanding project architecture", completed: false },
    { id: "documentation", title: "Generate Documentation", description: "Creating AI-readable documentation", completed: false },
    { id: "complete", title: "Complete", description: "Project ready for use", completed: false }
  ]);
  const [isImporting, setIsImporting] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const importMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch("/api/projects/import", {
        method: "POST",
        body: data,
      });
      if (!response.ok) {
        throw new Error("Import failed");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Project imported successfully",
        description: "Your project has been imported with AI-generated documentation",
      });
      setOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Import failed",
        description: error.message || "Failed to import project",
        variant: "destructive",
      });
      setIsImporting(false);
    },
  });

  const resetForm = () => {
    setImportMethod(null);
    setSelectedFiles(null);
    setGitUrl("");
    setProjectName("");
    setProjectDescription("");
    setImportProgress(0);
    setIsImporting(false);
    setImportSteps(prev => prev.map(step => ({ ...step, completed: false })));
  };

  const simulateProgress = () => {
    setIsImporting(true);
    let currentStep = 0;
    const progressInterval = setInterval(() => {
      setImportProgress(prev => {
        const newProgress = prev + 25;
        if (newProgress >= 25 * (currentStep + 1) && currentStep < importSteps.length) {
          setImportSteps(prev => prev.map((step, index) => 
            index === currentStep ? { ...step, completed: true } : step
          ));
          currentStep++;
        }
        
        if (newProgress >= 100) {
          clearInterval(progressInterval);
        }
        return Math.min(newProgress, 100);
      });
    }, 1500);
  };

  const handleFileImport = async () => {
    if (!selectedFiles || !projectName.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide project name and select files",
        variant: "destructive",
      });
      return;
    }

    simulateProgress();

    const formData = new FormData();
    formData.append("name", projectName);
    formData.append("description", projectDescription);
    formData.append("method", "files");

    for (let i = 0; i < selectedFiles.length; i++) {
      formData.append("files", selectedFiles[i]);
    }

    importMutation.mutate(formData);
  };

  const handleGitImport = async () => {
    if (!gitUrl.trim() || !projectName.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide project name and Git URL",
        variant: "destructive",
      });
      return;
    }

    simulateProgress();

    const formData = new FormData();
    formData.append("name", projectName);
    formData.append("description", projectDescription);
    formData.append("method", "git");
    formData.append("gitUrl", gitUrl);

    importMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Upload className="mr-2 h-4 w-4" />
          Import Project
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Project</DialogTitle>
          <DialogDescription>
            Import an existing project from files or Git repository. AI will analyze and generate documentation.
          </DialogDescription>
        </DialogHeader>

        {!isImporting ? (
          <div className="space-y-6">
            {/* Method Selection */}
            {!importMethod && (
              <div className="grid grid-cols-2 gap-4">
                <Card 
                  className="cursor-pointer hover:border-primary transition-colors"
                  onClick={() => setImportMethod("file")}
                >
                  <CardHeader className="text-center">
                    <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground" />
                    <CardTitle className="text-lg">Upload Files</CardTitle>
                    <CardDescription>
                      Upload project files from your computer
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card 
                  className="cursor-pointer hover:border-primary transition-colors"
                  onClick={() => setImportMethod("url")}
                >
                  <CardHeader className="text-center">
                    <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                    <CardTitle className="text-lg">Git Repository</CardTitle>
                    <CardDescription>
                      Import from GitHub, GitLab, or other Git service
                    </CardDescription>
                  </CardHeader>
                </Card>
              </div>
            )}

            {/* Project Details */}
            {importMethod && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="projectName">Project Name *</Label>
                  <Input
                    id="projectName"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="My Awesome Project"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="projectDescription">Description</Label>
                  <Textarea
                    id="projectDescription"
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    placeholder="Brief description of your project..."
                    rows={3}
                  />
                </div>

                {/* File Upload */}
                {importMethod === "file" && (
                  <div className="space-y-2">
                    <Label htmlFor="files">Project Files *</Label>
                    <Input
                      id="files"
                      type="file"
                      multiple
                      onChange={(e) => setSelectedFiles(e.target.files)}
                      accept=".js,.jsx,.ts,.tsx,.py,.java,.cpp,.c,.h,.css,.html,.json,.md,.txt,.yml,.yaml,.xml,.sql"
                    />
                    <p className="text-sm text-muted-foreground">
                      Select multiple files. Supported: JS, TS, Python, Java, C++, HTML, CSS, JSON, MD, etc.
                    </p>
                  </div>
                )}

                {/* Git URL */}
                {importMethod === "url" && (
                  <div className="space-y-2">
                    <Label htmlFor="gitUrl">Git Repository URL *</Label>
                    <Input
                      id="gitUrl"
                      value={gitUrl}
                      onChange={(e) => setGitUrl(e.target.value)}
                      placeholder="https://github.com/username/repo.git"
                    />
                    <p className="text-sm text-muted-foreground">
                      Public repositories only. Private repos require access tokens.
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setImportMethod(null)}
                  >
                    Back
                  </Button>
                  <Button
                    onClick={importMethod === "file" ? handleFileImport : handleGitImport}
                    disabled={importMutation.isPending}
                  >
                    {importMutation.isPending ? "Importing..." : "Import Project"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Import Progress */
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Importing Project</h3>
              <p className="text-muted-foreground">
                AI is analyzing your project and generating documentation...
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{importProgress}%</span>
              </div>
              <Progress value={importProgress} className="h-2" />
            </div>

            <div className="space-y-3">
              {importSteps.map((step) => (
                <div key={step.id} className="flex items-center space-x-3">
                  <div className={`rounded-full p-1 ${
                    step.completed ? "bg-green-100 text-green-600" : "bg-muted text-muted-foreground"
                  }`}>
                    <CheckCircle className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{step.title}</p>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}