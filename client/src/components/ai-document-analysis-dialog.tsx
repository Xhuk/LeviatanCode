import { useState } from "react";
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
            Analyze existing documents when .ia files don't exist. AI can create Python scripts to digest and share insights.
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
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={generateScript}
                      onChange={(e) => setGenerateScript(e.target.checked)}
                      className="rounded"
                    />
                    <div>
                      <div className="font-medium">Generate Python Analysis Script</div>
                      <div className="text-sm text-muted-foreground">
                        Create a Python script to digest documents and extract structured insights for sharing
                      </div>
                    </div>
                  </label>
                </div>
              </CardContent>
            </Card>

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
                    {analysisResult.technologies.map((tech, index) => (
                      <Badge key={index} variant="secondary">
                        {tech}
                      </Badge>
                    ))}
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
                    {analysisResult.recommendations.map((rec, index) => (
                      <li key={index} className="text-sm flex items-start gap-2">
                        <span className="text-orange-500 mt-1">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

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
                    {analysisResult.insights.map((insight, index) => (
                      <li key={index} className="text-sm flex items-start gap-2">
                        <span className="text-purple-500 mt-1">•</span>
                        <span>{insight}</span>
                      </li>
                    ))}
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