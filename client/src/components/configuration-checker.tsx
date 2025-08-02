import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Settings, 
  ExternalLink,
  RefreshCw,
  Database,
  Globe,
  Key,
  FolderOpen
} from "lucide-react";

interface ConfigStatus {
  category: string;
  name: string;
  status: 'ok' | 'warning' | 'error' | 'missing';
  message: string;
  canUpdateFromFrontend: boolean;
  frontendLocation?: string;
  value?: string;
}

interface ConfigurationCheckerProps {
  currentProject: string;
}

export const ConfigurationChecker: React.FC<ConfigurationCheckerProps> = ({ currentProject }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [hasShownOnce, setHasShownOnce] = useState(false);

  // Fetch configuration status
  const { data: configStatus, isLoading, refetch } = useQuery({
    queryKey: ['/api/configuration/verify', currentProject],
    enabled: !!currentProject && isVisible,
    refetchOnWindowFocus: false,
    refetchInterval: 30000, // Check every 30 seconds
  });

  // Show checker on startup and when there are issues
  useEffect(() => {
    if (configStatus && !hasShownOnce) {
      const hasIssues = configStatus.some((config: ConfigStatus) => 
        config.status === 'error' || config.status === 'warning'
      );
      if (hasIssues) {
        setIsVisible(true);
        setHasShownOnce(true);
      } else {
        setIsVisible(false);
      }
    }
  }, [configStatus, hasShownOnce]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ok':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'error':
      case 'missing':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ok':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'error':
      case 'missing':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'database':
        return <Database className="w-4 h-4" />;
      case 'api':
        return <Globe className="w-4 h-4" />;
      case 'secrets':
        return <Key className="w-4 h-4" />;
      case 'workspace':
        return <FolderOpen className="w-4 h-4" />;
      default:
        return <Settings className="w-4 h-4" />;
    }
  };

  if (!isVisible || isLoading || !configStatus) {
    return null;
  }

  const issueConfigs = configStatus.filter((config: ConfigStatus) => 
    config.status === 'error' || config.status === 'warning'
  );

  if (issueConfigs.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 w-96 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              Configuration Issues
            </h3>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              className="p-1"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost" 
              size="sm"
              onClick={() => setIsVisible(false)}
              className="p-1"
            >
              ✕
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {issueConfigs.map((config: ConfigStatus, index: number) => (
            <Alert key={index} className="p-3">
              <div className="flex items-start gap-3">
                <div className="flex items-center gap-2 mt-0.5">
                  {getCategoryIcon(config.category)}
                  {getStatusIcon(config.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                      {config.name}
                    </span>
                    <Badge variant="outline" className={getStatusColor(config.status)}>
                      {config.status.toUpperCase()}
                    </Badge>
                  </div>
                  <AlertDescription className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    {config.message}
                  </AlertDescription>
                  
                  {config.canUpdateFromFrontend ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        Fix in: 
                      </span>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-6 px-2 text-xs"
                        onClick={() => {
                          // Navigate to settings page
                          const event = new CustomEvent('navigate-to-settings', {
                            detail: { location: config.frontendLocation }
                          });
                          window.dispatchEvent(event);
                        }}
                      >
                        <Settings className="w-3 h-3 mr-1" />
                        {config.frontendLocation || 'Settings'}
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                  ) : (
                    <div className="text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 p-2 rounded">
                      ⚠️ Backchannel configuration needed - cannot update from frontend
                    </div>
                  )}
                </div>
              </div>
            </Alert>
          ))}
        </div>

        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Auto-checked on startup</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(false)}
              className="text-xs h-6 px-2"
            >
              Dismiss
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};