import { useState, useEffect } from "react";
import { Workspace } from "@/components/layout/workspace";
import { FileExplorer } from "@/components/panels/file-explorer";
import { EditorPanel } from "@/components/panels/editor-panel";
import { TerminalPanel } from "@/components/panels/terminal-panel";
import { AiChatPanel } from "@/components/panels/ai-chat-panel";
import { DocumentationPanel } from "@/components/panels/documentation-panel";
import { ExtractionPanel } from "@/components/panels/extraction-panel";
import { PromptTemplatesPanel } from "@/components/panels/prompt-templates-panel";
import { GitPanel } from "@/components/panels/git-panel";
import { ConsolePanel } from "@/components/panels/console-panel";
import { PreviewPanel } from "@/components/panels/preview-panel";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable-panels";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Database, Play, Settings, UserCircle, Cog, Brain, FileText, MessageSquare, AlertTriangle, Upload, FolderOpen, Sparkles, Camera, GitBranch, Terminal, Globe, ExternalLink, Monitor } from "lucide-react";
import { ServiceStatusIndicator } from "@/components/service-status-indicator";
import { ProjectImportDialog } from "@/components/project-import-dialog";
import { SettingsDialog } from "@/components/settings-dialog";
import { ProjectInsightsSaveButton } from "@/components/project-insights-save-button";
import { AiDocumentAnalysisDialog } from "@/components/ai-document-analysis-dialog";
import { AgentWindows } from "@/components/agent-windows";

