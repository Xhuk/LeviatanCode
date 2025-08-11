import { useState } from "react";
import { useAnalysisWebSocket } from "@/hooks/use-analysis-websocket";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Loader2, FileText, Code, Database, Brain, CheckCircle, AlertCircle } from "lucide-react";

interface DocumentAnalysisResult {
  summary: string;
  technologies: string[];
  pythonScript?: string;
  recommendations: string[];
  insights: string[];
  aiAnalysis?: {
    projectType?: string;
    architecture?: string;
    techStack?: string;
    setup?: string;
    security?: string;
    performance?: string;
    deployment?: string;
    nextSteps?: string;
    contextRecommendations?: string;
  };
  contextAnalysis?: {
    currentState?: string;
    recentActions?: any[];
    sessionSummary?: string;
  };
  replitMdUpdated?: boolean;
  replitMdPath?: string;
}

interface AiDocumentAnalysisDialogProps {
  projectId: string;
  workingDirectory: string;
  trigger?: React.ReactNode;
}

export function AiDocumentAnalysisDialog({ 
  projectId, 
  workingDirectory, 
  trigger 
}: AiDocumentAnalysisDialogProps) {
  const [open, setOpen] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<DocumentAnalysisResult | null>(null);
  const [generateScript, setGenerateScript] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // WebSocket connection for real-time analysis updates
  const { updates, isConnected, currentStatus, clearUpdates, latestUpdate } = useAnalysisWebSocket(projectId);

  const analysisMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/projects/${projectId}/analyze-documents`, {
        workingDirectory,
        generateScript,
        analysisType: "comprehensive"
      });
    },
    onSuccess: (data) => {
      setAnalysisResult(data);
      toast({
        title: "Analysis completed",
        description: "AI has successfully analyzed your documents.",
      });
      // Invalidate insights to refresh if .ia files were created
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/insights`] });
    },
    onError: (error: any) => {
      toast({
        title: "Analysis failed",
        description: error.message || "Failed to analyze documents. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAnalyze = () => {
    analysisMutation.mutate();
  };

  const resetAnalysis = () => {
    setAnalysisResult(null);
    setGenerateScript(false);
    clearUpdates();
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      if (!newOpen) {
        resetAnalysis();
      }
    }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 px-3 text-xs bg-gradient-to-r from-purple-500/20 to-blue-500/20 border-purple-300 dark:border-purple-700 hover:from-purple-500/30 hover:to-blue-500/30"
          >
            <Sparkles className="h-3 w-3 mr-1" />
            Analyze Documents
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl w-full h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-purple-500" />
            <span>AI Document Analysis</span>
          </DialogTitle>
          <DialogDescription>
            AI-powered project analysis compatible with replit.md system. Creates comprehensive project insights, Python analysis scripts, and updates your project metadata for enhanced context awareness.
          </DialogDescription>
        </DialogHeader>

        {!analysisResult ? (
          <div className="flex-1 space-y-6 p-6">
            <div className="text-center">
              <FileText className="h-16 w-16 mx-auto mb-4 text-purple-500 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Ready to Analyze Your Documents</h3>
              <p className="text-sm text-muted-foreground mb-6">
                AI will scan your project files, analyze documentation, code structure, and provide comprehensive insights.
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  Analysis Options
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center border border-green-400 dark:border-green-600">
                        <span className="text-white text-xs">✓</span>
                      </div>
                      <div>
                        <div className="font-medium">Python Analysis Script</div>
                        <div className="text-sm text-muted-foreground">
                          Automatically creates a comprehensive Python script for project analysis with Gemini AI integration
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center border border-green-400 dark:border-green-600">
                        <span className="text-white text-xs">✓</span>
                      </div>
                      <div>
                        <div className="font-medium">File System Analysis</div>
                        <div className="text-sm text-muted-foreground">
                          Scans project files, detects technologies, and creates detailed file trees
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center border border-green-400 dark:border-green-600">
                        <span className="text-white text-xs">✓</span>
                      </div>
                      <div>
                        <div className="font-medium">Replit.md Integration</div>
                        <div className="text-sm text-muted-foreground">
                          Updates your replit.md file with project insights for enhanced AI context awareness
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Real-time Analysis Progress */}
            {(analysisMutation.isPending || updates.length > 0) && (
              <Card className="border-blue-200 dark:border-blue-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                    Real-time Analysis Progress
                    {isConnected ? (
                      <span className="flex items-center gap-1 text-xs text-green-600">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Connected
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-red-600">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        Disconnected
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {currentStatus && (
                      <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-medium text-blue-800 dark:text-blue-200">{currentStatus}</span>
                      </div>
                    )}
                    
                    {latestUpdate && (
                      <div className="grid grid-cols-2 gap-4">
                        {latestUpdate.fileCount !== undefined && (
                          <div className="text-center p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                            <div className="text-xl font-bold text-green-600">{latestUpdate.fileCount}</div>
                            <div className="text-xs text-green-700 dark:text-green-400">Files Found</div>
                          </div>
                        )}
                        {latestUpdate.technologies && latestUpdate.technologies.length > 0 && (
                          <div className="text-center p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                            <div className="text-xl font-bold text-purple-600">{latestUpdate.technologies.length}</div>
                            <div className="text-xs text-purple-700 dark:text-purple-400">Technologies</div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {updates.length > 0 && (
                      <div>
                        <div className="text-xs font-medium text-muted-foreground mb-2">Recent Activity</div>
                        <ScrollArea className="h-24 bg-slate-50 dark:bg-slate-950/50 rounded p-2">
                          <div className="space-y-1">
                            {updates.slice(-3).map((update, index) => (
                              <div key={index} className="text-xs text-muted-foreground">
                                <span className="font-mono text-blue-600">{update.status}</span> - {update.message}
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-center">
              <Button 
                onClick={handleAnalyze}
                disabled={analysisMutation.isPending}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {analysisMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing Documents...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Start Analysis
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <ScrollArea className="flex-1">
            <div className="space-y-6 p-6">
              {/* Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Analysis Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed">{analysisResult.summary}</p>
                  
                  {/* Replit.md Integration Status */}
                  {analysisResult.replitMdUpdated && (
                    <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
                      <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                        <CheckCircle className="h-4 w-4" />
                        <span className="font-medium text-sm">Replit.md Compatible</span>
                      </div>
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                        Project analysis has been integrated with your replit.md file for enhanced AI context awareness
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Technologies */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Database className="h-4 w-4 text-blue-500" />
                    Detected Technologies
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {analysisResult.technologies?.map((tech, index) => (
                      <Badge key={index} variant="secondary">
                        {tech}
                      </Badge>
                    )) || <p className="text-sm text-muted-foreground">No technologies detected</p>}
                  </div>
                </CardContent>
              </Card>

              {/* Python Script */}
              {analysisResult.pythonScript && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Code className="h-4 w-4 text-yellow-500" />
                      Generated Python Analysis Script
                    </CardTitle>
                    <CardDescription>
                      Use this script to digest documents and extract insights
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={analysisResult.pythonScript}
                      readOnly
                      className="font-mono text-xs min-h-[200px]"
                    />
                  </CardContent>
                </Card>
              )}

              {/* Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                    Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysisResult.recommendations?.map((rec, index) => (
                      <li key={index} className="text-sm flex items-start gap-2">
                        <span className="text-orange-500 mt-1">•</span>
                        <span>{rec}</span>
                      </li>
                    )) || <p className="text-sm text-muted-foreground">No recommendations available</p>}
                  </ul>
                </CardContent>
              </Card>

              {/* AI Analysis */}
              {analysisResult.aiAnalysis && (
                <Card className="border-green-200 dark:border-green-800">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Brain className="h-4 w-4 text-green-500" />
                      AI Architecture Analysis
                    </CardTitle>
                    <CardDescription>
                      Context-aware project analysis powered by AI
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {analysisResult.aiAnalysis.projectType && (
                      <div>
                        <div className="text-sm font-medium text-green-700 dark:text-green-300">Project Type</div>
                        <div className="text-sm text-muted-foreground">{analysisResult.aiAnalysis.projectType}</div>
                      </div>
                    )}
                    
                    {analysisResult.aiAnalysis.architecture && (
                      <div>
                        <div className="text-sm font-medium text-green-700 dark:text-green-300">Architecture</div>
                        <div className="text-sm text-muted-foreground">{analysisResult.aiAnalysis.architecture}</div>
                      </div>
                    )}
                    
                    {analysisResult.aiAnalysis.techStack && (
                      <div>
                        <div className="text-sm font-medium text-green-700 dark:text-green-300">Technology Stack</div>
                        <div className="text-sm text-muted-foreground">{analysisResult.aiAnalysis.techStack}</div>
                      </div>
                    )}
                    
                    {analysisResult.aiAnalysis.setup && (
                      <div>
                        <div className="text-sm font-medium text-green-700 dark:text-green-300">Setup Requirements</div>
                        <div className="text-sm text-muted-foreground">{analysisResult.aiAnalysis.setup}</div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Context Analysis */}
              {analysisResult.contextAnalysis && (
                <Card className="border-blue-200 dark:border-blue-800">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Database className="h-4 w-4 text-blue-500" />
                      Project Context
                    </CardTitle>
                    <CardDescription>
                      Current project state and recent activity
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="text-sm font-medium text-blue-700 dark:text-blue-300">Current State</div>
                      <div className="text-sm text-muted-foreground">{analysisResult.contextAnalysis.currentState || 'Unknown'}</div>
                    </div>
                    
                    {analysisResult.contextAnalysis.recentActions && analysisResult.contextAnalysis.recentActions.length > 0 && (
                      <div>
                        <div className="text-sm font-medium text-blue-700 dark:text-blue-300">Recent Actions</div>
                        <div className="space-y-1">
                          {analysisResult.contextAnalysis.recentActions.slice(0, 3).map((action: any, index: number) => (
                            <div key={index} className="text-xs bg-blue-50 dark:bg-blue-950/30 p-2 rounded">
                              {action.actionType || 'Unknown action'}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {analysisResult.contextAnalysis.sessionSummary && (
                      <div>
                        <div className="text-sm font-medium text-blue-700 dark:text-blue-300">Session Summary</div>
                        <div className="text-sm text-muted-foreground">{analysisResult.contextAnalysis.sessionSummary}</div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Insights */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Brain className="h-4 w-4 text-purple-500" />
                    Key Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysisResult.insights?.map((insight, index) => (
                      <li key={index} className="text-sm flex items-start gap-2">
                        <span className="text-purple-500 mt-1">•</span>
                        <span>{insight}</span>
                      </li>
                    )) || <p className="text-sm text-muted-foreground">No insights available</p>}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}