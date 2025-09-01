# Overview

MyAiMediaMgr is an AI-powered social media management platform designed specifically for small businesses. The application enables users to create, schedule, approve, and publish content across multiple social media platforms (Instagram, Facebook, X/Twitter, TikTok, LinkedIn) from a single interface. The platform leverages AI assistance for content generation and includes sophisticated approval workflows, analytics tracking, and performance monitoring to streamline social media management operations.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client-side application is built using React with TypeScript, utilizing Vite as the build tool and development server. The architecture follows a component-based design with:
- **Routing**: Wouter for client-side routing with page-based navigation
- **State Management**: TanStack Query (React Query) for server state management and caching
- **UI Framework**: Shadcn/UI components built on Radix UI primitives with Tailwind CSS for styling
- **Form Handling**: React Hook Form with Zod validation schemas
- **Component Structure**: Organized into layout components (header, sidebar), content-specific components, and reusable UI components

### Backend Architecture
The server-side is implemented as an Express.js application with TypeScript, featuring:
- **API Design**: RESTful API endpoints organized in `/api` routes
- **Data Layer**: In-memory storage implementation with interfaces designed for easy database migration
- **Middleware**: Request logging, JSON parsing, and error handling middleware
- **Development Setup**: Vite integration for hot module replacement and development tooling

### Database Design
The application uses Drizzle ORM with PostgreSQL dialect, structured around five core entities:
- **Users**: User account information and business details
- **Platforms**: Connected social media platform configurations
- **Posts**: Content posts with status tracking, scheduling, and engagement data
- **AI Suggestions**: Generated content recommendations and metadata
- **Analytics**: Performance metrics and engagement tracking data

### Content Management System
The platform implements a sophisticated content lifecycle:
- **Creation**: AI-assisted content generation with platform-specific adaptations
- **Approval Workflow**: Multi-stage review process with approval/rejection capabilities
- **Scheduling**: Calendar-based scheduling with platform-specific timing optimization
- **Publishing**: Automated posting to connected social media platforms
- **Analytics**: Post-publication performance tracking and reporting

### AI Integration Architecture
The system incorporates AI capabilities for:
- **Content Generation**: AI-powered post creation with customizable tone and style
- **Platform Optimization**: Automatic content adaptation for different social media platforms
- **Performance Prediction**: Engagement forecasting and optimization suggestions
- **Hashtag Generation**: Automated relevant hashtag suggestions

## External Dependencies

### Core Framework Dependencies
- **React 18**: Frontend framework with modern hooks and concurrent features
- **Express.js**: Backend web application framework
- **TypeScript**: Type safety across both frontend and backend
- **Vite**: Build tool and development server with hot module replacement

### Database and ORM
- **Drizzle ORM**: Type-safe database toolkit with PostgreSQL support
- **@neondatabase/serverless**: Serverless PostgreSQL database connection
- **PostgreSQL**: Primary database system (configured via DATABASE_URL)

### UI and Styling
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Shadcn/UI**: Comprehensive component library built on Radix UI
- **Radix UI**: Accessible, unstyled UI primitives for complex components
- **Lucide React**: Icon library for consistent iconography

### State Management and Data Fetching
- **TanStack Query**: Server state management, caching, and synchronization
- **React Hook Form**: Form state management and validation
- **Zod**: Runtime type validation and schema definition

### Development and Build Tools
- **ESBuild**: Fast JavaScript bundler for production builds
- **PostCSS**: CSS processing with Autoprefixer for vendor prefixes
- **TSX**: TypeScript execution for development server

### Session and Storage
- **connect-pg-simple**: PostgreSQL session store for Express sessions
- **nanoid**: Unique ID generation for various entities

### Replit-Specific Integrations
- **@replit/vite-plugin-runtime-error-modal**: Development error overlay
- **@replit/vite-plugin-cartographer**: Development tooling integration