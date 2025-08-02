# Overview

LeviatanCode is a comprehensive web-based development environment that can run and debug various programming languages and frameworks (Vite, Node.js, Python, Java, etc.). It provides an IDE-like interface for importing, managing, and executing projects, enhanced with AI-powered assistance for program execution and debugging. Key capabilities include intelligent project analysis, automatic setup detection, AI-powered debugging, and comprehensive documentation generation. Users can import projects from files or Git repositories, and the AI automatically analyzes the codebase to determine optimal running and debugging strategies.

The system features production-ready components such as robust security middleware, secure session management, global error handling, and secure file upload mechanisms. It also includes an advanced agent system with interactive windows for terminal, file analysis, web preview, system monitoring, and database console, alongside a comprehensive Git management system.

# User Preferences

Preferred communication style: Simple, everyday language.
Target platform: Windows machines with Python and PowerShell support
Database preference: Supabase (serverless PostgreSQL)
Development port: 5000 (main app), 5001 (Flask analyzer)
Setup preference: Python scripts for better accuracy and reliability
Deployment target: Local Windows development with option for Windows Server production
Architecture preference: Dual-service setup with main app + Flask analyzer for comprehensive analysis
Theme implementation: Comprehensive light/dark mode for entire application (completed January 2025)

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite.
- **UI Library**: shadcn/ui components built on Radix UI primitives with Tailwind CSS.
- **State Management**: TanStack React Query for server state; in-memory client state.
- **Routing**: Wouter for lightweight client-side routing.
- **Styling**: Tailwind CSS with custom Replit-inspired dark theme and CSS variables.
- **Code Editor**: Monaco Editor integration.
- **UI/UX Decisions**: Modern professional design with glass morphism effects and smooth animations, adhering to a Replit-style dark theme.

## Backend Architecture
- **Framework**: Express.js with TypeScript running on Node.js.
- **Database ORM**: Drizzle with PostgreSQL dialect.
- **Storage Pattern**: Repository pattern with interface-based storage abstraction (currently in-memory with database schema ready).
- **API Design**: RESTful API with structured error handling and logging.
- **Development Server**: Vite integration for hot module replacement.
- **Security Middleware**: Helmet.js, rate limiting, CORS protection.
- **Session Management**: Express sessions with secure cookie handling.
- **Error Handling**: Global error handlers with detailed logging.
- **File Upload Security**: Multer with size and type restrictions.
- **Core Features**: Intelligent project analysis, automatic setup detection, AI-powered debugging assistance, and comprehensive documentation generation.
- **System Design**: Monorepo structure, comprehensive agent windows (Terminal, File Analysis, Web Preview, System Monitor, Database Console, Configuration), and a dedicated Git Management System.
- **Workspace Management**: WORKING_DIRECTORY-based workspace system with per-workspace configuration persistence.
- **Project Metadata System**: "insightsproject.ia" file system for persistent project context and metadata storage, used by AI for contextual responses.

## Data Storage Solutions
- **Primary Database**: PostgreSQL with Neon serverless hosting.
- **Schema Management**: Drizzle migrations.
- **Session Storage**: PostgreSQL sessions using connect-pg-simple.
- **File System**: Virtual file system stored as JSONB in the database for project files.
- **Credential Storage**: Secure credential management system (`vaultSecrets` table) with workspace-scoped, encrypted storage using Supabase backend.

## Theme System (January 2025)
- **ThemeProvider**: React context managing light/dark/auto theme modes with localStorage persistence
- **CSS Variables**: Comprehensive light and dark mode color schemes for entire application
- **Editor Integration**: Monaco Editor theme synchronization with app theme
- **Settings Controls**: Functional theme, font size, and tab size controls in LeviatanSettings
- **Auto Detection**: System preference detection for automatic theme switching

## UI Enhancements (January 2025)
- **Agent Tools Animation**: Subtle flowing border animation for active buttons matching chat interface style
- **Hover Effects**: Gentle green highlight with lift animation for improved user feedback
- **Visual Consistency**: Professional button interactions with Leviatan green (#22c55e) theming
- **Middleware Monitor**: Fully functional middleware configuration panel with real-time performance tracking

## Authentication and Authorization
- **User Management**: Username/password authentication with bcrypt hashing.
- **Session Management**: Express sessions with PostgreSQL store.
- **Authorization**: User-based resource isolation with demo user fallback.

# External Dependencies

## AI Services
- **OpenAI GPT-4o**: Primary AI model for chat completions and code analysis.
- **Google Gemini**: Alternative AI model for diversified responses.
- **AI Features**: Chat interface, code suggestions, documentation generation, data analysis.
- **Flask Analyzer**: A separate Python Flask web application (port 5001) serving a RESTful `/analyze` endpoint for AI-powered project analysis, supporting 15+ programming languages and 20+ frameworks.

## Database and Infrastructure
- **Neon Database**: Serverless PostgreSQL hosting.
- **Drizzle Kit**: Database schema management and migration tooling.
- **Supabase**: Backend for secure credential storage.

## UI and Development Libraries
- **Radix UI**: Headless component library for accessible UI primitives.
- **Tailwind CSS**: Utility-first CSS framework.
- **React Hook Form**: Form validation with Zod schema validation.
- **Lucide React**: Icon library.

## Development Tools
- **TypeScript**: Type safety across the stack.
- **Vite**: Fast development server and build tool.
- **ESBuild**: Fast bundling for server-side code.