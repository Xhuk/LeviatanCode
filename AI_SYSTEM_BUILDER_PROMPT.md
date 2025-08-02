# LeviatanCode AI System Builder Prompt

## For ChatGPT or Gemini: Build Complete Development Environment

You are tasked with building LeviatanCode - a comprehensive AI-powered development environment that can run and debug any type of program. This system provides intelligent project analysis, automatic setup detection, AI-powered debugging assistance, and comprehensive documentation generation.

### System Architecture Overview
- **Frontend**: React TypeScript with shadcn/ui components, Vite build system
- **Backend**: Express.js with comprehensive middleware stack (security, sessions, rate limiting)
- **Database**: PostgreSQL with Drizzle ORM for type-safe operations
- **AI Integration**: Multiple AI services (OpenAI GPT-4o, Google Gemini) for code analysis and chat
- **File System**: Virtual file system with project import/export capabilities
- **Real-time**: WebSocket connections for live updates and progress tracking

### Core Features to Implement

#### 1. Project Management System
```typescript
// Project structure with virtual file system
interface Project {
  id: string;
  name: string;
  type: 'web' | 'api' | 'desktop' | 'mobile' | 'library';
  files: VirtualFileSystem;
  insights: ProjectInsights;
  technologies: string[];
}
```

#### 2. AI-Powered Analysis Engine
- **Technology Detection**: Automatically identify 50+ programming languages and frameworks
- **Dependency Analysis**: Parse all major package managers (npm, pip, cargo, maven, etc.)
- **Project Classification**: Determine project type and architecture patterns
- **Quality Metrics**: Calculate code quality scores and complexity metrics
- **Security Assessment**: Identify potential security issues and vulnerabilities

#### 3. Comprehensive Metadata System
- **File-by-File Analysis**: Generate detailed metadata for every source file
- **Dependency Mapping**: Track all imports, exports, and relationships
- **Object Intent Analysis**: Document classes, functions, and their purposes
- **AI Debugging Context**: Provide complete context for AI debugging assistance

#### 4. Development Environment Features
- **File Explorer**: Tree view with project navigation and file management
- **Code Editor**: Monaco Editor integration with syntax highlighting
- **AI Chat Panel**: Context-aware conversations about code and projects
- **Terminal**: Interactive command execution and output display
- **Documentation Panel**: Auto-generated project documentation

#### 5. Intelligent Setup Detection
- **Run Commands**: Automatically detect how to start applications (npm run dev, python main.py, etc.)
- **Build Systems**: Identify and configure build tools (Webpack, Vite, Maven, etc.)
- **Environment Setup**: Generate setup instructions and dependency installation commands
- **Platform Support**: Windows, macOS, and Linux compatibility

### Technical Implementation Requirements

#### Database Schema (PostgreSQL with Drizzle)
```typescript
// Core tables for project management
export const projects = pgTable('projects', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  projectType: text('project_type'),
  technologies: jsonb('technologies').$type<string[]>(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const files = pgTable('files', {
  id: text('id').primaryKey(),
  projectId: text('project_id').references(() => projects.id),
  path: text('path').notNull(),
  content: text('content'),
  size: integer('size'),
  lastModified: timestamp('last_modified'),
});

export const aiChats = pgTable('ai_chats', {
  id: text('id').primaryKey(),
  projectId: text('project_id').references(() => projects.id),
  role: text('role').notNull(), // 'user' | 'assistant'
  content: text('content').notNull(),
  timestamp: timestamp('timestamp').defaultNow(),
});
```

#### AI Integration Architecture
```typescript
// Multi-AI service support
interface AIService {
  name: 'openai' | 'gemini';
  apiKey: string;
  model: string;
  generateResponse(prompt: string, context: ProjectContext): Promise<string>;
  analyzeCode(code: string, language: string): Promise<CodeAnalysis>;
}

// Project context for AI
interface ProjectContext {
  name: string;
  type: string;
  technologies: string[];
  fileStructure: FileNode[];
  dependencies: DependencyMap;
  insights: ProjectInsights;
}
```

