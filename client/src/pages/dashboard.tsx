import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import Editor from "@monaco-editor/react";
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
  Trash2,
  Globe,
  Monitor
} from "lucide-react";
import { ProjectImportDialog } from "@/components/project-import-dialog";
import { SettingsDialog } from "@/components/settings-dialog";
import { ProjectInsightsSaveButton } from "@/components/project-insights-save-button";
import { AiDocumentAnalysisDialog } from "@/components/ai-document-analysis-dialog";

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

// File Editor component with Monaco Editor
const FileEditor = ({ activeFile, fileName }: { activeFile: string | null; fileName: string | null }) => {
  const [content, setContent] = useState("// Select a file to edit\n// Or create a new file");
  const [language, setLanguage] = useState("javascript");

  // Get language based on file extension
  const getLanguageFromExtension = (filename: string): string => {
    const extension = filename.split('.').pop()?.toLowerCase();
    const languageMap: { [key: string]: string } = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'json': 'json',
      'html': 'html',
      'htm': 'html',
      'css': 'css',
      'scss': 'scss',
      'sass': 'sass',
      'less': 'less',
      'py': 'python',
      'java': 'java',
      'cs': 'csharp',
      'cpp': 'cpp',
      'c': 'c',
      'h': 'c',
      'hpp': 'cpp',
      'go': 'go',
      'rs': 'rust',
      'php': 'php',
      'rb': 'ruby',
      'swift': 'swift',
      'kt': 'kotlin',
      'dart': 'dart',
      'xml': 'xml',
      'md': 'markdown',
      'sql': 'sql',
      'sh': 'shell',
      'bash': 'shell',
      'zsh': 'shell',
      'ps1': 'powershell',
      'bat': 'bat',
      'cmd': 'bat',
      'yml': 'yaml',
      'yaml': 'yaml',
      'toml': 'toml',
      'ini': 'ini',
      'dockerfile': 'dockerfile',
      'r': 'r',
      'scala': 'scala',
      'clj': 'clojure',
      'ex': 'elixir',
      'exs': 'elixir',
      'pl': 'perl',
      'lua': 'lua',
      'vim': 'vim'
    };
    return languageMap[extension || ''] || 'plaintext';
  };

  // Update content and language when file changes
  useEffect(() => {
    if (activeFile && fileName) {
      const detectedLanguage = getLanguageFromExtension(fileName);
      setLanguage(detectedLanguage);
      
      // Generate sample content based on file type
      const extension = fileName.split('.').pop()?.toLowerCase();
      switch (extension) {
        case 'tsx':
        case 'ts':
          setContent(`// ${fileName}\nimport React from 'react';\n\ninterface Props {\n  title: string;\n}\n\nconst Component: React.FC<Props> = ({ title }) => {\n  return (\n    <div className="container">\n      <h1>{title}</h1>\n      <p>Hello from {fileName}</p>\n    </div>\n  );\n};\n\nexport default Component;`);
          break;
        case 'js':
        case 'jsx':
          setContent(`// ${fileName}\nconst ${fileName.replace(/\.(js|jsx)$/, '')} = () => {\n  console.log('Hello from ${fileName}');\n  \n  // Add your logic here\n  return {\n    message: 'Component loaded successfully'\n  };\n};\n\nmodule.exports = ${fileName.replace(/\.(js|jsx)$/, '')};`);
          break;
        case 'json':
          setContent(`{\n  "name": "${fileName.replace('.json', '')}",\n  "version": "1.0.0",\n  "description": "Project configuration",\n  "main": "index.js",\n  "scripts": {\n    "start": "node index.js",\n    "dev": "nodemon index.js"\n  },\n  "dependencies": {},\n  "devDependencies": {}\n}`);
          break;
        case 'md':
          setContent(`# ${fileName.replace('.md', '')}\n\nThis is a markdown file for ${fileName}.\n\n## Features\n\n- **Feature 1**: Description here\n- **Feature 2**: Description here\n- **Feature 3**: Description here\n\n## Code Example\n\n\`\`\`javascript\nconst example = () => {\n  console.log('Hello World!');\n};\n\`\`\`\n\n## Usage\n\nAdd your content and documentation here.\n\n### Installation\n\n\`\`\`bash\nnpm install\n\`\`\`\n\n### Running\n\n\`\`\`bash\nnpm start\n\`\`\``);
          break;
        case 'py':
          setContent(`# ${fileName}\n\ndef main():\n    \"\"\"\n    Main function for ${fileName}\n    \"\"\"\n    print(f"Hello from {fileName}")\n    \n    # Add your Python logic here\n    result = process_data()\n    return result\n\ndef process_data():\n    \"\"\"\n    Process data function\n    \"\"\"\n    data = [1, 2, 3, 4, 5]\n    processed = [x * 2 for x in data]\n    return processed\n\nif __name__ == "__main__":\n    main()`);
          break;
        case 'css':
          setContent(`/* ${fileName} */\n\n:root {\n  --primary-color: #007acc;\n  --secondary-color: #f0f0f0;\n  --text-color: #333;\n  --border-radius: 4px;\n}\n\n* {\n  margin: 0;\n  padding: 0;\n  box-sizing: border-box;\n}\n\nbody {\n  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;\n  color: var(--text-color);\n  line-height: 1.6;\n}\n\n.container {\n  max-width: 1200px;\n  margin: 0 auto;\n  padding: 20px;\n}\n\n.btn {\n  background: var(--primary-color);\n  color: white;\n  border: none;\n  padding: 10px 20px;\n  border-radius: var(--border-radius);\n  cursor: pointer;\n  transition: background 0.3s ease;\n}\n\n.btn:hover {\n  background: darken(var(--primary-color), 10%);\n}`);
          break;
        case 'html':
          setContent(`<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>${fileName.replace('.html', '')}</title>\n    <link rel="stylesheet" href="style.css">\n</head>\n<body>\n    <div class="container">\n        <header>\n            <h1>Welcome to ${fileName}</h1>\n        </header>\n        \n        <main>\n            <section class="content">\n                <p>This is the main content area.</p>\n                <button id="actionBtn" class="btn">Click Me</button>\n            </section>\n        </main>\n        \n        <footer>\n            <p>&copy; 2025 Your Project Name</p>\n        </footer>\n    </div>\n    \n    <script src="script.js"></script>\n</body>\n</html>`);
          break;
        default:
          setContent(`// ${fileName}\n// Content of ${fileName}\n// Edit this file...\n\n// File type: ${extension}\n// Language: ${detectedLanguage}`);
      }
    } else {
      setContent("// Select a file to edit\n// Or create a new file");
      setLanguage("javascript");
    }
  }, [activeFile, fileName]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-2 border-b border-replit-border bg-replit-panel">
        <span className="text-sm font-semibold text-replit-text">
          {fileName || "No file selected"}
        </span>
        <div className="flex items-center space-x-2 text-xs text-replit-text-secondary">
          <span>UTF-8</span>
          <span>TypeScript</span>
        </div>
      </div>
      <div className="flex-1 bg-replit-bg">
        <Editor
          value={content}
          language={language}
          onChange={(value) => setContent(value || "")}
          theme="vs-dark"
          options={{
            minimap: { enabled: true },
            fontSize: 14,
            fontFamily: '"Fira Code", "JetBrains Mono", "Consolas", "Monaco", monospace',
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            insertSpaces: true,
            wordWrap: "on",
            bracketPairColorization: { enabled: true },
            guides: {
              bracketPairs: true,
              indentation: true
            },
            suggest: {
            },
            quickSuggestions: {
              other: true,
              comments: true,
              strings: true
            },
            parameterHints: {
              enabled: true
            },
            hover: {
              enabled: true
            },
            contextmenu: true,
            mouseWheelZoom: true,
            cursorBlinking: "blink",
            cursorStyle: "line",
            renderWhitespace: "selection",
            smoothScrolling: true,
            folding: true,
            foldingHighlight: true,
            showFoldingControls: "always",
            matchBrackets: "always",
            autoIndent: "full",
            formatOnPaste: true,
            formatOnType: true,
            colorDecorators: true,
            codeLens: true,
            lightbulb: {
              enabled: "On"
            }
          }}
          loading={<div className="flex items-center justify-center h-full text-replit-text">Loading editor...</div>}
        />
      </div>
    </div>
  );
};