export default function Dashboard() {
  const [currentProject, setCurrentProject] = useState<string>("demo-project-1");
  const [activeFile, setActiveFile] = useState<string>("");
  const [workingDirectory, setWorkingDirectory] = useState<string>("");
  const [workspaceFolders, setWorkspaceFolders] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("http://localhost:3000");

  const { data: projects } = useQuery({
    queryKey: ["/api/projects"],
  });

  const { data: project } = useQuery({
    queryKey: ["/api/projects", currentProject],
    enabled: !!currentProject,
  });

  // Fetch working directory and workspace folders
  const { data: workingDirData } = useQuery({
    queryKey: ["/api/settings/working-directory"],
  });

  const { data: foldersData } = useQuery({
    queryKey: ["/api/settings/workspace-folders"],
    enabled: !!workingDirectory,
  });

  useEffect(() => {
    if (workingDirData?.workingDirectory) {
      setWorkingDirectory(workingDirData.workingDirectory);
    }
  }, [workingDirData]);

  useEffect(() => {
    if (foldersData?.folders) {
      setWorkspaceFolders(foldersData.folders);
    }
  }, [foldersData]);

  return (
    <div className="h-screen bg-replit-dark text-replit-text flex flex-col overflow-hidden">
      {/* Top Navigation Bar */}
      <nav className="replit-panel border-b border-replit-border px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-replit-blue to-replit-blue-secondary rounded-lg flex items-center justify-center">
              <Database className="text-white" size={16} />
            </div>
            <h1 className="font-bold text-lg gradient-text">LeviatanCode</h1>
          </div>
          <Button 
            onClick={() => {
              const dir = prompt("Enter working directory path:", workingDirectory || "C:\\Development");
              if (dir) {
                setWorkingDirectory(dir);
                // Save to .env and refresh data
                fetch("/api/settings/working-directory", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ workingDirectory: dir })
                }).then(() => {
                  // Refresh working directory and folders data
                  window.location.reload();
                });
              }
            }}
            variant="outline" 
            size="sm"
            className="border-replit-border hover:bg-replit-elevated"
          >
            <Settings className="mr-2 h-4 w-4" />
            Set Working Directory
          </Button>
          <div className="flex items-center space-x-2">
            <span className="text-replit-text-secondary text-sm">Workspace:</span>
            <Select value={currentProject} onValueChange={setCurrentProject}>
              <SelectTrigger className="w-48 bg-replit-elevated border-replit-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {workspaceFolders.length > 0 ? (
                  workspaceFolders.map((folder: any) => (
                    <SelectItem key={folder.path} value={folder.name}>
                      {folder.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-workspace">No workspace folders</SelectItem>
                )}
              </SelectContent>
            </Select>
            
            {/* AI Analysis Button */}
            <AiDocumentAnalysisDialog 
              projectId={currentProject}
              workingDirectory={workingDirectory}
            />
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 px-2 py-1 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
              <AlertTriangle className="h-3 w-3 text-yellow-600 dark:text-yellow-400" />
              <span className="text-xs text-yellow-700 dark:text-yellow-300 font-medium">
                Free Tier
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-replit-text-secondary">AI Online</span>
            </div>
          </div>
          <ProjectImportDialog onProjectImported={setCurrentProject} />
          <ProjectInsightsSaveButton 
            projectId={currentProject} 
            projectName={project?.name || "Current Project"}
            projectPath="."
          />
          
          {/* Screenshot Button */}
          <Button 
            variant="outline" 
            size="sm"
            onClick={async () => {
              try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const video = document.createElement('video');
                
                const stream = await navigator.mediaDevices.getDisplayMedia({
                  video: { mediaSource: 'screen' }
                });
                
                video.srcObject = stream;
                video.play();
                
                video.addEventListener('loadedmetadata', () => {
                  canvas.width = video.videoWidth;
                  canvas.height = video.videoHeight;
                  ctx?.drawImage(video, 0, 0);
                  
                  const imageData = canvas.toDataURL('image/png');
                  console.log('Screenshot taken for chat input');
                  
                  stream.getTracks().forEach(track => track.stop());
                });
              } catch (error) {
                console.error('Screenshot failed:', error);
                alert('Screenshot failed. Please allow screen sharing permission.');
              }
            }}
            className="border-replit-border hover:bg-replit-elevated"
          >
            <Camera size={14} className="mr-1" />
            Screenshot
          </Button>
          
          {/* Preview Button */}
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              const url = prompt("Enter preview URL:", previewUrl);
              if (url) {
                setPreviewUrl(url);
                window.open(url, '_blank');
              }
            }}
            className="border-replit-border hover:bg-replit-elevated"
          >
            <Globe size={14} className="mr-1" />
            Preview
          </Button>
          
          {/* Agent Windows */}
          <AgentWindows 
            projectId={currentProject}
            workingDirectory={workingDirectory}
            previewUrl={previewUrl}
          />
          
          <Button className="bg-replit-blue hover:bg-replit-blue-secondary">
            <Play size={14} className="mr-1" />
            Run Project
          </Button>
          <div className="flex items-center space-x-1">
            <SettingsDialog />
            <Button variant="ghost" size="sm">
              <UserCircle size={16} className="text-replit-text-secondary" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Workspace */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* File Explorer */}
          <ResizablePanel defaultSize={15} minSize={10} maxSize={25}>
            <FileExplorer 
              workingDirectory={workingDirectory}
              selectedProject={currentProject}
              activeFile={activeFile}
              onFileSelect={setActiveFile}
            />
          </ResizablePanel>
          
          <ResizableHandle className="resizer" />
          
          {/* Editor Panel */}
          <ResizablePanel defaultSize={35} minSize={25}>
            <EditorPanel
              workingDirectory={workingDirectory}
              selectedProject={currentProject}
              activeFile={activeFile}
              onFileChange={setActiveFile}
            />
          </ResizablePanel>
          
          <ResizableHandle className="resizer" />
          
          {/* Terminal Panel */}
          <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
            <TerminalPanel projectId={currentProject} />
          </ResizablePanel>
          
          <ResizableHandle className="resizer" />
          
          {/* AI & Documentation Panel with Tabs */}
          <ResizablePanel defaultSize={30} minSize={25} maxSize={40}>
            <Tabs defaultValue="ai-chat" className="h-full flex flex-col">
              <TabsList className="replit-panel border-b border-replit-border rounded-none h-10 w-full justify-start">
                <TabsTrigger value="ai-chat" className="flex items-center gap-2 text-xs">
                  <MessageSquare className="w-3 h-3" />
                  AI Chat
                </TabsTrigger>
                <TabsTrigger value="git" className="flex items-center gap-2 text-xs">
                  <GitBranch className="w-3 h-3" />
                  Git
                </TabsTrigger>
                <TabsTrigger value="console" className="flex items-center gap-2 text-xs">
                  <Terminal className="w-3 h-3" />
                  Console
                </TabsTrigger>
                <TabsTrigger value="preview" className="flex items-center gap-2 text-xs">
                  <Monitor className="w-3 h-3" />
                  Preview
                </TabsTrigger>
                <TabsTrigger value="prompts" className="flex items-center gap-2 text-xs">
                  <Brain className="w-3 h-3" />
                  Prompts
                </TabsTrigger>
                <TabsTrigger value="docs" className="flex items-center gap-2 text-xs">
                  <FileText className="w-3 h-3" />
                  Docs
                </TabsTrigger>
                <TabsTrigger value="extraction" className="flex items-center gap-2 text-xs">
                  <Upload className="w-3 h-3" />
                  Extraction
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="ai-chat" className="flex-1 m-0">
                <AiChatPanel projectId={currentProject} />
              </TabsContent>
              
              <TabsContent value="git" className="flex-1 m-0">
                <GitPanel projectId={currentProject} workingDirectory={workingDirectory} />
              </TabsContent>
              
              <TabsContent value="console" className="flex-1 m-0">
                <ConsolePanel projectId={currentProject} />
              </TabsContent>
              
              <TabsContent value="preview" className="flex-1 m-0">
                <PreviewPanel previewUrl={previewUrl} />
              </TabsContent>
              
              <TabsContent value="prompts" className="flex-1 m-0">
                <PromptTemplatesPanel projectId={currentProject} />
              </TabsContent>
              
              <TabsContent value="docs" className="flex-1 m-0">
                <DocumentationPanel projectId={currentProject} />
              </TabsContent>
              
              <TabsContent value="extraction" className="flex-1 m-0">
                <ExtractionPanel />
              </TabsContent>
            </Tabs>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Status Bar */}
      <div className="replit-panel border-t border-replit-border px-4 py-1 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <i className="fab fa-git-alt text-orange-400"></i>
            <span className="text-replit-text-secondary">main</span>
            <span className="text-replit-success">✓</span>
          </div>
          <div className="flex items-center space-x-1">
            <Database size={12} className="text-blue-400" />
            <span className="text-replit-text-secondary">Project loaded</span>
          </div>
          <div className="flex items-center space-x-1">
            <i className="fas fa-clock text-purple-400"></i>
            <span className="text-replit-text-secondary">Last run: 2m ago</span>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-replit-success rounded-full"></div>
            <span className="text-replit-text-secondary">AI: Online</span>
          </div>
          <div className="flex items-center space-x-1">
            <i className="fas fa-memory text-yellow-400"></i>
            <span className="text-replit-text-secondary">Memory: 2.1GB</span>
          </div>
          <div className="text-replit-text-secondary">Ln 10, Col 45</div>
        </div>
      </div>
    </div>
  );
}
