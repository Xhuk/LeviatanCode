import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Terminal, Trash2, Download, Filter } from "lucide-react";

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  source?: string;
}

interface ConsolePanelProps {
  projectId: string;
}

export function ConsolePanel({ projectId }: ConsolePanelProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isAutoScroll, setIsAutoScroll] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const addLog = (entry: LogEntry) => {
    setLogs(prev => [...prev, entry].slice(-1000)); // Keep last 1000 logs
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const exportLogs = () => {
    const logText = logs.map(log => 
      `[${log.timestamp}] ${log.level.toUpperCase()}: ${log.message}`
    ).join('\n');
    
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `console-logs-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filteredLogs = logs.filter(log => {
    if (filter === 'all') return true;
    return log.level === filter;
  });

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-400 bg-red-900/20';
      case 'warn': return 'text-yellow-400 bg-yellow-900/20';
      case 'info': return 'text-blue-400 bg-blue-900/20';
      case 'debug': return 'text-gray-400 bg-gray-900/20';
      default: return 'text-replit-text-secondary bg-replit-elevated';
    }
  };

  const getLevelBadgeColor = (level: string) => {
    switch (level) {
      case 'error': return 'bg-red-500 text-white';
      case 'warn': return 'bg-yellow-500 text-black';
      case 'info': return 'bg-blue-500 text-white';
      case 'debug': return 'bg-gray-500 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  // Simulate some log entries for demo
  useEffect(() => {
    const interval = setInterval(() => {
      const messages = [
        { level: 'info' as const, message: 'Application started successfully', source: 'app' },
        { level: 'debug' as const, message: 'Loading configuration files...', source: 'config' },
        { level: 'warn' as const, message: 'Deprecated API endpoint used', source: 'api' },
        { level: 'error' as const, message: 'Failed to connect to database', source: 'db' },
        { level: 'info' as const, message: 'User authentication successful', source: 'auth' },
        { level: 'debug' as const, message: 'Cache miss for key: user_session_123', source: 'cache' },
        { level: 'info' as const, message: 'File upload completed', source: 'storage' },
        { level: 'warn' as const, message: 'Memory usage above 80%', source: 'system' }
      ];
      
      const randomMessage = messages[Math.floor(Math.random() * messages.length)];
      
      // Only add logs occasionally to avoid spam
      if (Math.random() > 0.7) {
        addLog({
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          ...randomMessage
        });
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (isAutoScroll && scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [logs, isAutoScroll]);

  return (
    <div className="h-full flex flex-col replit-panel">
      <div className="p-3 border-b border-replit-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-replit-text">Console Output</h3>
          <div className="flex items-center gap-1">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={exportLogs}
              className="border-replit-border hover:bg-replit-elevated"
            >
              <Download className="w-3 h-3" />
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={clearLogs}
              className="border-replit-border hover:bg-replit-elevated"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
        
        {/* Filter Controls */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-replit-text-secondary" />
          <div className="flex gap-1">
            {['all', 'error', 'warn', 'info', 'debug'].map((level) => (
              <Button
                key={level}
                size="sm" 
                variant={filter === level ? "default" : "outline"}
                onClick={() => setFilter(level)}
                className={`text-xs h-6 px-2 ${
                  filter === level 
                    ? 'bg-replit-blue text-white' 
                    : 'border-replit-border hover:bg-replit-elevated'
                }`}
              >
                {level}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <input
              type="checkbox"
              checked={isAutoScroll}
              onChange={(e) => setIsAutoScroll(e.target.checked)}
              className="w-3 h-3"
            />
            <span className="text-xs text-replit-text-secondary">Auto-scroll</span>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1" ref={scrollAreaRef}>
        <div className="p-2">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-8">
              <Terminal className="w-8 h-8 text-replit-text-muted mx-auto mb-2" />
              <p className="text-sm text-replit-text-muted">
                {filter === 'all' ? 'No console output yet' : `No ${filter} logs`}
              </p>
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className={`p-2 mb-1 rounded text-xs font-mono ${getLevelColor(log.level)}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Badge 
                    className={`text-xs px-1 py-0 h-4 ${getLevelBadgeColor(log.level)}`}
                  >
                    {log.level.toUpperCase()}
                  </Badge>
                  <span className="text-replit-text-muted">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  {log.source && (
                    <span className="text-replit-text-muted">[{log.source}]</span>
                  )}
                </div>
                <div className="text-replit-text whitespace-pre-wrap break-words">
                  {log.message}
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Stats Bar */}
      <div className="border-t border-replit-border px-3 py-2 flex items-center justify-between text-xs">
        <div className="flex items-center gap-4">
          <span className="text-replit-text-secondary">
            Total: {logs.length}
          </span>
          <span className="text-red-400">
            Errors: {logs.filter(log => log.level === 'error').length}
          </span>
          <span className="text-yellow-400">
            Warnings: {logs.filter(log => log.level === 'warn').length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${logs.length > 0 ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`} />
          <span className="text-replit-text-secondary">
            {logs.length > 0 ? 'Active' : 'Idle'}
          </span>
        </div>
      </div>
    </div>
  );
}