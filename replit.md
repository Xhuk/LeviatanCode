# Overview

LeviatanCode is a comprehensive web-based development environment that can run and debug any type of program (Vite, Node.js, Python, Java, etc.). The application provides an IDE-like interface for importing, managing, and executing projects with AI-powered assistance for identifying how to run programs and debugging issues.

The system features intelligent project analysis, automatic setup detection, AI-powered debugging assistance, and comprehensive documentation generation. Users can import projects from files or Git repositories, and the AI automatically analyzes the codebase to determine the best way to run and debug the application.

The system is built as a monorepo with a React TypeScript frontend using shadcn/ui components, an Express.js backend with comprehensive middleware stack, and PostgreSQL database with Drizzle ORM. The application features a Replit-style dark theme and integrates multiple AI models for intelligent code analysis, execution guidance, and debugging assistance.

## Production-Ready Features
- **Security Middleware**: Helmet.js, rate limiting, CORS protection
- **Session Management**: Express sessions with secure cookie handling  
- **Error Handling**: Global error handlers with detailed logging
- **File Upload Security**: Multer with size and type restrictions
- **Windows Compatibility**: Complete PowerShell setup scripts and documentation

## Recent Updates (January 2025)

- **Universal Development Environment**: Transformed from data scraping focus to general-purpose development environment supporting any programming language and framework
- **Project Import System**: Added comprehensive project import from files or Git repositories with AI-powered analysis and automatic insightsproject.ia generation
- **Intelligent Project Analysis**: AI automatically detects project type, dependencies, and execution methods for any imported codebase with persistent storage of results
- **Smart Debugging Assistant**: AI can identify how to run programs and provide debugging assistance for various programming languages and frameworks
- **Documentation Generation**: Automatic generation of comprehensive project documentation including setup instructions, architecture analysis, and deployment guides
- **File System Integration**: AI can access and analyze project files directly, providing contextual responses based on actual code structure
- **Windows Optimization**: Complete Windows setup with PowerShell scripts, Supabase integration, and comprehensive development tools
- **Project Metadata System**: Implemented "insightsproject.ia" file system for persistent project context and metadata storage with comprehensive AI analysis results
- **Save Project Functionality**: Added save button for updating project insights including name, path, type, commands, and AI analysis results
- **InsightsFileService**: Complete service for reading, writing, and managing insightsproject.ia files with version control and change tracking
- **AI Context Provision**: AI assistants can now access full project context from insightsproject.ia files including technologies, insights, recommendations, and project history
- **Complete Windows Setup**: Created comprehensive PowerShell setup script that configures database, API keys, middleware, and all integrations automatically
- **Production-Ready Security**: Implemented complete middleware stack with rate limiting, session management, CORS, and security headers  
- **Real AI Integration**: Added actual OpenAI and Gemini integration with project analysis and chat capabilities (requires API keys)
- **Python-Based Setup**: Converted setup scripts to Python for better accuracy, error handling, and cross-platform compatibility
- **Port 5005 Configuration**: Configured Windows development environment to use port 5005 with `npm run windev` command
- **Comprehensive Validation**: Added setup validation scripts to verify all components are working correctly
- **Windows Networking Fix**: Resolved Windows socket binding issues with localhost configuration and automatic platform detection  
- **Application Successfully Running**: LeviatanCode interface fully functional with project import dialog, file upload, and AI chat capabilities working
- **Middleware Production Deployment**: Complete middleware stack deployed with CORS, security headers, rate limiting, session management, and error handling
- **File Upload Fix**: Resolved HTTP method error in project import functionality - file uploads now working correctly
- **ZIP File Support**: Added automatic ZIP decompression with intelligent file filtering - imports ZIP archives and extracts only relevant source code files
- **Enhanced File Handling**: Improved large file management with 50MB limits, smart filtering of build directories, and automatic detection of code files vs binary assets
- **insightsproject.ia Files**: Implemented persistent AI context system through insightsproject.ia files that store comprehensive project analysis results for AI consumption
- **AI Context Integration**: AI chat system now reads insightsproject.ia files to provide contextual assistance with project history and analysis
- **Analysis Caching**: Analysis results are cached for 24 hours in insightsproject.ia files to avoid redundant processing while maintaining fresh insights
- **WebSocket Progress Tracking**: Real-time progress updates for analysis including when existing insights are loaded and when new insights are saved
- **Seeded Comprehensive Analyzer**: Created comprehensive Python analyzer in /scripts folder that runs complete project analysis and generates insightsproject.ia files with all required data
- **Fixed Path Resolution**: All analysis outputs (insightsproject.ia, Python scripts, README files) now correctly target specific project subdirectories instead of parent directories
- **Comprehensive Metadata System**: Created complete metadata folder mirroring app architecture with detailed .md analysis files for each of 315 project components
- **Automated Metadata Generator**: Built Python script that creates file-by-file analysis with dependency maps, object intent analysis, and complete metadata for AI debugging assistance

