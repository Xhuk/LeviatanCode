import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Activity, 
  Clock, 
  Code, 
  FileEdit, 
  GitBranch, 
  Terminal, 
  Bot, 
  Settings,
  RefreshCw,
  Play,
  Square,
  CheckCircle,
  AlertCircle,
  Zap
} from "lucide-react";

interface ActionLog {
  id: string;
  actionType: string;
  actionDescription: string;
  timestamp: string;
  success: boolean;
  duration?: number;
  filePath?: string;
  userId: string;
}

interface ProjectContext {
  currentState: string;
  totalRecentActions: number;
  mostCommonAction: string;
  actionBreakdown: Record<string, number>;
  lastActivity: string;
  sessionInfo: any;
  recommendedState: string;
}

interface ContextPanelProps {
  projectId: string;
}

const ACTION_ICONS = {
  'file_edit': FileEdit,
  'file_create': FileEdit,
  'file_delete': FileEdit,
  'file_move': FileEdit,
  'command_execute': Terminal,
  'git_operation': GitBranch,
  'ai_interaction': Bot,
  'agent_execution': Code,
  'project_setup': Settings,
  'configuration_change': Settings,
  'workspace_change': Settings,
  'debug_session': Activity,
  'test_run': Play,
  'build_operation': Zap,
};

const STATE_COLORS = {
  'initializing': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  'coding': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  'debugging': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  'testing': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  'building': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  'deploying': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  'git_operations': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
  'ai_assisted': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
  'idle': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
  'error': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

export function ContextPanel({ projectId }: ContextPanelProps) {
  const [sessionId, setSessionId] = useState<string>('');

  // Fetch project context
  const { data: context, refetch: refetchContext } = useQuery<ProjectContext>({
    queryKey: [`/api/context/${projectId}`],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Fetch action history
  const { data: actionHistory = [], refetch: refetchHistory } = useQuery<ActionLog[]>({
    queryKey: [`/api/context/${projectId}/history`],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Generate session ID on mount
  useEffect(() => {
    const generateSessionId = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let result = '';
      for (let i = 0; i < 12; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };

    setSessionId(generateSessionId());
  }, []);

  const startNewSession = async () => {
    try {
      const response = await fetch('/api/context/start-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          userId: 'demo-user',
          goal: 'Development session'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSessionId(data.sessionId);
        refetchContext();
      }
    } catch (error) {
      console.error('Failed to start session:', error);
    }
  };

  const getActionIcon = (actionType: string) => {
    const IconComponent = ACTION_ICONS[actionType as keyof typeof ACTION_ICONS] || Activity;
    return <IconComponent className="w-4 h-4" />;
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div className="h-full bg-replit-panel p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-replit-text flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Project Context
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            refetchContext();
            refetchHistory();
          }}
          className="flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="history">Action History</TabsTrigger>
          <TabsTrigger value="session">Session</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Current State */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Current State</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Badge 
                  className={STATE_COLORS[context?.currentState as keyof typeof STATE_COLORS] || STATE_COLORS.idle}
                >
                  {context?.currentState?.replace('_', ' ').toUpperCase() || 'UNKNOWN'}
                </Badge>
                {context?.recommendedState && context.recommendedState !== context.currentState && (
                  <Badge variant="outline" className="text-xs">
                    Suggested: {context.recommendedState.replace('_', ' ')}
                  </Badge>
                )}
              </div>
              {context?.lastActivity && (
                <p className="text-xs text-muted-foreground mt-2">
                  Last activity: {formatTimeAgo(context.lastActivity)}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Activity Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Actions</span>
                <span className="font-medium">{context?.totalRecentActions || 0}</span>
              </div>
              
              {context?.mostCommonAction && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Most Common</span>
                  <div className="flex items-center gap-2">
                    {getActionIcon(context.mostCommonAction)}
                    <span className="text-xs font-medium">
                      {context.mostCommonAction.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              )}

              {context?.actionBreakdown && Object.keys(context.actionBreakdown).length > 0 && (
                <div className="space-y-2">
                  <span className="text-sm text-muted-foreground">Action Breakdown</span>
                  <div className="space-y-1">
                    {Object.entries(context.actionBreakdown).slice(0, 3).map(([action, count]) => (
                      <div key={action} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          {getActionIcon(action)}
                          <span>{action.replace('_', ' ')}</span>
                        </div>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <ScrollArea className="h-96">
            <div className="space-y-2">
              {actionHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No recent actions recorded</p>
                  <p className="text-xs">Start using LeviatanCode to see your activity</p>
                </div>
              ) : (
                actionHistory.map((action) => (
                  <Card key={action.id} className="p-3">
                    <div className="flex items-start gap-3">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {getActionIcon(action.actionType)}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">
                            {action.actionDescription}
                          </p>
                          {action.filePath && (
                            <p className="text-xs text-muted-foreground truncate">
                              {action.filePath}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {action.actionType.replace('_', ' ')}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatTimeAgo(action.timestamp)}
                            </span>
                            {action.duration && (
                              <span className="text-xs text-muted-foreground">
                                {formatDuration(action.duration)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center">
                          {action.success ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-red-500" />
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="session" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Session Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Session ID</span>
                <code className="text-xs bg-muted px-2 py-1 rounded">
                  {sessionId || 'No active session'}
                </code>
              </div>
              
              {context?.sessionInfo && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Actions</span>
                    <span className="font-medium">{context.sessionInfo.totalActions || 0}</span>
                  </div>
                  
                  {context.sessionInfo.sessionGoal && (
                    <div className="space-y-1">
                      <span className="text-sm text-muted-foreground">Session Goal</span>
                      <p className="text-xs bg-muted p-2 rounded">
                        {context.sessionInfo.sessionGoal}
                      </p>
                    </div>
                  )}
                </>
              )}
              
              <Button onClick={startNewSession} className="w-full" size="sm">
                <Play className="w-4 h-4 mr-2" />
                Start New Session
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}