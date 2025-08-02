import { Request, Response, NextFunction } from 'express';
import { performance } from 'perf_hooks';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface MiddlewareMetrics {
  name: string;
  status: 'active' | 'stopped' | 'error';
  requests: number;
  totalTime: number;
  averageTime: number;
  lastExecuted: Date | null;
  errors: number;
  isEnabled: boolean;
  isService?: boolean; // Indicates if this is an external service
}

class MiddlewareMonitor {
  private metrics: Map<string, MiddlewareMetrics> = new Map();
  private isGloballyEnabled: boolean = true;

  constructor() {
    // Initialize Flask Analyzer service monitoring
    this.initializeFlaskAnalyzer();
  }

  private async initializeFlaskAnalyzer() {
    const flaskAnalyzer: MiddlewareMetrics = {
      name: 'Flask Analyzer',
      status: 'stopped',
      requests: 0,
      totalTime: 0,
      averageTime: 0,
      lastExecuted: null,
      errors: 0,
      isEnabled: true,
      isService: true
    };

    this.metrics.set('Flask Analyzer', flaskAnalyzer);
    
    // Check if Flask analyzer is running
    this.checkFlaskAnalyzerStatus();
    
    // Set up periodic health checks
    setInterval(() => {
      this.checkFlaskAnalyzerStatus();
    }, 30000); // Check every 30 seconds
  }