#### Comprehensive Analysis System
```python
# Python analyzer for deep project analysis
class ComprehensiveProjectAnalyzer:
    def __init__(self, project_path: str, api_key: str = None):
        self.project_path = Path(project_path)
        self.api_key = api_key
        
    def run_comprehensive_analysis(self):
        # 1. File system scanning with smart filtering
        # 2. Technology detection using 50+ patterns
        # 3. Dependency analysis for all package managers
        # 4. Git repository analysis
        # 5. Code quality metrics calculation
        # 6. AI-powered insights generation
        # 7. insightsproject.ia file creation
```

### Metadata System Implementation
Each source file should have a corresponding metadata file that provides:
- **Purpose**: What the file does and why it exists
- **Dependencies**: All imports, exports, and relationships  
- **Object Intent**: The intention behind classes, functions, and variables
- **Architecture Context**: How the file fits into the overall system
- **Debugging Information**: Common issues and troubleshooting tips
- **AI Insights**: Specific guidance for AI systems working with this code

### Security and Production Features
- **Helmet.js**: Security headers and protection
- **Rate Limiting**: Prevent API abuse and DDoS attacks
- **Session Management**: Secure user sessions with PostgreSQL storage
- **CORS Protection**: Cross-origin request security
- **Input Validation**: Zod schemas for all API endpoints
- **File Upload Security**: Size limits, type validation, and sanitization

### API Requirements (No Local LLM Needed)
The system uses cloud-based AI services:
- **OpenAI API**: GPT-4o for advanced code analysis and chat
- **Google Gemini API**: Alternative AI service for diversified responses
- **API Key Management**: Secure storage and rotation of API credentials

### File Structure to Build
```
leviatancode/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utility functions
│   │   └── pages/         # Application pages
├── server/                # Express.js backend
│   ├── routes/           # API route handlers
│   ├── services/         # Business logic
│   └── middleware/       # Express middleware
├── shared/               # Shared TypeScript schemas
├── scripts/              # Python analysis scripts
├── metadata/             # Auto-generated file metadata
└── migrations/           # Database migrations
```

### Key Implementation Steps

1. **Setup Project Structure**: Create the monorepo structure with proper TypeScript configuration
2. **Database Setup**: Configure PostgreSQL with Drizzle ORM and create all necessary tables
3. **Security Middleware**: Implement comprehensive security stack (Helmet, CORS, rate limiting)
4. **File System**: Build virtual file system with project import/export capabilities
5. **AI Integration**: Connect to OpenAI and Gemini APIs with proper error handling
6. **Analysis Engine**: Create Python scripts for comprehensive project analysis
7. **Frontend Components**: Build React components for file explorer, editor, chat, etc.
8. **WebSocket System**: Implement real-time updates for analysis progress
9. **Metadata Generation**: Create automated metadata system for AI debugging context
10. **Testing & Documentation**: Comprehensive testing and documentation generation

### Environment Variables Required
```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/leviatancode

# AI Services (cloud-based, no local LLM needed)
OPENAI_API_KEY=your_openai_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here

# Application
NODE_ENV=development
PORT=5000
SESSION_SECRET=your_session_secret_here
```

### Success Criteria
- Import any project (ZIP, Git repo) and automatically analyze it
- Detect technologies, dependencies, and project structure
- Generate comprehensive project insights and documentation
- Provide AI-powered chat assistance with full project context
- Support multiple programming languages and frameworks
- Run on Windows, macOS, and Linux without local AI installation
- Production-ready security and error handling
- Real-time progress updates and WebSocket communication

### Additional Context
This system should work entirely with cloud AI services - no local LLM installation required. Users only need API keys for OpenAI and/or Gemini. The comprehensive metadata system enables any AI to become an expert at debugging the imported projects from scratch.

Build this as a complete, production-ready development environment that can handle any type of software project with intelligent AI assistance.