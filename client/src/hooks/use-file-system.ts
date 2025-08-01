import { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Project, FileSystemItem } from "@shared/schema";

export interface FileContent {
  content: string;
  language: string;
  lastModified: Date;
}

export function useFileSystem(projectId: string) {
  const [openFiles, setOpenFiles] = useState<Set<string>>(new Set());
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [fileContents, setFileContents] = useState<Map<string, FileContent>>(new Map());
  const [unsavedChanges, setUnsavedChanges] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  const updateFilesMutation = useMutation({
    mutationFn: (data: { files: any }) =>
      apiRequest("PUT", `/api/projects/${projectId}/files`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId] });
    }
  });

  const openFile = useCallback((filePath: string, project?: Project) => {
    if (!project?.files || !project.files[filePath]) return;

    setOpenFiles(prev => new Set([...prev, filePath]));
    setActiveFile(filePath);

    // Load file content if not already loaded
    if (!fileContents.has(filePath)) {
      const fileData = project.files[filePath];
      setFileContents(prev => new Map(prev.set(filePath, {
        content: fileData.content || '',
        language: fileData.language || getLanguageFromFile(filePath),
        lastModified: new Date()
      })));
    }
  }, [fileContents]);

  const closeFile = useCallback((filePath: string) => {
    setOpenFiles(prev => {
      const newSet = new Set(prev);
      newSet.delete(filePath);
      return newSet;
    });

    // Switch to another open file if this was the active one
    if (activeFile === filePath) {
      const remainingFiles = Array.from(openFiles).filter(f => f !== filePath);
      setActiveFile(remainingFiles.length > 0 ? remainingFiles[0] : null);
    }

    // Remove from file contents if no unsaved changes
    if (!unsavedChanges.has(filePath)) {
      setFileContents(prev => {
        const newMap = new Map(prev);
        newMap.delete(filePath);
        return newMap;
      });
    }
  }, [activeFile, openFiles, unsavedChanges]);

  const updateFileContent = useCallback((filePath: string, content: string) => {
    setFileContents(prev => {
      const current = prev.get(filePath);
      if (!current) return prev;

      const newMap = new Map(prev);
      newMap.set(filePath, {
        ...current,
        content,
        lastModified: new Date()
      });
      return newMap;
    });

    // Mark as having unsaved changes
    setUnsavedChanges(prev => new Set([...prev, filePath]));
  }, []);

  const saveFile = useCallback(async (filePath: string, project?: Project) => {
    if (!project?.files || !fileContents.has(filePath)) return;

    const fileContent = fileContents.get(filePath);
    if (!fileContent) return;

    const updatedFiles = {
      ...project.files,
      [filePath]: {
        ...project.files[filePath],
        content: fileContent.content
      }
    };

    try {
      await updateFilesMutation.mutateAsync({ files: updatedFiles });
      
      // Remove from unsaved changes
      setUnsavedChanges(prev => {
        const newSet = new Set(prev);
        newSet.delete(filePath);
        return newSet;
      });
    } catch (error) {
      console.error('Failed to save file:', error);
      throw error;
    }
  }, [fileContents, updateFilesMutation]);

  const saveAllFiles = useCallback(async (project?: Project) => {
    if (!project) return;

    const savePromises = Array.from(unsavedChanges).map(filePath => 
      saveFile(filePath, project)
    );

    try {
      await Promise.all(savePromises);
    } catch (error) {
      console.error('Failed to save some files:', error);
      throw error;
    }
  }, [unsavedChanges, saveFile]);

  const createFile = useCallback(async (filePath: string, content: string = '', project?: Project) => {
    if (!project) return;

    const language = getLanguageFromFile(filePath);
    const updatedFiles = {
      ...project.files,
      [filePath]: {
        content,
        language
      }
    };

    try {
      await updateFilesMutation.mutateAsync({ files: updatedFiles });
      
      // Open the newly created file
      setFileContents(prev => new Map(prev.set(filePath, {
        content,
        language,
        lastModified: new Date()
      })));
      
      openFile(filePath, { ...project, files: updatedFiles });
    } catch (error) {
      console.error('Failed to create file:', error);
      throw error;
    }
  }, [updateFilesMutation, openFile]);

  const deleteFile = useCallback(async (filePath: string, project?: Project) => {
    if (!project?.files) return;

    const updatedFiles = { ...project.files };
    delete updatedFiles[filePath];

    try {
      await updateFilesMutation.mutateAsync({ files: updatedFiles });
      
      // Close the file if it's open
      closeFile(filePath);
      
      // Remove from file contents and unsaved changes
      setFileContents(prev => {
        const newMap = new Map(prev);
        newMap.delete(filePath);
        return newMap;
      });
      
      setUnsavedChanges(prev => {
        const newSet = new Set(prev);
        newSet.delete(filePath);
        return newSet;
      });
    } catch (error) {
      console.error('Failed to delete file:', error);
      throw error;
    }
  }, [updateFilesMutation, closeFile]);

  const renameFile = useCallback(async (oldPath: string, newPath: string, project?: Project) => {
    if (!project?.files || !project.files[oldPath]) return;

    const fileData = project.files[oldPath];
    const updatedFiles = { ...project.files };
    delete updatedFiles[oldPath];
    updatedFiles[newPath] = {
      ...fileData,
      language: getLanguageFromFile(newPath)
    };

    try {
      await updateFilesMutation.mutateAsync({ files: updatedFiles });
      
      // Update internal state
      if (fileContents.has(oldPath)) {
        const content = fileContents.get(oldPath)!;
        setFileContents(prev => {
          const newMap = new Map(prev);
          newMap.delete(oldPath);
          newMap.set(newPath, {
            ...content,
            language: getLanguageFromFile(newPath)
          });
          return newMap;
        });
      }
      
      // Update open files
      if (openFiles.has(oldPath)) {
        setOpenFiles(prev => {
          const newSet = new Set(prev);
          newSet.delete(oldPath);
          newSet.add(newPath);
          return newSet;
        });
      }
      
      // Update active file
      if (activeFile === oldPath) {
        setActiveFile(newPath);
      }
      
      // Update unsaved changes
      if (unsavedChanges.has(oldPath)) {
        setUnsavedChanges(prev => {
          const newSet = new Set(prev);
          newSet.delete(oldPath);
          newSet.add(newPath);
          return newSet;
        });
      }
    } catch (error) {
      console.error('Failed to rename file:', error);
      throw error;
    }
  }, [updateFilesMutation, fileContents, openFiles, activeFile, unsavedChanges]);

  const getFileContent = useCallback((filePath: string): FileContent | null => {
    return fileContents.get(filePath) || null;
  }, [fileContents]);

  const hasUnsavedChanges = useCallback((filePath: string): boolean => {
    return unsavedChanges.has(filePath);
  }, [unsavedChanges]);

  const buildFileTree = useCallback((project?: Project): FileSystemItem[] => {
    if (!project?.files) return [];

    const files = Object.keys(project.files);
    const tree: FileSystemItem[] = [];
    const folderMap = new Map<string, FileSystemItem>();

    // Create folder structure
    files.forEach(filePath => {
      const parts = filePath.split('/');
      let currentPath = '';
      
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const isFile = i === parts.length - 1;
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        
        if (isFile) {
          // Add file to appropriate folder or root
          const parentPath = parts.slice(0, -1).join('/');
          const fileItem: FileSystemItem = {
            name: part,
            type: 'file',
            path: filePath,
            language: getLanguageFromFile(part),
            size: project.files[filePath]?.content?.length || 0,
            lastModified: new Date()
          };
          
          if (parentPath) {
            const parentFolder = folderMap.get(parentPath);
            if (parentFolder) {
              parentFolder.children = parentFolder.children || [];
              parentFolder.children.push(fileItem);
            }
          } else {
            tree.push(fileItem);
          }
        } else {
          // Create folder if it doesn't exist
          if (!folderMap.has(currentPath)) {
            const folderItem: FileSystemItem = {
              name: part,
              type: 'folder',
              path: currentPath,
              children: []
            };
            
            folderMap.set(currentPath, folderItem);
            
            // Add to parent folder or root
            const parentPath = parts.slice(0, i).join('/');
            if (parentPath) {
              const parentFolder = folderMap.get(parentPath);
              if (parentFolder) {
                parentFolder.children = parentFolder.children || [];
                parentFolder.children.push(folderItem);
              }
            } else {
              tree.push(folderItem);
            }
          }
        }
      }
    });

    // Sort folders first, then files
    const sortItems = (items: FileSystemItem[]): FileSystemItem[] => {
      return items.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === 'folder' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      }).map(item => ({
        ...item,
        children: item.children ? sortItems(item.children) : undefined
      }));
    };

    return sortItems(tree);
  }, []);

  return {
    // State
    openFiles: Array.from(openFiles),
    activeFile,
    unsavedChanges: Array.from(unsavedChanges),
    isLoading: updateFilesMutation.isPending,
    
    // Actions
    openFile,
    closeFile,
    updateFileContent,
    saveFile,
    saveAllFiles,
    createFile,
    deleteFile,
    renameFile,
    setActiveFile,
    
    // Getters
    getFileContent,
    hasUnsavedChanges,
    buildFileTree
  };
}

function getLanguageFromFile(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'py': return 'python';
    case 'js': return 'javascript';
    case 'ts': return 'typescript';
    case 'tsx': return 'typescriptreact';
    case 'jsx': return 'javascriptreact';
    case 'html': return 'html';
    case 'css': return 'css';
    case 'scss': case 'sass': return 'scss';
    case 'json': return 'json';
    case 'md': return 'markdown';
    case 'csv': return 'csv';
    case 'xml': return 'xml';
    case 'yaml': case 'yml': return 'yaml';
    case 'sql': return 'sql';
    case 'sh': case 'bash': return 'shell';
    case 'dockerfile': return 'dockerfile';
    case 'gitignore': return 'ignore';
    default: return 'plaintext';
  }
}
