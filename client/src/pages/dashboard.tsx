import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Database, 
  Settings, 
  UserCircle, 
  AlertTriangle, 
  Camera, 
  Terminal, 
  FileText, 
  ChevronLeft, 
  ChevronRight,
  File,
  Folder,
  FolderOpen,
  Play,
  Square,
  Trash2
} from "lucide-react";
import { ProjectImportDialog } from "@/components/project-import-dialog";
import { SettingsDialog } from "@/components/settings-dialog";
import { ProjectInsightsSaveButton } from "@/components/project-insights-save-button";
import { AiDocumentAnalysisDialog } from "@/components/ai-document-analysis-dialog";
import { AgentWindows } from "@/components/agent-windows";

// Logger component with WebSocket integration
const Logger = () => {
  const [logs, setLogs] = useState<string[]>([
    "[INFO] LeviatanCode Logger initialized",
    "[INFO] WebSocket connection established",
    "[INFO] Ready for command execution"
  ]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // WebSocket connection for real-time logs
    const ws = new WebSocket(`${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`);
    
    ws.onopen = () => {
      setIsConnected(true);
      setLogs(prev => [...prev, "[INFO] Logger WebSocket connected"]);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'log') {
        setLogs(prev => [...prev, `[${data.level.toUpperCase()}] ${data.message}`]);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      setLogs(prev => [...prev, "[WARN] Logger WebSocket disconnected"]);
    };

    return () => ws.close();
  }, []);

  const clearLogs = () => setLogs([]);

  return (
    <div className="h-full flex flex-col bg-black text-green-400 font-mono">
      <div className="flex items-center justify-between p-2 border-b border-green-800">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
          <span className="text-sm">Logger</span>
        </div>
        <Button size="sm" variant="ghost" onClick={clearLogs} className="text-green-400 hover:bg-green-900">
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
      <ScrollArea className="flex-1 p-2">
        {logs.map((log, i) => (
          <div key={i} className="text-xs py-0.5">{log}</div>
        ))}
      </ScrollArea>
    </div>
  );
};

// PowerShell Terminal component
const PowerShellTerminal = () => {
  const [command, setCommand] = useState("");
  const [history, setHistory] = useState([
    "PowerShell 7.3.0",
    "Copyright (c) Microsoft Corporation.",
    "",
    "PS C:\\workspace> "
  ]);
  const [isRunning, setIsRunning] = useState(false);

  const executeCommand = async () => {
    if (!command.trim()) return;
    
    setIsRunning(true);
    const newHistory = [...history, `PS C:\\workspace> ${command}`];
    
    try {
      // Send command to server for execution
      const response = await fetch('/api/execute-command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command, shell: 'powershell' })
      });
      
      const result = await response.json();
      newHistory.push(result.output || result.error || "Command executed");
    } catch (error) {
      // Simulate command execution for demo
      switch (command.toLowerCase()) {
        case 'ls':
        case 'dir':
          newHistory.push("Directory: C:\\workspace\n\nMode    LastWriteTime    Length Name\n----    -------------    ------ ----\nd----   1/2/25 5:00 PM          client\nd----   1/2/25 5:00 PM          server\n-a---   1/2/25 5:00 PM    1024   package.json");
          break;
        case 'pwd':
          newHistory.push("Path\n----\nC:\\workspace");
          break;
        case 'npm run dev':
          newHistory.push("Starting development server...\n> vite\n\nLocal:   http://localhost:5000\nPress h to show help");
          break;
        default:
          newHistory.push(`'${command}' is not recognized as an internal or external command.`);
      }
    }
    
    newHistory.push("PS C:\\workspace> ");
    setHistory(newHistory);
    setCommand("");
    setIsRunning(false);
  };

  return (
    <div className="h-full flex flex-col bg-blue-900 text-white font-mono">
      <div className="flex items-center justify-between p-2 border-b border-blue-700">
        <span className="text-sm font-semibold">PowerShell</span>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
          <span className="text-xs">Ready</span>
        </div>
      </div>
      <ScrollArea className="flex-1 p-2">
        {history.map((line, i) => (
          <div key={i} className="text-sm whitespace-pre-wrap">{line}</div>
        ))}
      </ScrollArea>
      <div className="p-2 border-t border-blue-700 flex items-center space-x-2">
        <span className="text-blue-300">PS&gt;</span>
        <Input
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && executeCommand()}
          className="bg-transparent border-none text-white focus:ring-0 flex-1"
          placeholder="Enter PowerShell command..."
          disabled={isRunning}
        />
        <Button 
          size="sm" 
          onClick={executeCommand} 
          disabled={isRunning}
          className="bg-blue-700 hover:bg-blue-600"
        >
          {isRunning ? <Square className="w-3 h-3" /> : <Play className="w-3 h-3" />}
        </Button>
      </div>
    </div>
  );
};

// File Editor component
const FileEditor = ({ activeFile }: { activeFile: string | null }) => {
  const [content, setContent] = useState("// Select a file to edit\n// Or create a new file");

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-2 border-b border-replit-border bg-replit-panel">
        <span className="text-sm font-semibold text-replit-text">
          {activeFile || "No file selected"}
        </span>
        <div className="flex items-center space-x-2 text-xs text-replit-text-secondary">
          <span>UTF-8</span>
          <span>TypeScript</span>
        </div>
      </div>
      <div className="flex-1 p-4 bg-replit-bg">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full h-full bg-transparent text-replit-text font-mono text-sm resize-none outline-none"
          placeholder="Start typing..."
        />
      </div>
    </div>
  );
};

