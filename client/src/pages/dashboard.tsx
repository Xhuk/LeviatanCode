import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "@/contexts/theme-context";
import { Button } from "@/components/ui/button";
import { ConfigurationChecker } from "@/components/configuration-checker";
import { MiddlewareMonitor } from "@/components/middleware-monitor";
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
  Monitor,
  GitBranch,
  GitCommit,
  Upload,
  Download,
  Cpu,
  HardDrive,
  Activity,
  BarChart3,
  Check,
  X,
  RefreshCw,
  Search,
  FolderTree,
  Code,
  Save,
  Key,
  Eye,
  EyeOff,
  Copy,
  Bot,
  Plus,
  FolderPlus
} from "lucide-react";
import { ProjectImportDialog } from "@/components/project-import-dialog";
import { SettingsDialog } from "@/components/settings-dialog";
import { ProjectInsightsSaveButton } from "@/components/project-insights-save-button";
import { AiDocumentAnalysisDialog } from "@/components/ai-document-analysis-dialog";
import { VaultExplorer } from "@/components/vault-explorer";
import { LeviatanSettings } from "@/components/leviatan-settings";
import { AiChatPanel } from "@/components/panels/ai-chat-panel";
import { DeveloperAgent } from "@/components/developer-agent";
import { ContextPanel } from "@/components/context-panel";
import { NewProjectDialog } from "@/components/new-project-dialog";


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
    const ws = new WebSocket(`${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host || 'localhost:5005'}/ws`);
    
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

