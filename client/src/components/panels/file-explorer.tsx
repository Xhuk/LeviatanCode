import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Folder, File, Plus, RefreshCw, Search, GitBranch } from "lucide-react";
import { Project, FileSystemItem } from "@shared/schema";

interface FileExplorerProps {
  project?: Project;
  activeFile: string;
  onFileSelect: (filePath: string) => void;
}

export function FileExplorer({ project, activeFile, onFileSelect }: FileExplorerProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'py':
        return <i className="fab fa-python text-blue-400" />;
      case 'js':
      case 'ts':
        return <i className="fab fa-js text-yellow-400" />;
      case 'html':
        return <i className="fab fa-html5 text-orange-400" />;
      case 'css':
        return <i className="fab fa-css3-alt text-blue-500" />;
      case 'json':
        return <i className="fas fa-code text-green-400" />;
      case 'csv':
        return <i className="fas fa-file-csv text-green-400" />;
      case 'md':
        return <i className="fab fa-markdown text-gray-400" />;
      default:
        return <File size={14} className="text-gray-400" />;
    }
  };

  const renderFileTree = () => {
    if (!project?.files) return null;

    const files = Object.keys(project.files);
    const filteredFiles = files.filter(file => 
      file.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Group files by directory
    const fileTree: { [key: string]: string[] } = {};
    filteredFiles.forEach(file => {
      const parts = file.split('/');
      if (parts.length > 1) {
        const dir = parts[0];
        if (!fileTree[dir]) fileTree[dir] = [];
        fileTree[dir].push(file);
      } else {
        if (!fileTree['root']) fileTree['root'] = [];
        fileTree['root'].push(file);
      }
    });

    return (
      <div className="space-y-1 text-sm">
        {Object.entries(fileTree).map(([dir, dirFiles]) => (
          <div key={dir}>
            {dir !== 'root' && (
              <div className="file-tree-item p-1 rounded cursor-pointer text-replit-text-secondary flex items-center">
                <Folder size={14} className="mr-2 text-replit-warning" />
                {dir}/
              </div>
            )}
            <div className={dir !== 'root' ? 'ml-4 space-y-1' : 'space-y-1'}>
              {dirFiles.map(file => (
                <div
                  key={file}
                  className={`file-tree-item p-1 rounded cursor-pointer flex items-center ${
                    activeFile === file ? 'bg-replit-elevated' : ''
                  }`}
                  onClick={() => onFileSelect(file)}
                >
                  {getFileIcon(file)}
                  <span className="ml-2">{file.split('/').pop()}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="w-full replit-panel border-r border-replit-border flex flex-col h-full">
      <div className="p-3 border-b border-replit-border">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-sm">Project Files</h3>
          <div className="flex space-x-1">
            <Button variant="ghost" size="sm" title="New File">
              <Plus size={12} className="text-replit-text-secondary" />
            </Button>
            <Button variant="ghost" size="sm" title="Refresh">
              <RefreshCw size={12} className="text-replit-text-secondary" />
            </Button>
          </div>
        </div>
        <div className="relative">
          <Input
            type="text"
            placeholder="Search files..."
            className="w-full bg-replit-elevated border-replit-border text-xs pr-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search size={12} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-replit-text-muted" />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2">
        {renderFileTree()}
      </div>
      
      <div className="p-2 border-t border-replit-border">
        <div className="flex items-center justify-between text-xs text-replit-text-muted">
          <span>{project?.files ? Object.keys(project.files).length : 0} files</span>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-replit-success rounded-full"></div>
            <GitBranch size={10} />
            <span>Clean</span>
          </div>
        </div>
      </div>
    </div>
  );
}