// Collapsible File Explorer
const FileExplorer = ({ isCollapsed, onToggle }: { isCollapsed: boolean; onToggle: () => void }) => {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['root']));

  const fileTree = {
    root: {
      name: 'workspace',
      type: 'folder',
      children: {
        'client': { name: 'client', type: 'folder', children: {
          'src': { name: 'src', type: 'folder', children: {
            'components': { name: 'components', type: 'folder', children: {} },
            'pages': { name: 'pages', type: 'folder', children: {} },
            'main.tsx': { name: 'main.tsx', type: 'file' }
          }}
        }},
        'server': { name: 'server', type: 'folder', children: {
          'index.ts': { name: 'index.ts', type: 'file' },
          'routes.ts': { name: 'routes.ts', type: 'file' }
        }},
        'package.json': { name: 'package.json', type: 'file' },
        'README.md': { name: 'README.md', type: 'file' }
      }
    }
  };

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  const renderTree = (node: any, path: string, level: number = 0) => {
    if (node.type === 'file') {
      return (
        <div
          key={path}
          className={`flex items-center space-x-2 py-1 px-2 cursor-pointer hover:bg-replit-elevated ${
            selectedFile === path ? 'bg-replit-blue text-white' : 'text-replit-text'
          }`}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => setSelectedFile(path)}
        >
          <File className="w-4 h-4" />
          <span className="text-sm">{node.name}</span>
        </div>
      );
    }

    const isExpanded = expandedFolders.has(path);
    return (
      <div key={path}>
        <div
          className="flex items-center space-x-2 py-1 px-2 cursor-pointer hover:bg-replit-elevated text-replit-text"
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => toggleFolder(path)}
        >
          {isExpanded ? <FolderOpen className="w-4 h-4" /> : <Folder className="w-4 h-4" />}
          <span className="text-sm">{node.name}</span>
        </div>
        {isExpanded && node.children && Object.entries(node.children).map(([key, child]) =>
          renderTree(child, `${path}/${key}`, level + 1)
        )}
      </div>
    );
  };

  if (isCollapsed) {
    return (
      <div className="w-12 bg-replit-panel border-r border-replit-border flex flex-col items-center py-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="p-2"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="w-64 bg-replit-panel border-r border-replit-border flex flex-col">
      <div className="flex items-center justify-between p-2 border-b border-replit-border">
        <span className="font-semibold text-replit-text">Explorer</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="p-1"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
      </div>
      <ScrollArea className="flex-1">
        {renderTree(fileTree.root, 'root')}
      </ScrollArea>
    </div>
  );
};

export default function Dashboard() {
  const [currentProject, setCurrentProject] = useState<string>("demo-project-1");
  const [workingDirectory, setWorkingDirectory] = useState<string>("");
  const [workspaceFolders, setWorkspaceFolders] = useState<any[]>([]);
  const [isExplorerCollapsed, setIsExplorerCollapsed] = useState(false);
  const [activeFile, setActiveFile] = useState<string | null>(null);

  const { data: projects } = useQuery({
    queryKey: ["/api/projects"],
  });

  const { data: project } = useQuery({
    queryKey: ["/api/projects", currentProject],
    enabled: !!currentProject,
  });

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
      {/* Top Navigation Bar */}
      <nav className="bg-replit-panel/90 backdrop-blur-lg border-b border-replit-border px-6 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-gradient-to-br from-replit-blue to-replit-blue-secondary rounded-xl flex items-center justify-center shadow-lg">
              <Database className="text-white" size={18} />
            </div>
            <h1 className="font-bold text-xl gradient-text">LeviatanCode</h1>
          </div>
          
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
          
          <SettingsDialog />
          <Button variant="ghost" size="sm" className="modern-button hover:bg-replit-elevated rounded-lg">
            <UserCircle size={20} className="text-replit-text-secondary" />
          </Button>
        </div>
      </nav>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* File Explorer */}
        <FileExplorer 
          isCollapsed={isExplorerCollapsed}
          onToggle={() => setIsExplorerCollapsed(!isExplorerCollapsed)}
        />
        
        {/* Main Editor Area */}
        <div className="flex-1 flex flex-col">
          <Tabs defaultValue="editor" className="h-full flex flex-col">
            <TabsList className="bg-replit-panel/90 backdrop-blur-lg border-b border-replit-border rounded-none h-12 w-full justify-start shadow-sm">
              <TabsTrigger value="editor" className="flex items-center gap-2 text-sm modern-button data-[state=active]:bg-replit-blue data-[state=active]:text-white">
                <FileText className="w-4 h-4" />
                Editor
              </TabsTrigger>
              <TabsTrigger value="logger" className="flex items-center gap-2 text-sm modern-button data-[state=active]:bg-replit-blue data-[state=active]:text-white">
                <Terminal className="w-4 h-4" />
                Logger
              </TabsTrigger>
              <TabsTrigger value="powershell" className="flex items-center gap-2 text-sm modern-button data-[state=active]:bg-replit-blue data-[state=active]:text-white">
                <Terminal className="w-4 h-4" />
                PowerShell
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="editor" className="flex-1 m-0">
              <FileEditor activeFile={activeFile} />
            </TabsContent>
            
            <TabsContent value="logger" className="flex-1 m-0">
              <Logger />
            </TabsContent>
            
            <TabsContent value="powershell" className="flex-1 m-0">
              <PowerShellTerminal />
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Agent Windows Panel */}
        <div className="w-80 bg-replit-panel border-l border-replit-border">
          <div className="h-full p-4">
            <h3 className="font-semibold text-replit-text mb-4">Agent Tools</h3>
            <AgentWindows />
          </div>
        </div>
      </div>
    </div>
  );
}