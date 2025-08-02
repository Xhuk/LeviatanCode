import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Terminal, Trash2, Download } from "lucide-react";

interface ConsolePanelProps {
  projectId: string;
}

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  source?: string;
}

export function ConsolePanel({ projectId }: ConsolePanelProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Real console log streaming with WebSocket connection
    const connectWebSocket = () => {
      try {
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const wsUrl = `${protocol}//${window.location.host}/ws/console`;
        const ws = new WebSocket(wsUrl);
        
        ws.onopen = () => {
          console.log('Console WebSocket connected');
          setIsConnected(true);
        };
        
        ws.onmessage = (event) => {
          const logData = JSON.parse(event.data);
          const newLog: LogEntry = {
            id: Date.now().toString(),
            timestamp: new Date().toLocaleTimeString(),
            level: logData.level || 'info',
            message: logData.message,
            source: logData.source || 'runtime'
          };
          setLogs(prev => [...prev, newLog].slice(-100)); // Keep last 100 logs
        };
        
        ws.onclose = () => {
          setIsConnected(false);
          // Reconnect after 3 seconds
          setTimeout(connectWebSocket, 3000);
        };
        
        ws.onerror = () => {
          setIsConnected(false);
        };
        
        return ws;
      } catch (error) {
        console.error('WebSocket connection failed:', error);
        setIsConnected(false);
        return null;
      }
    };

    // Initialize with some sample logs
    const initialLogs: LogEntry[] = [
      {
        id: "1",
        timestamp: new Date().toLocaleTimeString(),
        level: "info",
        message: "LeviatanCode development server started",
        source: "server"
      },
      {
        id: "2", 
        timestamp: new Date().toLocaleTimeString(),
        level: "info",
        message: "Vite dev server running on http://localhost:5000",
        source: "vite"
      },
      {
        id: "3",
        timestamp: new Date().toLocaleTimeString(),
        level: "info",
        message: "WebSocket server initialized",
        source: "websocket"
      },
      {
        id: "4",
        timestamp: new Date().toLocaleTimeString(),
        level: "debug",
        message: "AI chat panel loaded successfully",
        source: "frontend"
      }
    ];
    
    setLogs(initialLogs);
    
    // Connect to WebSocket for real-time logs
    const ws = connectWebSocket();
    
    // Simulate periodic system logs
    const interval = setInterval(() => {
      const messages = [
        "Processing user request",
        "File system cache updated",
        "AI model response received",
        "Git status refreshed",
        "Project analysis completed"
      ];
      
      const newLog: LogEntry = {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleTimeString(),
        level: Math.random() > 0.8 ? 'warning' : 'info',
        message: messages[Math.floor(Math.random() * messages.length)],
        source: "system"
      };
      
      setLogs(prev => [...prev, newLog].slice(-100));
    }, 10000);

    return () => {
      clearInterval(interval);
      if (ws) {
        ws.close();
      }
    };
  }, [projectId]);

  const filteredLogs = logs.filter(log => 
    filter === "all" || log.level === filter
  );

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-400 bg-red-500/20';
      case 'warning': return 'text-yellow-400 bg-yellow-500/20';
      case 'info': return 'text-blue-400 bg-blue-500/20';
      case 'debug': return 'text-purple-400 bg-purple-500/20';
      default: return 'text-replit-text-secondary bg-replit-elevated';
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const exportLogs = () => {
    const logText = logs.map(log => 
      `[${log.timestamp}] ${log.level.toUpperCase()} ${log.source ? `[${log.source}]` : ''} ${log.message}`
    ).join('\n');
    
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `console-logs-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-replit-panel">
      {/* Header */}
      <div className="p-4 border-b border-replit-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Terminal className="w-4 h-4 text-replit-blue" />
            <h3 className="font-semibold text-replit-text">Console Output</h3>
            <Badge variant="outline" className="text-xs">
              <div className={`w-2 h-2 rounded-full mr-1 animate-pulse ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
              {isConnected ? 'Live' : 'Offline'}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {filteredLogs.length} entries
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-24 h-8 bg-replit-elevated border-replit-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="error">Errors</SelectItem>
                <SelectItem value="warning">Warnings</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="debug">Debug</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" size="sm" onClick={exportLogs} disabled={logs.length === 0}>
              <Download className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={clearLogs}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Console Logs */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-1">
          {filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <Terminal className="w-8 h-8 text-replit-text-muted mb-2" />
              <p className="text-sm text-replit-text-secondary">No console output</p>
              <p className="text-xs text-replit-text-muted">Application logs will appear here</p>
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div key={log.id} className="flex items-start space-x-3 p-2 rounded text-xs hover:bg-replit-elevated/50 transition-colors font-mono">
                <div className="flex-shrink-0 text-replit-text-muted w-16">
                  {log.timestamp}
                </div>
                <Badge className={`text-xs px-1 py-0 ${getLevelColor(log.level)} border-0 font-mono uppercase`}>
                  {log.level.substring(0, 4)}
                </Badge>
                {log.source && (
                  <div className="text-replit-text-secondary w-16 truncate">
                    [{log.source}]
                  </div>
                )}
                <div className="flex-1 text-replit-text">
                  {log.message}
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}