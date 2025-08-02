import express, { type Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { middlewareMonitor, monitoringRoutes } from "./middleware/monitor";

// Load environment variables first
dotenv.config();

// Set NODE_ENV to development for proper middleware configuration
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development';
}

// Port configuration - use Replit's PORT environment variable
if (!process.env.PORT) {
  process.env.PORT = '5005';
  console.log('[INFO] No PORT specified - defaulting to 5005');
}

console.log(`[INFO] Environment: ${process.env.NODE_ENV}`);

const app = express();

// Basic parsing middleware
app.use(express.json({ limit: process.env.MAX_FILE_SIZE || '10mb' }));
app.use(express.urlencoded({ extended: false, limit: process.env.MAX_FILE_SIZE || '10mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Add monitoring routes first
  app.use(monitoringRoutes);
  
  // Load and apply middleware with monitoring
  try {
    const corsModule = await import("../middleware/cors.js");
    const securityModule = await import("../middleware/security.js");
    const sessionModule = await import("../middleware/session.js");
    const loggingModule = await import("../middleware/logging.js");
    const errorModule = await import("../middleware/errorHandler.js");

    // Apply CORS middleware with monitoring
    app.use(middlewareMonitor.createMonitoredMiddleware('CORS', corsModule.default));

    // Apply security middleware with monitoring
    const securityMiddleware = (req: Request, res: Response, next: NextFunction) => {
      securityModule.default(app);
      next();
    };
    app.use(middlewareMonitor.createMonitoredMiddleware('Security', securityMiddleware));

    // Apply logging middleware with monitoring
    const loggingMiddleware = (req: Request, res: Response, next: NextFunction) => {
      loggingModule.default(app);
      next();
    };
    app.use(middlewareMonitor.createMonitoredMiddleware('Logging', loggingMiddleware));

    // Apply session middleware with monitoring
    app.use(middlewareMonitor.createMonitoredMiddleware('Session', sessionModule.default));
    
    console.log("[INFO] All middleware loaded successfully with monitoring");
  } catch (error: any) {
    console.warn("Some middleware failed to load:", error?.message || error);
    console.log("Continuing with basic setup...");
  }

  const server = await registerRoutes(app);
  
  // Apply error handler after routes
  try {
    const errorModule = await import("../middleware/errorHandler.js");
    errorModule.default(app);
  } catch (error) {
    console.warn("Error handler failed to load:", error);
  }

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Default to 5005 for Windows Replit environment, fallback based on environment
  const port = parseInt(process.env.PORT || '5005', 10);
  
  // Server configuration for Replit
  server.listen(port, '0.0.0.0', async () => {
    log(`serving on port ${port}`);
    
    // Auto-start Flask Analyzer
    console.log('[INFO] Auto-starting Flask Analyzer...');
    try {
      await middlewareMonitor.startMiddleware('Flask Analyzer');
      console.log('[INFO] Flask Analyzer started successfully');
    } catch (error) {
      console.warn('[WARN] Failed to auto-start Flask Analyzer:', error);
    }
  });

  // Graceful shutdown handling
  const gracefulShutdown = async (signal: string) => {
    console.log(`[INFO] Received ${signal}, shutting down gracefully...`);
    
    try {
      // Stop Flask Analyzer
      console.log('[INFO] Stopping Flask Analyzer...');
      await middlewareMonitor.stopMiddleware('Flask Analyzer');
      console.log('[INFO] Flask Analyzer stopped');
    } catch (error) {
      console.warn('[WARN] Error stopping Flask Analyzer:', error);
    }
    
    // Close the server
    server.close(() => {
      console.log('[INFO] HTTP server closed');
      process.exit(0);
    });
  };

  // Listen for termination signals
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('[ERROR] Uncaught Exception:', error);
    gracefulShutdown('uncaughtException');
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    console.error('[ERROR] Unhandled Rejection at:', promise, 'reason:', reason);
    gracefulShutdown('unhandledRejection');
  });
})();
