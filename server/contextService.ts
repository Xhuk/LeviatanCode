import { db } from './db';
import { 
  actionLogs, 
  contextStates, 
  sessionContexts,
  ActionType,
  ContextState as ContextStateEnum,
  type ActionContext,
  type StateTransition,
  type InsertActionLog,
  type InsertContextStateRecord,
  type InsertSessionContext
} from '../shared/context-schema';
import { eq, desc, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export class ContextService {
  // Session Management
  async startSession(projectId: string, userId: string, goal?: string): Promise<string> {
    const sessionId = nanoid();
    
    try {
      await db.insert(sessionContexts).values({
        sessionId,
        projectId,
        userId,
        sessionGoal: goal,
        totalActions: 0,
        isActive: true,
      });

      return sessionId;
    } catch (error) {
      console.error('Failed to start session:', error);
      return sessionId; // Return sessionId even if DB fails for graceful degradation
    }
  }

  async endSession(sessionId: string, achievements?: string[]): Promise<void> {
    try {
      await db
        .update(sessionContexts)
        .set({
          endTime: new Date(),
          achievements: achievements || [],
          isActive: false,
        })
        .where(eq(sessionContexts.sessionId, sessionId));
    } catch (error) {
      console.error('Failed to end session:', error);
    }
  }

  // Action Logging
  async logAction(context: ActionContext): Promise<void> {
    const startTime = Date.now();
    
    try {
      const actionData: InsertActionLog = {
        sessionId: context.sessionId,
        projectId: context.projectId,
        userId: context.userId,
        actionType: context.type,
        actionDescription: context.description,
        actionData: context.data || {},
        filePath: context.filePath,
        beforeState: context.beforeState,
        afterState: context.afterState,
        success: true,
        duration: Date.now() - startTime,
      };

      await db.insert(actionLogs).values(actionData);

      // Update session action count
      await this.incrementSessionActions(context.sessionId);

      // Update project state based on action
      await this.updateProjectStateFromAction(context);

    } catch (error) {
      console.error('Failed to log action:', error);
      // Log the failure
      try {
        await db.insert(actionLogs).values({
          sessionId: context.sessionId,
          projectId: context.projectId,
          userId: context.userId,
          actionType: context.type,
          actionDescription: context.description,
          success: false,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          duration: Date.now() - startTime,
        });
      } catch (logError) {
        console.error('Failed to log action failure:', logError);
      }
    }
  }

  // State Management
  async updateProjectState(transition: StateTransition): Promise<void> {
    try {
      const existing = await db
        .select()
        .from(contextStates)
        .where(eq(contextStates.projectId, transition.projectId))
        .limit(1);

      const stateData = {
        projectId: transition.projectId,
        currentState: transition.toState,
        previousState: transition.fromState,
        stateData: {
          trigger: transition.trigger,
          context: transition.context,
          timestamp: new Date().toISOString(),
        },
        updatedAt: new Date(),
      };

      if (existing.length > 0) {
        await db
          .update(contextStates)
          .set(stateData)
          .where(eq(contextStates.projectId, transition.projectId));
      } else {
        await db.insert(contextStates).values(stateData);
      }
    } catch (error) {
      console.error('Failed to update project state:', error);
    }
  }

  async getCurrentState(projectId: string): Promise<ContextStateEnum | null> {
    try {
      const state = await db
        .select()
        .from(contextStates)
        .where(eq(contextStates.projectId, projectId))
        .limit(1);

      return state.length > 0 ? state[0].currentState as ContextStateEnum : null;
    } catch (error) {
      console.error('Failed to get current state:', error);
      return null;
    }
  }

  // Action History
  async getActionHistory(projectId: string, limit: number = 50): Promise<any[]> {
    try {
      const actions = await db
        .select()
        .from(actionLogs)
        .where(eq(actionLogs.projectId, projectId))
        .orderBy(desc(actionLogs.timestamp))
        .limit(limit);

      return actions;
    } catch (error) {
      console.error('Failed to get action history:', error);
      return [];
    }
  }

  async getSessionHistory(sessionId: string): Promise<any[]> {
    try {
      const actions = await db
        .select()
        .from(actionLogs)
        .where(eq(actionLogs.sessionId, sessionId))
        .orderBy(desc(actionLogs.timestamp));

      return actions;
    } catch (error) {
      console.error('Failed to get session history:', error);
      return [];
    }
  }

  // Context Analysis
  async analyzeProjectContext(projectId: string): Promise<any> {
    try {
      const [currentState, recentActions, sessionData] = await Promise.all([
        this.getCurrentState(projectId),
        this.getActionHistory(projectId, 20),
        this.getActiveSession(projectId)
      ]);

      const actionTypes = recentActions.reduce((acc, action) => {
        acc[action.actionType] = (acc[action.actionType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const mostCommonAction = Object.entries(actionTypes)
        .sort(([, a], [, b]) => b - a)[0]?.[0];

      const context = {
        currentState,
        totalRecentActions: recentActions.length,
        mostCommonAction,
        actionBreakdown: actionTypes,
        lastActivity: recentActions[0]?.timestamp,
        sessionInfo: sessionData,
        recommendedState: this.recommendState(actionTypes, currentState),
      };

      return context;
    } catch (error) {
      console.error('Failed to analyze project context:', error);
      return null;
    }
  }

  // Private helper methods
  private async incrementSessionActions(sessionId: string): Promise<void> {
    try {
      await db
        .update(sessionContexts)
        .set({
          totalActions: db.raw('total_actions + 1'),
        })
        .where(eq(sessionContexts.sessionId, sessionId));
    } catch (error) {
      console.error('Failed to increment session actions:', error);
    }
  }

  private async updateProjectStateFromAction(context: ActionContext): Promise<void> {
    const currentState = await this.getCurrentState(context.projectId);
    const newState = this.inferStateFromAction(context.type, currentState);

    if (newState && newState !== currentState) {
      await this.updateProjectState({
        projectId: context.projectId,
        fromState: currentState || ContextStateEnum.IDLE,
        toState: newState,
        trigger: `action:${context.type}`,
        context: { action: context.description },
      });
    }
  }

  private inferStateFromAction(actionType: ActionType, currentState: ContextStateEnum | null): ContextStateEnum | null {
    const stateMap: Record<ActionType, ContextStateEnum> = {
      [ActionType.FILE_EDIT]: ContextStateEnum.CODING,
      [ActionType.FILE_CREATE]: ContextStateEnum.CODING,
      [ActionType.FILE_DELETE]: ContextStateEnum.CODING,
      [ActionType.FILE_MOVE]: ContextStateEnum.CODING,
      [ActionType.COMMAND_EXECUTE]: ContextStateEnum.TESTING,
      [ActionType.GIT_OPERATION]: ContextStateEnum.GIT_OPERATIONS,
      [ActionType.AI_INTERACTION]: ContextStateEnum.AI_ASSISTED,
      [ActionType.AGENT_EXECUTION]: ContextStateEnum.AI_ASSISTED,
      [ActionType.PROJECT_SETUP]: ContextStateEnum.INITIALIZING,
      [ActionType.CONFIGURATION_CHANGE]: ContextStateEnum.INITIALIZING,
      [ActionType.WORKSPACE_CHANGE]: ContextStateEnum.INITIALIZING,
      [ActionType.DEBUG_SESSION]: ContextStateEnum.DEBUGGING,
      [ActionType.TEST_RUN]: ContextStateEnum.TESTING,
      [ActionType.BUILD_OPERATION]: ContextStateEnum.BUILDING,
    };

    return stateMap[actionType] || null;
  }

  private recommendState(actionTypes: Record<string, number>, currentState: ContextStateEnum | null): ContextStateEnum {
    // Simple recommendation logic based on recent actions
    if (actionTypes[ActionType.DEBUG_SESSION] > 0) return ContextStateEnum.DEBUGGING;
    if (actionTypes[ActionType.TEST_RUN] > 0) return ContextStateEnum.TESTING;
    if (actionTypes[ActionType.GIT_OPERATION] > 0) return ContextStateEnum.GIT_OPERATIONS;
    if (actionTypes[ActionType.AI_INTERACTION] > 0 || actionTypes[ActionType.AGENT_EXECUTION] > 0) {
      return ContextStateEnum.AI_ASSISTED;
    }
    if (actionTypes[ActionType.FILE_EDIT] > 0 || actionTypes[ActionType.FILE_CREATE] > 0) {
      return ContextStateEnum.CODING;
    }
    
    return currentState || ContextStateEnum.IDLE;
  }

  private async getActiveSession(projectId: string): Promise<any> {
    try {
      const session = await db
        .select()
        .from(sessionContexts)
        .where(and(
          eq(sessionContexts.projectId, projectId),
          eq(sessionContexts.isActive, true)
        ))
        .limit(1);

      return session.length > 0 ? session[0] : null;
    } catch (error) {
      console.error('Failed to get active session:', error);
      return null;
    }
  }
}

export const contextService = new ContextService();