// Collapsible File Explorer
const FileExplorer = ({ isCollapsed, onToggle, onFileSelect }: { 
  isCollapsed: boolean; 
  onToggle: () => void;
  onFileSelect: (filePath: string, fileName: string) => void;
}) => {
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
          onClick={() => {
            setSelectedFile(path);
            onFileSelect(path, node.name);
          }}
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
  const [isAgentMenuCollapsed, setIsAgentMenuCollapsed] = useState(false);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [activeFileName, setActiveFileName] = useState<string | null>(null);

  const handleFileSelect = (filePath: string, fileName: string) => {
    setActiveFile(filePath);
    setActiveFileName(fileName);
  };

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
        {/* Agent Tools Menu */}
        <div className={`${isAgentMenuCollapsed ? 'w-12' : 'w-64'} bg-replit-panel border-r border-replit-border transition-all duration-300 flex flex-col`}>
          <div className="p-3 border-b border-replit-border flex items-center justify-between">
            {!isAgentMenuCollapsed && (
              <h3 className="font-semibold text-replit-text text-sm">Agent Tools</h3>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsAgentMenuCollapsed(!isAgentMenuCollapsed)}
              className="p-1 h-8 w-8"
            >
              {isAgentMenuCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </Button>
          </div>
          <div className="flex-1 p-2">
            {isAgentMenuCollapsed ? (
              <div className="space-y-2">
                <Button variant="ghost" size="sm" className="w-full h-10 p-2 flex items-center justify-center">
                  <Terminal className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className="w-full h-10 p-2 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className="w-full h-10 p-2 flex items-center justify-center">
                  <Globe className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className="w-full h-10 p-2 flex items-center justify-center">
                  <Monitor className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className="w-full h-10 p-2 flex items-center justify-center">
                  <Database className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className="w-full h-10 p-2 flex items-center justify-center">
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start gap-3 p-3 h-auto hover:bg-replit-elevated"
                >
                  <Terminal className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-medium text-sm">Interactive Terminal</div>
                    <div className="text-xs text-replit-text-secondary">Execute commands and scripts</div>
                  </div>
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start gap-3 p-3 h-auto hover:bg-replit-elevated"
                >
                  <FileText className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-medium text-sm">File Analysis</div>
                    <div className="text-xs text-replit-text-secondary">Analyze project structure</div>
                  </div>
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start gap-3 p-3 h-auto hover:bg-replit-elevated"
                >
                  <Globe className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-medium text-sm">Web Preview</div>
                    <div className="text-xs text-replit-text-secondary">Live application preview</div>
                  </div>
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start gap-3 p-3 h-auto hover:bg-replit-elevated"
                >
                  <Monitor className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-medium text-sm">System Monitor</div>
                    <div className="text-xs text-replit-text-secondary">CPU, memory, and processes</div>
                  </div>
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start gap-3 p-3 h-auto hover:bg-replit-elevated"
                >
                  <Database className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-medium text-sm">Database Console</div>
                    <div className="text-xs text-replit-text-secondary">Query and manage database</div>
                  </div>
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start gap-3 p-3 h-auto hover:bg-replit-elevated"
                >
                  <Settings className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-medium text-sm">Configuration</div>
                    <div className="text-xs text-replit-text-secondary">Environment settings</div>
                  </div>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* File Explorer */}
        <FileExplorer 
          isCollapsed={isExplorerCollapsed}
          onToggle={() => setIsExplorerCollapsed(!isExplorerCollapsed)}
          onFileSelect={handleFileSelect}
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
              <FileEditor activeFile={activeFile} fileName={activeFileName} />
            </TabsContent>
            
            <TabsContent value="logger" className="flex-1 m-0">
              <Logger />
            </TabsContent>
            
            <TabsContent value="powershell" className="flex-1 m-0">
              <PowerShellTerminal />
            </TabsContent>
          </Tabs>
        </div>
        

      </div>
    </div>
  );
}