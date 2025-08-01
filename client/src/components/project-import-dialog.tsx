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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FolderOpen className="h-5 w-5" />
            <span>Import Project for AI Analysis</span>
          </DialogTitle>
          <DialogDescription>
            Import your existing project and let AI analyze it to determine how to run and debug it.
          </DialogDescription>
        </DialogHeader>

        {importMutation.isPending ? (
          <div className="space-y-6 py-6">
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
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="projectName">Project Name</Label>
                <Input
                  id="projectName"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="My Awesome Project"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="projectDescription">Description (Optional)</Label>
                <Textarea
                  id="projectDescription"
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="Brief description of your project..."
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="projectPath">Project Path (Optional)</Label>
                <Input
                  id="projectPath"
                  value={projectPath}
                  onChange={(e) => setProjectPath(e.target.value)}
                  placeholder="./my-project or C:\Projects\MyApp"
                />
                <p className="text-xs text-muted-foreground">
                  Where to save the insightsproject.ia file. Defaults to current directory.
                </p>
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

              <TabsContent value="file" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Upload Project Files</CardTitle>
                    <CardDescription>
                      Select multiple files or a compressed archive (.zip, .tar.gz) containing your project.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
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

              <TabsContent value="git" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Clone Git Repository</CardTitle>
                    <CardDescription>
                      Import a project directly from GitHub, GitLab, or any Git repository.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="gitUrl">Repository URL</Label>
                        <Input
                          id="gitUrl"
                          value={gitUrl}
                          onChange={(e) => setGitUrl(e.target.value)}
                          placeholder="https://github.com/username/repository.git"
                        />
                      </div>
                      
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                        <div className="flex items-start space-x-2">
                          <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                          <div className="text-sm text-blue-700 dark:text-blue-300">
                            <p className="font-medium mb-1">Supported repositories</p>
                            <p>Public repositories from GitHub, GitLab, Bitbucket, and any Git hosting service.</p>
                          </div>
                        </div>
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

            {/* AI Analysis Info */}
            <div className="relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 rounded-lg opacity-75 blur-sm animate-pulse"></div>
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 rounded-lg animate-gradient-x"></div>
              <Card className="relative bg-white dark:bg-gray-900 border-0">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                        <Brain className="h-5 w-5 text-white" />
                      </div>
                      <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full opacity-30 animate-ping"></div>
                    </div>
                    <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent font-bold">
                      AI-Powered Project Analysis
                    </span>
                  </CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    Our intelligent system automatically analyzes your codebase to provide instant setup and execution guidance
                  </p>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-start space-x-3 p-3 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                      <div className="flex-shrink-0 w-6 h-6 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center mt-0.5">
                        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">Framework Detection</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Automatically identifies React, Django, Express, Next.js, and 50+ other frameworks</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3 p-3 rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center mt-0.5">
                        <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">Smart Command Generation</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Creates the exact commands needed to install, build, test, and run your project</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3 p-3 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
                      <div className="flex-shrink-0 w-6 h-6 bg-purple-100 dark:bg-purple-800 rounded-full flex items-center justify-center mt-0.5">
                        <CheckCircle className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">Dependency Analysis</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Scans package.json, requirements.txt, pom.xml and other config files</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3 p-3 rounded-lg bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20">
                      <div className="flex-shrink-0 w-6 h-6 bg-orange-100 dark:bg-orange-800 rounded-full flex items-center justify-center mt-0.5">
                        <CheckCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">Documentation Creation</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Generates comprehensive setup guides, architecture insights, and troubleshooting tips</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-lg">
                    <div className="flex items-center space-x-2 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Analysis typically completes in 10-30 seconds</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}