# User Preferences

Preferred communication style: Simple, everyday language.
Target platform: Windows machines with Python and PowerShell support
Database preference: Supabase (serverless PostgreSQL)
Development port: 5005 (configured for Windows with npm run windev)
Setup preference: Python scripts for better accuracy and reliability
Deployment target: Local Windows development with option for Windows Server production

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for development/build tooling
- **UI Library**: shadcn/ui components built on Radix UI primitives with Tailwind CSS
- **State Management**: TanStack React Query for server state with in-memory client state
- **Routing**: Wouter for lightweight client-side routing
- **Styling**: Tailwind CSS with custom Replit-inspired dark theme and CSS variables
- **Code Editor**: Monaco Editor integration for syntax highlighting and code editing

## Backend Architecture
- **Framework**: Express.js with TypeScript running on Node.js
- **Database ORM**: Drizzle with PostgreSQL dialect for type-safe database operations
- **Storage Pattern**: Repository pattern with interface-based storage abstraction (currently in-memory implementation with database schema ready)
- **API Design**: RESTful API with structured error handling and request/response logging
- **Development Server**: Vite integration for hot module replacement in development

## Data Storage Solutions
- **Primary Database**: PostgreSQL with Neon serverless hosting
- **Schema Management**: Drizzle migrations with schema defined in shared TypeScript
- **Session Storage**: PostgreSQL sessions using connect-pg-simple
- **File System**: Virtual file system stored as JSONB in database for project files

## Authentication and Authorization
- **User Management**: Username/password authentication with bcrypt hashing
- **Session Management**: Express sessions with PostgreSQL store
- **Authorization**: User-based resource isolation with demo user fallback

# External Dependencies

## AI Services (Cloud-Based - No Local LLM Required)
- **OpenAI GPT-4o**: Primary AI model for chat completions and code analysis via API
- **Google Gemini**: Alternative AI model for diversified responses via API  
- **AI Features**: Chat interface, code suggestions, documentation generation, and data analysis
- **Setup**: Only requires API keys, no local AI installation needed

## Database and Infrastructure
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Drizzle Kit**: Database schema management and migration tooling

## Development Environment
- **Multi-Language Support**: Support for JavaScript, TypeScript, Python, Java, C++, and other programming languages
- **Project Import**: File upload and Git repository import with automatic project structure analysis
- **Intelligent Execution**: AI-powered detection of how to run different types of projects (npm run dev, python main.py, etc.)
- **Debug Assistant**: AI-powered debugging guidance and error resolution for various programming languages
- **Project Metadata**: insightsproject.ia file system for storing project context, configuration, and AI analysis results
- **Save Functionality**: Persistent project information storage with manual save capability for updating project insights

## UI and Development
- **Radix UI**: Headless component library for accessible UI primitives
- **Tailwind CSS**: Utility-first CSS framework with custom design system
- **React Hook Form**: Form validation with Zod schema validation
- **Lucide React**: Icon library for consistent iconography

## Development Tools
- **TypeScript**: Type safety across frontend, backend, and shared code
- **Vite**: Fast development server with hot reload and production builds
- **ESBuild**: Fast bundling for server-side code compilation
- **Replit Integration**: Development environment compatibility with Replit-specific tooling