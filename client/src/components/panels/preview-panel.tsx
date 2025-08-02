import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RefreshCw, ExternalLink, Home, ArrowLeft, ArrowRight, Globe, Smartphone, Tablet, Monitor } from "lucide-react";

interface PreviewPanelProps {
  previewUrl: string;
}

export function PreviewPanel({ previewUrl }: PreviewPanelProps) {
  const [currentUrl, setCurrentUrl] = useState(previewUrl);
  const [inputUrl, setInputUrl] = useState(previewUrl);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleUrlChange = () => {
    if (inputUrl !== currentUrl) {
      setCurrentUrl(inputUrl);
      setIsLoading(true);
    }
  };

  const handleRefresh = () => {
    if (iframeRef.current) {
      setIsLoading(true);
      iframeRef.current.src = iframeRef.current.src;
    }
  };

  const handleOpenExternal = () => {
    window.open(currentUrl, '_blank');
  };

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const getViewportStyles = () => {
    switch (viewMode) {
      case 'mobile':
        return { width: '375px', height: '667px', margin: '0 auto' };
      case 'tablet':
        return { width: '768px', height: '1024px', margin: '0 auto' };
      case 'desktop':
      default:
        return { width: '100%', height: '100%' };
    }
  };

  const commonUrls = [
    { label: 'Localhost:3000', url: 'http://localhost:3000' },
    { label: 'Localhost:5000', url: 'http://localhost:5000' },
    { label: 'Localhost:8080', url: 'http://localhost:8080' },
    { label: 'Vite Dev', url: 'http://localhost:5173' },
  ];

  return (
    <div className="h-full flex flex-col replit-panel">
      <div className="p-3 border-b border-replit-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-replit-text">Live Preview</h3>
          <div className="flex items-center gap-1">
            {/* Viewport Controls */}
            <div className="flex items-center gap-1 mr-2">
              <Button
                size="sm"
                variant={viewMode === 'desktop' ? 'default' : 'outline'}
                onClick={() => setViewMode('desktop')}
                className={viewMode === 'desktop' ? 'bg-replit-blue text-white' : 'border-replit-border hover:bg-replit-elevated'}
              >
                <Monitor className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'tablet' ? 'default' : 'outline'}
                onClick={() => setViewMode('tablet')}
                className={viewMode === 'tablet' ? 'bg-replit-blue text-white' : 'border-replit-border hover:bg-replit-elevated'}
              >
                <Tablet className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'mobile' ? 'default' : 'outline'}
                onClick={() => setViewMode('mobile')}
                className={viewMode === 'mobile' ? 'bg-replit-blue text-white' : 'border-replit-border hover:bg-replit-elevated'}
              >
                <Smartphone className="w-3 h-3" />
              </Button>
            </div>
            
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleRefresh}
              disabled={isLoading}
              className="border-replit-border hover:bg-replit-elevated"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleOpenExternal}
              className="border-replit-border hover:bg-replit-elevated"
            >
              <ExternalLink className="w-3 h-3" />
            </Button>
          </div>
        </div>
        
        {/* URL Bar */}
        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center gap-1">
            <Button 
              size="sm" 
              variant="outline"
              className="border-replit-border hover:bg-replit-elevated px-2"
            >
              <ArrowLeft className="w-3 h-3" />
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              className="border-replit-border hover:bg-replit-elevated px-2"
            >
              <ArrowRight className="w-3 h-3" />
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => {
                setInputUrl('http://localhost:3000');
                setCurrentUrl('http://localhost:3000');
              }}
              className="border-replit-border hover:bg-replit-elevated px-2"
            >
              <Home className="w-3 h-3" />
            </Button>
          </div>
          
          <div className="flex-1 flex items-center gap-2">
            <Globe className="w-4 h-4 text-replit-text-secondary" />
            <Input
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleUrlChange();
                }
              }}
              placeholder="Enter URL to preview..."
              className="bg-replit-elevated border-replit-border text-sm"
            />
            <Button 
              size="sm" 
              onClick={handleUrlChange}
              className="bg-replit-blue hover:bg-replit-blue-secondary px-3"
            >
              Go
            </Button>
          </div>
        </div>

        {/* Quick Access URLs */}
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-xs text-replit-text-secondary mr-2">Quick:</span>
          {commonUrls.map((item) => (
            <Button
              key={item.url}
              size="sm"
              variant="outline"
              onClick={() => {
                setInputUrl(item.url);
                setCurrentUrl(item.url);
              }}
              className="text-xs h-6 px-2 border-replit-border hover:bg-replit-elevated"
            >
              {item.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 relative overflow-auto bg-white">
        {isLoading && (
          <div className="absolute inset-0 bg-replit-panel/50 flex items-center justify-center z-10">
            <div className="flex items-center gap-2 text-replit-text">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Loading preview...</span>
            </div>
          </div>
        )}
        
        {currentUrl ? (
          <div className="h-full flex items-center justify-center p-4">
            <iframe
              ref={iframeRef}
              src={currentUrl}
              onLoad={handleIframeLoad}
              style={getViewportStyles()}
              className="border border-gray-300 rounded-lg shadow-lg bg-white"
              title="Live Preview"
            />
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <Globe className="w-16 h-16 text-replit-text-muted mx-auto mb-4" />
              <h4 className="text-lg font-medium text-replit-text mb-2">No Preview URL</h4>
              <p className="text-sm text-replit-text-secondary mb-4">
                Enter a URL above to start previewing your application
              </p>
              <Button 
                onClick={() => {
                  setInputUrl('http://localhost:3000');
                  setCurrentUrl('http://localhost:3000');
                }}
                className="bg-replit-blue hover:bg-replit-blue-secondary"
              >
                Try localhost:3000
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="border-t border-replit-border px-3 py-2 flex items-center justify-between text-xs">
        <div className="flex items-center gap-4">
          <span className="text-replit-text-secondary">
            Mode: {viewMode}
          </span>
          {viewMode !== 'desktop' && (
            <span className="text-replit-text-secondary">
              {getViewportStyles().width} × {getViewportStyles().height}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${!isLoading ? 'bg-green-400' : 'bg-yellow-400 animate-pulse'}`} />
          <span className="text-replit-text-secondary">
            {!isLoading ? 'Ready' : 'Loading'}
          </span>
        </div>
      </div>
    </div>
  );
}