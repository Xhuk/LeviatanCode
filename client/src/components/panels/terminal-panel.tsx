import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Terminal, Play, Square, Trash2, Copy, Send, Activity, Monitor } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface TerminalPanelProps {
  projectId: string;
}

interface TerminalLine {
  id: string;
  content: string;
  type: 'command' | 'output' | 'error' | 'success' | 'warning' | 'prompt';
  timestamp: Date;
}

interface ConsoleLog {
  id: string;
  message: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  timestamp: string;
  source?: string;
}

export function TerminalPanel({ projectId }: TerminalPanelProps) {
  const [activeTab, setActiveTab] = useState<'terminal' | 'console'>('terminal');
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([]);
  const [consoleLogs, setConsoleLogs] = useState<ConsoleLog[]>([]);
  const [currentCommand, setCurrentCommand] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const terminalRef = useRef<HTMLDivElement>(null);
  const consoleRef = useRef<HTMLDivElement>(null);
  const commandInputRef = useRef<HTMLInputElement>(null);

  // Execute command mutation
  const executeCommandMutation = useMutation({
    mutationFn: async (command: string) => {
      return apiRequest(`/api/terminal/execute`, {
        method: 'POST',
        body: JSON.stringify({ command, projectId }),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: (data, command) => {
      addTerminalLine(data.output || '', data.exitCode === 0 ? 'success' : 'error');
      addPrompt();
      setIsRunning(false);
    },
    onError: (error: any) => {
      addTerminalLine(`Error: ${error.message || 'Command execution failed'}`, 'error');
      addPrompt();
      setIsRunning(false);
    }
  });

  useEffect(() => {
    // Initialize terminal with PowerShell prompt
    const initialLines: TerminalLine[] = [
      {
        id: '1',
        content: 'LeviatanCode Terminal v1.0 - Interactive PowerShell',
        type: 'output',
        timestamp: new Date(Date.now() - 10000)
      },
      {
        id: '2',
        content: 'Type commands below or use the input field to execute PowerShell commands.',
        type: 'output',
        timestamp: new Date(Date.now() - 8000)
      }
    ];
    
    setTerminalLines(initialLines);
    addPrompt();
    
    // Initialize console with sample logs
    const initialConsole: ConsoleLog[] = [
      {
        id: '1',
        message: 'Application started successfully',
        level: 'info',
        timestamp: new Date().toISOString(),
        source: 'system'
      },
      {
        id: '2',
        message: 'Listening on port 5005',
        level: 'info',
        timestamp: new Date().toISOString(),
        source: 'server'
      }
    ];
    
    setConsoleLogs(initialConsole);
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom when new lines are added
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalLines]);

  useEffect(() => {
    // Auto-scroll console to bottom
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [consoleLogs]);

  const getLineColor = (type: string) => {
    switch (type) {
      case 'command':
        return 'text-blue-400';
      case 'prompt':
        return 'text-green-400';
      case 'success':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      case 'warning':
        return 'text-yellow-300';
      default:
        return 'text-gray-300';
    }
  };

  const getLogColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'text-red-400';
      case 'warn':
        return 'text-yellow-300';
      case 'debug':
        return 'text-purple-400';
      default:
        return 'text-gray-300';
    }
  };

  const addTerminalLine = (content: string, type: TerminalLine['type'] = 'output') => {
    const newLine: TerminalLine = {
      id: Date.now().toString(),
      content,
      type,
      timestamp: new Date()
    };
    setTerminalLines(prev => [...prev, newLine]);
  };

  const addPrompt = () => {
    addTerminalLine('PS C:\\LeviatanCode> ', 'prompt');
  };

  const addConsoleLog = (message: string, level: ConsoleLog['level'] = 'info', source?: string) => {
    const newLog: ConsoleLog = {
      id: Date.now().toString(),
      message,
      level,
      timestamp: new Date().toISOString(),
      source
    };
    setConsoleLogs(prev => [...prev, newLog]);
  };

  const executeCommand = async () => {
    if (!currentCommand.trim() || isRunning) return;

    const command = currentCommand.trim();
    
    // Add command to terminal display
    addTerminalLine(command, 'command');
    
    // Add to command history
    setCommandHistory(prev => [...prev, command]);
    setHistoryIndex(-1);
    
    setCurrentCommand("");
    setIsRunning(true);

    // Simple built-in commands
    if (command === 'clear' || command === 'cls') {
      setTerminalLines([]);
      addPrompt();
      setIsRunning(false);
      return;
    }

    if (command === 'help') {
      addTerminalLine('Available commands:', 'output');
      addTerminalLine('  clear/cls - Clear terminal', 'output');
      addTerminalLine('  help - Show this help', 'output');
      addTerminalLine('  ls/dir - List directory contents', 'output');
      addTerminalLine('  cd <path> - Change directory', 'output');
      addTerminalLine('  npm/node/python - Run development commands', 'output');
      addPrompt();
      setIsRunning(false);
      return;
    }

    // Execute command via API
    try {
      executeCommandMutation.mutate(command);
    } catch (error) {
      addTerminalLine(`Error executing command: ${error}`, 'error');
      addPrompt();
      setIsRunning(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      executeCommand();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0 && historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setCurrentCommand(commandHistory[commandHistory.length - 1 - newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCurrentCommand(commandHistory[commandHistory.length - 1 - newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCurrentCommand("");
      }
    }
  };

  const clearTerminal = () => {
    setTerminalLines([]);
    addPrompt();
  };

  const clearConsole = () => {
    setConsoleLogs([]);
  };

  const copyTerminalContent = () => {
    const content = terminalLines.map(line => line.content).join('\n');
    navigator.clipboard.writeText(content);
  };

  const copyConsoleContent = () => {
    const content = consoleLogs.map(log => `[${log.level.toUpperCase()}] ${log.message}`).join('\n');
    navigator.clipboard.writeText(content);
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 border-r border-gray-800">
      <div className="flex items-center justify-between p-3 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-green-400" />
          <span className="text-sm font-medium text-white">Terminal & Console</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {isRunning ? (
              <><Activity className="h-3 w-3 mr-1 animate-pulse" />Running</>
            ) : (
              <>Ready</>
            )}
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'terminal' | 'console')} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-2 bg-gray-800 border-b border-gray-700">
          <TabsTrigger value="terminal" className="flex items-center gap-2">
            <Terminal className="h-4 w-4" />
            Terminal
          </TabsTrigger>
          <TabsTrigger value="console" className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            Console
          </TabsTrigger>
        </TabsList>

        <TabsContent value="terminal" className="flex-1 flex flex-col p-0 m-0">
          <div className="flex items-center justify-between p-2 border-b border-gray-800">
            <div className="text-xs text-gray-400">Interactive PowerShell Terminal</div>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={copyTerminalContent}
                className="h-6 px-2 text-xs"
              >
                <Copy className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={clearTerminal}
                className="h-6 px-2 text-xs"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <div 
            ref={terminalRef}
            className="flex-1 overflow-y-auto p-3 bg-black font-mono text-sm"
          >
            {terminalLines.map((line) => (
              <div key={line.id} className={`${getLineColor(line.type)} mb-1`}>
                {line.type === 'prompt' ? (
                  <span className="select-none">{line.content}</span>
                ) : (
                  <span>{line.content}</span>
                )}
              </div>
            ))}
          </div>

          <div className="p-3 border-t border-gray-800 bg-gray-900">
            <div className="flex items-center gap-2">
              <span className="text-green-400 font-mono text-sm shrink-0">PS C:\LeviatanCode&gt;</span>
              <Input
                ref={commandInputRef}
                value={currentCommand}
                onChange={(e) => setCurrentCommand(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your command here..."
                className="flex-1 bg-black border-gray-700 text-white font-mono"
                disabled={isRunning}
              />
              <Button
                size="sm"
                onClick={executeCommand}
                disabled={!currentCommand.trim() || isRunning}
                className="shrink-0"
              >
                {isRunning ? (
                  <Activity className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="console" className="flex-1 flex flex-col p-0 m-0">
          <div className="flex items-center justify-between p-2 border-b border-gray-800">
            <div className="text-xs text-gray-400">Run Command Logs & Details</div>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={copyConsoleContent}
                className="h-6 px-2 text-xs"
              >
                <Copy className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={clearConsole}
                className="h-6 px-2 text-xs"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <div 
            ref={consoleRef}
            className="flex-1 overflow-y-auto p-3 bg-black font-mono text-sm"
          >
            {consoleLogs.length === 0 ? (
              <div className="text-gray-500 italic">
                No console logs yet. Run commands will appear here.
              </div>
            ) : (
              consoleLogs.map((log) => (
                <div key={log.id} className="mb-1 flex items-start gap-2">
                  <span className="text-gray-500 text-xs shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span className={`text-xs uppercase shrink-0 ${getLogColor(log.level)}`}>
                    [{log.level}]
                  </span>
                  {log.source && (
                    <span className="text-gray-400 text-xs shrink-0">
                      ({log.source})
                    </span>
                  )}
                  <span className={`${getLogColor(log.level)}`}>
                    {log.message}
                  </span>
                </div>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}