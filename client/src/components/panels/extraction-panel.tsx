import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Archive, FileText, Trash2, Loader2 } from "lucide-react";

interface ExtractionLog {
  id: string;
  timestamp: Date;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  details?: string;
}

interface ExtractionPanelProps {
  className?: string;
}

export function ExtractionPanel({ className }: ExtractionPanelProps) {
  const [logs, setLogs] = useState<ExtractionLog[]>([]);
  const [isActive, setIsActive] = useState(false);

  // Add extraction log entry
  const addLog = (type: ExtractionLog['type'], message: string, details?: string) => {
    const newLog: ExtractionLog = {
      id: Date.now().toString(),
      timestamp: new Date(),
      type,
      message,
      details
    };
    setLogs(prev => [...prev, newLog]);
  };

  // Clear all logs
  const clearLogs = () => {
    setLogs([]);
    setIsActive(false);
    localStorage.removeItem('leviatancode_extraction_logs');
  };

  // Load persistent logs from localStorage
  useEffect(() => {
    const savedLogs = localStorage.getItem('leviatancode_extraction_logs');
    if (savedLogs) {
      try {
        const parsedLogs = JSON.parse(savedLogs);
        setLogs(parsedLogs);
      } catch (e) {
        console.warn('Failed to parse saved extraction logs');
      }
    }
  }, []);

  // Save logs to localStorage whenever they change
  useEffect(() => {
    if (logs.length > 0) {
      localStorage.setItem('leviatancode_extraction_logs', JSON.stringify(logs));
    }
  }, [logs]);

  // Listen for extraction events from the import process
  useEffect(() => {
    const handleExtractionStart = () => {
      // Clear previous logs when starting new extraction
      setLogs([]);
      setIsActive(true);
      addLog('info', '📦 Starting ZIP extraction process...');
    };

    const handleExtractionProgress = (event: CustomEvent) => {
      const { filename, size } = event.detail;
      addLog('info', `🔍 Processing ${filename}...`, `Size: ${size} bytes`);
    };

    const handleExtractionComplete = (event: CustomEvent) => {
      const { fileCount, extractPath } = event.detail;
      addLog('success', `✅ Extraction completed successfully!`, 
        `Processed ${fileCount} files, extracted to: ${extractPath}`);
      setIsActive(false);
    };

    const handleExtractionError = (event: CustomEvent) => {
      const { message } = event.detail;
      addLog('error', `❌ Extraction failed: ${message}`);
      setIsActive(false);
    };

    const handleExtractionLog = (event: CustomEvent) => {
      const { type, message, details } = event.detail;
      addLog(type, message, details);
    };

    // Connect to actual events from the import process
    window.addEventListener('extraction:start', handleExtractionStart);
    window.addEventListener('extraction:progress', handleExtractionProgress as EventListener);
    window.addEventListener('extraction:complete', handleExtractionComplete as EventListener);
    window.addEventListener('extraction:error', handleExtractionError as EventListener);
    window.addEventListener('extraction:log', handleExtractionLog as EventListener);

    return () => {
      window.removeEventListener('extraction:start', handleExtractionStart);
      window.removeEventListener('extraction:progress', handleExtractionProgress as EventListener);
      window.removeEventListener('extraction:complete', handleExtractionComplete as EventListener);
      window.removeEventListener('extraction:error', handleExtractionError as EventListener);
      window.removeEventListener('extraction:log', handleExtractionLog as EventListener);
    };
  }, []);

  const getLogIcon = (type: ExtractionLog['type']) => {
    switch (type) {
      case 'info': return '📦';
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return '📄';
    }
  };

  const getLogColor = (type: ExtractionLog['type']) => {
    switch (type) {
      case 'info': return 'text-blue-400';
      case 'success': return 'text-green-400';
      case 'warning': return 'text-yellow-400';
      case 'error': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <Card className={`h-full flex flex-col ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Archive className="h-4 w-4" />
            <CardTitle className="text-base">ZIP Extraction Logs</CardTitle>
            {isActive && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Active
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearLogs}
            disabled={logs.length === 0}
            className="h-8 px-2"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
        <CardDescription className="text-sm">
          Real-time ZIP decompression logs (persistent until next extraction)
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1 min-h-0 p-0">
        <div className="bg-black dark:bg-gray-900 text-green-400 h-full">
          <ScrollArea className="h-full">
            <div className="p-4 font-mono text-sm space-y-2">
              {logs.length === 0 ? (
                <div className="text-gray-500 text-center py-8">
                  <Archive className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No extraction activity yet.</p>
                  <p className="text-xs mt-2">ZIP extraction logs will appear here during file imports.</p>
                </div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="space-y-1">
                    <div className={`flex items-start gap-2 ${getLogColor(log.type)}`}>
                      <span className="flex-shrink-0 mt-0.5">
                        {getLogIcon(log.type)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="break-words">{log.message}</div>
                        {log.details && (
                          <div className="text-xs text-gray-500 mt-1 ml-4">
                            {log.details}
                          </div>
                        )}
                        <div className="text-xs text-gray-600 mt-1">
                          {log.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}

// Export function to add logs from other components
export const useExtractionLogs = () => {
  const addExtractionLog = (type: ExtractionLog['type'], message: string, details?: string) => {
    // This would trigger the log addition in the ExtractionPanel
    const event = new CustomEvent('extraction:log', {
      detail: { type, message, details }
    });
    window.dispatchEvent(event);
  };

  return { addExtractionLog };
};