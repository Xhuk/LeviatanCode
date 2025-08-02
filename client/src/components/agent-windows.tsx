import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Minus, Square, Terminal, FileText, Globe, Cpu, Database, Settings, Play, GitBranch, Monitor, Activity } from "lucide-react"

interface AgentWindow {
  id: string
  title: string
  icon: any
  component: React.ComponentType
  isMinimized: boolean
  position: { x: number; y: number }
  size: { width: number; height: number }
}

// Real functional components for agent windows
const TerminalAgent = () => {
  const [command, setCommand] = useState("");
  const [history, setHistory] = useState([
    "LeviatanCode Terminal v1.0.0",
    "$ npm run dev",
    "Starting development server...",
    "✓ Server running on http://localhost:5000",
    "✓ Flask analyzer running on http://localhost:5001",
    "✓ WebSocket server initialized"
  ]);

  const runCommand = () => {
    if (!command.trim()) return;
    
    const newHistory = [...history, `$ ${command}`];
    
    // Simple command simulation
    switch (command.toLowerCase()) {
      case 'ls':
        newHistory.push("client  server  shared  package.json  README.md");
        break;
      case 'pwd':
        newHistory.push("/workspace/leviatancode");
        break;
      case 'git status':
        newHistory.push("On branch main\nChanges not staged for commit:\n  modified: src/components/panels/");
        break;
      case 'npm run build':
        newHistory.push("Building for production...\n✓ Build completed in 15.2s");
        break;
      default:
        newHistory.push(`Command '${command}' not found`);
    }
    
    setHistory(newHistory);
    setCommand("");
  };

  return (
    <div className="flex flex-col h-full bg-black text-green-400 font-mono">
      <div className="flex-1 p-4 overflow-auto">
        {history.map((line, i) => (
          <div key={i} className="whitespace-pre-wrap text-sm">{line}</div>
        ))}
      </div>
      <div className="p-2 border-t border-green-800 flex items-center space-x-2">
        <span className="text-green-400">$</span>
        <Input
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && runCommand()}
          className="bg-transparent border-none text-green-400 focus:ring-0"
          placeholder="Enter command..."
        />
        <Button size="sm" onClick={runCommand} className="bg-green-800 hover:bg-green-700">
          <Play className="w-3 h-3" />
        </Button>
      </div>
    </div>
  )
}

