import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Plus, FileText, Lightbulb } from "lucide-react";
import { Project } from "@shared/schema";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface EditorPanelProps {
  project?: Project;
  activeFile: string;
  onFileChange: (filePath: string) => void;
}

interface EditorTab {
  filePath: string;
  fileName: string;
  language: string;
  isDirty: boolean;
}

export function EditorPanel({ project, activeFile, onFileChange }: EditorPanelProps) {
  const [openTabs, setOpenTabs] = useState<EditorTab[]>([]);
  const [fileContents, setFileContents] = useState<{ [key: string]: string }>({});
  const [showAiSuggestion, setShowAiSuggestion] = useState(true);
  const editorRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Load Monaco Editor
  useEffect(() => {
    const loadMonaco = async () => {
      if (typeof window !== 'undefined') {
        // Monaco Editor would be loaded here in a real implementation
        // For now, we'll use a simple textarea
      }
    };
    loadMonaco();
  }, []);

  // Update open tabs when active file changes
  useEffect(() => {
    if (activeFile && project?.files) {
      const existingTab = openTabs.find(tab => tab.filePath === activeFile);
      if (!existingTab) {
        const fileName = activeFile.split('/').pop() || activeFile;
        const language = getLanguageFromFile(fileName);
        
        setOpenTabs(prev => [...prev, {
          filePath: activeFile,
          fileName,
          language,
          isDirty: false
        }]);
      }
      
      // Load file content if not already loaded
      if (project.files[activeFile] && !fileContents[activeFile]) {
        setFileContents(prev => ({
          ...prev,
          [activeFile]: project.files[activeFile].content || ''
        }));
      }
    }
  }, [activeFile, project?.files, openTabs, fileContents]);

  const updateFilesMutation = useMutation({
    mutationFn: (data: { files: any }) => 
      apiRequest("PUT", `/api/projects/${project?.id}/files`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", project?.id] });
    }
  });

  const getLanguageFromFile = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'py': return 'python';
      case 'js': return 'javascript';
      case 'ts': return 'typescript';
      case 'html': return 'html';
      case 'css': return 'css';
      case 'json': return 'json';
      case 'md': return 'markdown';
      case 'csv': return 'csv';
      default: return 'plaintext';
    }
  };

  const getFileIcon = (language: string) => {
    switch (language) {
      case 'python':
        return <i className="fab fa-python text-blue-400" />;
      case 'javascript':
      case 'typescript':
        return <i className="fab fa-js text-yellow-400" />;
      case 'html':
        return <i className="fab fa-html5 text-orange-400" />;
      case 'css':
        return <i className="fab fa-css3-alt text-blue-500" />;
      case 'json':
        return <i className="fas fa-code text-green-400" />;
      case 'csv':
        return <i className="fas fa-file-csv text-green-400" />;
      default:
        return <FileText size={14} className="text-gray-400" />;
    }
  };

  const closeTab = (filePath: string) => {
    setOpenTabs(prev => prev.filter(tab => tab.filePath !== filePath));
    if (activeFile === filePath && openTabs.length > 1) {
      const remainingTabs = openTabs.filter(tab => tab.filePath !== filePath);
      if (remainingTabs.length > 0) {
        onFileChange(remainingTabs[0].filePath);
      }
    }
  };

  const handleContentChange = (content: string) => {
    setFileContents(prev => ({
      ...prev,
      [activeFile]: content
    }));
    
    // Mark tab as dirty
    setOpenTabs(prev => prev.map(tab => 
      tab.filePath === activeFile ? { ...tab, isDirty: true } : tab
    ));
    
    // Auto-save after 2 seconds of no changes
    setTimeout(() => {
      if (project?.files) {
        const updatedFiles = {
          ...project.files,
          [activeFile]: {
            ...project.files[activeFile],
            content
          }
        };
        updateFilesMutation.mutate({ files: updatedFiles });
      }
    }, 2000);
  };

  const renderCodeEditor = () => {
    const content = fileContents[activeFile] || '';
    const lines = content.split('\n');

    return (
      <div className="flex-1 relative bg-replit-dark font-mono text-sm leading-relaxed overflow-auto">
        <div className="p-4">
          <div className="space-y-1">
            {lines.map((line, index) => (
              <div key={index} className="flex min-h-[1.5rem]">
                <span className="text-replit-text-muted w-12 text-right mr-4 select-none">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <code className="text-replit-text whitespace-pre">{line || ' '}</code>
                  {index === 9 && <span className="terminal-cursor text-replit-text">|</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* AI Code Analysis Overlay */}
        {showAiSuggestion && (
          <div className="absolute top-4 right-4 replit-elevated border border-replit-border rounded-lg p-3 max-w-xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-replit-success rounded-full"></div>
                <span className="text-sm font-medium">AI Analysis</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAiSuggestion(false)}
              >
                <X size={12} />
              </Button>
            </div>
            <p className="text-xs text-replit-text-secondary mb-2">
              This HTML file sets up a basic web scraper dashboard. Consider adding form validation and error handling.
            </p>
            <Button variant="link" size="sm" className="text-xs text-replit-blue p-0 h-auto">
              <Lightbulb size={12} className="mr-1" />
              View suggestions
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col bg-replit-dark h-full">
      {/* Editor tabs */}
      <div className="replit-panel border-b border-replit-border">
        <div className="flex items-center overflow-x-auto">
          {openTabs.map(tab => (
            <div
              key={tab.filePath}
              className={`panel-tab border-r border-replit-border cursor-pointer flex items-center space-x-2 ${
                activeFile === tab.filePath ? 'active' : ''
              }`}
              onClick={() => onFileChange(tab.filePath)}
            >
              {getFileIcon(tab.language)}
              <span className="text-sm">{tab.fileName}</span>
              {tab.isDirty && (
                <div className="w-1.5 h-1.5 bg-replit-warning rounded-full"></div>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="ml-2 p-0 h-auto text-replit-text-muted hover:text-replit-text"
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(tab.filePath);
                }}
              >
                <X size={12} />
              </Button>
            </div>
          ))}
          <Button
            variant="ghost"
            size="sm"
            className="px-3 py-2 text-replit-text-muted hover:text-replit-text"
            title="New tab"
          >
            <Plus size={12} />
          </Button>
        </div>
      </div>
      
      {/* Editor content */}
      {activeFile ? (
        renderCodeEditor()
      ) : (
        <div className="flex-1 flex items-center justify-center text-replit-text-secondary">
          <div className="text-center">
            <FileText size={48} className="mx-auto mb-4 opacity-50" />
            <p>Select a file to start editing</p>
          </div>
        </div>
      )}
    </div>
  );
}
