import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { pgTable, text, timestamp, jsonb, boolean, integer, uuid } from "drizzle-orm/pg-core";

// Action Types enum for categorizing user actions
export enum ActionType {
  FILE_EDIT = 'file_edit',
  FILE_CREATE = 'file_create',
  FILE_DELETE = 'file_delete',
  FILE_MOVE = 'file_move',
  COMMAND_EXECUTE = 'command_execute',
  GIT_OPERATION = 'git_operation',
  AI_INTERACTION = 'ai_interaction',
  AGENT_EXECUTION = 'agent_execution',
  PROJECT_SETUP = 'project_setup',
  CONFIGURATION_CHANGE = 'configuration_change',
  WORKSPACE_CHANGE = 'workspace_change',
  DEBUG_SESSION = 'debug_session',
  TEST_RUN = 'test_run',
  BUILD_OPERATION = 'build_operation'
}

// Context State enum for tracking current project state
export enum ContextState {
  INITIALIZING = 'initializing',
  CODING = 'coding',
  DEBUGGING = 'debugging',
  TESTING = 'testing',
  BUILDING = 'building',
  DEPLOYING = 'deploying',
  GIT_OPERATIONS = 'git_operations',
  AI_ASSISTED = 'ai_assisted',
  IDLE = 'idle',
  ERROR = 'error'
}

// Action Log Table
export const actionLogs = pgTable('action_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: text('session_id').notNull(),
  projectId: text('project_id').notNull(),
  userId: text('user_id').notNull(),
  actionType: text('action_type').notNull(),
  actionDescription: text('action_description').notNull(),
  actionData: jsonb('action_data'), // Store additional action context
  filePath: text('file_path'), // Affected file if applicable
  beforeState: jsonb('before_state'), // State before action
  afterState: jsonb('after_state'), // State after action
  success: boolean('success').notNull().default(true),
  errorMessage: text('error_message'),
  duration: integer('duration'), // Action duration in ms
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});

// Context State Table - tracks current project state
export const contextStates = pgTable('context_states', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: text('project_id').notNull().unique(),
  currentState: text('current_state').notNull(),
  previousState: text('previous_state'),
  stateData: jsonb('state_data'), // Additional state context
  activeFiles: jsonb('active_files'), // Currently open/modified files
  lastActivity: timestamp('last_activity').defaultNow().notNull(),
  sessionContext: jsonb('session_context'), // Current session info
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Session Context Table - tracks user sessions
export const sessionContexts = pgTable('session_contexts', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: text('session_id').notNull().unique(),
  projectId: text('project_id').notNull(),
  userId: text('user_id').notNull(),
  startTime: timestamp('start_time').defaultNow().notNull(),
  endTime: timestamp('end_time'),
  totalActions: integer('total_actions').default(0),
  sessionGoal: text('session_goal'), // What user is trying to accomplish
  achievements: jsonb('achievements'), // What was accomplished
  isActive: boolean('is_active').default(true),
});

// Action Log Insert Schema
export const insertActionLogSchema = createInsertSchema(actionLogs).omit({
  id: true,
  timestamp: true,
});

// Context State Insert Schema
export const insertContextStateSchema = createInsertSchema(contextStates).omit({
  id: true,
  lastActivity: true,
  updatedAt: true,
});

// Session Context Insert Schema
export const insertSessionContextSchema = createInsertSchema(sessionContexts).omit({
  id: true,
  startTime: true,
});

// Types
export type ActionLog = typeof actionLogs.$inferSelect;
export type InsertActionLog = z.infer<typeof insertActionLogSchema>;

export type ContextStateRecord = typeof contextStates.$inferSelect;
export type InsertContextStateRecord = z.infer<typeof insertContextStateSchema>;

export type SessionContext = typeof sessionContexts.$inferSelect;
export type InsertSessionContext = z.infer<typeof insertSessionContextSchema>;

// Action Context Interface for tracking action details
export interface ActionContext {
  sessionId: string;
  projectId: string;
  userId: string;
  type: ActionType;
  description: string;
  data?: any;
  filePath?: string;
  beforeState?: any;
  afterState?: any;
}

// State Transition Interface
export interface StateTransition {
  projectId: string;
  fromState: ContextState;
  toState: ContextState;
  trigger: string;
  context?: any;
}