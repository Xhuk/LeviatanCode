import { useState, useEffect } from "react";
import { useTheme } from "@/contexts/theme-context";
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
  const { theme, fontSize, tabSize, accentColor, applySettings } = useTheme();
  const [settings, setSettings] = useState({
    // User Preferences
    theme: theme as 'dark' | 'light' | 'auto',
    language: 'en',
    fontSize: fontSize,
    tabSize: tabSize,
    accentColor: accentColor,
    wordWrap: true,
    minimap: true,
    lineNumbers: true,
    
    // Development Settings
    autoSave: true,
    autoFormat: true,
    debugMode: false,
    flaskAnalyzerPort: '5001',
    mainAppPort: '5000',
    
    // AI Configuration (Beta)
    enableOllama: false,
    ollamaUrl: 'http://localhost:11434',
    ollamaModel: 'llama3',
    aiMode: 'chatgpt-only', // 'chatgpt-only' | 'dual-mode' | 'ollama-dev'
    
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

  const testOllamaConnection = async () => {
    try {
      setSaveStatus('Testing Ollama connection...');
      const response = await fetch('/api/ai/test-ollama', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: settings.ollamaUrl,
          model: settings.ollamaModel
        })
      });
      
      const result = await response.json();
      if (result.success) {
        setSaveStatus('✅ Ollama connection successful!');
      } else {
        setSaveStatus(`❌ Ollama connection failed: ${result.error}`);
      }
      setTimeout(() => setSaveStatus(''), 5000);
    } catch (error) {
      setSaveStatus('❌ Failed to test Ollama connection');
      setTimeout(() => setSaveStatus(''), 5000);
    }
  }

  const detectOllama = async () => {
    try {
      setSaveStatus('🔍 Detecting Ollama service...');
      
      // Test common Ollama URLs
      const urls = ['http://localhost:11434', 'http://127.0.0.1:11434'];
      
      for (const url of urls) {
        try {
          const response = await fetch('/api/ai/test-ollama', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              url: url,
              model: 'llama3'
            })
          });
          
          const result = await response.json();
          if (result.success) {
            // Auto-populate configuration
            setSettings({
              ...settings,
              enableOllama: true,
              ollamaUrl: url,
              ollamaModel: 'llama3'
            });
            setSaveStatus(`✅ Ollama detected and configured! URL: ${url}`);
            setTimeout(() => setSaveStatus(''), 5000);
            return;
          }
        } catch (error) {
          // Continue to next URL
          continue;
        }
      }
      
      setSaveStatus('❌ Ollama service not detected. Please start Ollama and try again.');
      setTimeout(() => setSaveStatus(''), 5000);
    } catch (error) {
      setSaveStatus(`❌ Error detecting Ollama: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setTimeout(() => setSaveStatus(''), 5000);
    }
  };

  const [systemInfo, setSystemInfo] = useState({
    platform: '',
    architecture: '',
    nodeVersion: '',
    pythonVersion: '',
    shell: '',
    packageManagers: '',
    database: '',
    cpuCount: 0,
    totalMemory: '',
    freeMemory: '',
    uptime: ''
  });

  useEffect(() => {
    // Load settings and system info from API
    const loadData = async () => {
      try {
        const [settingsResponse, systemResponse] = await Promise.all([
          fetch(`/api/workspace/${currentProject}/settings`),
          fetch('/api/system/info')
        ]);
        
        if (settingsResponse.ok) {
          const data = await settingsResponse.json();
          setSettings(prev => ({ ...prev, ...data }));
        }
        
        if (systemResponse.ok) {
          const sysData = await systemResponse.json();
          setSystemInfo(sysData);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    };
    
    loadData();
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
          <TabsList className="grid w-full grid-cols-6 bg-replit-elevated">
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
            <TabsTrigger value="ai-config" className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>AI Config</span>
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
                    <Select value={settings.theme} onValueChange={(value) => {
                      const newSettings = {...settings, theme: value};
                      setSettings(newSettings);
                      applySettings({ theme: value as any, fontSize: settings.fontSize, tabSize: settings.tabSize, accentColor: settings.accentColor });
                    }}>
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
                    <Select value={settings.fontSize} onValueChange={(value) => {
                      const newSettings = {...settings, fontSize: value};
                      setSettings(newSettings);
                      applySettings({ theme: settings.theme as any, fontSize: value, tabSize: settings.tabSize, accentColor: settings.accentColor });
                    }}>
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
                    <Select value={settings.tabSize} onValueChange={(value) => {
                      const newSettings = {...settings, tabSize: value};
                      setSettings(newSettings);
                      applySettings({ theme: settings.theme as any, fontSize: settings.fontSize, tabSize: value, accentColor: settings.accentColor });
                    }}>
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
                  <div>
                    <label className="block text-sm font-medium text-replit-text-secondary mb-2">Accent Color</label>
                    <div className="flex items-center space-x-3">
                      <Input
                        type="color"
                        value={settings.accentColor}
                        onChange={(e) => {
                          const newColor = e.target.value;
                          const newSettings = {...settings, accentColor: newColor};
                          setSettings(newSettings);
                          applySettings({ 
                            theme: settings.theme as any, 
                            fontSize: settings.fontSize, 
                            tabSize: settings.tabSize,
                            accentColor: newColor
                          });
                        }}
                        className="w-12 h-8 rounded border-0 cursor-pointer"
                      />
                      <span className="text-sm text-replit-text-secondary">{settings.accentColor}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const defaultColor = '#22c55e';
                          const newSettings = {...settings, accentColor: defaultColor};
                          setSettings(newSettings);
                          applySettings({ 
                            theme: settings.theme as any, 
                            fontSize: settings.fontSize, 
                            tabSize: settings.tabSize,
                            accentColor: defaultColor
                          });
                        }}
                        className="text-xs"
                      >
                        Reset
                      </Button>
                    </div>
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
                    <span className="text-replit-text">{systemInfo.platform || 'Loading...'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-replit-text-secondary">Architecture:</span>
                    <span className="text-replit-text">{systemInfo.architecture || 'Loading...'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-replit-text-secondary">Node.js:</span>
                    <span className="text-replit-text">{systemInfo.nodeVersion || 'Loading...'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-replit-text-secondary">Python:</span>
                    <span className="text-replit-text">{systemInfo.pythonVersion || 'Loading...'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-replit-text-secondary">Shell:</span>
                    <span className="text-replit-text">{systemInfo.shell || 'Loading...'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-replit-text-secondary">Package Managers:</span>
                    <span className="text-replit-text">{systemInfo.packageManagers || 'Loading...'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-replit-text-secondary">Database:</span>
                    <span className="text-replit-text">{systemInfo.database || 'Loading...'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-replit-text-secondary">CPU Cores:</span>
                    <span className="text-replit-text">{systemInfo.cpuCount || 'Loading...'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-replit-text-secondary">Total Memory:</span>
                    <span className="text-replit-text">{systemInfo.totalMemory || 'Loading...'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-replit-text-secondary">Free Memory:</span>
                    <span className="text-replit-text">{systemInfo.freeMemory || 'Loading...'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-replit-text-secondary">Uptime:</span>
                    <span className="text-replit-text">{systemInfo.uptime || 'Loading...'}</span>
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

          {/* AI Configuration */}
          <TabsContent value="ai-config" className="space-y-6">
            <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4 flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
              <div>
                <div className="text-yellow-400 font-medium">Beta Feature</div>
                <div className="text-yellow-200 text-sm mt-1">
                  This is experimental. Current behavior remains unchanged when disabled.
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div className="bg-replit-panel rounded-lg p-6 border border-replit-border">
                <h3 className="text-lg font-medium text-replit-text mb-4">AI Mode Configuration</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-replit-text-secondary mb-2">AI Mode</label>
                    <Select 
                      value={settings.aiMode} 
                      onValueChange={(value) => setSettings({...settings, aiMode: value})}
                    >
                      <SelectTrigger className="bg-replit-elevated border-replit-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="chatgpt-only">ChatGPT Only (Default)</SelectItem>
                        <SelectItem value="dual-mode">Dual Mode (ChatGPT + Ollama)</SelectItem>
                        <SelectItem value="ollama-dev">Ollama for Dev Tasks</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="text-xs text-replit-text-secondary mt-2">
                      • ChatGPT Only: Current behavior (architectural guidance)<br/>
                      • Dual Mode: ChatGPT for architecture, Ollama for coding tasks<br/>
                      • Ollama Dev: Ollama handles development, ChatGPT for planning
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-replit-panel rounded-lg p-6 border border-replit-border">
                <h3 className="text-lg font-medium text-replit-text mb-4">Ollama Configuration</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="enableOllama"
                      checked={settings.enableOllama}
                      onChange={(e) => setSettings({...settings, enableOllama: e.target.checked})}
                      className="rounded border-replit-border bg-replit-elevated focus:ring-replit-blue"
                    />
                    <label htmlFor="enableOllama" className="text-sm font-medium text-replit-text">
                      Enable Ollama Integration
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-replit-text-secondary mb-2">Ollama Server URL</label>
                    <Input
                      value={settings.ollamaUrl}
                      onChange={(e) => setSettings({...settings, ollamaUrl: e.target.value})}
                      placeholder="http://localhost:11434"
                      className="bg-replit-elevated border-replit-border"
                      disabled={!settings.enableOllama}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-replit-text-secondary mb-2">Ollama Model</label>
                    <Select 
                      value={settings.ollamaModel} 
                      onValueChange={(value) => setSettings({...settings, ollamaModel: value})}
                      disabled={!settings.enableOllama}
                    >
                      <SelectTrigger className="bg-replit-elevated border-replit-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="llama3">Llama 3</SelectItem>
                        <SelectItem value="llama3:8b">Llama 3 8B</SelectItem>
                        <SelectItem value="llama3:70b">Llama 3 70B</SelectItem>
                        <SelectItem value="codellama">Code Llama</SelectItem>
                        <SelectItem value="codellama:13b">Code Llama 13B</SelectItem>
                        <SelectItem value="codellama:34b">Code Llama 34B</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      onClick={() => detectOllama()}
                      className="modern-button bg-green-600 hover:bg-green-700"
                      data-testid="button-detect-ollama"
                    >
                      <Search className="w-4 h-4 mr-2" />
                      Detect Ollama
                    </Button>
                    <Button
                      onClick={() => testOllamaConnection()}
                      disabled={!settings.enableOllama}
                      className="modern-button bg-replit-blue hover:bg-replit-blue-secondary"
                      data-testid="button-test-ollama"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Test Connection
                    </Button>
                  </div>
                </div>
              </div>

              <div className="bg-replit-panel rounded-lg p-6 border border-replit-border">
                <h3 className="text-lg font-medium text-replit-text mb-4">AI Task Distribution</h3>
                <div className="text-sm text-replit-text-secondary space-y-2">
                  <div><strong>ChatGPT (GPT-4o):</strong> Architectural guidance, project planning, complex analysis</div>
                  <div><strong>Ollama Llama3:</strong> Code generation, debugging, refactoring, documentation</div>
                  <div><strong>Context Sharing:</strong> Both models have access to project context and previous conversations</div>
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