  private async checkFlaskAnalyzerStatus() {
    const metric = this.metrics.get('Flask Analyzer');
    if (!metric) return;

    try {
      const flaskUrl = process.env.FLASK_ANALYZER_URL || 'http://localhost:5001';
      const response = await fetch(`${flaskUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      
      if (response.ok) {
        metric.status = 'active';
        metric.lastExecuted = new Date();
      } else {
        metric.status = 'error';
        metric.errors++;
      }
    } catch (error) {
      metric.status = 'stopped';
    }
  }

  createMonitoredMiddleware(name: string, middleware: (req: Request, res: Response, next: NextFunction) => void) {
    // Initialize metrics for this middleware
    this.metrics.set(name, {
      name,
      status: 'active',
      requests: 0,
      totalTime: 0,
      averageTime: 0,
      lastExecuted: null,
      errors: 0,
      isEnabled: true
    });

    return (req: Request, res: Response, next: NextFunction) => {
      const metric = this.metrics.get(name);
      
      // Skip if middleware is disabled or monitor is globally disabled
      if (!this.isGloballyEnabled || !metric?.isEnabled) {
        return next();
      }

      const startTime = performance.now();
      
      try {
        // Execute the original middleware
        middleware(req, res, (error?: any) => {
          const endTime = performance.now();
          const executionTime = endTime - startTime;
          
          // Update metrics
          if (metric) {
            metric.requests++;
            metric.totalTime += executionTime;
            metric.averageTime = metric.totalTime / metric.requests;
            metric.lastExecuted = new Date();
            
            if (error) {
              metric.errors++;
              metric.status = 'error';
            } else {
              metric.status = 'active';
            }
          }
          
          next(error);
        });
      } catch (error) {
        const endTime = performance.now();
        const executionTime = endTime - startTime;
        
        if (metric) {
          metric.requests++;
          metric.totalTime += executionTime;
          metric.averageTime = metric.totalTime / metric.requests;
          metric.lastExecuted = new Date();
          metric.errors++;
          metric.status = 'error';
        }
        
        next(error);
      }
    };
  }

  // Start a specific middleware
  async startMiddleware(name: string): Promise<boolean> {
    const metric = this.metrics.get(name);
    if (!metric) return false;

    if (name === 'Flask Analyzer') {
      return await this.startFlaskAnalyzer();
    }

    metric.isEnabled = true;
    metric.status = 'active';
    return true;
  }

  private async startFlaskAnalyzer(): Promise<boolean> {
    try {
      console.log('🔄 Starting Flask Analyzer service...');
      
      // Create virtual environment and install dependencies
      const isWindows = process.platform === 'win32';
      const venvPath = 'flask_analyzer/venv';
      const pythonExe = isWindows ? 'python' : 'python3';
      const pipExe = isWindows ? `${venvPath}/Scripts/pip` : `${venvPath}/bin/pip`;
      const pythonVenv = isWindows ? `${venvPath}/Scripts/python` : `${venvPath}/bin/python`;
      
      try {
        // Check if virtual environment exists
        const venvExists = await this.checkPathExists(venvPath);
        
        if (!venvExists) {
          console.log('📦 Creating Python virtual environment...');
          await execAsync(`cd flask_analyzer && ${pythonExe} -m venv venv`);
        }
        
        // Install dependencies in virtual environment
        console.log('📦 Installing Flask dependencies...');
        await execAsync(`cd flask_analyzer && ${pipExe} install -r requirements.txt --quiet`);
        console.log('✅ Flask dependencies installed in virtual environment');
        
      } catch (installError) {
        console.warn('Warning: Could not setup virtual environment, trying system Python:', installError);
        // Fallback to system Python
        try {
          await execAsync('cd flask_analyzer && pip install -r requirements.txt --quiet');
        } catch (fallbackError) {
          console.error('Failed to install dependencies with system Python:', fallbackError);
          throw fallbackError;
        }
      }

      // Start the Flask analyzer using virtual environment Python or system Python
      let startCommand: string;
      const venvPythonExists = await this.checkPathExists(pythonVenv);
      
      if (venvPythonExists) {
        startCommand = `cd flask_analyzer && ${pythonVenv} run_server.py`;
      } else {
        startCommand = `cd flask_analyzer && ${pythonExe} run_server.py`;
      }
      
      console.log(`🚀 Starting Flask server with command: ${startCommand}`);
      
      // Start the process in the background
      const child = exec(startCommand, (error, stdout, stderr) => {
        if (error) {
          console.error('Flask Analyzer start error:', error);
          const metric = this.metrics.get('Flask Analyzer');
          if (metric) {
            metric.status = 'error';
            metric.errors++;
          }
        }
      });

      // Log output for debugging
      if (child.stdout) {
        child.stdout.on('data', (data) => {
          console.log('Flask stdout:', data.toString());
        });
      }
      
      if (child.stderr) {
        child.stderr.on('data', (data) => {
          console.log('Flask stderr:', data.toString());
        });
      }

      // Wait and check if it's running
      setTimeout(async () => {
        await this.checkFlaskAnalyzerStatus();
      }, 8000); // Increased wait time for startup

      return true;
    } catch (error) {
      console.error('Error starting Flask Analyzer:', error);
      const metric = this.metrics.get('Flask Analyzer');
      if (metric) {
        metric.status = 'error';
        metric.errors++;
      }
      return false;
    }
  }

  private async checkPathExists(path: string): Promise<boolean> {
    try {
      await execAsync(`test -e ${path} || [[ -e ${path} ]]`);
      return true;
    } catch {
      return false;
    }
  }

  // Stop a specific middleware
  async stopMiddleware(name: string): Promise<boolean> {
    const metric = this.metrics.get(name);
    if (!metric) return false;

    if (name === 'Flask Analyzer') {
      return await this.stopFlaskAnalyzer();
    }

    metric.isEnabled = false;
    metric.status = 'stopped';
    return true;
  }

  private async stopFlaskAnalyzer(): Promise<boolean> {
    try {
      // Kill Flask analyzer process (Windows and Unix compatible)
      let killCommands: string[] = [];
      
      if (process.platform === 'win32') {
        // Windows commands
        killCommands = [
          'taskkill /F /FI "COMMANDLINE=*run_server.py*" /T || echo "No Flask process found"',
          'taskkill /F /FI "COMMANDLINE=*flask_analyzer*" /T || echo "No Flask analyzer process found"'
        ];
      } else {
        // Unix/Linux commands
        killCommands = [
          'pkill -f ".*run_server.py" || echo "No Flask process found"',
          'pkill -f ".*flask_analyzer.*python" || echo "No Flask analyzer process found"'
        ];
      }
      
      // Execute all kill commands
      for (const cmd of killCommands) {
        try {
          await execAsync(cmd);
        } catch (error) {
          console.log(`Kill command failed (expected): ${cmd}`);
        }
      }
      
      console.log('🛑 Flask Analyzer service stopped');
      
      const metric = this.metrics.get('Flask Analyzer');
      if (metric) {
        metric.status = 'stopped';
        metric.isEnabled = false;
      }
      
      return true;
    } catch (error) {
      console.error('Error stopping Flask Analyzer:', error);
      return false;
    }
  }

  // Start all middleware monitoring
  startAll(): void {
    this.isGloballyEnabled = true;
    this.metrics.forEach(metric => {
      if (metric.status !== 'error') {
        metric.isEnabled = true;
        metric.status = 'active';
      }
    });
  }

  // Stop all middleware monitoring
  stopAll(): void {
    this.isGloballyEnabled = false;
    this.metrics.forEach(metric => {
      metric.isEnabled = false;
      metric.status = 'stopped';
    });
  }

  // Get metrics for a specific middleware
  getMetrics(name: string): MiddlewareMetrics | null {
    return this.metrics.get(name) || null;
  }

  // Get all metrics
  getAllMetrics(): MiddlewareMetrics[] {
    return Array.from(this.metrics.values());
  }

  // Reset metrics for a specific middleware
  resetMetrics(name: string): boolean {
    const metric = this.metrics.get(name);
    if (metric) {
      metric.requests = 0;
      metric.totalTime = 0;
      metric.averageTime = 0;
      metric.errors = 0;
      metric.lastExecuted = null;
      return true;
    }
    return false;
  }

  // Reset all metrics
  resetAllMetrics(): void {
    this.metrics.forEach(metric => {
      metric.requests = 0;
      metric.totalTime = 0;
      metric.averageTime = 0;
      metric.errors = 0;
      metric.lastExecuted = null;
    });
  }

  // Get system health summary
  getHealthSummary() {
    const metrics = this.getAllMetrics();
    const total = metrics.length;
    const active = metrics.filter(m => m.status === 'active').length;
    const stopped = metrics.filter(m => m.status === 'stopped').length;
    const errors = metrics.filter(m => m.status === 'error').length;
    const totalRequests = metrics.reduce((sum, m) => sum + m.requests, 0);
    const totalErrors = metrics.reduce((sum, m) => sum + m.errors, 0);

    return {
      globallyEnabled: this.isGloballyEnabled,
      total,
      active,
      stopped,
      errors,
      totalRequests,
      totalErrors,
      errorRate: totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0,
      middlewareList: metrics.map(m => ({
        name: m.name,
        status: m.status,
        isEnabled: m.isEnabled,
        requests: m.requests,
        averageTime: Math.round(m.averageTime * 100) / 100,
        errorRate: m.requests > 0 ? Math.round((m.errors / m.requests) * 10000) / 100 : 0
      }))
    };
  }
}

// Export singleton instance
export const middlewareMonitor = new MiddlewareMonitor();

// Express middleware to expose monitoring endpoints
export const monitoringRoutes = async (req: Request, res: Response, next: NextFunction) => {
  const { method, path } = req;

  // Monitoring API endpoints
  if (method === 'GET' && path === '/api/middleware/status') {
    return res.json(middlewareMonitor.getHealthSummary());
  }

  if (method === 'POST' && path === '/api/middleware/start') {
    const { name } = req.body;
    if (name === 'all') {
      middlewareMonitor.startAll();
      return res.json({ success: true, message: 'All middleware started' });
    } else if (name) {
      const success = await middlewareMonitor.startMiddleware(name);
      return res.json({ 
        success, 
        message: success ? `Middleware ${name} started` : `Middleware ${name} not found` 
      });
    }
    return res.status(400).json({ error: 'Missing middleware name' });
  }

  if (method === 'POST' && path === '/api/middleware/stop') {
    const { name } = req.body;
    if (name === 'all') {
      middlewareMonitor.stopAll();
      return res.json({ success: true, message: 'All middleware stopped' });
    } else if (name) {
      const success = await middlewareMonitor.stopMiddleware(name);
      return res.json({ 
        success, 
        message: success ? `Middleware ${name} stopped` : `Middleware ${name} not found` 
      });
    }
    return res.status(400).json({ error: 'Missing middleware name' });
  }

  if (method === 'POST' && path === '/api/middleware/reset') {
    const { name } = req.body;
    if (name === 'all') {
      middlewareMonitor.resetAllMetrics();
      return res.json({ success: true, message: 'All metrics reset' });
    } else if (name) {
      if (name === 'Flask Analyzer') {
        // For Flask Analyzer, reset means restart
        const stopSuccess = await middlewareMonitor.stopMiddleware(name);
        const startSuccess = await middlewareMonitor.startMiddleware(name);
        return res.json({ 
          success: stopSuccess && startSuccess, 
          message: stopSuccess && startSuccess ? `Flask Analyzer restarted` : `Failed to restart Flask Analyzer` 
        });
      }
      const success = middlewareMonitor.resetMetrics(name);
      return res.json({ 
        success, 
        message: success ? `Metrics for ${name} reset` : `Middleware ${name} not found` 
      });
    }
    return res.status(400).json({ error: 'Missing middleware name' });
  }

  if (method === 'GET' && path.startsWith('/api/middleware/metrics/')) {
    const name = path.split('/').pop();
    if (name) {
      const metrics = middlewareMonitor.getMetrics(name);
      if (metrics) {
        return res.json(metrics);
      }
      return res.status(404).json({ error: 'Middleware not found' });
    }
    return res.status(400).json({ error: 'Missing middleware name' });
  }

  next();
};