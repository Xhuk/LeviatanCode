# Overview

DataScraper Pro is a full-stack web application for data scraping and analysis with AI-powered features. The application provides a web-based IDE-like interface for creating, managing, and executing web scraping projects. Users can build scraping configurations, run scraping jobs, analyze collected data with AI assistance, and generate documentation automatically.

The system is built as a monorepo with a React TypeScript frontend using shadcn/ui components, an Express.js backend, and PostgreSQL database with Drizzle ORM. The application features a Replit-style dark theme and integrates multiple AI models for intelligent data analysis and code assistance.

## Recent Updates (January 2025)

- **Prompt Management System**: Added comprehensive prompt template management with categorization, variable substitution, AI-powered prompt refinement, and integration with AI chat functionality
- **Enhanced AI Chat Interface**: Integrated prompt templates directly into the chat interface with quick selection and variable input dialogs  
- **File System Integration**: AI can now access and analyze project files directly, providing contextual responses based on actual code and file structure
- **Tabbed Interface**: Reorganized right-side panels into a tabbed interface (AI Chat, Prompts, Documentation) for better space utilization

# User Preferences

Preferred communication style: Simple, everyday language.

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

## Web Scraping
- **Axios**: HTTP client for web requests with custom headers and timeout handling
- **Cheerio**: Server-side jQuery-like HTML parsing and data extraction
- **Configurable Scraping**: Dynamic selector-based data extraction with multiple data point types

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