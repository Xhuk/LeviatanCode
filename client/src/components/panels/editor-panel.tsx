import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { X, Plus, Save, FileText, Edit3, Check, X as XIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface EditorTab {
  path: string;
  name: string;
  content: string;
  isDirty: boolean;
  isNew: boolean;
}

interface EditorPanelProps {
  workingDirectory?: string;
  selectedProject?: string;
  activeFile: string;
  onFileChange: (fileName: string) => void;
}

export function EditorPanel({ workingDirectory, selectedProject, activeFile, onFileChange }: EditorPanelProps) {
  const [openTabs, setOpenTabs] = useState<EditorTab[]>([]);
  const [activeTabPath, setActiveTabPath] = useState<string>("");
  const [editingTabName, setEditingTabName] = useState<string | null>(null);
  const [newTabName, setNewTabName] = useState<string>("");

  // Get current directory for file operations
  const getCurrentDirPath = () => {
    if (!workingDirectory) return undefined;
    if (!selectedProject || selectedProject === 'no-workspace') return workingDirectory;
    return `${workingDirectory}/${selectedProject}`;
  };

  // Fetch file content when needed
  const { data: fileContent } = useQuery({
    queryKey: ["/api/settings/file-content", activeFile],
    queryFn: async () => {
      if (!activeFile) return null;
      const response = await fetch(`/api/settings/file-content?filePath=${encodeURIComponent(activeFile)}`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!activeFile && !openTabs.find(tab => tab.path === activeFile),
  });

  // Add new file tab when activeFile changes
  useEffect(() => {
    if (activeFile && !openTabs.find(tab => tab.path === activeFile)) {
      const fileName = activeFile.split('/').pop() || activeFile;
      const newTab: EditorTab = {
        path: activeFile,
        name: fileName,
        content: fileContent?.content || "",
        isDirty: false,
        isNew: false
      };
      
      setOpenTabs(prev => [...prev, newTab]);
      setActiveTabPath(activeFile);
    }
  }, [activeFile, fileContent]);

  // Create new file tab
  const createNewTab = () => {
    const newTabId = `new-file-${Date.now()}`;
    const newTab: EditorTab = {
      path: newTabId,
      name: "untitled.txt",
      content: "",
      isDirty: false,
      isNew: true
    };
    
    setOpenTabs(prev => [...prev, newTab]);
    setActiveTabPath(newTabId);
    setEditingTabName(newTabId);
    setNewTabName("untitled.txt");
  };

  // Close tab
  const closeTab = (tabPath: string) => {
    setOpenTabs(prev => prev.filter(tab => tab.path !== tabPath));
    
    if (activeTabPath === tabPath) {
      const remainingTabs = openTabs.filter(tab => tab.path !== tabPath);
      if (remainingTabs.length > 0) {
        setActiveTabPath(remainingTabs[remainingTabs.length - 1].path);
        onFileChange(remainingTabs[remainingTabs.length - 1].path);
      } else {
        setActiveTabPath("");
        onFileChange("");
      }
    }
  };

  // Start editing tab name
  const startEditingTabName = (tabPath: string) => {
    const tab = openTabs.find(t => t.path === tabPath);
    if (tab) {
      setEditingTabName(tabPath);
      setNewTabName(tab.name);
    }
  };

  // Confirm tab name change
  const confirmTabNameChange = async (tabPath: string) => {
    if (!newTabName.trim()) {
      cancelTabNameEdit();
      return;
    }

    setOpenTabs(prev => prev.map(tab => 
      tab.path === tabPath 
        ? { ...tab, name: newTabName.trim(), isDirty: true }
        : tab
    ));

    // If this is a new file, we might want to save it or update the path
    // For now, just update the name
    setEditingTabName(null);
    setNewTabName("");
  };

  // Cancel tab name editing
  const cancelTabNameEdit = () => {
    setEditingTabName(null);
    setNewTabName("");
  };

  // Update tab content
  const updateTabContent = (tabPath: string, content: string) => {
    setOpenTabs(prev => prev.map(tab => 
      tab.path === tabPath 
        ? { ...tab, content, isDirty: true }
        : tab
    ));
  };

  // Save file
  const saveFile = async (tabPath: string) => {
    const tab = openTabs.find(t => t.path === tabPath);
    if (!tab) return;

    try {
      // Here you would implement actual file saving
      // For now, just mark as not dirty
      setOpenTabs(prev => prev.map(t => 
        t.path === tabPath 
          ? { ...t, isDirty: false }
          : t
      ));
    } catch (error) {
      console.error("Error saving file:", error);
    }
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'py': return '🐍';
      case 'js':
      case 'ts': return '⚡';
      case 'html': return '🌐';
      case 'css': return '🎨';
      case 'json': return '📦';
      case 'md': return '📝';
      case 'txt': return '📄';
      default: return '📄';
    }
  };

  const getLanguageFromExtension = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'py': return 'python';
      case 'js': return 'javascript';
      case 'ts': return 'typescript';
      case 'html': return 'html';
      case 'css': return 'css';
      case 'json': return 'json';
      case 'md': return 'markdown';
      default: return 'plaintext';
    }
  };

  if (openTabs.length === 0) {
    return (
      <div className="w-full replit-panel border-r border-replit-border flex flex-col h-full">
        <div className="border-b border-replit-border p-3 flex items-center justify-between">
          <h3 className="text-sm font-medium text-replit-text">Editor</h3>
          <Button
            size="sm"
            variant="ghost"
            onClick={createNewTab}
            className="h-6 w-6 p-0"
          >
            <Plus size={12} />
          </Button>
        </div>
        
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-replit-text-secondary">
            <FileText size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-sm mb-2">No files open</p>
            <Button
              size="sm"
              variant="outline"
              onClick={createNewTab}
              className="border-replit-border"
            >
              <Plus size={12} className="mr-1" />
              New File
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full replit-panel border-r border-replit-border flex flex-col h-full">
      <Tabs value={activeTabPath} onValueChange={setActiveTabPath} className="flex flex-col h-full">
        {/* Tab Headers */}
        <div className="border-b border-replit-border">
          <div className="flex items-center">
            <TabsList className="h-auto p-0 bg-transparent rounded-none">
              {openTabs.map((tab) => (
                <div key={tab.path} className="flex items-center">
                  <TabsTrigger
                    value={tab.path}
                    className="flex items-center space-x-2 px-3 py-2 text-xs border-r border-replit-border rounded-none data-[state=active]:bg-replit-elevated"
                    onClick={() => {
                      setActiveTabPath(tab.path);
                      if (!tab.isNew) {
                        onFileChange(tab.path);
                      }
                    }}
                  >
                    <span className="mr-1">{getFileIcon(tab.name)}</span>
                    
                    {editingTabName === tab.path ? (
                      <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                        <Input
                          value={newTabName}
                          onChange={(e) => setNewTabName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              confirmTabNameChange(tab.path);
                            } else if (e.key === 'Escape') {
                              cancelTabNameEdit();
                            }
                          }}
                          className="h-5 text-xs px-1 w-24"
                          autoFocus
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => confirmTabNameChange(tab.path)}
                          className="h-4 w-4 p-0"
                        >
                          <Check size={8} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={cancelTabNameEdit}
                          className="h-4 w-4 p-0"
                        >
                          <XIcon size={8} />
                        </Button>
                      </div>
                    ) : (
                      <span
                        className={`${tab.isDirty ? 'text-replit-warning' : ''}`}
                        onDoubleClick={() => startEditingTabName(tab.path)}
                      >
                        {tab.name}
                        {tab.isDirty && ' •'}
                      </span>
                    )}
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        closeTab(tab.path);
                      }}
                      className="h-4 w-4 p-0 ml-1"
                    >
                      <X size={8} />
                    </Button>
                  </TabsTrigger>
                </div>
              ))}
            </TabsList>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={createNewTab}
              className="h-8 w-8 p-0 ml-2"
            >
              <Plus size={12} />
            </Button>
          </div>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-hidden">
          {openTabs.map((tab) => (
            <TabsContent 
              key={tab.path} 
              value={tab.path} 
              className="m-0 h-full flex flex-col"
            >
              {/* File Info Bar */}
              <div className="border-b border-replit-border px-3 py-1 flex items-center justify-between text-xs text-replit-text-secondary">
                <div className="flex items-center space-x-2">
                  <span>{getLanguageFromExtension(tab.name)}</span>
                  <span>•</span>
                  <span>{tab.content.length} chars</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => saveFile(tab.path)}
                    disabled={!tab.isDirty}
                    className="h-5 w-5 p-0"
                  >
                    <Save size={10} />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => startEditingTabName(tab.path)}
                    className="h-5 w-5 p-0"
                  >
                    <Edit3 size={10} />
                  </Button>
                </div>
              </div>

              {/* Editor Area */}
              <div className="flex-1 p-3">
                <textarea
                  value={tab.content}
                  onChange={(e) => updateTabContent(tab.path, e.target.value)}
                  className="w-full h-full bg-transparent border-none outline-none resize-none font-mono text-sm text-replit-text"
                  placeholder={`Start typing in ${tab.name}...`}
                  spellCheck={false}
                />
              </div>
            </TabsContent>
          ))}
        </div>
      </Tabs>
    </div>
  );
}