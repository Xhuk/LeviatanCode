import { Request, Response, NextFunction } from 'express';
import { contextService } from './contextService';
import { ActionType } from '../shared/context-schema';
import { nanoid } from 'nanoid';

// Extend Express Request to include context
declare global {
  namespace Express {
    interface Request {
      contextSession?: string;
      userId?: string;
      projectId?: string;
    }
  }
}

export class ContextMiddleware {
  // Initialize session for request
  static initializeContext = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Extract user and project info from request
      const userId = req.user?.claims?.sub || 'demo-user';
      const projectId = req.headers['x-project-id'] as string || 
                       req.body?.projectId || 
                       req.query?.projectId as string || 
                       'demo-project-1';

      // Get or create session
      let sessionId = req.headers['x-session-id'] as string;
      if (!sessionId) {
        sessionId = await contextService.startSession(projectId, userId);
      }

      // Attach to request
      req.contextSession = sessionId;
      req.userId = userId;
      req.projectId = projectId;

      next();
    } catch (error) {
      console.error('Context middleware error:', error);
      next(); // Continue without context tracking
    }
  };

  // Log actions based on route patterns
  static trackAction = (actionType: ActionType, getDescription?: (req: Request) => string) => {
    return async (req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();
      
      // Store original send method
      const originalSend = res.send;
      let responseData: any = null;
      let success = true;

      // Override send to capture response
      res.send = function(data: any) {
        responseData = data;
        return originalSend.call(this, data);
      } as any;

      // Override error handling
      const originalStatus = res.status;
      res.status = function(code: number) {
        if (code >= 400) {
          success = false;
        }
        return originalStatus.call(this, code);
      } as any;

      // Continue with original request
      res.on('finish', async () => {
        try {
          if (req.contextSession && req.userId && req.projectId) {
            const description = getDescription ? getDescription(req) : `${actionType} operation`;
            
            await contextService.logAction({
              sessionId: req.contextSession,
              projectId: req.projectId,
              userId: req.userId,
              type: actionType,
              description,
              data: {
                method: req.method,
                path: req.path,
                query: req.query,
                body: req.body,
                headers: req.headers,
                statusCode: res.statusCode,
                duration: Date.now() - startTime,
              },
              filePath: req.body?.filePath || req.query?.filePath as string,
              beforeState: req.body?.beforeState,
              afterState: responseData,
            });
          }
        } catch (error) {
          console.error('Failed to track action:', error);
        }
      });

      next();
    };
  };

  // Specific action trackers
  static trackFileEdit = ContextMiddleware.trackAction(
    ActionType.FILE_EDIT,
    (req) => `Edited file: ${req.body?.filePath || 'unknown'}`
  );

  static trackFileCreate = ContextMiddleware.trackAction(
    ActionType.FILE_CREATE,
    (req) => `Created file: ${req.body?.filePath || 'unknown'}`
  );

  static trackCommandExecution = ContextMiddleware.trackAction(
    ActionType.COMMAND_EXECUTE,
    (req) => `Executed command: ${req.body?.command || 'unknown'}`
  );

  static trackGitOperation = ContextMiddleware.trackAction(
    ActionType.GIT_OPERATION,
    (req) => `Git operation: ${req.body?.operation || req.path}`
  );

  static trackAIInteraction = ContextMiddleware.trackAction(
    ActionType.AI_INTERACTION,
    (req) => `AI chat: ${req.body?.message?.substring(0, 50) || 'interaction'}`
  );

  static trackAgentExecution = ContextMiddleware.trackAction(
    ActionType.AGENT_EXECUTION,
    (req) => `Agent task: ${req.body?.messages?.[req.body.messages.length - 1]?.content?.substring(0, 50) || 'execution'}`
  );

  static trackConfiguration = ContextMiddleware.trackAction(
    ActionType.CONFIGURATION_CHANGE,
    (req) => `Configuration change: ${req.path}`
  );
}

// Helper function to generate session ID for frontend
export function generateSessionId(): string {
  return nanoid();
}