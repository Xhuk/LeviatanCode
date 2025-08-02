import express, { type Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

// Load environment variables first
dotenv.config();

// Set NODE_ENV to development for proper middleware configuration
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development';
}

// Override PORT for Windows development - force 5005 for local Windows development
if (process.platform === 'win32' || process.env.NODE_ENV === 'development') {
  // Check if running locally (not in Replit) by checking for Windows platform or local dev indicators
  const isLocalDevelopment = process.platform === 'win32' || 
    (!process.env.REPLIT && !process.env.REPLIT_ID && !process.env.REPL_ID);
  
  if (isLocalDevelopment) {
    process.env.PORT = '5005';
    console.log('[INFO] Windows/Local development detected - using port 5005');
  }
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
  // Load and apply middleware
  try {
    const corsModule = await import("../middleware/cors.js");
    const securityModule = await import("../middleware/security.js");
    const sessionModule = await import("../middleware/session.js");
    const loggingModule = await import("../middleware/logging.js");
    const errorModule = await import("../middleware/errorHandler.js");

    // Apply CORS middleware
    app.use(corsModule.default);

    // Apply security middleware
    securityModule.default(app);

    // Apply logging middleware
    loggingModule.default(app);

    // Apply session middleware
    app.use(sessionModule.default);
    
    console.log("[INFO] All middleware loaded successfully");
  } catch (error) {
    console.warn("Some middleware failed to load:", error.message);
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
  // Default to 5005 for Windows development, fallback to 5000 for Replit
  const port = parseInt(process.env.PORT || '5005', 10);
  
  // Windows-compatible server configuration
  const listenOptions = {
    port,
    host: process.platform === 'win32' ? '127.0.0.1' : '0.0.0.0'
  };
  
  server.listen(listenOptions, () => {
    log(`serving on port ${port}`);
  });
})();
