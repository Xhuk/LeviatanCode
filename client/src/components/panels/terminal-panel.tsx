import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Terminal, Bug, TrendingUp, Play, Square, MemoryStick, Cpu } from "lucide-react";

interface TerminalPanelProps {
  projectId: string;
}

interface TerminalLine {
  id: string;
  content: string;
  type: 'command' | 'output' | 'error' | 'success' | 'warning';
  timestamp: Date;
}

export function TerminalPanel({ projectId }: TerminalPanelProps) {
  const [activeTab, setActiveTab] = useState<'terminal' | 'console' | 'metrics'>('terminal');
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize with empty terminal ready for development
    const initialLines: TerminalLine[] = [
      {
        id: '1',
        content: 'PowerShell 7.3.4',
        type: 'output',
        timestamp: new Date(Date.now() - 10000)
      },
      {
        id: '2', 
        content: 'PS C:\\Development> ',
        type: 'command',
        timestamp: new Date(Date.now() - 5000)
      }
    ];
    
    setTerminalLines(initialLines);
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom when new lines are added
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalLines]);

  const getLineColor = (type: string) => {
    switch (type) {
      case 'command':
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

  const addTerminalLine = (content: string, type: TerminalLine['type'] = 'output') => {
    const newLine: TerminalLine = {
      id: Date.now().toString(),
      content,
      type,
      timestamp: new Date()
    };
    setTerminalLines(prev => [...prev, newLine]);
  };

  const runCommand = async (command: string) => {
    setIsRunning(true);
    addTerminalLine(`PS C:\\DataScraper> ${command}`, 'command');
    
    // Simulate command execution
    setTimeout(() => {
      switch (command) {
        case 'python scraper.py':
          addTerminalLine('Starting web scraper...', 'output');
          setTimeout(() => {
            addTerminalLine('✓ Scraping completed successfully', 'success');
            setIsRunning(false);
          }, 2000);
          break;
        case 'npm run analyze':
          addTerminalLine('🔍 Analyzing data with AI...', 'output');
          setTimeout(() => {
            addTerminalLine('📊 Analysis complete - 95% accuracy', 'success');
            setIsRunning(false);
          }, 3000);
          break;
        default:
          addTerminalLine(`Command not found: ${command}`, 'error');
          setIsRunning(false);
      }
    }, 500);
  };

  const renderTerminal = () => (
    <div className="flex-1 bg-black p-3 font-mono text-sm overflow-y-auto" ref={terminalRef}>
      <div className="space-y-1">
        {terminalLines.map(line => (
          <div key={line.id} className={getLineColor(line.type)}>
            {line.content}
          </div>
        ))}
        {isRunning && (
          <div className="flex items-center space-x-2 text-blue-400">
            <div className="loading-skeleton h-4 w-48 rounded"></div>
          </div>
        )}
        <div className="text-green-400">
          PS C:\DataScraper&gt; <span className="terminal-cursor">|</span>
        </div>
      </div>
    </div>
  );

  const renderConsole = () => (
    <div className="flex-1 bg-black p-3 font-mono text-sm overflow-y-auto">
      <div className="space-y-1 text-gray-300">
        <div className="text-blue-400">[INFO] Application started</div>
        <div className="text-green-400">[SUCCESS] Database connection established</div>
        <div className="text-yellow-300">[WARNING] Rate limit approaching</div>
        <div className="text-gray-300">[DEBUG] Processing batch 127/500</div>
        <div className="text-blue-400">[INFO] AI analysis in progress...</div>
      </div>
    </div>
  );

  const renderMetrics = () => (
    <div className="flex-1 p-3 overflow-y-auto">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="replit-elevated p-3 rounded">
            <div className="text-xs text-replit-text-secondary mb-1">Profiles Scraped</div>
            <div className="text-lg font-semibold text-replit-success">127</div>
          </div>
          <div className="replit-elevated p-3 rounded">
            <div className="text-xs text-replit-text-secondary mb-1">Success Rate</div>
            <div className="text-lg font-semibold text-replit-success">95.3%</div>
          </div>
          <div className="replit-elevated p-3 rounded">
            <div className="text-xs text-replit-text-secondary mb-1">Avg Response</div>
            <div className="text-lg font-semibold text-replit-blue">1.2s</div>
          </div>
          <div className="replit-elevated p-3 rounded">
            <div className="text-xs text-replit-text-secondary mb-1">Data Quality</div>
            <div className="text-lg font-semibold text-replit-warning">Good</div>
          </div>
        </div>
        
        <div className="replit-elevated p-3 rounded">
          <div className="text-xs text-replit-text-secondary mb-2">Recent Activity</div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span>LinkedIn Scraper</span>
              <span className="text-replit-success">Completed</span>
            </div>
            <div className="flex justify-between">
              <span>Data Analysis</span>
              <span className="text-replit-blue">Running</span>
            </div>
            <div className="flex justify-between">
              <span>Twitter API</span>
              <span className="text-replit-text-muted">Pending</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full replit-panel border-r border-replit-border flex flex-col h-full">
      {/* Tab headers */}
      <div className="border-b border-replit-border">
        <div className="flex items-center">
          <div 
            className={`panel-tab border-r border-replit-border ${activeTab === 'terminal' ? 'active' : ''}`}
            onClick={() => setActiveTab('terminal')}
          >
            <Terminal size={14} className="mr-2" />
            Terminal
          </div>
          <div 
            className={`panel-tab border-r border-replit-border ${activeTab === 'console' ? 'active' : ''}`}
            onClick={() => setActiveTab('console')}
          >
            <Bug size={14} className="mr-2" />
            Console
          </div>
          <div 
            className={`panel-tab ${activeTab === 'metrics' ? 'active' : ''}`}
            onClick={() => setActiveTab('metrics')}
          >
            <TrendingUp size={14} className="mr-2" />
            Metrics
          </div>
        </div>
      </div>
      
      {/* Tab content */}
      {activeTab === 'terminal' && renderTerminal()}
      {activeTab === 'console' && renderConsole()}
      {activeTab === 'metrics' && renderMetrics()}
      
      {/* Terminal controls and status */}
      <div className="border-t border-replit-border p-2">
        {activeTab === 'terminal' && (
          <div className="flex items-center justify-between mb-2">
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => runCommand('python scraper.py')}
                disabled={isRunning}
              >
                <Play size={12} className="mr-1" />
                Run
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsRunning(false)}
                disabled={!isRunning}
              >
                <Square size={12} className="mr-1" />
                Stop
              </Button>
            </div>
          </div>
        )}
        
        <div className="flex items-center space-x-2 text-xs text-replit-text-muted">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-replit-success rounded-full"></div>
            <span>PowerShell 7.3</span>
          </div>
          <div className="flex items-center space-x-1">
            <MemoryStick size={10} />
            <span>2.1GB</span>
          </div>
          <div className="flex items-center space-x-1">
            <Cpu size={10} />
            <span>45%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