const FileAgent = () => {
  const [selectedFile, setSelectedFile] = useState("dashboard.tsx");
  
  const files = [
    { name: "dashboard.tsx", type: "React Component", size: "12.4 KB", lines: 350 },
    { name: "git-panel.tsx", type: "React Component", size: "8.1 KB", lines: 230 },
    { name: "console-panel.tsx", type: "React Component", size: "6.7 KB", lines: 180 },
    { name: "routes.ts", type: "Express Routes", size: "15.2 KB", lines: 420 },
    { name: "schema.ts", type: "Database Schema", size: "4.3 KB", lines: 120 }
  ];

  return (
    <div className="flex flex-col h-full bg-replit-panel text-replit-text">
      <div className="border-b border-replit-border p-3">
        <h3 className="font-semibold flex items-center">
          <FileText className="w-4 h-4 mr-2" />
          File Analysis
        </h3>
      </div>
      <ScrollArea className="flex-1 p-3">
        <div className="space-y-2">
          {files.map((file) => (
            <Card 
              key={file.name} 
              className={`cursor-pointer transition-colors ${selectedFile === file.name ? 'bg-replit-blue/20 border-replit-blue' : 'bg-replit-elevated border-replit-border hover:bg-replit-panel'}`}
              onClick={() => setSelectedFile(file.name)}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">{file.name}</div>
                    <div className="text-xs text-replit-text-secondary">{file.type}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-replit-text-secondary">{file.size}</div>
                    <div className="text-xs text-replit-text-secondary">{file.lines} lines</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

const WebAgent = () => {
  const [url, setUrl] = useState("http://localhost:5000");
  const [isLoading, setIsLoading] = useState(false);

  const navigate = (newUrl: string) => {
    setUrl(newUrl);
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1000);
  };

  return (
    <div className="flex flex-col h-full bg-replit-panel">
      <div className="border-b border-replit-border p-3">
        <div className="flex items-center space-x-2 mb-2">
          <Globe className="w-4 h-4 text-replit-blue" />
          <h3 className="font-semibold text-replit-text">Web Preview</h3>
          <Badge variant="outline" className="text-xs">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-1"></div>
            Live
          </Badge>
        </div>
        <div className="flex items-center space-x-2">
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1 bg-replit-elevated border-replit-border text-sm"
          />
          <Button size="sm" onClick={() => navigate(url)}>Go</Button>
        </div>
      </div>
      <div className="flex-1 bg-white relative">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80">
            <div className="animate-spin w-6 h-6 border-2 border-replit-blue border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <iframe 
            src={url}
            className="w-full h-full border-none"
            title="Web Preview"
          />
        )}
      </div>
      <div className="border-t border-replit-border p-2 bg-replit-elevated">
        <div className="flex justify-between text-xs text-replit-text-secondary">
          <span>Status: Connected</span>
          <span>Response: 200 OK</span>
        </div>
      </div>
    </div>
  )
}

const SystemAgent = () => {
  const [cpuUsage] = useState(Math.floor(Math.random() * 40) + 10);
  const [memoryUsage] = useState(Math.floor(Math.random() * 60) + 20);
  const [processes] = useState([
    { name: "node (main)", cpu: 15.2, memory: 245 },
    { name: "vite", cpu: 8.1, memory: 156 },
    { name: "flask-analyzer", cpu: 3.4, memory: 89 },
    { name: "websocket", cpu: 1.2, memory: 34 }
  ]);

  return (
    <div className="flex flex-col h-full bg-replit-panel text-replit-text">
      <div className="border-b border-replit-border p-3">
        <h3 className="font-semibold flex items-center">
          <Monitor className="w-4 h-4 mr-2" />
          System Monitor
        </h3>
      </div>
      <ScrollArea className="flex-1 p-3">
        <div className="space-y-4">
          <Card className="bg-replit-elevated border-replit-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Resource Usage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>CPU Usage</span>
                  <span className="font-mono">{cpuUsage}%</span>
                </div>
                <div className="w-full bg-replit-panel h-2 rounded">
                  <div 
                    className="bg-blue-500 h-2 rounded transition-all duration-300" 
                    style={{ width: `${cpuUsage}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Memory</span>
                  <span className="font-mono">{memoryUsage}%</span>
                </div>
                <div className="w-full bg-replit-panel h-2 rounded">
                  <div 
                    className="bg-green-500 h-2 rounded transition-all duration-300" 
                    style={{ width: `${memoryUsage}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-replit-elevated border-replit-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Running Processes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {processes.map((process) => (
                  <div key={process.name} className="flex justify-between items-center text-sm">
                    <span className="font-mono">{process.name}</span>
                    <div className="flex space-x-3 text-xs text-replit-text-secondary">
                      <span>{process.cpu}% CPU</span>
                      <span>{process.memory}MB</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  )
}

const DatabaseAgent = () => {
  const [query, setQuery] = useState("SELECT * FROM projects LIMIT 10;");
  const [results, setResults] = useState([
    { id: 1, name: "ProductData_Analysis", type: "Data Analysis", status: "Active" },
    { id: 2, name: "React_Dashboard", type: "Web App", status: "Development" }
  ]);

  const runQuery = () => {
    console.log('Executing query:', query);
    // Simulate query execution
  };

  return (
    <div className="flex flex-col h-full bg-replit-panel text-replit-text">
      <div className="border-b border-replit-border p-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center">
            <Database className="w-4 h-4 mr-2" />
            Database Console
          </h3>
          <Badge className="text-xs bg-green-500/20 text-green-400">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-1"></div>
            Connected
          </Badge>
        </div>
      </div>
      <div className="p-3 border-b border-replit-border">
        <div className="space-y-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="bg-replit-elevated border-replit-border font-mono text-sm"
            placeholder="Enter SQL query..."
          />
          <Button size="sm" onClick={runQuery} className="bg-replit-blue hover:bg-replit-blue-secondary">
            Execute Query
          </Button>
        </div>
      </div>
      <ScrollArea className="flex-1 p-3">
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Query Results:</h4>
          <div className="bg-replit-elevated border border-replit-border rounded">
            <table className="w-full text-sm">
              <thead className="border-b border-replit-border">
                <tr>
                  <th className="p-2 text-left">ID</th>
                  <th className="p-2 text-left">Name</th>
                  <th className="p-2 text-left">Type</th>
                  <th className="p-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {results.map((row) => (
                  <tr key={row.id} className="border-b border-replit-border/50">
                    <td className="p-2 font-mono">{row.id}</td>
                    <td className="p-2">{row.name}</td>
                    <td className="p-2">{row.type}</td>
                    <td className="p-2">
                      <Badge variant="outline" className="text-xs">
                        {row.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}

const ConfigAgent = () => {
  const [settings, setSettings] = useState({
    environment: "development",
    debugMode: true,
    autoSave: true,
    theme: "dark",
    port: 5000,
    aiModel: "gpt-4o"
  });

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="flex flex-col h-full bg-replit-panel text-replit-text">
      <div className="border-b border-replit-border p-3">
        <h3 className="font-semibold flex items-center">
          <Settings className="w-4 h-4 mr-2" />
          Configuration
        </h3>
      </div>
      <ScrollArea className="flex-1 p-3">
        <div className="space-y-4">
          <Card className="bg-replit-elevated border-replit-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Environment Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium block mb-1">Environment</label>
                <select 
                  value={settings.environment}
                  onChange={(e) => updateSetting('environment', e.target.value)}
                  className="w-full p-2 bg-replit-panel border border-replit-border rounded text-sm"
                >
                  <option value="development">Development</option>
                  <option value="staging">Staging</option>
                  <option value="production">Production</option>
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium block mb-1">Server Port</label>
                <Input
                  type="number"
                  value={settings.port}
                  onChange={(e) => updateSetting('port', parseInt(e.target.value))}
                  className="bg-replit-panel border-replit-border"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-replit-elevated border-replit-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Development Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Debug Mode</label>
                <input 
                  type="checkbox" 
                  checked={settings.debugMode}
                  onChange={(e) => updateSetting('debugMode', e.target.checked)}
                  className="rounded"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Auto-save</label>
                <input 
                  type="checkbox" 
                  checked={settings.autoSave}
                  onChange={(e) => updateSetting('autoSave', e.target.checked)}
                  className="rounded"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium block mb-1">AI Model</label>
                <select 
                  value={settings.aiModel}
                  onChange={(e) => updateSetting('aiModel', e.target.value)}
                  className="w-full p-2 bg-replit-panel border border-replit-border rounded text-sm"
                >
                  <option value="gpt-4o">GPT-4o</option>
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                  <option value="claude-3.5-sonnet">Claude 3.5 Sonnet</option>
                </select>
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  )
}

export function AgentWindows() {
  const [windows, setWindows] = useState<AgentWindow[]>([
    {
      id: "terminal",
      title: "Terminal",
      icon: Terminal,
      component: TerminalAgent,
      isMinimized: false,
      position: { x: 100, y: 100 },
      size: { width: 600, height: 400 }
    },
    {
      id: "files",
      title: "File Explorer",
      icon: FileText,
      component: FileAgent,
      isMinimized: false,
      position: { x: 150, y: 150 },
      size: { width: 500, height: 350 }
    },
    {
      id: "web",
      title: "Web Preview",
      icon: Globe,
      component: WebAgent,
      isMinimized: false,
      position: { x: 200, y: 200 },
      size: { width: 800, height: 600 }
    },
    {
      id: "system",
      title: "System Monitor",
      icon: Cpu,
      component: SystemAgent,
      isMinimized: false,
      position: { x: 250, y: 250 },
      size: { width: 450, height: 400 }
    },
    {
      id: "database",
      title: "Database",
      icon: Database,
      component: DatabaseAgent,
      isMinimized: false,
      position: { x: 300, y: 300 },
      size: { width: 550, height: 450 }
    },
    {
      id: "config",
      title: "Configuration",
      icon: Settings,
      component: ConfigAgent,
      isMinimized: false,
      position: { x: 350, y: 350 },
      size: { width: 400, height: 500 }
    }
  ])

  const [dragState, setDragState] = useState<{
    isDragging: boolean
    windowId: string | null
    offset: { x: number; y: number }
  }>({
    isDragging: false,
    windowId: null,
    offset: { x: 0, y: 0 }
  })

  const handleMouseDown = (e: React.MouseEvent, windowId: string) => {
    const window = windows.find(w => w.id === windowId)
    if (!window) return

    const rect = e.currentTarget.getBoundingClientRect()
    setDragState({
      isDragging: true,
      windowId,
      offset: {
        x: e.clientX - window.position.x,
        y: e.clientY - window.position.y
      }
    })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragState.isDragging || !dragState.windowId) return

    setWindows(prev => prev.map(window => 
      window.id === dragState.windowId
        ? {
            ...window,
            position: {
              x: e.clientX - dragState.offset.x,
              y: e.clientY - dragState.offset.y
            }
          }
        : window
    ))
  }

  const handleMouseUp = () => {
    setDragState({
      isDragging: false,
      windowId: null,
      offset: { x: 0, y: 0 }
    })
  }

  const closeWindow = (windowId: string) => {
    setWindows(prev => prev.filter(w => w.id !== windowId))
  }

  const minimizeWindow = (windowId: string) => {
    setWindows(prev => prev.map(window => 
      window.id === windowId
        ? { ...window, isMinimized: !window.isMinimized }
        : window
    ))
  }

  const bringToFront = (windowId: string) => {
    setWindows(prev => {
      const windowIndex = prev.findIndex(w => w.id === windowId)
      if (windowIndex === -1) return prev
      
      const window = prev[windowIndex]
      const otherWindows = prev.filter(w => w.id !== windowId)
      return [...otherWindows, window]
    })
  }

  return (
    <div 
      className="fixed inset-0 pointer-events-none"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {windows.map((window, index) => (
        <div
          key={window.id}
          className={`absolute bg-replit-panel border border-replit-border rounded-lg shadow-xl pointer-events-auto ${
            window.isMinimized ? 'h-8' : ''
          }`}
          style={{
            left: window.position.x,
            top: window.position.y,
            width: window.isMinimized ? 200 : window.size.width,
            height: window.isMinimized ? 32 : window.size.height,
            zIndex: 1000 + index
          }}
          onClick={() => bringToFront(window.id)}
        >
          {/* Window Header */}
          <div
            className="flex items-center justify-between p-2 bg-replit-elevated border-b border-replit-border rounded-t-lg cursor-move"
            onMouseDown={(e) => handleMouseDown(e, window.id)}
          >
            <div className="flex items-center space-x-2">
              <window.icon className="w-4 h-4 text-replit-blue" />
              <span className="text-sm font-medium text-replit-text">{window.title}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-replit-panel"
                onClick={() => minimizeWindow(window.id)}
              >
                <Minus className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-red-500/20"
                onClick={() => closeWindow(window.id)}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* Window Content */}
          {!window.isMinimized && (
            <div className="h-full overflow-hidden rounded-b-lg">
              <window.component />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}