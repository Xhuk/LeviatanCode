import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Settings, 
  Database, 
  Brain, 
  Shield, 
  FileText, 
  Info,
  ExternalLink,
  CheckCircle,
  XCircle,
  AlertTriangle
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface EnvironmentConfig {
  databaseUrl: string;
  openaiApiKey: string;
  geminiApiKey: string;
  sessionSecret: string;
  nodeEnv: string;
  port: string;
  maxFileSize: string;
  maxFiles: string;
  rateLimitMax: string;
  uploadRateLimit: string;
}

interface ServiceStatus {
  database: 'connected' | 'disconnected' | 'error';
  openai: 'connected' | 'disconnected' | 'error';
  gemini: 'connected' | 'disconnected' | 'error';
}

export function SettingsDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<EnvironmentConfig>({
    databaseUrl: '',
    openaiApiKey: '',
    geminiApiKey: '',
    sessionSecret: '',
    nodeEnv: 'development',
    port: '5000',
    maxFileSize: '10485760',
    maxFiles: '50',
    rateLimitMax: '1000',
    uploadRateLimit: '10'
  });
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus>({
    database: 'disconnected',
    openai: 'disconnected',
    gemini: 'disconnected'
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current configuration
  const { data: currentConfig, isLoading } = useQuery({
    queryKey: ['/api/settings/environment'],
    enabled: isOpen,
  });

  // Test service connections
  const { data: services } = useQuery({
    queryKey: ['/api/settings/services/status'],
    enabled: isOpen,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const updateConfigMutation = useMutation({
    mutationFn: async (newConfig: Partial<EnvironmentConfig>) => {
      const response = await fetch('/api/settings/environment', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newConfig),
      });
      if (!response.ok) {
        throw new Error('Failed to update settings');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Settings Updated",
        description: "Environment configuration has been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
    },
    onError: (error) => {
      toast({
        title: "Settings Update Failed",
        description: error.message || "Failed to update environment configuration.",
        variant: "destructive",
      });
    },
  });

  const testConnectionMutation = useMutation({
    mutationFn: async (service: string) => {
      const response = await fetch(`/api/settings/services/test/${service}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to test connection');
      }
      return response.json();
    },
    onSuccess: (data: any, service: string) => {
      setServiceStatus(prev => ({
        ...prev,
        [service]: data.connected ? 'connected' : 'error'
      }));
      toast({
        title: `${service.toUpperCase()} Connection Test`,
        description: data.connected ? "Connection successful!" : "Connection failed.",
        variant: data.connected ? "default" : "destructive",
      });
    },
  });

  useEffect(() => {
    if (currentConfig) {
      setConfig(currentConfig as EnvironmentConfig);
    }
  }, [currentConfig]);

  useEffect(() => {
    if (services) {
      setServiceStatus(services as ServiceStatus);
    }
  }, [services]);

  const handleSave = () => {
    updateConfigMutation.mutate(config);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected':
        return 'Connected';
      case 'error':
        return 'Error';
      default:
        return 'Not Configured';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Settings size={16} className="text-replit-text-secondary" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Environment Configuration
          </DialogTitle>
          <DialogDescription>
            Configure API keys and environment variables for LeviatanCode. All settings are stored in your .env file.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="services" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="application">Application</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="services" className="space-y-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI Services
              </h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="openai-key">OpenAI API Key</Label>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(serviceStatus.openai)}
                      <span className="text-sm text-muted-foreground">
                        {getStatusText(serviceStatus.openai)}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => testConnectionMutation.mutate('openai')}
                        disabled={!config.openaiApiKey || testConnectionMutation.isPending}
                      >
                        Test
                      </Button>
                    </div>
                  </div>
                  <Input
                    id="openai-key"
                    type="password"
                    placeholder="sk-..."
                    value={config.openaiApiKey}
                    onChange={(e) => setConfig({ ...config, openaiApiKey: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Get your API key from{" "}
                    <a 
                      href="https://platform.openai.com/api-keys" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline inline-flex items-center gap-1"
                    >
                      OpenAI Platform
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="gemini-key">Gemini API Key</Label>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(serviceStatus.gemini)}
                      <span className="text-sm text-muted-foreground">
                        {getStatusText(serviceStatus.gemini)}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => testConnectionMutation.mutate('gemini')}
                        disabled={!config.geminiApiKey || testConnectionMutation.isPending}
                      >
                        Test
                      </Button>
                    </div>
                  </div>
                  <Input
                    id="gemini-key"
                    type="password"
                    placeholder="Enter Gemini API key"
                    value={config.geminiApiKey}
                    onChange={(e) => setConfig({ ...config, geminiApiKey: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Get your API key from{" "}
                    <a 
                      href="https://aistudio.google.com/app/apikey" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline inline-flex items-center gap-1"
                    >
                      Google AI Studio
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Database
                </h3>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="database-url">Database URL</Label>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(serviceStatus.database)}
                      <span className="text-sm text-muted-foreground">
                        {getStatusText(serviceStatus.database)}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => testConnectionMutation.mutate('database')}
                        disabled={!config.databaseUrl || testConnectionMutation.isPending}
                      >
                        Test
                      </Button>
                    </div>
                  </div>
                  <Input
                    id="database-url"
                    type="password"
                    placeholder="postgresql://postgres:password@..."
                    value={config.databaseUrl}
                    onChange={(e) => setConfig({ ...config, databaseUrl: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Use Supabase for managed PostgreSQL hosting.{" "}
                    <a 
                      href="https://supabase.com/dashboard" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline inline-flex items-center gap-1"
                    >
                      Create Project
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="application" className="space-y-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Application Settings
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="node-env">Environment</Label>
                  <select
                    id="node-env"
                    value={config.nodeEnv}
                    onChange={(e) => setConfig({ ...config, nodeEnv: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="development">Development</option>
                    <option value="production">Production</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="port">Port</Label>
                  <Input
                    id="port"
                    type="number"
                    value={config.port}
                    onChange={(e) => setConfig({ ...config, port: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max-file-size">Max File Size (bytes)</Label>
                  <Input
                    id="max-file-size"
                    type="number"
                    value={config.maxFileSize}
                    onChange={(e) => setConfig({ ...config, maxFileSize: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Current: {Math.round(parseInt(config.maxFileSize) / 1024 / 1024)}MB
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max-files">Max Files per Upload</Label>
                  <Input
                    id="max-files"
                    type="number"
                    value={config.maxFiles}
                    onChange={(e) => setConfig({ ...config, maxFiles: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="session-secret">Session Secret</Label>
                  <Input
                    id="session-secret"
                    type="password"
                    placeholder="Enter secure session secret"
                    value={config.sessionSecret}
                    onChange={(e) => setConfig({ ...config, sessionSecret: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Use a long, random string for production environments.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rate-limit">API Rate Limit (per 15min)</Label>
                    <Input
                      id="rate-limit"
                      type="number"
                      value={config.rateLimitMax}
                      onChange={(e) => setConfig({ ...config, rateLimitMax: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="upload-rate-limit">Upload Rate Limit (per min)</Label>
                    <Input
                      id="upload-rate-limit"
                      type="number"
                      value={config.uploadRateLimit}
                      onChange={(e) => setConfig({ ...config, uploadRateLimit: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Changes to security settings require a server restart to take effect.
                </AlertDescription>
              </Alert>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={updateConfigMutation.isPending}
          >
            {updateConfigMutation.isPending ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}