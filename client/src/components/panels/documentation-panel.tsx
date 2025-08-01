import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Book, 
  History, 
  BarChart3, 
  Sparkles, 
  Download, 
  RefreshCw,
  ExternalLink,
  FileText,
  Code,
  Settings,
  Database,
  Brain
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface DocumentationPanelProps {
  projectId: string;
}

export function DocumentationPanel({ projectId }: DocumentationPanelProps) {
  const [activeTab, setActiveTab] = useState<'docs' | 'history' | 'stats'>('docs');
  const queryClient = useQueryClient();

  const { data: documentation } = useQuery({
    queryKey: ["/api/projects", projectId, "documentation"],
    enabled: !!projectId,
  });

  const { data: project } = useQuery({
    queryKey: ["/api/projects", projectId],
    enabled: !!projectId,
  });

  const generateDocsMutation = useMutation({
    mutationFn: (fileName: string) =>
      apiRequest("POST", `/api/projects/${projectId}/documentation/generate`, { fileName }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "documentation"] });
    }
  });

  const renderAiGeneratedBanner = () => (
    <div className="gradient-border mb-4">
      <div className="replit-elevated p-3 rounded-lg">
        <h4 className="font-semibold text-sm mb-2 flex items-center">
          <Sparkles size={14} className="mr-2 text-purple-400" />
          AI-Generated Docs
        </h4>
        <p className="text-xs text-replit-text-secondary">
          Documentation auto-updated 2 minutes ago
        </p>
      </div>
    </div>
  );

  const renderFunctionDocs = () => (
    <div className="space-y-3">
      <div>
        <h4 className="font-semibold text-sm mb-2 flex items-center">
          <FileText size={14} className="mr-2" />
          linkedin_scraper.py
        </h4>
        <div className="space-y-2 text-sm">
          <div className="replit-elevated p-2 rounded">
            <h5 className="font-medium text-xs text-replit-blue mb-1">scrape_profiles()</h5>
            <p className="text-xs text-replit-text-secondary mb-2">
              Scrapes LinkedIn profiles with rate limiting and error handling. 
              Returns structured data with profile metrics.
            </p>
            <div className="flex flex-wrap gap-1">
              <Badge variant="secondary" className="text-xs">async</Badge>
              <Badge variant="secondary" className="text-xs">selenium</Badge>
            </div>
          </div>
          
          <div className="replit-elevated p-2 rounded">
            <h5 className="font-medium text-xs text-replit-blue mb-1">validate_profile()</h5>
            <p className="text-xs text-replit-text-secondary mb-2">
              Validates scraped profile data quality and completeness scores.
            </p>
            <div className="flex flex-wrap gap-1">
              <Badge variant="secondary" className="text-xs">validation</Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderConfiguration = () => (
    <div className="space-y-3">
      <h4 className="font-semibold text-sm mb-2 flex items-center">
        <Settings size={14} className="mr-2" />
        Configuration
      </h4>
      <div className="replit-elevated p-2 rounded text-xs">
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-replit-text-secondary">Rate limit:</span>
            <span className="text-replit-success">2s delay</span>
          </div>
          <div className="flex justify-between">
            <span className="text-replit-text-secondary">Max profiles:</span>
            <span>500/batch</span>
          </div>
          <div className="flex justify-between">
            <span className="text-replit-text-secondary">Timeout:</span>
            <span>30s</span>
          </div>
          <div className="flex justify-between">
            <span className="text-replit-text-secondary">Output format:</span>
            <span>CSV</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDependencies = () => (
    <div className="space-y-3">
      <h4 className="font-semibold text-sm mb-2 flex items-center">
        <Code size={14} className="mr-2" />
        Dependencies
      </h4>
      <div className="space-y-1 text-xs">
        <div className="flex items-center justify-between replit-elevated p-2 rounded">
          <div className="flex items-center space-x-2">
            <i className="fab fa-python text-blue-400"></i>
            <span>selenium</span>
          </div>
          <Badge variant="outline" className="text-replit-success border-replit-success">
            4.15.2
          </Badge>
        </div>
        <div className="flex items-center justify-between replit-elevated p-2 rounded">
          <div className="flex items-center space-x-2">
            <Database size={12} className="text-green-400" />
            <span>pandas</span>
          </div>
          <Badge variant="outline" className="text-replit-success border-replit-success">
            2.1.3
          </Badge>
        </div>
        <div className="flex items-center justify-between replit-elevated p-2 rounded">
          <div className="flex items-center space-x-2">
            <Brain size={12} className="text-purple-400" />
            <span>openai</span>
          </div>
          <Badge variant="outline" className="text-replit-success border-replit-success">
            1.3.8
          </Badge>
        </div>
        <div className="flex items-center justify-between replit-elevated p-2 rounded">
          <div className="flex items-center space-x-2">
            <Brain size={12} className="text-orange-400" />
            <span>google-genai</span>
          </div>
          <Badge variant="outline" className="text-replit-success border-replit-success">
            0.3.2
          </Badge>
        </div>
      </div>
    </div>
  );

  const renderQuickActions = () => (
    <div className="space-y-3">
      <h4 className="font-semibold text-sm mb-2">Quick Actions</h4>
      <div className="space-y-2">
        <Button 
          className="w-full bg-replit-blue hover:bg-replit-blue-secondary text-xs"
          size="sm"
          onClick={() => {
            if (project?.files) {
              const firstFile = Object.keys(project.files)[0];
              if (firstFile) {
                generateDocsMutation.mutate(firstFile);
              }
            }
          }}
          disabled={generateDocsMutation.isPending}
        >
          <RefreshCw size={12} className="mr-1" />
          {generateDocsMutation.isPending ? "Generating..." : "Regenerate Docs"}
        </Button>
        <Button 
          variant="outline" 
          className="w-full text-xs"
          size="sm"
        >
          <Download size={12} className="mr-1" />
          Export Documentation
        </Button>
      </div>
    </div>
  );

  const renderHistory = () => (
    <div className="space-y-3">
      <h4 className="font-semibold text-sm mb-2">Recent Changes</h4>
      <div className="space-y-2 text-xs">
        <div className="replit-elevated p-2 rounded">
          <div className="flex justify-between items-start mb-1">
            <span className="font-medium">linkedin_scraper.py</span>
            <span className="text-replit-text-muted">2m ago</span>
          </div>
          <p className="text-replit-text-secondary">Added error handling for network timeouts</p>
        </div>
        <div className="replit-elevated p-2 rounded">
          <div className="flex justify-between items-start mb-1">
            <span className="font-medium">config/settings.json</span>
            <span className="text-replit-text-muted">5m ago</span>
          </div>
          <p className="text-replit-text-secondary">Updated rate limiting configuration</p>
        </div>
        <div className="replit-elevated p-2 rounded">
          <div className="flex justify-between items-start mb-1">
            <span className="font-medium">README.md</span>
            <span className="text-replit-text-muted">1h ago</span>
          </div>
          <p className="text-replit-text-secondary">Auto-generated project documentation</p>
        </div>
      </div>
    </div>
  );

  const renderStats = () => (
    <div className="space-y-3">
      <h4 className="font-semibold text-sm mb-2">Project Statistics</h4>
      <div className="grid grid-cols-2 gap-2">
        <div className="replit-elevated p-2 rounded text-center">
          <div className="text-lg font-semibold text-replit-blue">15</div>
          <div className="text-xs text-replit-text-secondary">Files</div>
        </div>
        <div className="replit-elevated p-2 rounded text-center">
          <div className="text-lg font-semibold text-replit-success">2.3k</div>
          <div className="text-xs text-replit-text-secondary">Lines</div>
        </div>
        <div className="replit-elevated p-2 rounded text-center">
          <div className="text-lg font-semibold text-replit-warning">127</div>
          <div className="text-xs text-replit-text-secondary">Records</div>
        </div>
        <div className="replit-elevated p-2 rounded text-center">
          <div className="text-lg font-semibold text-replit-error">3</div>
          <div className="text-xs text-replit-text-secondary">Errors</div>
        </div>
      </div>
      
      <div className="replit-elevated p-3 rounded">
        <h5 className="font-medium text-xs mb-2">Code Quality</h5>
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span>Maintainability</span>
            <span className="text-replit-success">Good</span>
          </div>
          <div className="flex justify-between text-xs">
            <span>Test Coverage</span>
            <span className="text-replit-warning">72%</span>
          </div>
          <div className="flex justify-between text-xs">
            <span>Documentation</span>
            <span className="text-replit-blue">85%</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full replit-panel flex flex-col h-full">
      {/* Tab headers */}
      <div className="border-b border-replit-border">
        <div className="flex items-center">
          <div 
            className={`panel-tab border-r border-replit-border ${activeTab === 'docs' ? 'active' : ''}`}
            onClick={() => setActiveTab('docs')}
          >
            <Book size={14} className="mr-2" />
            Docs
          </div>
          <div 
            className={`panel-tab border-r border-replit-border ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <History size={14} className="mr-2" />
            History
          </div>
          <div 
            className={`panel-tab ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            <BarChart3 size={14} className="mr-2" />
            Stats
          </div>
        </div>
      </div>
      
      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-3">
        {activeTab === 'docs' && (
          <div className="space-y-4">
            {renderAiGeneratedBanner()}
            {renderFunctionDocs()}
            <Separator className="bg-replit-border" />
            {renderConfiguration()}
            <Separator className="bg-replit-border" />
            {renderDependencies()}
            <Separator className="bg-replit-border" />
            {renderQuickActions()}
          </div>
        )}
        
        {activeTab === 'history' && renderHistory()}
        {activeTab === 'stats' && renderStats()}
      </div>
    </div>
  );
}