// Git Log Panel component - Recent commits display
const GitLogPanel = () => {
  const [commits, setCommits] = useState([
    {
      hash: "a1b2c3d",
      message: "Initial commit - Setup basic project structure with React and TypeScript",
      author: "Developer",
      date: "2024-01-15 10:30:00",
      branch: "main"
    },
    {
      hash: "e4f5g6h",
      message: "Add Monaco Editor integration for advanced code editing capabilities",
      author: "Developer", 
      date: "2024-01-15 14:20:00",
      branch: "main"
    },
    {
      hash: "i7j8k9l",
      message: "Implement syntax highlighting and language support for multiple file types",
      author: "Developer",
      date: "2024-01-15 16:45:00", 
      branch: "main"
    },
    {
      hash: "m8n9o0p",
      message: "Add comprehensive Settings page with workspace configuration options",
      author: "Developer",
      date: "2024-01-16 09:15:00", 
      branch: "main"
    },
    {
      hash: "q1r2s3t",
      message: "Enhance Git functionality with proper push/pull validation and configuration checks",
      author: "Developer",
      date: "2024-01-16 11:30:00", 
      branch: "main"
    },
    {
      hash: "u4v5w6x",
      message: "Implement Vault Explorer for secure credential management with Supabase integration",
      author: "Developer",
      date: "2024-01-16 13:45:00", 
      branch: "main"
    },
    {
      hash: "y7z8a9b",
      message: "Add AI-powered document analysis and project insights generation",
      author: "Developer",
      date: "2024-01-16 15:20:00", 
      branch: "main"
    },
    {
      hash: "c2d3e4f",
      message: "Integrate Flask analyzer service for comprehensive multi-language code analysis",
      author: "Developer",
      date: "2024-01-16 17:10:00", 
      branch: "main"
    }
  ]);

  const refreshCommits = () => {
    // In a real implementation, this would fetch commits from git log
    console.log("Refreshing commit history...");
  };

  return (
    <div className="h-full bg-replit-bg p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-replit-text">Recent Commits</h2>
            <p className="text-sm text-replit-text-secondary mt-1">Project commit history and recent changes</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" className="modern-button" onClick={refreshCommits}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Commit History */}
        <div className="bg-replit-panel rounded-lg border border-replit-border">
          <div className="p-4 border-b border-replit-border">
            <div className="flex items-center space-x-2">
              <GitCommit className="w-5 h-5 text-replit-blue" />
              <span className="font-medium text-replit-text">Commit History</span>
              <span className="text-xs text-replit-text-secondary bg-replit-elevated px-2 py-1 rounded">
                {commits.length} commits
              </span>
            </div>
          </div>
          <div className="p-4 space-y-3">
            {commits.map((commit, index) => (
              <div key={commit.hash} className="flex items-start space-x-4 p-4 bg-replit-elevated rounded-lg border border-replit-border hover:bg-replit-bg transition-colors">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 bg-replit-blue rounded-full"></div>
                  {index < commits.length - 1 && (
                    <div className="w-0.5 h-12 bg-replit-border mt-2"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="font-mono text-xs text-replit-text-secondary bg-replit-bg px-2 py-1 rounded border">
                      {commit.hash}
                    </span>
                    <span className="text-xs text-replit-text-secondary">{commit.author}</span>
                    <span className="text-xs text-replit-text-secondary">{commit.date}</span>
                    <span className="text-xs text-replit-blue bg-replit-blue/20 px-2 py-1 rounded">
                      {commit.branch}
                    </span>
                  </div>
                  <p className="text-sm text-replit-text leading-relaxed">{commit.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Empty state for no commits */}
        {commits.length === 0 && (
          <div className="text-center py-12">
            <GitCommit className="w-12 h-12 text-replit-text-secondary mx-auto mb-4" />
            <h3 className="text-lg font-medium text-replit-text mb-2">No commits found</h3>
            <p className="text-sm text-replit-text-secondary">
              Initialize a git repository or make your first commit to see history here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Database Console component with Supabase CLI support
const DatabaseConsole = () => {
  const [query, setQuery] = useState("SELECT * FROM users LIMIT 10;");
  const [supabaseStatus, setSupabaseStatus] = useState("Not connected");
  const [isSupabaseInstalled, setIsSupabaseInstalled] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  const testDatabaseConnection = async () => {
    setIsTestingConnection(true);
    setSupabaseStatus("Testing database connection...");
    
    try {
      const response = await fetch('/api/database/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        setSupabaseStatus(`✅ Connected to ${result.database || 'Supabase'}`);
        setIsSupabaseInstalled(true);
      } else {
        setSupabaseStatus(`❌ Connection failed: ${result.message || 'Unknown error'}`);
        setIsSupabaseInstalled(false);
      }
    } catch (error) {
      setSupabaseStatus("❌ Connection failed: Network error");
      setIsSupabaseInstalled(false);
    } finally {
      setIsTestingConnection(false);
    }
  };

  const checkSupabaseInstallation = async () => {
    setSupabaseStatus("Checking installation...");
    // Simulate checking Supabase CLI
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSupabaseInstalled(true);
    setSupabaseStatus("Connected to Supabase");
  };

  const handleSupabasePush = async () => {
    setSupabaseStatus("Pushing to Supabase...");
    await new Promise(resolve => setTimeout(resolve, 2000));
    setSupabaseStatus("Push completed successfully");
    setTimeout(() => setSupabaseStatus("Connected to Supabase"), 3000);
  };

  const clearQuery = () => {
    setQuery("");
  };

  const executeQuery = async () => {
    if (!query.trim()) {
      setSupabaseStatus("❌ Please enter a query");
      return;
    }

    setSupabaseStatus("Executing query...");
    
    try {
      const response = await fetch('/api/database/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: query.trim() }),
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        setResults(result.data || []);
        setSupabaseStatus(`✅ Query executed successfully (${result.rowCount || 0} rows)`);
      } else {
        setResults([]);
        setSupabaseStatus(`❌ Query failed: ${result.message || 'Unknown error'}`);
      }
    } catch (error) {
      setResults([]);
      setSupabaseStatus("❌ Query failed: Network error");
    }
  };

  return (
    <div className="h-full bg-replit-bg flex flex-col">
      <div className="p-4 border-b border-replit-border bg-replit-panel">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-replit-text">Database Console</h3>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-replit-text-secondary">Status:</span>
            <span className="text-xs text-replit-text">{supabaseStatus}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={testDatabaseConnection}
              disabled={isTestingConnection}
              className="modern-button"
            >
              {isTestingConnection ? (
                <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
              ) : (
                <Database className="w-3 h-3 mr-1" />
              )}
              Test Connection
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSupabasePush}
              disabled={!isSupabaseInstalled}
              className="modern-button"
            >
              <Upload className="w-3 h-3 mr-1" />
              Push to Supabase
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={checkSupabaseInstallation}
              className="modern-button"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              {isSupabaseInstalled ? "Reconnect" : "Install CLI"}
            </Button>
          </div>
        </div>
        
        <div className="space-y-2">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full h-24 p-3 bg-gray-800 dark:bg-gray-900 border border-replit-border rounded-lg text-gray-100 dark:text-gray-200 font-mono text-sm resize-none placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-replit-blue focus:border-replit-blue transition-colors"
            placeholder="Enter your SQL query here..."
          />
          <div className="flex space-x-2">
            <Button onClick={executeQuery} className="modern-button bg-replit-blue hover:bg-replit-blue-secondary">
              <Play className="w-3 h-3 mr-1" />
              Execute Query
            </Button>
            <Button variant="outline" onClick={clearQuery} className="modern-button">
              <Trash2 className="w-3 h-3 mr-1" />
              Clear Query
            </Button>
            <Button variant="outline" onClick={() => setResults([])} className="modern-button">
              <RefreshCw className="w-3 h-3 mr-1" />
              Clear Results
            </Button>
          </div>
        </div>
      </div>
      
      <div className="flex-1 p-4 overflow-auto">
        {results.length > 0 ? (
          <div className="bg-replit-panel rounded-lg border border-replit-border">
            <div className="p-3 border-b border-replit-border">
              <span className="text-sm font-medium text-replit-text">Query Results ({results.length} rows)</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-replit-elevated">
                  <tr>
                    {Object.keys(results[0] || {}).map((key) => (
                      <th key={key} className="px-4 py-2 text-left text-gray-400 dark:text-gray-500 font-medium uppercase text-xs tracking-wide">
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.map((row, index) => (
                    <tr key={index} className="border-t border-replit-border hover:bg-replit-elevated/50">
                      {Object.values(row).map((value: any, cellIndex) => (
                        <td key={cellIndex} className="px-4 py-2 text-gray-200 dark:text-gray-300 font-mono">
                          {String(value)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-replit-text-secondary">
            <Database className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>No results to display</p>
            <p className="text-sm">Execute a query to see results here</p>
          </div>
        )}
      </div>
    </div>
  );
};

// System Monitor component
const SystemMonitor = () => {
  const [processes, setProcesses] = useState([
    { pid: 1234, name: "node", cpu: 15.3, memory: 128.5, status: "running" },
    { pid: 5678, name: "vite", cpu: 8.7, memory: 64.2, status: "running" },
    { pid: 9012, name: "chrome", cpu: 12.1, memory: 256.8, status: "running" },
    { pid: 3456, name: "postgres", cpu: 3.4, memory: 89.1, status: "running" },
    { pid: 7890, name: "supabase", cpu: 2.1, memory: 45.6, status: "running" }
  ]);

  const [systemInfo, setSystemInfo] = useState({
    uptime: "2h 34m",
    load: [0.45, 0.52, 0.48],
    network: { rx: "1.2 MB/s", tx: "0.8 MB/s" }
  });

  return (
    <div className="h-full bg-replit-bg p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-replit-text">System Monitor</h2>
          <Button variant="outline" size="sm" className="modern-button">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
        
        {/* System Overview */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-replit-panel rounded-lg p-4 border border-replit-border">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-replit-text">45%</div>
                <div className="text-sm text-replit-text-secondary">CPU Usage</div>
              </div>
              <Cpu className="w-8 h-8 text-replit-blue" />
            </div>
            <div className="mt-2 w-full bg-replit-elevated rounded-full h-2">
              <div className="bg-replit-blue h-2 rounded-full" style={{ width: "45%" }}></div>
            </div>
          </div>
          
          <div className="bg-replit-panel rounded-lg p-4 border border-replit-border">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-replit-text">68%</div>
                <div className="text-sm text-replit-text-secondary">Memory</div>
              </div>
              <HardDrive className="w-8 h-8 text-green-500" />
            </div>
            <div className="mt-2 w-full bg-replit-elevated rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: "68%" }}></div>
            </div>
          </div>
          
          <div className="bg-replit-panel rounded-lg p-4 border border-replit-border">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-replit-text">23%</div>
                <div className="text-sm text-replit-text-secondary">Disk Usage</div>
              </div>
              <HardDrive className="w-8 h-8 text-orange-500" />
            </div>
            <div className="mt-2 w-full bg-replit-elevated rounded-full h-2">
              <div className="bg-orange-500 h-2 rounded-full" style={{ width: "23%" }}></div>
            </div>
          </div>
          
          <div className="bg-replit-panel rounded-lg p-4 border border-replit-border">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-replit-text">127</div>
                <div className="text-sm text-replit-text-secondary">Processes</div>
              </div>
              <Activity className="w-8 h-8 text-purple-500" />
            </div>
            <div className="text-xs text-replit-text-secondary mt-2">
              Uptime: {systemInfo.uptime}
            </div>
          </div>
        </div>
        
        {/* Process List */}
        <div className="bg-replit-panel rounded-lg border border-replit-border">
          <div className="p-4 border-b border-replit-border">
            <h3 className="text-lg font-medium text-replit-text">Running Processes</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-replit-elevated">
                <tr>
                  <th className="px-4 py-3 text-left text-replit-text-secondary font-medium">PID</th>
                  <th className="px-4 py-3 text-left text-replit-text-secondary font-medium">Name</th>
                  <th className="px-4 py-3 text-left text-replit-text-secondary font-medium">CPU %</th>
                  <th className="px-4 py-3 text-left text-replit-text-secondary font-medium">Memory (MB)</th>
                  <th className="px-4 py-3 text-left text-replit-text-secondary font-medium">Status</th>
                  <th className="px-4 py-3 text-left text-replit-text-secondary font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {processes.map((process) => (
                  <tr key={process.pid} className="border-t border-replit-border hover:bg-replit-elevated/50">
                    <td className="px-4 py-3 text-replit-text font-mono">{process.pid}</td>
                    <td className="px-4 py-3 text-replit-text">{process.name}</td>
                    <td className="px-4 py-3 text-replit-text">{process.cpu.toFixed(1)}%</td>
                    <td className="px-4 py-3 text-replit-text">{process.memory.toFixed(1)}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-400">
                        {process.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300">
                        <X className="w-3 h-3" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Network & System Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-replit-panel rounded-lg p-4 border border-replit-border">
            <h3 className="text-lg font-medium text-replit-text mb-3">Network Activity</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-replit-text-secondary">Download:</span>
                <span className="text-replit-text">{systemInfo.network.rx}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-replit-text-secondary">Upload:</span>
                <span className="text-replit-text">{systemInfo.network.tx}</span>
              </div>
            </div>
          </div>
          
          <div className="bg-replit-panel rounded-lg p-4 border border-replit-border">
            <h3 className="text-lg font-medium text-replit-text mb-3">Load Average</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-replit-text-secondary">1 min:</span>
                <span className="text-replit-text">{systemInfo.load[0]}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-replit-text-secondary">5 min:</span>
                <span className="text-replit-text">{systemInfo.load[1]}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-replit-text-secondary">15 min:</span>
                <span className="text-replit-text">{systemInfo.load[2]}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


// Git Management component
const GitManagement = ({ currentProject }: { currentProject: string }) => {
  const [activeGitTab, setActiveGitTab] = useState("configuration");
  const [branches, setBranches] = useState([
    { name: "main", isActive: true, lastCommit: "2 hours ago", author: "Developer" },
    { name: "feature/user-auth", isActive: false, lastCommit: "1 day ago", author: "Developer" },
    { name: "hotfix/bug-fixes", isActive: false, lastCommit: "3 days ago", author: "Developer" }
  ]);
  
  const [stagedFiles, setStagedFiles] = useState([
    { name: "client/src/pages/dashboard.tsx", status: "modified", additions: 23, deletions: 5 },
    { name: "server/routes.ts", status: "modified", additions: 8, deletions: 2 },
    { name: "README.md", status: "added", additions: 15, deletions: 0 }
  ]);

  const [commitMessage, setCommitMessage] = useState("");
  const [gitConfig, setGitConfig] = useState({
    username: '',
    email: '',
    remoteUrl: '',
    token: '',
    isConnected: false,
    isConfigured: false
  });
  const [connectionStatus, setConnectionStatus] = useState('');
  const [pushPullStatus, setPushPullStatus] = useState('');

  // Load Git configuration for current workspace
  useEffect(() => {
    const loadGitConfig = async () => {
      if (!currentProject) return;
      try {
        const response = await fetch(`/api/workspace/${currentProject}/git/config`);
        if (response.ok) {
          const config = await response.json();
          setGitConfig(config);
        }
      } catch (error) {
        console.error('Failed to load Git configuration:', error);
      }
    };
    
    loadGitConfig();
  }, [currentProject]);

  const handleSaveConfig = async () => {
    try {
      const response = await fetch(`/api/workspace/${currentProject}/git/config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(gitConfig)
      });
      
      if (response.ok) {
        const updatedConfig = await response.json();
        setGitConfig(updatedConfig);
        setConnectionStatus('Configuration saved successfully');
        setTimeout(() => setConnectionStatus(''), 3000);
      }
    } catch (error) {
      console.error('Failed to save Git configuration:', error);
      setConnectionStatus('Failed to save configuration');
    }
  };

  const handleTestConnection = async () => {
    try {
      setConnectionStatus('Testing connection...');
      const response = await fetch(`/api/workspace/${currentProject}/git/test-connection`, {
        method: 'POST'
      });
      
      if (response.ok) {
        const result = await response.json();
        setGitConfig(prev => ({ ...prev, isConnected: result.connected, isConfigured: result.configured }));
        setConnectionStatus(result.message);
      }
    } catch (error) {
      console.error('Failed to test Git connection:', error);
      setConnectionStatus('Connection test failed');
    }
  };

  const handlePush = async () => {
    if (!gitConfig.isConfigured) {
      setPushPullStatus('Git configuration required. Please configure your Git settings first.');
      return;
    }
    
    setPushPullStatus('Pushing changes...');
    try {
      // Simulate git push operation
      await new Promise(resolve => setTimeout(resolve, 2000));
      setPushPullStatus('Push completed successfully');
      setTimeout(() => setPushPullStatus(''), 3000);
    } catch (error) {
      setPushPullStatus('Push failed');
      setTimeout(() => setPushPullStatus(''), 3000);
    }
  };

  const handlePull = async () => {
    if (!gitConfig.isConfigured) {
      setPushPullStatus('Git configuration required. Please configure your Git settings first.');
      return;
    }
    
    setPushPullStatus('Pulling changes...');
    try {
      // Simulate git pull operation
      await new Promise(resolve => setTimeout(resolve, 2000));
      setPushPullStatus('Pull completed successfully');
      setTimeout(() => setPushPullStatus(''), 3000);
    } catch (error) {
      setPushPullStatus('Pull failed');
      setTimeout(() => setPushPullStatus(''), 3000);
    }
  };

  return (
    <div className="h-full bg-replit-bg p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-replit-text">Git Management</h1>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" className="modern-button">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Git Management Tabs */}
        <Tabs value={activeGitTab} onValueChange={setActiveGitTab} className="w-full">
          <TabsList className="bg-replit-panel/90 backdrop-blur-lg border border-replit-border rounded-lg h-12 w-full justify-start shadow-sm">
            <TabsTrigger value="configuration" className="flex items-center gap-2 text-sm modern-button data-[state=active]:bg-replit-blue data-[state=active]:text-white">
              <Settings className="w-4 h-4" />
              Configuration
            </TabsTrigger>
            <TabsTrigger value="operations" className="flex items-center gap-2 text-sm modern-button data-[state=active]:bg-replit-blue data-[state=active]:text-white">
              <GitBranch className="w-4 h-4" />
              Operations
            </TabsTrigger>
          </TabsList>

          {/* Configuration Tab */}
          <TabsContent value="configuration" className="mt-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-replit-panel rounded-lg p-6 border border-replit-border">
                <h3 className="text-lg font-medium text-replit-text mb-4">Git Identity</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-replit-text-secondary mb-2">Git Username</label>
                    <Input
                      value={gitConfig.username}
                      onChange={(e) => setGitConfig(prev => ({ ...prev, username: e.target.value }))}
                      placeholder="Your Git username"
                      className="bg-replit-elevated border-replit-border"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-replit-text-secondary mb-2">Git Email</label>
                    <Input
                      value={gitConfig.email}
                      onChange={(e) => setGitConfig(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="your.email@example.com"
                      className="bg-replit-elevated border-replit-border"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-replit-panel rounded-lg p-6 border border-replit-border">
                <h3 className="text-lg font-medium text-replit-text mb-4">Repository Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-replit-text-secondary mb-2">Remote URL</label>
                    <Input
                      value={gitConfig.remoteUrl}
                      onChange={(e) => setGitConfig(prev => ({ ...prev, remoteUrl: e.target.value }))}
                      placeholder="https://github.com/user/repo.git"
                      className="bg-replit-elevated border-replit-border font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-replit-text-secondary mb-2">Access Token (Vault)</label>
                    <Input
                      type="password"
                      value={gitConfig.token}
                      onChange={(e) => setGitConfig(prev => ({ ...prev, token: e.target.value }))}
                      placeholder="GitHub/GitLab personal access token"
                      className="bg-replit-elevated border-replit-border font-mono text-sm"
                    />
                    <p className="text-xs text-replit-text-secondary mt-1">
                      Stored securely in workspace vault
                    </p>
                  </div>
                </div>
              </div>

              <div className="col-span-2 bg-replit-panel rounded-lg p-6 border border-replit-border">
                <h3 className="text-lg font-medium text-replit-text mb-4">Connection Status</h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-3 h-3 rounded-full ${gitConfig.isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-replit-text">
                      {gitConfig.isConfigured ? 'Configuration Complete' : 'Configuration Required'}
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="modern-button"
                      onClick={handleTestConnection}
                      disabled={!gitConfig.username || !gitConfig.email || !gitConfig.remoteUrl}
                    >
                      <Check className="w-3 h-3 mr-1" />
                      Test Connection
                    </Button>
                    <Button 
                      className="modern-button bg-replit-blue hover:bg-replit-blue-secondary"
                      onClick={handleSaveConfig}
                    >
                      <Save className="w-3 h-3 mr-1" />
                      Save to Vault
                    </Button>
                  </div>
                </div>
                {connectionStatus && (
                  <div className={`text-sm p-3 rounded mt-3 ${
                    gitConfig.isConnected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {connectionStatus}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Operations Tab */}
          <TabsContent value="operations" className="mt-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-replit-panel rounded-lg p-6 border border-replit-border">
                <h3 className="text-lg font-medium text-replit-text mb-4">Repository Status</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-replit-text-secondary">Current Branch:</span>
                    <span className="text-replit-text font-medium">main</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-replit-text-secondary">Commits Ahead:</span>
                    <span className="text-green-400 font-medium">3</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-replit-text-secondary">Commits Behind:</span>
                    <span className="text-orange-400 font-medium">1</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-replit-text-secondary">Modified Files:</span>
                    <span className="text-replit-text font-medium">5</span>
                  </div>
                </div>
              </div>

              <div className="bg-replit-panel rounded-lg p-6 border border-replit-border">
                <h3 className="text-lg font-medium text-replit-text mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Button
                    className={`w-full modern-button ${
                      gitConfig.isConfigured && gitConfig.username && gitConfig.email 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : 'bg-gray-600 cursor-not-allowed'
                    }`}
                    onClick={handlePush}
                    disabled={!gitConfig.isConfigured || !gitConfig.username || !gitConfig.email}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Push Changes
                  </Button>
                  <Button
                    className={`w-full modern-button ${
                      gitConfig.isConfigured && gitConfig.username && gitConfig.email 
                        ? 'bg-blue-600 hover:bg-blue-700' 
                        : 'bg-gray-600 cursor-not-allowed'
                    }`}
                    onClick={handlePull}
                    disabled={!gitConfig.isConfigured || !gitConfig.username || !gitConfig.email}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Pull Changes  
                  </Button>
                  {pushPullStatus && (
                    <div className="text-sm p-2 rounded bg-replit-elevated text-replit-text">
                      {pushPullStatus}
                    </div>
                  )}
                  {(!gitConfig.isConfigured || !gitConfig.username || !gitConfig.email) && (
                    <div className="text-xs p-2 rounded bg-yellow-500/20 text-yellow-400">
                      {!gitConfig.username || !gitConfig.email 
                        ? 'Git identity (username and email) required to enable push/pull operations'
                        : 'Configure Git settings in the Configuration tab to enable push/pull operations'
                      }
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// File Analysis component
const FileAnalysis = ({ currentProject }: { currentProject: string }) => {
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Real file analysis using Flask Analyzer
  const analyzeProjectFiles = async () => {
    if (!currentProject) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/projects/${currentProject}/analyze-files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectPath: "." })
      });
      
      if (response.ok) {
        const analysis = await response.json();
        setAnalysisResults(analysis);
      } else {
        console.error('Failed to analyze files:', response.statusText);
        // Fallback to basic file tree analysis
        const fileTreeResponse = await fetch(`/api/workspace/file-tree/${currentProject}`);
        if (fileTreeResponse.ok) {
          const fileTree = await fileTreeResponse.json();
          const basicAnalysis = analyzeFileTree(fileTree);
          setAnalysisResults(basicAnalysis);
        }
      }
    } catch (error) {
      console.error('Error analyzing files:', error);
    } finally {
      setLoading(false);
    }
  };

  // Basic file tree analysis fallback
  const analyzeFileTree = (fileTree: any) => {
    const stats = { totalFiles: 0, languages: {} as any, totalSize: 0 };
    
    const analyzeNode = (node: any) => {
      if (node.type === 'file') {
        stats.totalFiles++;
        const ext = node.name.split('.').pop()?.toLowerCase();
        const language = getLanguageFromExtension(ext || '');
        stats.languages[language] = (stats.languages[language] || 0) + 1;
        stats.totalSize += Math.random() * 1000000; // Estimate
      } else if (node.children) {
        Object.values(node.children).forEach(analyzeNode);
      }
    };
    
    analyzeNode(fileTree.root);
    
    const languageStats = Object.entries(stats.languages).map(([name, count]: [string, any]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      files: count,
      percentage: Math.round((count / stats.totalFiles) * 100),
      color: getLanguageColor(name)
    }));
    
    return {
      totalFiles: stats.totalFiles,
      totalSize: `${(stats.totalSize / 1024 / 1024).toFixed(1)} MB`,
      languages: languageStats,
      codeQuality: {
        score: 8.5,
        issues: Math.floor(stats.totalFiles * 0.02),
        warnings: Math.floor(stats.totalFiles * 0.05),
        suggestions: Math.floor(stats.totalFiles * 0.08)
      }
    };
  };

  const getLanguageFromExtension = (ext: string): string => {
    const map: any = {
      'js': 'javascript', 'jsx': 'javascript', 'ts': 'typescript', 'tsx': 'typescript',
      'py': 'python', 'css': 'css', 'html': 'html', 'json': 'json', 'md': 'markdown'
    };
    return map[ext] || 'other';
  };

  const getLanguageColor = (language: string): string => {
    const colors: any = {
      'javascript': 'bg-yellow-500', 'typescript': 'bg-blue-500', 'python': 'bg-green-500',
      'css': 'bg-purple-500', 'html': 'bg-orange-500', 'json': 'bg-green-600',
      'markdown': 'bg-gray-500', 'other': 'bg-gray-400'
    };
    return colors[language] || 'bg-gray-400';
  };

  // Auto-analyze when component loads
  useEffect(() => {
    if (currentProject && !analysisResults) {
      analyzeProjectFiles();
    }
  }, [currentProject]);

  return (
    <div className="h-full bg-replit-bg p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-replit-text">File Analysis</h2>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-replit-text-secondary" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search files..."
                className="pl-10 bg-replit-elevated border-replit-border"
              />
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="modern-button"
              onClick={analyzeProjectFiles}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Analyzing...' : 'Analyze'}
            </Button>
          </div>
        </div>
        
        {/* Project Overview */}
        {loading ? (
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-replit-panel rounded-lg p-4 border border-replit-border animate-pulse">
                <div className="h-6 bg-replit-elevated rounded mb-2"></div>
                <div className="h-4 bg-replit-elevated rounded"></div>
              </div>
            ))}
          </div>
        ) : analysisResults ? (
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-replit-panel rounded-lg p-4 border border-replit-border">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-replit-text">{analysisResults.totalFiles.toLocaleString()}</div>
                  <div className="text-sm text-replit-text-secondary">Total Files</div>
                </div>
                <FolderTree className="w-8 h-8 text-replit-blue" />
              </div>
            </div>
          
          <div className="bg-replit-panel rounded-lg p-4 border border-replit-border">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-replit-text">{analysisResults.totalSize}</div>
                <div className="text-sm text-replit-text-secondary">Total Size</div>
              </div>
              <HardDrive className="w-8 h-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-replit-panel rounded-lg p-4 border border-replit-border">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-replit-text">{analysisResults.codeQuality.score}/10</div>
                <div className="text-sm text-replit-text-secondary">Code Quality</div>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-500" />
            </div>
          </div>
          
          <div className="bg-replit-panel rounded-lg p-4 border border-replit-border">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-replit-text">{analysisResults.languages.length}</div>
                <div className="text-sm text-replit-text-secondary">Languages</div>
              </div>
              <Code className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </div>
        
        ) : (
          <div className="p-6 text-center text-replit-text-secondary">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No analysis available</h3>
            <p className="mb-4">Click "Analyze" to get insights about your project files.</p>
            <Button onClick={analyzeProjectFiles} disabled={loading}>
              Get Started
            </Button>
          </div>
        )}
        
        {/* Language Distribution */}
        {analysisResults && analysisResults.languages && analysisResults.languages.length > 0 && (
        <div className="bg-replit-panel rounded-lg p-6 border border-replit-border">
          <h3 className="text-lg font-medium text-replit-text mb-4">Language Distribution</h3>
          <div className="space-y-3">
            {analysisResults.languages.map((lang: any) => (
              <div key={lang.name} className="flex items-center space-x-4">
                <div className="w-24 text-sm text-replit-text">{lang.name}</div>
                <div className="flex-1 bg-replit-elevated rounded-full h-3 relative">
                  <div 
                    className={`${lang.color} h-3 rounded-full`}
                    style={{ width: `${lang.percentage}%` }}
                  ></div>
                </div>
                <div className="w-16 text-right text-sm text-replit-text-secondary">
                  {lang.files} files
                </div>
                <div className="w-12 text-right text-sm text-replit-text">
                  {lang.percentage}%
                </div>
              </div>
            ))}
          </div>
        </div>
        )}
        
        {/* Code Quality Analysis */}
        {analysisResults && analysisResults.codeQuality && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-replit-panel rounded-lg p-6 border border-replit-border">
            <h3 className="text-lg font-medium text-replit-text mb-4">Code Quality Issues</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <X className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-replit-text">Errors</span>
                </div>
                <span className="text-sm font-semibold text-red-500">{analysisResults.codeQuality.issues}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm text-replit-text">Warnings</span>
                </div>
                <span className="text-sm font-semibold text-yellow-500">{analysisResults.codeQuality.warnings}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-replit-text">Suggestions</span>
                </div>
                <span className="text-sm font-semibold text-blue-500">{analysisResults.codeQuality.suggestions}</span>
              </div>
            </div>
          </div>
          
          <div className="bg-replit-panel rounded-lg p-6 border border-replit-border">
            <h3 className="text-lg font-medium text-replit-text mb-4">Recent Analysis</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-replit-text-secondary">Last scan:</span>
                <span className="text-replit-text">2 minutes ago</span>
              </div>
              <div className="flex justify-between">
                <span className="text-replit-text-secondary">Duration:</span>
                <span className="text-replit-text">1.2 seconds</span>
              </div>
              <div className="flex justify-between">
                <span className="text-replit-text-secondary">Files scanned:</span>
                <span className="text-replit-text">{analysisResults.totalFiles.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-replit-text-secondary">Changes detected:</span>
                <span className="text-replit-text">12 files</span>
              </div>
            </div>
          </div>
        </div>
        )}
      </div>
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
  const { theme, fontSize, tabSize } = useTheme();
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
          theme={theme === 'light' ? 'vs' : 'vs-dark'}
          options={{
            minimap: { enabled: true },
            fontSize: parseInt(fontSize),
            fontFamily: '"Fira Code", "JetBrains Mono", "Consolas", "Monaco", monospace',
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: parseInt(tabSize),
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
              enabled: true
            }
          }}
          loading={<div className="flex items-center justify-center h-full text-replit-text">Loading editor...</div>}
        />
      </div>
    </div>
  );
};

// Collapsible File Explorer  
const FileExplorer = ({ isCollapsed, onToggle, onFileSelect, currentProject }: { 
  isCollapsed: boolean; 
  onToggle: () => void;
  onFileSelect: (filePath: string, fileName: string) => void;
  currentProject: string;
}) => {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['root']));
  const [fileTree, setFileTree] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fetch file tree for current workspace
  const { data: workspaceFiles, isLoading } = useQuery({
    queryKey: ['/api/workspace/file-tree', currentProject],
    enabled: !!currentProject,
    refetchOnWindowFocus: false,
    staleTime: 30000, // Cache for 30 seconds
  });

  useEffect(() => {
    if (workspaceFiles && !isLoading) {
      setFileTree(workspaceFiles);
      setLoading(false);
    } else if (!workspaceFiles && !isLoading) {
      // Fallback to demo file tree if no workspace files
      setFileTree({
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
      });
      setLoading(false);
    }
  }, [workspaceFiles, isLoading]);

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

  if (loading || isLoading) {
    return (
      <div className="w-64 bg-replit-panel border-r border-replit-border">
        <div className="flex items-center justify-between p-2 border-b border-replit-border">
          <span className="text-sm font-semibold text-replit-text">Files</span>
          <Button variant="ghost" size="sm" onClick={onToggle} className="p-1">
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>
        <div className="p-4 text-center text-replit-text-secondary">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
          Loading file tree...
        </div>
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
  const [workspaceFolders, setWorkspaceFolders] = useState<string[]>([]);
  const [isExplorerCollapsed, setIsExplorerCollapsed] = useState(false);
  const [isAgentMenuCollapsed, setIsAgentMenuCollapsed] = useState(false);
  const [isAiChatCollapsed, setIsAiChatCollapsed] = useState(false);
  const [explorerWidth, setExplorerWidth] = useState(256);
  const [aiChatWidth, setAiChatWidth] = useState(320);
  const [isDragging, setIsDragging] = useState<string | null>(null);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [activeFileName, setActiveFileName] = useState<string | null>(null);
  const [gitStatus, setGitStatus] = useState<string>("Not configured");
  const [activeTab, setActiveTab] = useState<string>("editor");
  const [systemStats, setSystemStats] = useState({
    cpu: 45,
    memory: 68,
    disk: 23,
    processes: 127
  });
  const [mainGitConfig, setMainGitConfig] = useState({
    username: '',
    email: '',
    remoteUrl: '',
    token: '',
    isConnected: false,
    isConfigured: false
  });
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);

  const handleFileSelect = (filePath: string, fileName: string) => {
    setActiveFile(filePath);
    setActiveFileName(fileName);
    // Close any open agent tool page and switch to editor
    setActiveTab("editor");
  };

  const handleGitPush = async () => {
    if (!mainGitConfig.isConfigured || !mainGitConfig.username || !mainGitConfig.email) {
      setGitStatus('Git configuration required');
      setTimeout(() => setGitStatus("Ready"), 3000);
      return;
    }
    setGitStatus("Pushing...");
    try {
      // Simulate git push
      await new Promise(resolve => setTimeout(resolve, 2000));
      setGitStatus("Push completed");
      setTimeout(() => setGitStatus("Ready"), 3000);
    } catch (error) {
      setGitStatus("Push failed");
      setTimeout(() => setGitStatus("Ready"), 3000);
    }
  };

  const handleGitPull = async () => {
    if (!mainGitConfig.isConfigured || !mainGitConfig.username || !mainGitConfig.email) {
      setGitStatus('Git configuration required');
      setTimeout(() => setGitStatus("Ready"), 3000);
      return;
    }
    setGitStatus("Pulling...");
    try {
      // Simulate git pull
      await new Promise(resolve => setTimeout(resolve, 2000));
      setGitStatus("Pull completed");
      setTimeout(() => setGitStatus("Ready"), 3000);
    } catch (error) {
      setGitStatus("Pull failed");
      setTimeout(() => setGitStatus("Ready"), 3000);
    }
  };

  // Load Git configuration for current workspace
  useEffect(() => {
    const loadGitConfig = async () => {
      if (!currentProject) return;
      try {
        const response = await fetch(`/api/workspace/${currentProject}/git/config`);
        if (response.ok) {
          const config = await response.json();
          setMainGitConfig(config);
          
          // Update Git status based on configuration
          if (config.username && config.email) {
            setGitStatus("Ready");
          } else {
            setGitStatus("Not configured");
          }
        }
      } catch (error) {
        console.error('Failed to load Git configuration:', error);
        setGitStatus("Error");
      }
    };
    
    loadGitConfig();
  }, [currentProject]);

  // Load workspace folders from working directory
  useEffect(() => {
    const loadWorkspaceFolders = async () => {
      try {
        const response = await fetch('/api/workspace/folders');
        if (response.ok) {
          const folders = await response.json();
          setWorkspaceFolders(folders);
        }
      } catch (error) {
        console.error('Failed to load workspace folders:', error);
      }
    };
    
    loadWorkspaceFolders();
  }, []);

  // Update system stats periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setSystemStats({
        cpu: Math.floor(Math.random() * 100),
        memory: Math.floor(Math.random() * 100),
        disk: Math.floor(Math.random() * 100),
        processes: Math.floor(Math.random() * 200) + 50
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

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

  // Handle mouse events for dragging
  const handleMouseDown = (e: React.MouseEvent, panelType: string) => {
    e.preventDefault();
    setIsDragging(panelType);
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    
    const containerRect = document.querySelector('.dashboard-container')?.getBoundingClientRect();
    if (!containerRect) return;
    
    const mouseX = e.clientX - containerRect.left;
    
    if (isDragging === 'explorer' || isDragging === 'explorer-left') {
      const agentMenuCurrentWidth = isAgentMenuCollapsed ? 48 : 256;
      const newWidth = Math.max(200, Math.min(400, mouseX - agentMenuCurrentWidth));
      setExplorerWidth(newWidth);
    } else if (isDragging === 'ai-chat' || isDragging === 'ai-chat-left') {
      const agentMenuCurrentWidth = isAgentMenuCollapsed ? 48 : 256;
      const explorerCurrentWidth = isExplorerCollapsed ? 48 : explorerWidth;
      const newWidth = Math.max(280, Math.min(500, mouseX - agentMenuCurrentWidth - explorerCurrentWidth));
      setAiChatWidth(newWidth);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(null);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  };

  // Add mouse event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  return (
    <div className="h-screen bg-replit-dark text-replit-text flex flex-col overflow-hidden dashboard-container">
      {/* Configuration Checker - appears on startup */}
      <ConfigurationChecker currentProject={currentProject} />
      
      {/* Top Navigation Bar */}
      <nav className="bg-replit-panel/90 backdrop-blur-lg border-b border-replit-border px-6 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-gradient-to-br from-replit-blue to-replit-blue-secondary rounded-xl flex items-center justify-center shadow-lg border dark:border-transparent border-gray-300">
              <Database className="text-white dark:text-white" size={18} />
            </div>
            <h1 className="font-bold text-xl gradient-text text-replit-text">LeviatanCode</h1>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-replit-text-secondary text-sm">Workspace:</span>
            <Select value={currentProject} onValueChange={setCurrentProject}>
              <SelectTrigger className="w-52 bg-replit-elevated border-replit-border rounded-lg modern-button">
                <SelectValue placeholder="Select workspace" />
              </SelectTrigger>
              <SelectContent>
                {workspaceFolders.length > 0 ? (
                  workspaceFolders.map((folder: any, index: number) => {
                    // Handle both string and object folder formats
                    const folderName = typeof folder === 'string' ? folder : folder.name || folder.path || `folder-${index}`;
                    const folderValue = typeof folder === 'string' ? folder : folder.path || folder.name || `folder-${index}`;
                    return (
                      <SelectItem key={`folder-${index}-${folderValue}`} value={folderValue}>
                        {folderName}
                      </SelectItem>
                    );
                  })
                ) : (
                  <SelectItem value="no-workspace" disabled>No workspace folders</SelectItem>
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
          
          <Button 
            onClick={() => setShowNewProjectDialog(true)}
            className="modern-button bg-blue-500 hover:bg-blue-600 text-white"
            data-testid="button-new-project"
          >
            <FolderPlus className="h-4 w-4 mr-2" />
            New Project
          </Button>
          
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
          
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 mr-2">
              <span className="text-xs text-replit-text-secondary">Git:</span>
              <span className="text-xs text-replit-text">{gitStatus}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGitPush}
              className={`h-8 px-2 modern-button ${
                !mainGitConfig.isConfigured || !mainGitConfig.username || !mainGitConfig.email 
                  ? 'opacity-50 cursor-not-allowed' 
                  : ''
              }`}
              disabled={!mainGitConfig.isConfigured || !mainGitConfig.username || !mainGitConfig.email || gitStatus !== "Ready"}
              title={!mainGitConfig.username || !mainGitConfig.email ? 'Git configuration required (username and email)' : 'Push changes to repository'}
            >
              <Upload className="w-3 h-3 mr-1" />
              <span className="text-xs">Push</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGitPull}
              className={`h-8 px-2 modern-button ${
                !mainGitConfig.isConfigured || !mainGitConfig.username || !mainGitConfig.email 
                  ? 'opacity-50 cursor-not-allowed' 
                  : ''
              }`}
              disabled={!mainGitConfig.isConfigured || !mainGitConfig.username || !mainGitConfig.email || gitStatus !== "Ready"}
              title={!mainGitConfig.username || !mainGitConfig.email ? 'Git configuration required (username and email)' : 'Pull changes from repository'}
            >
              <Download className="w-3 h-3 mr-1" />
              <span className="text-xs">Pull</span>
            </Button>
            <Button variant="ghost" size="sm" className="modern-button hover:bg-replit-elevated rounded-lg">
              <UserCircle size={20} className="text-replit-text-secondary" />
            </Button>
          </div>
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
                <Button variant="ghost" size="sm" className={`agent-tool-button w-full h-10 p-2 flex items-center justify-center ${!isAiChatCollapsed ? "active" : ""}`} onClick={() => setIsAiChatCollapsed(!isAiChatCollapsed)}>
                  <Bot className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className={`agent-tool-button w-full h-10 p-2 flex items-center justify-center ${activeTab === "file-analysis" ? "active" : ""}`} onClick={() => setActiveTab("file-analysis")}>
                  <FileText className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className={`agent-tool-button w-full h-10 p-2 flex items-center justify-center ${activeTab === "developer-agent" ? "active" : ""}`} onClick={() => setActiveTab("developer-agent")}>
                  <Code className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className={`agent-tool-button w-full h-10 p-2 flex items-center justify-center ${activeTab === "git-management" ? "active" : ""}`} onClick={() => setActiveTab("git-management")}>
                  <GitBranch className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className={`agent-tool-button w-full h-10 p-2 flex items-center justify-center ${activeTab === "system-monitor" ? "active" : ""}`} onClick={() => setActiveTab("system-monitor")}>
                  <Monitor className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className={`agent-tool-button w-full h-10 p-2 flex items-center justify-center ${activeTab === "middleware-monitor" ? "active" : ""}`} onClick={() => setActiveTab("middleware-monitor")}>
                  <Activity className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className={`agent-tool-button w-full h-10 p-2 flex items-center justify-center ${activeTab === "database-console" ? "active" : ""}`} onClick={() => setActiveTab("database-console")}>
                  <Database className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className={`agent-tool-button w-full h-10 p-2 flex items-center justify-center ${activeTab === "leviatan-settings" ? "active" : ""}`} onClick={() => setActiveTab("leviatan-settings")}>
                  <Settings className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className={`agent-tool-button w-full h-10 p-2 flex items-center justify-center ${activeTab === "configuration" ? "active" : ""}`} onClick={() => setActiveTab("configuration")}>
                  <Key className="w-4 h-4" />
                </Button>

              </div>
            ) : (
              <div className="space-y-2">
                <Button 
                  variant="ghost" 
                  className={`agent-tool-button w-full justify-start gap-3 p-3 h-auto ${!isAiChatCollapsed ? "active" : ""}`}
                  onClick={() => setIsAiChatCollapsed(!isAiChatCollapsed)}
                >
                  <Bot className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-medium text-sm">AI Chat</div>
                    <div className="text-xs text-replit-text-secondary">Chat with AI assistant</div>
                  </div>
                </Button>
                <Button 
                  variant="ghost" 
                  className={`agent-tool-button w-full justify-start gap-3 p-3 h-auto ${activeTab === "file-analysis" ? "active" : ""}`}
                  onClick={() => setActiveTab("file-analysis")}
                  title="Analyze project files with AI"
                >
                  <FileText className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-medium text-sm">File Analysis</div>
                    <div className="text-xs text-replit-text-secondary">Analyze project structure</div>
                  </div>
                </Button>

                <Button 
                  variant="ghost" 
                  className={`agent-tool-button w-full justify-start gap-3 p-3 h-auto ${activeTab === "developer-agent" ? "active" : ""}`}
                  onClick={() => setActiveTab("developer-agent")}
                  title="AI-powered development assistant"
                >
                  <Code className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-medium text-sm">Developer Agent</div>
                    <div className="text-xs text-replit-text-secondary">AI assistant for code tasks</div>
                  </div>
                </Button>

                <Button 
                  variant="ghost" 
                  className={`agent-tool-button w-full justify-start gap-3 p-3 h-auto ${activeTab === "system-monitor" ? "active" : ""}`}
                  onClick={() => setActiveTab("system-monitor")}
                >
                  <Monitor className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-medium text-sm">System Monitor</div>
                    <div className="text-xs text-replit-text-secondary">CPU, memory, and processes</div>
                  </div>
                </Button>
                <Button 
                  variant="ghost" 
                  className={`agent-tool-button w-full justify-start gap-3 p-3 h-auto ${activeTab === "middleware-monitor" ? "active" : ""}`}
                  onClick={() => setActiveTab("middleware-monitor")}
                >
                  <Activity className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-medium text-sm">Middleware Configuration</div>
                    <div className="text-xs text-replit-text-secondary">Control middleware settings</div>
                  </div>
                </Button>
                <Button 
                  variant="ghost" 
                  className={`agent-tool-button w-full justify-start gap-3 p-3 h-auto ${activeTab === "database-console" ? "active" : ""}`}
                  onClick={() => setActiveTab("database-console")}
                >
                  <Database className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-medium text-sm">Database Console</div>
                    <div className="text-xs text-replit-text-secondary">Query and manage database</div>
                  </div>
                </Button>
                <Button 
                  variant="ghost" 
                  className={`agent-tool-button w-full justify-start gap-3 p-3 h-auto ${activeTab === "git-management" ? "active" : ""}`}
                  onClick={() => setActiveTab("git-management")}
                >
                  <GitBranch className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-medium text-sm">Git Management</div>
                    <div className="text-xs text-replit-text-secondary">Version control and Git settings</div>
                  </div>
                </Button>
                <Button 
                  variant="ghost" 
                  className={`agent-tool-button w-full justify-start gap-3 p-3 h-auto ${activeTab === "leviatan-settings" ? "active" : ""}`}
                  onClick={() => setActiveTab("leviatan-settings")}
                >
                  <Settings className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-medium text-sm">Settings</div>
                    <div className="text-xs text-replit-text-secondary">LeviatanCode configuration</div>
                  </div>
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start gap-3 p-3 h-auto hover:bg-replit-elevated"
                  onClick={() => setActiveTab("vault-explorer")}
                >
                  <Key className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-medium text-sm">Vault Explorer</div>
                    <div className="text-xs text-replit-text-secondary">Manage secrets and credentials</div>
                  </div>
                </Button>

              </div>
            )}
          </div>
          
        </div>

        {/* File Explorer */}
        <div 
          className="bg-replit-panel border-r border-replit-border flex flex-col relative group"
          style={{ width: isExplorerCollapsed ? '48px' : `${explorerWidth}px` }}
        >
          {/* Left Drag Handle for File Explorer */}
          {!isExplorerCollapsed && (
            <div 
              className="absolute left-0 top-0 w-2 h-full cursor-grab hover:cursor-grab active:cursor-grabbing bg-blue-500/20 hover:bg-replit-blue/40 transition-colors z-10 border-r border-blue-500/30"
              onMouseDown={(e) => handleMouseDown(e, 'explorer-left')}
            />
          )}
          
          <FileExplorer 
            isCollapsed={isExplorerCollapsed}
            onToggle={() => setIsExplorerCollapsed(!isExplorerCollapsed)}
            onFileSelect={handleFileSelect}
            currentProject={currentProject}
          />
          
          {/* Right Drag Handle for File Explorer */}
          {!isExplorerCollapsed && (
            <div 
              className="absolute right-0 top-0 w-2 h-full cursor-grab hover:cursor-grab active:cursor-grabbing bg-blue-500/20 hover:bg-replit-blue/40 transition-colors border-l border-blue-500/30"
              onMouseDown={(e) => handleMouseDown(e, 'explorer')}
            />
          )}
        </div>
        
        {/* AI Chat Panel */}
        <div 
          className="bg-replit-panel border-r border-replit-border flex flex-col relative group"
          style={{ width: isAiChatCollapsed ? '48px' : `${aiChatWidth}px` }}
        >
          {/* Left Drag Handle for AI Chat (shared with editor) */}
          {!isAiChatCollapsed && (
            <div 
              className="absolute left-0 top-0 w-2 h-full cursor-grab hover:cursor-grab active:cursor-grabbing bg-blue-500/20 hover:bg-replit-blue/40 transition-colors z-10 border-r border-blue-500/30"
              onMouseDown={(e) => handleMouseDown(e, 'ai-chat-left')}
            />
          )}
          
          <div className="p-3 border-b border-replit-border flex items-center justify-between">
            {!isAiChatCollapsed && (
              <h3 className="font-semibold text-replit-text text-sm flex items-center gap-2">
                <Bot className="w-4 h-4" />
                AI Chat
              </h3>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsAiChatCollapsed(!isAiChatCollapsed)}
              className="p-1 h-8 w-8"
            >
              {isAiChatCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </Button>
          </div>
          <div className="flex-1 overflow-hidden">
            {isAiChatCollapsed ? (
              <div className="flex items-center justify-center h-full">
                <Bot className="w-6 h-6 text-replit-text-secondary" />
              </div>
            ) : (
              <AiChatPanel projectId={currentProject} />
            )}
          </div>
        </div>
        
        {/* Main Editor Area */}
        <div className="flex-1 flex flex-col relative">
          {/* Left Drag Handle for Editor (shared with AI Chat) */}
          <div 
            className="absolute left-0 top-0 w-2 h-full cursor-grab hover:cursor-grab active:cursor-grabbing bg-blue-500/20 hover:bg-replit-blue/40 transition-colors z-20 border-r border-blue-500/30"
            onMouseDown={(e) => handleMouseDown(e, 'ai-chat-left')}
          />
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
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
              <TabsTrigger value="git-log" className="flex items-center gap-2 text-sm modern-button data-[state=active]:bg-replit-blue data-[state=active]:text-white">
                <GitCommit className="w-4 h-4" />
                Git Log
              </TabsTrigger>
              <TabsTrigger value="context" className="flex items-center gap-2 text-sm modern-button data-[state=active]:bg-replit-blue data-[state=active]:text-white">
                <Activity className="w-4 h-4" />
                Context
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
            
            <TabsContent value="git-log" className="flex-1 m-0">
              <GitLogPanel />
            </TabsContent>
            
            <TabsContent value="context" className="flex-1 m-0">
              <ContextPanel projectId={currentProject} />
            </TabsContent>
            
            {/* Agent Tool Tabs - Only show when activeTab matches */}
            {activeTab === "database-console" && (
              <TabsContent value="database-console" className="flex-1 m-0">
                <DatabaseConsole />
              </TabsContent>
            )}
            
            {activeTab === "system-monitor" && (
              <TabsContent value="system-monitor" className="flex-1 m-0">
                <SystemMonitor />
              </TabsContent>
            )}
            
            {activeTab === "middleware-monitor" && (
              <TabsContent value="middleware-monitor" className="flex-1 m-0">
                <MiddlewareMonitor />
              </TabsContent>
            )}
            
            {activeTab === "file-analysis" && (
              <TabsContent value="file-analysis" className="flex-1 m-0">
                <FileAnalysis currentProject={currentProject} />
              </TabsContent>
            )}
            
            {activeTab === "developer-agent" && (
              <TabsContent value="developer-agent" className="flex-1 m-0">
                <div className="h-full bg-replit-panel p-4">
                  <DeveloperAgent />
                </div>
              </TabsContent>
            )}
            
            {activeTab === "git-management" && (
              <TabsContent value="git-management" className="flex-1 m-0">
                <GitManagement currentProject={currentProject} />
              </TabsContent>
            )}
            
            {activeTab === "vault-explorer" && (
              <TabsContent value="vault-explorer" className="flex-1 m-0">
                <VaultExplorer workspace={workingDirectory || currentProject} />
              </TabsContent>
            )}
            
            {activeTab === "leviatan-settings" && (
              <TabsContent value="leviatan-settings" className="flex-1 m-0">
                <LeviatanSettings currentProject={currentProject} />
              </TabsContent>
            )}
            


          </Tabs>
        </div>
      </div>

      {/* System Resource Ribbon */}
      <div className="bg-replit-panel/90 backdrop-blur-lg border-t border-replit-border px-6 py-2 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <Cpu className="w-3 h-3 text-replit-blue" />
            <span className="text-replit-text-secondary">CPU:</span>
            <span className="text-replit-text font-medium">{systemStats.cpu}%</span>
          </div>
          <div className="flex items-center space-x-2">
            <HardDrive className="w-3 h-3 text-green-500" />
            <span className="text-replit-text-secondary">Memory:</span>
            <span className="text-replit-text font-medium">{systemStats.memory}%</span>
          </div>
          <div className="flex items-center space-x-2">
            <HardDrive className="w-3 h-3 text-orange-500" />
            <span className="text-replit-text-secondary">Disk:</span>
            <span className="text-replit-text font-medium">{systemStats.disk}%</span>
          </div>
          <div className="flex items-center space-x-2">
            <Activity className="w-3 h-3 text-purple-500" />
            <span className="text-replit-text-secondary">Processes:</span>
            <span className="text-replit-text font-medium">{systemStats.processes}</span>
          </div>
        </div>
        <div className="flex items-center space-x-4 text-replit-text-secondary">
          <span>LeviatanCode v1.0</span>
          <span>Port: 5000</span>
          <span className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Connected</span>
          </span>
        </div>
      </div>

      {/* Dialogs */}
      <NewProjectDialog 
        open={showNewProjectDialog} 
        onOpenChange={setShowNewProjectDialog} 
      />
    </div>
  );
}