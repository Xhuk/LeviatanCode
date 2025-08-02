import { Request, Response, NextFunction } from 'express';
import { performance } from 'perf_hooks';

interface MiddlewareMetrics {
  name: string;
  status: 'active' | 'stopped' | 'error';
  requests: number;
  totalTime: number;
  averageTime: number;
  lastExecuted: Date | null;
  errors: number;
  isEnabled: boolean;
}

class MiddlewareMonitor {
  private metrics: Map<string, MiddlewareMetrics> = new Map();
  private isGloballyEnabled: boolean = true;

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
  startMiddleware(name: string): boolean {
    const metric = this.metrics.get(name);
    if (metric) {
      metric.isEnabled = true;
      metric.status = 'active';
      return true;
    }
    return false;
  }

  // Stop a specific middleware
  stopMiddleware(name: string): boolean {
    const metric = this.metrics.get(name);
    if (metric) {
      metric.isEnabled = false;
      metric.status = 'stopped';
      return true;
    }
    return false;
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
export const monitoringRoutes = (req: Request, res: Response, next: NextFunction) => {
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
      const success = middlewareMonitor.startMiddleware(name);
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
      const success = middlewareMonitor.stopMiddleware(name);
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