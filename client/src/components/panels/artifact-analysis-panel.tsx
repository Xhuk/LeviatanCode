import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Plus, 
  FileCode, 
  Layers, 
  BookOpen, 
  Zap, 
  Copy, 
  Download,
  Trash2,
  RefreshCw,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { artifactAnalyzer, type ArtifactPattern, type AnalysisRequest } from '@/services/artifactAnalyzer';
import { aiRouter } from '@/services/aiRouterPro';

interface ArtifactAnalysisPanelProps {
  projectId?: string;
}

export function ArtifactAnalysisPanel({ projectId }: ArtifactAnalysisPanelProps) {
  const [patterns, setPatterns] = useState<ArtifactPattern[]>([]);
  const [selectedPattern, setSelectedPattern] = useState<ArtifactPattern | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Analysis form state
  const [analysisRequest, setAnalysisRequest] = useState<AnalysisRequest>({
    type: 'component',
    name: '',
    description: '',
    referenceArtifact: ''
  });

  // Generation results
  const [generationResult, setGenerationResult] = useState<{
    files: Record<string, string>;
    instructions: string;
    dependencies: string[];
  } | null>(null);

  useEffect(() => {
    loadPatterns();
    if (projectId) {
      analyzeCurrentProject();
    }
  }, [projectId]);

  const loadPatterns = () => {
    const loadedPatterns = artifactAnalyzer.getPatterns();
    setPatterns(loadedPatterns);
  };

  const analyzeCurrentProject = async () => {
    if (!projectId) return;
    
    setIsAnalyzing(true);
    try {
      const newPatterns = await artifactAnalyzer.analyzeProjectComponents(projectId);
      if (newPatterns.length > 0) {
        setPatterns(prev => [...prev, ...newPatterns]);
      }
    } catch (error) {
      console.error('Failed to analyze project:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerate = async () => {
    if (!analysisRequest.name.trim()) return;
    
    setIsGenerating(true);
    try {
      // Find similar patterns
      const similarPatterns = await artifactAnalyzer.findSimilarPatterns(analysisRequest);
      
      if (similarPatterns.length === 0) {
        // No similar patterns found, generate from scratch
        const scratchPrompt = `Create a ${analysisRequest.type} called "${analysisRequest.name}" ${analysisRequest.description ? `(${analysisRequest.description})` : ''}`;
        
        const routing = await aiRouter.routeRequest(scratchPrompt, {
          maxBudgetUSD: 0.05,
          forceComplexity: 'complex'
        });
        
        const result = await aiRouter.executeRequest(scratchPrompt, {
          maxBudgetUSD: 0.05,
          forceComplexity: 'complex'
        });
        
        setGenerationResult({
          files: { 'generated.tsx': result.response },
          instructions: 'Generated from scratch - no similar patterns found',
          dependencies: ['react']
        });
      } else {
        // Generate based on similar patterns
        const result = await artifactAnalyzer.generateFromPattern(analysisRequest, similarPatterns);
        setGenerationResult(result);
      }
      
    } catch (error) {
      console.error('Generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredPatterns = patterns.filter(pattern =>
    pattern.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pattern.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pattern.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'simple': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'complex': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-replit-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-replit-blue" />
            <h2 className="text-lg font-semibold text-replit-text-primary">Artifact Analysis</h2>
            <Badge variant="outline" className="text-xs">
              {patterns.length} patterns
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={analyzeCurrentProject}
              disabled={!projectId || isAnalyzing}
            >
              {isAnalyzing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {isAnalyzing ? 'Analyzing...' : 'Analyze Project'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => artifactAnalyzer.clearPatterns()}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-replit-text-muted" />
          <Input
            placeholder="Search patterns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Pattern Library */}
        <div className="w-1/2 border-r border-replit-border flex flex-col">
          <div className="p-3 border-b">
            <h3 className="font-medium text-replit-text-primary">Pattern Library</h3>
          </div>
          
          <ScrollArea className="flex-1 p-3">
            <div className="space-y-2">
              {filteredPatterns.map((pattern) => (
                <Card
                  key={pattern.id}
                  className={`cursor-pointer transition-colors hover:bg-replit-elevated/50 ${
                    selectedPattern?.id === pattern.id ? 'ring-2 ring-replit-blue' : ''
                  }`}
                  onClick={() => setSelectedPattern(pattern)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-sm truncate">{pattern.name}</h4>
                      <Badge variant="outline" className={`text-xs ${getComplexityColor(pattern.metadata.complexity)}`}>
                        {pattern.metadata.complexity}
                      </Badge>
                    </div>
                    <p className="text-xs text-replit-text-muted mb-2 line-clamp-2">
                      {pattern.description}
                    </p>
                    <div className="flex items-center justify-between text-xs">
                      <Badge variant="secondary" className="text-xs">
                        {pattern.category}
                      </Badge>
                      <div className="flex items-center gap-2 text-replit-text-muted">
                        <FileCode className="w-3 h-3" />
                        {Object.keys(pattern.implementation.files).length}
                        <span>•</span>
                        <span>Used {pattern.metadata.usageCount}x</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {filteredPatterns.length === 0 && (
                <div className="text-center py-8 text-replit-text-muted">
                  <Layers className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">No patterns found</p>
                  <p className="text-xs">Analyze your project to create patterns</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Right Panel - Details & Generation */}
        <div className="w-1/2 flex flex-col">
          <Tabs defaultValue="generate" className="flex-1">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="generate">Generate</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="result">Result</TabsTrigger>
            </TabsList>

            {/* Generate Tab */}
            <TabsContent value="generate" className="flex-1 p-4 space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Type</label>
                  <Select
                    value={analysisRequest.type}
                    onValueChange={(value: any) => setAnalysisRequest(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="component">Component</SelectItem>
                      <SelectItem value="feature">Feature</SelectItem>
                      <SelectItem value="pattern">Pattern</SelectItem>
                      <SelectItem value="full-app">Full App</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Name</label>
                  <Input
                    placeholder="e.g., UserDashboard, TaskManager"
                    value={analysisRequest.name}
                    onChange={(e) => setAnalysisRequest(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Description (Optional)</label>
                  <Textarea
                    placeholder="Describe what you want to build..."
                    value={analysisRequest.description}
                    onChange={(e) => setAnalysisRequest(prev => ({ ...prev, description: e.target.value }))}
                    className="min-h-[80px]"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Reference Artifact</label>
                  <Input
                    placeholder="e.g., like dailycalendar, similar to dashboard"
                    value={analysisRequest.referenceArtifact}
                    onChange={(e) => setAnalysisRequest(prev => ({ ...prev, referenceArtifact: e.target.value }))}
                  />
                  <p className="text-xs text-replit-text-muted mt-1">
                    Reference existing patterns to generate similar implementations
                  </p>
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={!analysisRequest.name.trim() || isGenerating}
                  className="w-full"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Generate Implementation
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            {/* Details Tab */}
            <TabsContent value="details" className="flex-1">
              <ScrollArea className="h-full p-4">
                {selectedPattern ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium mb-2">{selectedPattern.name}</h3>
                      <p className="text-sm text-replit-text-muted mb-4">{selectedPattern.description}</p>
                      
                      <div className="flex gap-2 mb-4">
                        <Badge variant="outline">{selectedPattern.category}</Badge>
                        <Badge variant="outline">{selectedPattern.metadata.complexity}</Badge>
                        {selectedPattern.metadata.frameworks.map(fw => (
                          <Badge key={fw} variant="secondary" className="text-xs">{fw}</Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Key Features</h4>
                      <ul className="text-sm text-replit-text-muted space-y-1">
                        {selectedPattern.implementation.keyFeatures.map((feature, i) => (
                          <li key={i}>• {feature}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Dependencies</h4>
                      <div className="flex flex-wrap gap-1">
                        {selectedPattern.implementation.dependencies.map(dep => (
                          <Badge key={dep} variant="outline" className="text-xs">{dep}</Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Files</h4>
                      <div className="space-y-2">
                        {Object.entries(selectedPattern.implementation.files).map(([path, content]) => (
                          <Card key={path}>
                            <CardHeader className="pb-2">
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-sm">{path}</CardTitle>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(content)}
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                              <pre className="text-xs bg-replit-elevated p-2 rounded overflow-x-auto">
                                {content.substring(0, 300)}...
                              </pre>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-replit-text-muted">
                    <div className="text-center">
                      <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-sm">Select a pattern to view details</p>
                    </div>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            {/* Result Tab */}
            <TabsContent value="result" className="flex-1">
              <ScrollArea className="h-full p-4">
                {generationResult ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <h3 className="font-medium">Generation Complete</h3>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Instructions</h4>
                      <p className="text-sm text-replit-text-muted bg-replit-elevated p-3 rounded">
                        {generationResult.instructions}
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Dependencies</h4>
                      <div className="flex flex-wrap gap-1">
                        {generationResult.dependencies.map(dep => (
                          <Badge key={dep} variant="outline" className="text-xs">{dep}</Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Generated Files</h4>
                      <div className="space-y-2">
                        {Object.entries(generationResult.files).map(([path, content]) => (
                          <Card key={path}>
                            <CardHeader className="pb-2">
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-sm">{path}</CardTitle>
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => copyToClipboard(content)}
                                  >
                                    <Copy className="w-3 h-3" />
                                  </Button>
                                  <Button variant="ghost" size="sm">
                                    <Download className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                              <pre className="text-xs bg-replit-elevated p-2 rounded overflow-x-auto max-h-60">
                                {content}
                              </pre>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-replit-text-muted">
                    <div className="text-center">
                      <FileCode className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-sm">Generate an implementation to see results</p>
                    </div>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}