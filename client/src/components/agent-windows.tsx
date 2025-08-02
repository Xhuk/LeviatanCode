import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Brain, 
  FileText, 
  MessageSquare, 
  Upload, 
  GitBranch, 
  Terminal, 
  Monitor, 
  Settings,
  Maximize2,
  Minimize2,
  X
} from "lucide-react";
import { AiChatPanel } from "@/components/panels/ai-chat-panel";
import { DocumentationPanel } from "@/components/panels/documentation-panel";
import { ExtractionPanel } from "@/components/panels/extraction-panel";
import { PromptTemplatesPanel } from "@/components/panels/prompt-templates-panel";
import { GitPanel } from "@/components/panels/git-panel";
import { ConsolePanel } from "@/components/panels/console-panel";
import { PreviewPanel } from "@/components/panels/preview-panel";

interface AgentWindow {
  id: string;
  title: string;
  icon: React.ReactNode;
  component: React.ReactNode;
  isOpen: boolean;
  isMinimized: boolean;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

interface AgentWindowsProps {
  projectId: string;
  workingDirectory: string;
  previewUrl: string;
}

export function AgentWindows({ projectId, workingDirectory, previewUrl }: AgentWindowsProps) {
  const [windows, setWindows] = useState<AgentWindow[]>([]);
  const [showLauncher, setShowLauncher] = useState(false);

  const agentTools = [
    {
      id: 'ai-chat',
      title: 'AI Assistant',
      icon: <MessageSquare className="w-4 h-4" />,
      component: <AiChatPanel projectId={projectId} />
    },
    {
      id: 'git',
      title: 'Git Version Control',
      icon: <GitBranch className="w-4 h-4" />,
      component: <GitPanel projectId={projectId} workingDirectory={workingDirectory} />
    },
    {
      id: 'console',
      title: 'Console Output',
      icon: <Terminal className="w-4 h-4" />,
      component: <ConsolePanel projectId={projectId} />
    },
    {
      id: 'preview',
      title: 'Live Preview',
      icon: <Monitor className="w-4 h-4" />,
      component: <PreviewPanel previewUrl={previewUrl} />
    },
    {
      id: 'docs',
      title: 'Documentation',
      icon: <FileText className="w-4 h-4" />,
      component: <DocumentationPanel projectId={projectId} />
    },
    {
      id: 'prompts',
      title: 'Prompt Templates',
      icon: <Brain className="w-4 h-4" />,
      component: <PromptTemplatesPanel projectId={projectId} />
    },
    {
      id: 'extraction',
      title: 'Data Extraction',
      icon: <Upload className="w-4 h-4" />,
      component: <ExtractionPanel />
    }
  ];

  const openWindow = (toolId: string) => {
    const tool = agentTools.find(t => t.id === toolId);
    if (!tool) return;

    const existingWindow = windows.find(w => w.id === toolId);
    if (existingWindow) {
      // If window exists, just bring it to front and unminimize
      setWindows(prev => prev.map(w => 
        w.id === toolId 
          ? { ...w, isMinimized: false }
          : w
      ));
      return;
    }

    const newWindow: AgentWindow = {
      id: toolId,
      title: tool.title,
      icon: tool.icon,
      component: tool.component,
      isOpen: true,
      isMinimized: false,
      position: { 
        x: 100 + (windows.length * 30), 
        y: 100 + (windows.length * 30) 
      },
      size: { width: 600, height: 500 }
    };

    setWindows(prev => [...prev, newWindow]);
    setShowLauncher(false);
  };

  const closeWindow = (windowId: string) => {
    setWindows(prev => prev.filter(w => w.id !== windowId));
  };

  const minimizeWindow = (windowId: string) => {
    setWindows(prev => prev.map(w => 
      w.id === windowId ? { ...w, isMinimized: true } : w
    ));
  };

  const restoreWindow = (windowId: string) => {
    setWindows(prev => prev.map(w => 
      w.id === windowId ? { ...w, isMinimized: false } : w
    ));
  };

  return (
    <>
      {/* Agent Windows Launcher Button */}
      <Dialog open={showLauncher} onOpenChange={setShowLauncher}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className="border-replit-border hover:bg-replit-elevated relative"
          >
            <Brain size={14} className="mr-1" />
            Agent Tools
            {windows.length > 0 && (
              <Badge 
                variant="secondary" 
                className="absolute -top-2 -right-2 h-5 w-5 p-0 bg-replit-blue text-white text-xs flex items-center justify-center"
              >
                {windows.length}
              </Badge>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md replit-panel border-replit-border">
          <DialogHeader>
            <DialogTitle className="text-replit-text">Agent Tool Windows</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-4">
            {agentTools.map((tool) => {
              const isOpen = windows.some(w => w.id === tool.id);
              return (
                <Button
                  key={tool.id}
                  variant="outline"
                  className={`h-16 flex flex-col gap-2 border-replit-border hover:bg-replit-elevated ${
                    isOpen ? 'bg-replit-blue/10 border-replit-blue' : ''
                  }`}
                  onClick={() => openWindow(tool.id)}
                >
                  <div className="flex items-center gap-2">
                    {tool.icon}
                    {isOpen && <div className="w-2 h-2 bg-green-400 rounded-full" />}
                  </div>
                  <span className="text-xs text-center">{tool.title}</span>
                </Button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Minimized Windows Taskbar */}
      {windows.some(w => w.isMinimized) && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-50">
          {windows.filter(w => w.isMinimized).map((window) => (
            <Button
              key={window.id}
              variant="outline"
              size="sm"
              onClick={() => restoreWindow(window.id)}
              className="bg-replit-panel border-replit-border hover:bg-replit-elevated flex items-center gap-2"
            >
              {window.icon}
              <span className="text-xs">{window.title}</span>
            </Button>
          ))}
        </div>
      )}

      {/* Floating Agent Windows */}
      {windows.filter(w => !w.isMinimized).map((window) => (
        <div
          key={window.id}
          className="fixed z-40 bg-replit-panel border border-replit-border rounded-lg shadow-2xl"
          style={{
            left: window.position.x,
            top: window.position.y,
            width: window.size.width,
            height: window.size.height,
            maxWidth: '90vw',
            maxHeight: '90vh',
            minWidth: 400,
            minHeight: 300
          }}
        >
          {/* Window Header */}
          <div className="flex items-center justify-between p-3 border-b border-replit-border bg-replit-elevated rounded-t-lg">
            <div className="flex items-center gap-2">
              {window.icon}
              <span className="text-sm font-medium text-replit-text">{window.title}</span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => minimizeWindow(window.id)}
                className="h-6 w-6 p-0 hover:bg-replit-panel"
              >
                <Minimize2 className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => closeWindow(window.id)}
                className="h-6 w-6 p-0 hover:bg-red-500/20 hover:text-red-400"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* Window Content */}
          <div className="h-full overflow-hidden" style={{ height: 'calc(100% - 57px)' }}>
            {window.component}
          </div>
        </div>
      ))}
    </>
  );
}