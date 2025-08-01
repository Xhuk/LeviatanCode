import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { ProjectInsights } from "@shared/insights-schema";

export function useProjectInsights(projectId: string, projectPath?: string) {
  const queryClient = useQueryClient();

  const { data: insights, isLoading, error } = useQuery({
    queryKey: ["/api/projects", projectId, "insights"],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/insights?projectPath=${encodeURIComponent(projectPath || ".")}`);
      return response.json();
    },
    enabled: !!projectId,
  });

  const saveMutation = useMutation({
    mutationFn: async (insightsData: Partial<ProjectInsights>) => {
      return apiRequest(`/api/projects/${projectId}/insights/save`, "POST", {
        projectPath: projectPath || ".",
        insights: insightsData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "insights"] });
    },
  });

  return {
    insights: insights?.insights || null,
    isLoading,
    error,
    saveInsights: saveMutation.mutate,
    isSaving: saveMutation.isPending,
    saveError: saveMutation.error,
    saveSuccess: saveMutation.isSuccess,
  };
}