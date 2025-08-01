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
- **Project Import System**: Added comprehensive project import from files or Git repositories with AI-powered analysis
- **Intelligent Project Analysis**: AI automatically detects project type, dependencies, and execution methods for any imported codebase
- **Smart Debugging Assistant**: AI can identify how to run programs and provide debugging assistance for various programming languages and frameworks
- **Documentation Generation**: Automatic generation of comprehensive project documentation including setup instructions, architecture analysis, and deployment guides
- **File System Integration**: AI can access and analyze project files directly, providing contextual responses based on actual code structure
- **Windows Optimization**: Complete Windows setup with PowerShell scripts, Supabase integration, and comprehensive development tools
- **Project Metadata System**: Implemented "insightsproject.ia" file system for persistent project context and metadata storage
- **Save Project Functionality**: Added save button for updating project insights including name, path, type, commands, and AI analysis results

# User Preferences

Preferred communication style: Simple, everyday language.
Target platform: Windows machines with PowerShell support
Database preference: Supabase (serverless PostgreSQL)
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

## AI Services
- **OpenAI GPT-4o**: Primary AI model for chat completions and code analysis
- **Google Gemini**: Alternative AI model for diversified responses
- **AI Features**: Chat interface, code suggestions, documentation generation, and data analysis

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