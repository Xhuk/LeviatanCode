import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface FileStructure {
  path: string;
  name: string;
  language: string;
  size: number;
}

interface FileSearchResult {
  filePath: string;
  content: string;
  relevance: number;
}

export function useFileSystem(projectId: string) {
  const queryClient = useQueryClient();

  // Get project file structure
  const { data: fileStructure, isLoading: isLoadingStructure } = useQuery({
    queryKey: ["/api/projects", projectId, "files-structure"],
    enabled: !!projectId,
  });

  // Search files
  const searchFilesMutation = useMutation({
    mutationFn: (query: string) =>
      apiRequest("GET", `/api/projects/${projectId}/files/search?query=${encodeURIComponent(query)}`),
  });

  // Analyze specific file
  const analyzeFileMutation = useMutation({
    mutationFn: ({ filePath, analysisType }: { filePath: string; analysisType: 'debug' | 'review' | 'explain' | 'optimize' }) =>
      apiRequest("POST", `/api/projects/${projectId}/files/${encodeURIComponent(filePath)}/analyze`, {
        analysisType
      }),
  });

  const searchFiles = async (query: string): Promise<FileSearchResult[]> => {
    try {
      const result = await searchFilesMutation.mutateAsync(query);
      return result.results || [];
    } catch (error) {
      console.error("File search failed:", error);
      return [];
    }
  };

  const analyzeFile = async (filePath: string, analysisType: 'debug' | 'review' | 'explain' | 'optimize' = 'review'): Promise<string> => {
    try {
      const result = await analyzeFileMutation.mutateAsync({ filePath, analysisType });
      return result.analysis || "Analysis failed";
    } catch (error) {
      console.error("File analysis failed:", error);
      throw error;
    }
  };

  return {
    fileStructure: (fileStructure?.structure || []) as FileStructure[],
    isLoadingStructure,
    searchFiles,
    analyzeFile,
    isSearching: searchFilesMutation.isPending,
    isAnalyzing: analyzeFileMutation.isPending,
    searchError: searchFilesMutation.error,
    analysisError: analyzeFileMutation.error,
  };
}