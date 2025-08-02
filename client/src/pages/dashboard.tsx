import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Database, Play, Settings, UserCircle, AlertTriangle, Camera, Terminal, Globe, GitBranch, Monitor } from "lucide-react";
import { ProjectImportDialog } from "@/components/project-import-dialog";
import { SettingsDialog } from "@/components/settings-dialog";
import { ProjectInsightsSaveButton } from "@/components/project-insights-save-button";
import { AiDocumentAnalysisDialog } from "@/components/ai-document-analysis-dialog";
import { AgentWindows } from "@/components/agent-windows";

export default function Dashboard() {
  const [currentProject, setCurrentProject] = useState<string>("demo-project-1");
  const [workingDirectory, setWorkingDirectory] = useState<string>("");
  const [workspaceFolders, setWorkspaceFolders] = useState<any[]>([]);

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
    if (workingDirData && typeof workingDirData === 'object' && workingDirData !== null && 'workingDirectory' in workingDirData) {
      setWorkingDirectory((workingDirData as any).workingDirectory);
    }
  }, [workingDirData]);

  useEffect(() => {
    if (foldersData && typeof foldersData === 'object' && foldersData !== null && 'folders' in foldersData) {
      setWorkspaceFolders((foldersData as any).folders);
    }
  }, [foldersData]);

  return (
    <div className="h-screen bg-replit-dark text-replit-text flex flex-col overflow-hidden">
      {/* Modern Top Navigation Bar */}
      <nav className="bg-replit-panel/90 backdrop-blur-lg border-b border-replit-border px-6 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-gradient-to-br from-replit-blue to-replit-blue-secondary rounded-xl flex items-center justify-center shadow-lg">
              <Database className="text-white" size={18} />
            </div>
            <h1 className="font-bold text-xl gradient-text">LeviatanCode</h1>
          </div>
          <Button 
            onClick={() => {
              const dir = prompt("Enter working directory path:", workingDirectory || "C:\\Development");
              if (dir) {
                setWorkingDirectory(dir);
                fetch("/api/settings/working-directory", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ workingDirectory: dir })
                }).then(() => {
                  window.location.reload();
                });
              }
            }}
            variant="outline" 
            size="sm"
            className="modern-button border-replit-border hover:bg-replit-elevated text-replit-text-secondary hover:text-replit-text"
          >
            <Settings className="mr-2 h-4 w-4" />
            Set Working Directory
          </Button>
          <div className="flex items-center space-x-2">
            <span className="text-replit-text-secondary text-sm">Workspace:</span>
            <Select value={currentProject} onValueChange={setCurrentProject}>
              <SelectTrigger className="w-52 bg-replit-elevated border-replit-border rounded-lg modern-button">
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
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <AlertTriangle className="h-3 w-3 text-yellow-400" />
              <span className="text-xs text-yellow-300 font-medium">Free Tier</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
              <span className="text-sm text-replit-text-secondary">AI Online</span>
            </div>
          </div>
          <ProjectImportDialog onProjectImported={setCurrentProject} />
          <ProjectInsightsSaveButton 
            projectId={currentProject} 
            projectName={(project && typeof project === 'object' && project !== null && 'name' in project ? (project as any).name : "Current Project")}
            projectPath="."
          />
          
          <div className="flex items-center space-x-2">
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
                    video: true
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
              className="modern-button border-replit-border hover:bg-replit-elevated text-replit-text-secondary hover:text-replit-text"
            >
              <Camera size={16} />
            </Button>
            

            
            {/* Agent Windows - Main Interface */}
            <AgentWindows />
            
            <Button className="modern-button bg-replit-blue hover:bg-replit-blue-secondary text-white px-4 py-2 shadow-lg hover:shadow-xl">
              <Play size={16} className="mr-2" />
              Run Project
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <SettingsDialog />
            <Button variant="ghost" size="sm" className="modern-button hover:bg-replit-elevated rounded-lg">
              <UserCircle size={20} className="text-replit-text-secondary" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Workspace - Clean Interface */}
      <div className="flex-1 overflow-hidden bg-gradient-to-br from-replit-bg via-replit-bg to-replit-elevated">
        <div className="h-full flex items-center justify-center">
          <div className="text-center text-replit-text-secondary">
            <div className="mb-4">
              <Terminal className="w-16 h-16 mx-auto text-replit-text-muted" />
            </div>
            <h2 className="text-xl font-semibold mb-2">LeviatanCode Development Environment</h2>
            <p className="text-sm text-replit-text-muted mb-6">Use the agent tools above to access terminal, file analysis, web preview, and more</p>
            <div className="flex items-center justify-center space-x-4 text-xs">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Server Running</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span>WebSocket Connected</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <span>AI Ready</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Status Bar */}
      <div className="bg-replit-panel/90 backdrop-blur-lg border-t border-replit-border px-6 py-2 flex items-center justify-between text-xs shadow-lg">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <GitBranch size={14} className="text-orange-400" />
            <span className="text-replit-text-secondary">main</span>
            <span className="text-replit-success">✓</span>
          </div>
          <div className="flex items-center space-x-2">
            <Database size={14} className="text-blue-400" />
            <span className="text-replit-text-secondary">Project loaded</span>
          </div>
          <div className="flex items-center space-x-2">
            <Terminal size={14} className="text-purple-400" />
            <span className="text-replit-text-secondary">Last run: 2m ago</span>
          </div>
        </div>
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-replit-success rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
            <span className="text-replit-text-secondary">AI: Online</span>
          </div>
          <div className="flex items-center space-x-2">
            <Monitor size={14} className="text-yellow-400" />
            <span className="text-replit-text-secondary">Memory: 2.1GB</span>
          </div>
          <div className="text-replit-text-secondary font-mono">Ln 10, Col 45</div>
        </div>
      </div>
    </div>
  );
}
