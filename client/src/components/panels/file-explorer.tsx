import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Folder, File, Plus, RefreshCw, Search, GitBranch, FolderOpen } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface FileTreeItem {
  name: string;
  type: 'file' | 'directory';
  path: string;
  fullPath: string;
  children?: FileTreeItem[];
  size?: number;
  extension?: string;
  modified?: string;
}

interface FileExplorerProps {
  workingDirectory?: string;
  selectedProject?: string;
  activeFile: string;
  onFileSelect: (filePath: string) => void;
}

export function FileExplorer({ workingDirectory, selectedProject, activeFile, onFileSelect }: FileExplorerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  // Get current directory path based on selected project
  const getCurrentDirPath = () => {
    if (!workingDirectory) return undefined;
    if (!selectedProject || selectedProject === 'no-workspace') return workingDirectory;
    return `${workingDirectory}/${selectedProject}`;
  };

  const { data: fileTreeData, refetch: refetchFileTree } = useQuery({
    queryKey: ["/api/settings/file-tree", getCurrentDirPath()],
    queryFn: async () => {
      const dirPath = getCurrentDirPath();
      if (!dirPath) return { tree: [] };
      
      const response = await fetch(`/api/settings/file-tree?dirPath=${encodeURIComponent(dirPath)}`);
      return response.json();
    },
    enabled: !!getCurrentDirPath(),
  });

  const getFileIcon = (fileName: string, isDirectory: boolean = false) => {
    if (isDirectory) {
      return <Folder size={14} className="text-replit-warning" />;
    }

    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'py':
        return <span className="text-blue-400">🐍</span>;
      case 'js':
      case 'ts':
        return <span className="text-yellow-400">⚡</span>;
      case 'html':
        return <span className="text-orange-400">🌐</span>;
      case 'css':
        return <span className="text-blue-500">🎨</span>;
      case 'json':
        return <span className="text-green-400">📦</span>;
      case 'csv':
        return <span className="text-green-400">📊</span>;
      case 'md':
        return <span className="text-gray-400">📝</span>;
      case 'txt':
        return <span className="text-gray-400">📄</span>;
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
        return <span className="text-purple-400">🖼️</span>;
      default:
        return <File size={14} className="text-gray-400" />;
    }
  };

  const toggleFolder = (folderPath: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderPath)) {
      newExpanded.delete(folderPath);
    } else {
      newExpanded.add(folderPath);
    }
    setExpandedFolders(newExpanded);
  };

  const renderFileTreeItem = (item: FileTreeItem, depth: number = 0) => {
    const isActive = activeFile === item.path;
    const isExpanded = expandedFolders.has(item.path);
    const hasChildren = item.children && item.children.length > 0;
    
    // Filter based on search term
    if (searchTerm && !item.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      // If this item doesn't match, check if any children match
      if (item.type === 'directory' && item.children) {
        const hasMatchingChildren = item.children.some(child => 
          child.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        if (!hasMatchingChildren) return null;
      } else {
        return null;
      }
    }

    return (
      <div key={item.path}>
        <div
          className={`file-tree-item p-1 rounded cursor-pointer flex items-center hover:bg-replit-elevated ${
            isActive ? 'bg-replit-blue/20 border-l-2 border-replit-blue' : ''
          }`}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={() => {
            if (item.type === 'directory') {
              toggleFolder(item.path);
            } else {
              onFileSelect(item.path);
            }
          }}
        >
          {item.type === 'directory' && hasChildren && (
            <span className="mr-1 text-xs">
              {isExpanded ? '▼' : '▶'}
            </span>
          )}
          {getFileIcon(item.name, item.type === 'directory')}
          <span className="ml-2 text-sm flex-1">{item.name}</span>
          {item.type === 'file' && item.size && (
            <span className="text-xs text-replit-text-secondary ml-auto">
              {formatFileSize(item.size)}
            </span>
          )}
        </div>
        
        {item.type === 'directory' && isExpanded && hasChildren && (
          <div>
            {item.children!.map(child => 
              renderFileTreeItem(child, depth + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const renderFileTree = () => {
    if (!fileTreeData?.tree || fileTreeData.tree.length === 0) {
      return (
        <div className="text-center text-replit-text-secondary p-4">
          <Folder size={32} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">No files found</p>
          {workingDirectory && (
            <p className="text-xs mt-1">Working directory: {workingDirectory}</p>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-1">
        {fileTreeData.tree.map((item: FileTreeItem) => 
          renderFileTreeItem(item)
        )}
      </div>
    );
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-replit-border p-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-replit-text">Files</h3>
          <div className="flex space-x-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => refetchFileTree()}
              className="h-6 w-6 p-0"
            >
              <RefreshCw size={12} />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
            >
              <Plus size={12} />
            </Button>
          </div>
        </div>
        
        <div className="relative">
          <Search size={14} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-replit-text-secondary" />
          <Input
            type="text"
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 h-7 text-xs bg-replit-elevated border-replit-border"
          />
        </div>
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto">
        {renderFileTree()}
      </div>

      {/* Footer */}
      <div className="border-t border-replit-border p-2 text-xs text-replit-text-secondary">
        <div className="flex items-center justify-between">
          <span>
            {fileTreeData?.totalItems || 0} items
          </span>
          <div className="flex items-center space-x-1">
            <GitBranch size={10} />
            <span>main</span>
          </div>
        </div>
      </div>
    </div>
  );
}
