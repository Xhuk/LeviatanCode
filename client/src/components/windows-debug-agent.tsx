import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Monitor, 
  Cpu, 
  MemoryStick, 
  HardDrive, 
  Activity, 
  Users, 
  Trash2, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Settings,
  Terminal,
  Eye,
  Shield
} from "lucide-react";

interface SystemInfo {
  platform: string;
  arch: string;
  version: string;
  hostname: string;
  uptime: string;
  loadAverage: number[];
  cpuCores: number;
  totalMemory: string;
  freeMemory: string;
  diskUsage: string;
}

interface Process {
  pid: number;
  name: string;
  cpu: number;
  memory: string;
  user: string;
  status: string;
}

interface EnvironmentVariable {
  name: string;
  value: string;
  sensitive: boolean;
}

export function WindowsDebugAgent() {
  const [activeTab, setActiveTab] = useState("overview");
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [environmentVars, setEnvironmentVars] = useState<EnvironmentVariable[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadSystemInfo = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/debug/system-info');
      if (!response.ok) throw new Error('Failed to fetch system information');
      
      const data = await response.json();
      setSystemInfo(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error loading system info:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadProcesses = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/debug/processes');
      if (!response.ok) throw new Error('Failed to fetch process information');
      
      const data = await response.json();
      setProcesses(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error loading processes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadEnvironment = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/debug/environment');
      if (!response.ok) throw new Error('Failed to fetch environment variables');
      
      const data = await response.json();
      setEnvironmentVars(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error loading environment:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const killProcess = async (pid: number) => {
    try {
      const response = await fetch('/api/debug/kill-process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pid })
      });
      
      if (!response.ok) throw new Error('Failed to kill process');
      
      const result = await response.json();
      if (result.success) {
        // Reload processes to reflect changes
        await loadProcesses();
      } else {
        setError(result.error || 'Failed to kill process');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error killing process:', err);
    }
  };

  // Load data based on active tab
  useEffect(() => {
    switch (activeTab) {
      case "overview":
        loadSystemInfo();
        break;
      case "processes":
        loadProcesses();
        break;
      case "environment":
        loadEnvironment();
        break;
    }
  }, [activeTab]);

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  return (
    <div className="h-full bg-replit-bg p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-replit-text flex items-center gap-2">
              <Shield className="w-6 h-6 text-replit-blue" />
              Windows Debug Agent
            </h2>
            <p className="text-sm text-replit-text-secondary mt-1">
              System diagnostics, process monitoring, and environment analysis
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {lastUpdated && (
              <span className="text-xs text-replit-text-secondary">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                switch (activeTab) {
                  case "overview": loadSystemInfo(); break;
                  case "processes": loadProcesses(); break;
                  case "environment": loadEnvironment(); break;
                }
              }}
              disabled={isLoading}
              className="modern-button"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="border-red-500/50 bg-red-500/10">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-400">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-replit-panel/90 backdrop-blur-lg border border-replit-border rounded-lg h-12 w-full justify-start shadow-sm">
            <TabsTrigger value="overview" className="flex items-center gap-2 text-sm modern-button data-[state=active]:bg-replit-blue data-[state=active]:text-white">
              <Monitor className="w-4 h-4" />
              System Overview
            </TabsTrigger>
            <TabsTrigger value="processes" className="flex items-center gap-2 text-sm modern-button data-[state=active]:bg-replit-blue data-[state=active]:text-white">
              <Activity className="w-4 h-4" />
              Process Monitor
            </TabsTrigger>
            <TabsTrigger value="environment" className="flex items-center gap-2 text-sm modern-button data-[state=active]:bg-replit-blue data-[state=active]:text-white">
              <Settings className="w-4 h-4" />
              Environment
            </TabsTrigger>
          </TabsList>

          {/* System Overview Tab */}
          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* System Information */}
              <Card className="bg-replit-panel border-replit-border">
                <CardHeader>
                  <CardTitle className="text-replit-text flex items-center gap-2">
                    <Info className="w-5 h-5 text-replit-blue" />
                    System Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {systemInfo ? (
                    <>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-replit-text-secondary">Platform:</span>
                          <div className="text-replit-text font-medium">{systemInfo.platform}</div>
                        </div>
                        <div>
                          <span className="text-replit-text-secondary">Architecture:</span>
                          <div className="text-replit-text font-medium">{systemInfo.arch}</div>
                        </div>
                        <div>
                          <span className="text-replit-text-secondary">Version:</span>
                          <div className="text-replit-text font-medium">{systemInfo.version}</div>
                        </div>
                        <div>
                          <span className="text-replit-text-secondary">Hostname:</span>
                          <div className="text-replit-text font-medium">{systemInfo.hostname}</div>
                        </div>
                        <div>
                          <span className="text-replit-text-secondary">Uptime:</span>
                          <div className="text-replit-text font-medium">{systemInfo.uptime}</div>
                        </div>
                        <div>
                          <span className="text-replit-text-secondary">CPU Cores:</span>
                          <div className="text-replit-text font-medium">{systemInfo.cpuCores}</div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-replit-text-secondary">
                      {isLoading ? "Loading system information..." : "No system information available"}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Resource Usage */}
              <Card className="bg-replit-panel border-replit-border">
                <CardHeader>
                  <CardTitle className="text-replit-text flex items-center gap-2">
                    <Activity className="w-5 h-5 text-green-500" />
                    Resource Usage
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {systemInfo ? (
                    <>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <MemoryStick className="w-4 h-4 text-blue-500" />
                            <span className="text-sm text-replit-text-secondary">Total Memory:</span>
                          </div>
                          <span className="text-sm text-replit-text font-medium">{systemInfo.totalMemory}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <MemoryStick className="w-4 h-4 text-green-500" />
                            <span className="text-sm text-replit-text-secondary">Free Memory:</span>
                          </div>
                          <span className="text-sm text-replit-text font-medium">{systemInfo.freeMemory}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <HardDrive className="w-4 h-4 text-orange-500" />
                            <span className="text-sm text-replit-text-secondary">Disk Usage:</span>
                          </div>
                          <span className="text-sm text-replit-text font-medium">{systemInfo.diskUsage}</span>
                        </div>
                        {systemInfo.loadAverage && systemInfo.loadAverage.length > 0 && (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Cpu className="w-4 h-4 text-purple-500" />
                              <span className="text-sm text-replit-text-secondary">Load Average:</span>
                            </div>
                            <span className="text-sm text-replit-text font-medium">
                              {systemInfo.loadAverage.map(load => load.toFixed(2)).join(", ")}
                            </span>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="text-replit-text-secondary">
                      {isLoading ? "Loading resource information..." : "No resource information available"}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Process Monitor Tab */}
          <TabsContent value="processes" className="mt-6">
            <Card className="bg-replit-panel border-replit-border">
              <CardHeader>
                <CardTitle className="text-replit-text flex items-center gap-2">
                  <Users className="w-5 h-5 text-replit-blue" />
                  Running Processes ({processes.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  {processes.length > 0 ? (
                    <div className="space-y-2">
                      {processes.map((process) => (
                        <div key={process.pid} className="flex items-center justify-between p-3 bg-replit-elevated rounded-lg border border-replit-border hover:bg-replit-bg transition-colors">
                          <div className="flex-1 grid grid-cols-5 gap-4 text-sm">
                            <div>
                              <span className="text-replit-text-secondary">PID:</span>
                              <div className="text-replit-text font-mono">{process.pid}</div>
                            </div>
                            <div>
                              <span className="text-replit-text-secondary">Name:</span>
                              <div className="text-replit-text font-medium truncate">{process.name}</div>
                            </div>
                            <div>
                              <span className="text-replit-text-secondary">CPU:</span>
                              <div className="text-replit-text">{process.cpu}%</div>
                            </div>
                            <div>
                              <span className="text-replit-text-secondary">Memory:</span>
                              <div className="text-replit-text">{process.memory}</div>
                            </div>
                            <div>
                              <span className="text-replit-text-secondary">Status:</span>
                              <Badge 
                                variant={process.status === 'running' ? 'default' : 'secondary'}
                                className={process.status === 'running' ? 'bg-green-500/20 text-green-400' : ''}
                              >
                                {process.status}
                              </Badge>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => killProcess(process.pid)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                            title="Kill Process"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-replit-text-secondary">
                      {isLoading ? "Loading processes..." : "No processes found"}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Environment Variables Tab */}
          <TabsContent value="environment" className="mt-6">
            <Card className="bg-replit-panel border-replit-border">
              <CardHeader>
                <CardTitle className="text-replit-text flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-replit-blue" />
                  Environment Variables ({environmentVars.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  {environmentVars.length > 0 ? (
                    <div className="space-y-2">
                      {environmentVars.map((envVar, index) => (
                        <div key={index} className="p-3 bg-replit-elevated rounded-lg border border-replit-border">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-mono text-sm text-replit-text font-medium">{envVar.name}</span>
                            {envVar.sensitive && (
                              <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400">
                                <Eye className="w-3 h-3 mr-1" />
                                Sensitive
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-replit-text-secondary font-mono break-all">
                            {envVar.sensitive ? '••••••••••••••••••••••••••••••••••••••••••••••••••••••••' : envVar.value}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-replit-text-secondary">
                      {isLoading ? "Loading environment variables..." : "No environment variables found"}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}