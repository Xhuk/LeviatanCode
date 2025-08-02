import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Upload, FolderOpen, GitBranch, FileText, CheckCircle, AlertCircle, Loader2, Brain } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ProjectImportDialogProps {
  onProjectImported?: (projectId: string) => void;
}

export function ProjectImportDialog({ onProjectImported }: ProjectImportDialogProps) {
  const [open, setOpen] = useState(false);
  const [importMethod, setImportMethod] = useState<"file" | "git">("file");
  const [files, setFiles] = useState<FileList | null>(null);
  const [gitUrl, setGitUrl] = useState("");
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [projectPath, setProjectPath] = useState("");
  const [analysisStep, setAnalysisStep] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const importMutation = useMutation({
    mutationFn: async (data: FormData | { gitUrl: string; name: string; description: string; projectPath: string }) => {
      if (data instanceof FormData) {
        return apiRequest("/api/projects/import/files", {
          method: "POST",
          body: data,
        });
      } else {
        return apiRequest("/api/projects/import/git", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      }
    },
    onSuccess: (data) => {
      toast({
        title: "Project imported successfully",
        description: "AI analysis has begun. You can start working with your project.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      onProjectImported?.(data.projectId);
      setOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Import failed",
        description: error.message || "Failed to import project. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFiles(null);
    setGitUrl("");
    setProjectName("");
    setProjectDescription("");
    setProjectPath("");
    setAnalysisStep(0);
  };

  const handleFileImport = () => {
    if (!files || files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select files to import.",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    Array.from(files).forEach((file) => {
      formData.append("files", file);
    });
    formData.append("name", projectName);
    formData.append("description", projectDescription);
    formData.append("projectPath", projectPath || ".");

    importMutation.mutate(formData);
  };

  const handleGitImport = () => {
    if (!gitUrl.trim()) {
      toast({
        title: "Git URL required",
        description: "Please enter a valid Git repository URL.",
        variant: "destructive",
      });
      return;
    }

    importMutation.mutate({
      gitUrl: gitUrl.trim(),
      name: projectName,
      description: projectDescription,
      projectPath: projectPath || ".",
    });
  };

  const analysisSteps = [
    { id: 0, name: "Scanning files", description: "Analyzing project structure" },
    { id: 1, name: "Detecting framework", description: "Identifying technology stack" },
    { id:2, name: "Analyzing dependencies", description: "Reading package.json, requirements.txt, etc." },
    { id: 3, name: "Generating documentation", description: "Creating setup instructions" },
    { id: 4, name: "Complete", description: "Ready to run!" },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
          <Upload className="mr-2 h-4 w-4" />
          Import Project
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg w-full h-auto max-h-[80vh] top-[10vh] transform-none overflow-hidden">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 rounded-lg opacity-75 blur-sm animate-pulse -z-10"></div>
        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 rounded-lg animate-gradient-x -z-10"></div>
        <div className="overflow-visible">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-white">
              <FolderOpen className="h-5 w-5" />
              <span>Import Project for AI Analysis</span>
            </DialogTitle>
            <DialogDescription className="text-white/90">
              Import your existing project and let AI analyze it to determine how to run and debug it.
            </DialogDescription>
          </DialogHeader>

        {importMutation.isPending ? (
          <div className="space-y-4 py-4">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
              <h3 className="text-lg font-semibold mb-2">Importing and Analyzing Project</h3>
              <p className="text-sm text-muted-foreground">
                AI is analyzing your project structure and determining the best way to run it.
              </p>
            </div>
            
            <div className="space-y-3">
              {analysisSteps.map((step, index) => (
                <div key={step.id} className="flex items-center space-x-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    index <= analysisStep ? "bg-green-500" : index === analysisStep + 1 ? "bg-blue-500" : "bg-gray-300"
                  }`}>
                    {index < analysisStep ? (
                      <CheckCircle className="h-4 w-4 text-white" />
                    ) : index === analysisStep ? (
                      <Loader2 className="h-4 w-4 text-white animate-spin" />
                    ) : (
                      <div className="w-2 h-2 bg-white rounded-full" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{step.name}</div>
                    <div className="text-xs text-muted-foreground">{step.description}</div>
                  </div>
                </div>
              ))}
            </div>
            
            <Progress value={(analysisStep / (analysisSteps.length - 1)) * 100} className="w-full" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Basic Info */}
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="projectName">Project Name</Label>
                <Input
                  id="projectName"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="My Awesome Project"
                  className="h-8"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="projectDescription">Description (Optional)</Label>
                <Input
                  id="projectDescription"
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="Brief description..."
                  className="h-8"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="projectPath">Project Path (Optional)</Label>
                <Input
                  id="projectPath"
                  value={projectPath}
                  onChange={(e) => setProjectPath(e.target.value)}
                  placeholder="./my-project"
                  className="h-8"
                />
              </div>
            </div>


            {/* Import Method Selection */}
            <Tabs value={importMethod} onValueChange={(value) => setImportMethod(value as "file" | "git")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="file" className="flex items-center space-x-2">
                  <Upload className="h-4 w-4" />
                  <span>Upload Files</span>
                </TabsTrigger>
                <TabsTrigger value="git" className="flex items-center space-x-2">
                  <GitBranch className="h-4 w-4" />
                  <span>Git Repository</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="file" className="space-y-3">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Upload Project Files</CardTitle>
                    <CardDescription className="text-sm">
                      Select files or archive (.zip, .tar.gz) containing your project.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
                        <Input
                          type="file"
                          multiple
                          onChange={(e) => setFiles(e.target.files)}
                          className="hidden"
                          id="file-upload"
                          accept=".zip,.tar.gz,.js,.ts,.jsx,.tsx,.py,.java,.cpp,.c,.html,.css,.json,.md,.txt,.yml,.yaml"
                        />
                        <label htmlFor="file-upload" className="cursor-pointer">
                          <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                          <p className="text-sm font-medium">Click to upload files</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Supports source code, configs, and archives
                          </p>
                        </label>
                      </div>
                      
                      {files && files.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Selected files:</p>
                          <div className="max-h-32 overflow-y-auto space-y-1">
                            {Array.from(files).map((file, index) => (
                              <div key={index} className="flex items-center space-x-2 text-xs bg-gray-50 dark:bg-gray-800 p-2 rounded">
                                <FileText className="h-3 w-3" />
                                <span className="truncate">{file.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {(file.size / 1024).toFixed(1)}KB
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <Button 
                        onClick={handleFileImport} 
                        disabled={!files || files.length === 0 || !projectName.trim()}
                        className="w-full"
                      >
                        Import and Analyze Project
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="git" className="space-y-3">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Clone Git Repository</CardTitle>
                    <CardDescription className="text-sm">
                      Import from GitHub, GitLab, or any Git repository.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label htmlFor="gitUrl">Repository URL</Label>
                        <Input
                          id="gitUrl"
                          value={gitUrl}
                          onChange={(e) => setGitUrl(e.target.value)}
                          placeholder="https://github.com/username/repository.git"
                          className="h-8"
                        />
                      </div>
                      
                      <Button 
                        onClick={handleGitImport} 
                        disabled={!gitUrl.trim() || !projectName.trim()}
                        className="w-full"
                      >
                        Clone and Analyze Repository
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
        </div>
      </DialogContent>
    </Dialog>
  );
}