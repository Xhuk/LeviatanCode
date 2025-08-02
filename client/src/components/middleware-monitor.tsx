import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Play, 
  Square, 
  RotateCcw, 
  Activity, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Clock,
  BarChart3,
  RefreshCw
} from "lucide-react";

interface MiddlewareMetric {
  name: string;
  status: 'active' | 'stopped' | 'error';
  isEnabled: boolean;
  requests: number;
  averageTime: number;
  errorRate: number;
}

interface HealthSummary {
  globallyEnabled: boolean;
  total: number;
  active: number;
  stopped: number;
  errors: number;
  totalRequests: number;
  totalErrors: number;
  errorRate: number;
  middlewareList: MiddlewareMetric[];
}

export const MiddlewareMonitor: React.FC = () => {
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Fetch middleware status
  const { data: healthData, isLoading, refetch } = useQuery<HealthSummary>({
    queryKey: ['/api/middleware/status'],
    refetchInterval: 5000, // Auto-refresh every 5 seconds
    refetchOnWindowFocus: false,
  });

  const executeAction = async (action: string, name?: string) => {
    setActionLoading(`${action}-${name || 'all'}`);
    try {
      const response = await fetch(`/api/middleware/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: name || 'all' })
      });
      
      if (response.ok) {
        refetch();
      }
    } catch (error) {
      console.error(`Failed to ${action} middleware:`, error);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'stopped':
        return <Square className="w-4 h-4 text-gray-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'stopped':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 bg-replit-bg text-replit-text">
        <div className="flex items-center justify-center">
          <RefreshCw className="w-6 h-6 animate-spin mr-2" />
          Loading middleware status...
        </div>
      </div>
    );
  }

  if (!healthData) {
    return (
      <div className="p-6 bg-replit-bg text-replit-text">
        <Alert>
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>
            Failed to load middleware monitoring data
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 bg-replit-bg text-replit-text space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity className="w-6 h-6 text-replit-blue" />
          <h2 className="text-xl font-semibold">Middleware Monitor</h2>
          <Badge variant={healthData.globallyEnabled ? "default" : "secondary"}>
            {healthData.globallyEnabled ? "Enabled" : "Disabled"}
          </Badge>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Global Controls */}
      <Card className="p-4 bg-replit-panel border-replit-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium">Global Controls</h3>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => executeAction('start')}
              disabled={actionLoading === 'start-all'}
              className="flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              Start All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => executeAction('stop')}
              disabled={actionLoading === 'stop-all'}
              className="flex items-center gap-2"
            >
              <Square className="w-4 h-4" />
              Stop All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => executeAction('reset')}
              disabled={actionLoading === 'reset-all'}
              className="flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reset All
            </Button>
          </div>
        </div>
        
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-replit-blue">{healthData.active}</div>
            <div className="text-sm text-replit-text-secondary">Active</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-500">{healthData.stopped}</div>
            <div className="text-sm text-replit-text-secondary">Stopped</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-500">{healthData.errors}</div>
            <div className="text-sm text-replit-text-secondary">Errors</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-500">{healthData.totalRequests}</div>
            <div className="text-sm text-replit-text-secondary">Total Requests</div>
          </div>
        </div>
      </Card>

      {/* Middleware List */}
      <div className="space-y-3">
        <h3 className="font-medium">Middleware Status</h3>
        {healthData.middlewareList.map((middleware) => (
          <Card key={middleware.name} className="p-4 bg-replit-panel border-replit-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getStatusIcon(middleware.status)}
                <div>
                  <h4 className="font-medium">{middleware.name}</h4>
                  <div className="flex items-center gap-4 text-sm text-replit-text-secondary">
                    <span className="flex items-center gap-1">
                      <BarChart3 className="w-3 h-3" />
                      {middleware.requests} requests
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {middleware.averageTime}ms avg
                    </span>
                    <span className="flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {middleware.errorRate}% error rate
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={getStatusColor(middleware.status)}>
                  {middleware.status.toUpperCase()}
                </Badge>
                
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => executeAction('start', middleware.name)}
                    disabled={middleware.status === 'active' || actionLoading === `start-${middleware.name}`}
                    className="p-1"
                  >
                    <Play className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => executeAction('stop', middleware.name)}
                    disabled={middleware.status === 'stopped' || actionLoading === `stop-${middleware.name}`}
                    className="p-1"
                  >
                    <Square className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => executeAction('reset', middleware.name)}
                    disabled={actionLoading === `reset-${middleware.name}`}
                    className="p-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {healthData.middlewareList.length === 0 && (
        <Alert>
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>
            No middleware registered for monitoring
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};