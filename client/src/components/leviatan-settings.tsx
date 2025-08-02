import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Settings, 
  User, 
  Palette, 
  Globe, 
  Shield, 
  Database, 
  Code,
  Save,
  RefreshCw,
  Check,
  AlertTriangle,
  Info
} from "lucide-react";

export const LeviatanSettings = ({ currentProject }: { currentProject: string }) => {
  const [settings, setSettings] = useState({
    // User Preferences
    theme: 'dark',
    language: 'en',
    fontSize: '14',
    tabSize: '2',
    wordWrap: true,
    minimap: true,
    lineNumbers: true,
    
    // Development Settings
    autoSave: true,
    autoFormat: true,
    debugMode: false,
    flaskAnalyzerPort: '5001',
    mainAppPort: '5000',
    
    // Environment
    nodeVersion: '20',
    pythonVersion: '3.11',
    workingDirectory: '',
    
    // Security
    enableHttps: false,
    corsEnabled: true,
    rateLimiting: true,
    sessionTimeout: '24'
  });

  const [saveStatus, setSaveStatus] = useState<string>('');

  useEffect(() => {
    // Load settings from API
    const loadSettings = async () => {
      try {
        const response = await fetch(`/api/workspace/${currentProject}/settings`);
        if (response.ok) {
          const data = await response.json();
          setSettings(prev => ({ ...prev, ...data }));
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };
    
    loadSettings();
  }, [currentProject]);

  const handleSave = async () => {
    setSaveStatus('Saving...');
    try {
      const response = await fetch(`/api/workspace/${currentProject}/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });
      
      if (response.ok) {
        setSaveStatus('Settings saved successfully');
        setTimeout(() => setSaveStatus(''), 3000);
      } else {
        setSaveStatus('Failed to save settings');
        setTimeout(() => setSaveStatus(''), 3000);
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      setSaveStatus('Error saving settings');
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  const handleReset = () => {
    setSettings({
      theme: 'dark',
      language: 'en',
      fontSize: '14',
      tabSize: '2',
      wordWrap: true,
      minimap: true,
      lineNumbers: true,
      autoSave: true,
      autoFormat: true,
      debugMode: false,
      flaskAnalyzerPort: '5001',
      mainAppPort: '5000',
      nodeVersion: '20',
      pythonVersion: '3.11',
      workingDirectory: '',
      enableHttps: false,
      corsEnabled: true,
      rateLimiting: true,
      sessionTimeout: '24'
    });
  };

  return (
    <div className="h-full bg-replit-bg p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-replit-text flex items-center">
              <Settings className="w-6 h-6 mr-2 text-replit-blue" />
              LeviatanCode Settings
            </h1>
            <p className="text-sm text-replit-text-secondary mt-1">
              Configure your development environment and preferences
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              onClick={handleReset}
              className="modern-button"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset to Defaults
            </Button>
            <Button 
              onClick={handleSave}
              className="modern-button bg-replit-blue hover:bg-replit-blue-secondary"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Settings
            </Button>
          </div>
        </div>

        {/* Save Status */}
        {saveStatus && (
          <div className={`p-3 rounded-lg flex items-center space-x-2 ${
            saveStatus.includes('success') ? 'bg-green-500/20 text-green-400' :
            saveStatus.includes('Error') || saveStatus.includes('Failed') ? 'bg-red-500/20 text-red-400' :
            'bg-blue-500/20 text-blue-400'
          }`}>
            {saveStatus.includes('success') ? <Check className="w-4 h-4" /> :
             saveStatus.includes('Error') || saveStatus.includes('Failed') ? <AlertTriangle className="w-4 h-4" /> :
             <Info className="w-4 h-4" />}
            <span className="text-sm">{saveStatus}</span>
          </div>
        )}

        {/* Workspace Context */}
        <div className="bg-replit-panel rounded-lg p-4 border border-replit-border">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-replit-blue rounded-full"></div>
            <span className="text-replit-text font-medium">Workspace: {currentProject}</span>
            <span className="text-xs text-replit-text-secondary">Windows Development Environment</span>
          </div>
        </div>

        <Tabs defaultValue="editor" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-replit-elevated">
            <TabsTrigger value="editor" className="flex items-center space-x-2">
              <Code className="w-4 h-4" />
              <span>Editor</span>
            </TabsTrigger>
            <TabsTrigger value="development" className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>Development</span>
            </TabsTrigger>
            <TabsTrigger value="environment" className="flex items-center space-x-2">
              <Globe className="w-4 h-4" />
              <span>Environment</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center space-x-2">
              <Shield className="w-4 h-4" />
              <span>Security</span>
            </TabsTrigger>
            <TabsTrigger value="about" className="flex items-center space-x-2">
              <Info className="w-4 h-4" />
              <span>About</span>
            </TabsTrigger>
          </TabsList>

          {/* Editor Settings */}
          <TabsContent value="editor" className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-replit-panel rounded-lg p-6 border border-replit-border">
                <h3 className="text-lg font-medium text-replit-text mb-4">Appearance</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-replit-text-secondary mb-2">Theme</label>
                    <Select value={settings.theme} onValueChange={(value) => setSettings({...settings, theme: value})}>
                      <SelectTrigger className="bg-replit-elevated border-replit-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dark">Dark (Replit Style)</SelectItem>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="auto">System Default</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-replit-text-secondary mb-2">Font Size</label>
                    <Select value={settings.fontSize} onValueChange={(value) => setSettings({...settings, fontSize: value})}>
                      <SelectTrigger className="bg-replit-elevated border-replit-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="12">12px</SelectItem>
                        <SelectItem value="14">14px</SelectItem>
                        <SelectItem value="16">16px</SelectItem>
                        <SelectItem value="18">18px</SelectItem>
                        <SelectItem value="20">20px</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-replit-text-secondary mb-2">Tab Size</label>
                    <Select value={settings.tabSize} onValueChange={(value) => setSettings({...settings, tabSize: value})}>
                      <SelectTrigger className="bg-replit-elevated border-replit-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">2 spaces</SelectItem>
                        <SelectItem value="4">4 spaces</SelectItem>
                        <SelectItem value="8">8 spaces</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="bg-replit-panel rounded-lg p-6 border border-replit-border">
                <h3 className="text-lg font-medium text-replit-text mb-4">Editor Features</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-replit-text text-sm">Word Wrap</div>
                      <div className="text-xs text-replit-text-secondary">Wrap long lines in editor</div>
                    </div>
                    <Button 
                      variant={settings.wordWrap ? "default" : "outline"} 
                      size="sm"
                      onClick={() => setSettings({...settings, wordWrap: !settings.wordWrap})}
                    >
                      {settings.wordWrap ? 'On' : 'Off'}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-replit-text text-sm">Minimap</div>
                      <div className="text-xs text-replit-text-secondary">Show code minimap</div>
                    </div>
                    <Button 
                      variant={settings.minimap ? "default" : "outline"} 
                      size="sm"
                      onClick={() => setSettings({...settings, minimap: !settings.minimap})}
                    >
                      {settings.minimap ? 'On' : 'Off'}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-replit-text text-sm">Line Numbers</div>
                      <div className="text-xs text-replit-text-secondary">Show line numbers</div>
                    </div>
                    <Button 
                      variant={settings.lineNumbers ? "default" : "outline"} 
                      size="sm"
                      onClick={() => setSettings({...settings, lineNumbers: !settings.lineNumbers})}
                    >
                      {settings.lineNumbers ? 'On' : 'Off'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Development Settings */}
          <TabsContent value="development" className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-replit-panel rounded-lg p-6 border border-replit-border">
                <h3 className="text-lg font-medium text-replit-text mb-4">Development Features</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-replit-text text-sm">Auto Save</div>
                      <div className="text-xs text-replit-text-secondary">Automatically save files on change</div>
                    </div>
                    <Button 
                      variant={settings.autoSave ? "default" : "outline"} 
                      size="sm"
                      onClick={() => setSettings({...settings, autoSave: !settings.autoSave})}
                    >
                      {settings.autoSave ? 'On' : 'Off'}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-replit-text text-sm">Auto Format</div>
                      <div className="text-xs text-replit-text-secondary">Format code on save</div>
                    </div>
                    <Button 
                      variant={settings.autoFormat ? "default" : "outline"} 
                      size="sm"
                      onClick={() => setSettings({...settings, autoFormat: !settings.autoFormat})}
                    >
                      {settings.autoFormat ? 'On' : 'Off'}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-replit-text text-sm">Debug Mode</div>
                      <div className="text-xs text-replit-text-secondary">Enable verbose logging</div>
                    </div>
                    <Button 
                      variant={settings.debugMode ? "default" : "outline"} 
                      size="sm"
                      onClick={() => setSettings({...settings, debugMode: !settings.debugMode})}
                    >
                      {settings.debugMode ? 'On' : 'Off'}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="bg-replit-panel rounded-lg p-6 border border-replit-border">
                <h3 className="text-lg font-medium text-replit-text mb-4">Port Configuration</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-replit-text-secondary mb-2">Main App Port</label>
                    <Input
                      value={settings.mainAppPort}
                      onChange={(e) => setSettings({...settings, mainAppPort: e.target.value})}
                      placeholder="5000"
                      className="bg-replit-elevated border-replit-border"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-replit-text-secondary mb-2">Flask Analyzer Port</label>
                    <Input
                      value={settings.flaskAnalyzerPort}
                      onChange={(e) => setSettings({...settings, flaskAnalyzerPort: e.target.value})}
                      placeholder="5001"
                      className="bg-replit-elevated border-replit-border"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-replit-text-secondary mb-2">Working Directory</label>
                    <Input
                      value={settings.workingDirectory}
                      onChange={(e) => setSettings({...settings, workingDirectory: e.target.value})}
                      placeholder="C:\Development\Projects"
                      className="bg-replit-elevated border-replit-border"
                    />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Environment Settings */}
          <TabsContent value="environment" className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-replit-panel rounded-lg p-6 border border-replit-border">
                <h3 className="text-lg font-medium text-replit-text mb-4">Runtime Versions</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-replit-text-secondary mb-2">Node.js Version</label>
                    <Select value={settings.nodeVersion} onValueChange={(value) => setSettings({...settings, nodeVersion: value})}>
                      <SelectTrigger className="bg-replit-elevated border-replit-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="18">Node.js 18 LTS</SelectItem>
                        <SelectItem value="20">Node.js 20 LTS</SelectItem>
                        <SelectItem value="21">Node.js 21 Current</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-replit-text-secondary mb-2">Python Version</label>
                    <Select value={settings.pythonVersion} onValueChange={(value) => setSettings({...settings, pythonVersion: value})}>
                      <SelectTrigger className="bg-replit-elevated border-replit-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3.9">Python 3.9</SelectItem>
                        <SelectItem value="3.10">Python 3.10</SelectItem>
                        <SelectItem value="3.11">Python 3.11</SelectItem>
                        <SelectItem value="3.12">Python 3.12</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-replit-text-secondary mb-2">Language</label>
                    <Select value={settings.language} onValueChange={(value) => setSettings({...settings, language: value})}>
                      <SelectTrigger className="bg-replit-elevated border-replit-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Español</SelectItem>
                        <SelectItem value="fr">Français</SelectItem>
                        <SelectItem value="de">Deutsch</SelectItem>
                        <SelectItem value="zh">中文</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="bg-replit-panel rounded-lg p-6 border border-replit-border">
                <h3 className="text-lg font-medium text-replit-text mb-4">System Information</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-replit-text-secondary">Platform:</span>
                    <span className="text-replit-text">Windows 11</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-replit-text-secondary">Architecture:</span>
                    <span className="text-replit-text">x64</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-replit-text-secondary">Shell:</span>
                    <span className="text-replit-text">PowerShell 7.x</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-replit-text-secondary">Package Manager:</span>
                    <span className="text-replit-text">npm, pip</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-replit-text-secondary">Database:</span>
                    <span className="text-replit-text">Supabase (PostgreSQL)</span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security" className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-replit-panel rounded-lg p-6 border border-replit-border">
                <h3 className="text-lg font-medium text-replit-text mb-4">Security Features</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-replit-text text-sm">HTTPS Only</div>
                      <div className="text-xs text-replit-text-secondary">Force HTTPS connections</div>
                    </div>
                    <Button 
                      variant={settings.enableHttps ? "default" : "outline"} 
                      size="sm"
                      onClick={() => setSettings({...settings, enableHttps: !settings.enableHttps})}
                    >
                      {settings.enableHttps ? 'On' : 'Off'}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-replit-text text-sm">CORS Protection</div>
                      <div className="text-xs text-replit-text-secondary">Enable cross-origin protection</div>
                    </div>
                    <Button 
                      variant={settings.corsEnabled ? "default" : "outline"} 
                      size="sm"
                      onClick={() => setSettings({...settings, corsEnabled: !settings.corsEnabled})}
                    >
                      {settings.corsEnabled ? 'On' : 'Off'}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-replit-text text-sm">Rate Limiting</div>
                      <div className="text-xs text-replit-text-secondary">Limit API request frequency</div>
                    </div>
                    <Button 
                      variant={settings.rateLimiting ? "default" : "outline"} 
                      size="sm"
                      onClick={() => setSettings({...settings, rateLimiting: !settings.rateLimiting})}
                    >
                      {settings.rateLimiting ? 'On' : 'Off'}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="bg-replit-panel rounded-lg p-6 border border-replit-border">
                <h3 className="text-lg font-medium text-replit-text mb-4">Session Management</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-replit-text-secondary mb-2">Session Timeout (hours)</label>
                    <Select value={settings.sessionTimeout} onValueChange={(value) => setSettings({...settings, sessionTimeout: value})}>
                      <SelectTrigger className="bg-replit-elevated border-replit-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 hour</SelectItem>
                        <SelectItem value="8">8 hours</SelectItem>
                        <SelectItem value="24">24 hours</SelectItem>
                        <SelectItem value="168">7 days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* About */}
          <TabsContent value="about" className="space-y-6">
            <div className="bg-replit-panel rounded-lg p-6 border border-replit-border">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-replit-blue rounded-lg mx-auto flex items-center justify-center">
                  <Code className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-replit-text">LeviatanCode</h2>
                  <p className="text-sm text-replit-text-secondary">Comprehensive Windows Development Environment</p>
                </div>
                <div className="text-sm text-replit-text-secondary space-y-1">
                  <div>Version: 2.0.0</div>
                  <div>Build: 2025.01.02</div>
                  <div>Environment: Development</div>
                </div>
                <div className="text-xs text-replit-text-secondary space-y-2 pt-4">
                  <p>
                    LeviatanCode is an advanced AI-powered development environment that provides intelligent, 
                    dynamic assistance for developers through comprehensive project metadata generation, 
                    real-time code insights, and enhanced collaborative tooling.
                  </p>
                  <p>
                    Key Features: React/TypeScript frontend, Express.js backend, Monaco Editor, 
                    AI-driven metadata generation, Multi-panel development workspace, Git integration, 
                    Flask analyzer service, and Supabase database integration.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};