import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Code, FileText, Search, Bug, Cog, Zap } from "lucide-react";

interface AgentStatus {
  status: 'idle' | 'working' | 'creating' | 'reviewing' | 'editing' | 'executing' | 'analyzing' | 'debugging';
  message: string;
  progress?: number;
}

export function StatusDemo() {
  const [agentStatus, setAgentStatus] = useState<AgentStatus>({ status: 'idle', message: '' });

  const getStatusIcon = (status: AgentStatus['status']) => {
    switch (status) {
      case 'working': return <Cog className="w-4 h-4 animate-spin" />;
      case 'creating': return <FileText className="w-4 h-4 animate-pulse" />;
      case 'reviewing': return <Search className="w-4 h-4 animate-pulse" />;
      case 'editing': return <Code className="w-4 h-4 animate-pulse" />;
      case 'executing': return <Zap className="w-4 h-4 animate-pulse" />;
      case 'analyzing': return <Search className="w-4 h-4 animate-pulse" />;
      case 'debugging': return <Bug className="w-4 h-4 animate-pulse" />;
      default: return null;
    }
  };

  const getStatusColor = (status: AgentStatus['status']) => {
    switch (status) {
      case 'working': return 'text-blue-500';
      case 'creating': return 'text-green-500';
      case 'reviewing': return 'text-yellow-500';
      case 'editing': return 'text-purple-500';
      case 'executing': return 'text-orange-500';
      case 'analyzing': return 'text-cyan-500';
      case 'debugging': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const demoSequence = async () => {
    const statuses = [
      { status: 'working' as const, message: 'Processing your request...', duration: 1000 },
      { status: 'analyzing' as const, message: 'Analyzing task complexity...', duration: 1500 },
      { status: 'creating' as const, message: 'Creating new file...', duration: 2000 },
      { status: 'editing' as const, message: 'Editing code structure...', duration: 1200 },
      { status: 'reviewing' as const, message: 'Reviewing changes...', duration: 800 },
      { status: 'executing' as const, message: 'Running tests...', duration: 1500 },
      { status: 'debugging' as const, message: 'Debugging errors...', duration: 1000 },
      { status: 'idle' as const, message: '', duration: 0 }
    ];

    for (const statusItem of statuses) {
      setAgentStatus({ status: statusItem.status, message: statusItem.message });
      if (statusItem.duration > 0) {
        await new Promise(resolve => setTimeout(resolve, statusItem.duration));
      }
    }
  };

  return (
    <div className="p-4 space-y-4 border border-replit-border rounded-lg bg-replit-elevated">
      <h3 className="text-lg font-semibold text-replit-text-primary">Agent Status Demo</h3>
      
      {/* Status Display */}
      {agentStatus.status !== 'idle' && (
        <div className="px-4 py-2 bg-replit-elevated border border-replit-border rounded-lg">
          <div className="flex items-center space-x-2">
            <div className={getStatusColor(agentStatus.status)}>
              {getStatusIcon(agentStatus.status)}
            </div>
            <span className="text-sm font-medium text-replit-text-primary capitalize">
              {agentStatus.status}
            </span>
            <span className="text-sm text-replit-text-secondary">
              {agentStatus.message}
            </span>
          </div>
        </div>
      )}

      <Button onClick={demoSequence} disabled={agentStatus.status !== 'idle'}>
        {agentStatus.status === 'idle' ? 'Demo Status Sequence' : 'Running Demo...'}
      </Button>
      
      <div className="text-xs text-replit-text-muted">
        This demo shows the same status indicators that appear in the AI chat when the assistant is working.
      </div>
    </div>
  );
}