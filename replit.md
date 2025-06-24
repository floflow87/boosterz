# Trading Card Collection Manager

## Overview
This is a sophisticated web application for managing trading card collections with dynamic portfolio tracking and immersive social interactions. The application is designed specifically for sports card collectors, featuring a Captain Tsubasa theme and supporting multiple collection types including Score Ligue 1 2023/24 cards.

## System Architecture

The application follows a modern full-stack architecture with clear separation between client and server components:

### Frontend Architecture
- **Framework**: React with TypeScript for type safety
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query for server state management and caching
- **Styling**: Tailwind CSS with custom theming and CSS custom properties
- **Build Tool**: Vite for fast development and optimized production builds
- **Component Library**: Radix UI primitives with shadcn/ui components

### Backend Architecture
- **Runtime**: Node.js with Express server
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Authentication**: JWT-based authentication with bcrypt for password hashing
- **Real-time Features**: WebSocket support for live chat functionality
- **API Design**: RESTful APIs with structured error handling

## Key Components

### Authentication System
- JWT token-based authentication with secure session management
- Password hashing using bcrypt with configurable salt rounds
- Protected routes with middleware authentication
- User registration and login with comprehensive validation

### Collection Management
- Multi-collection support with individual tracking
- Card ownership status tracking (owned/missing)
- Bulk operations for updating multiple cards
- Advanced filtering and search capabilities
- Image upload and card recognition features

### Social Features
- Real-time messaging system with conversation persistence
- User profiles with follow/unfollow functionality
- Activity feeds and social interactions
- Community features with user discovery

### Card Recognition
- AI-powered card recognition from uploaded photos
- Automatic player and team name extraction
- Smart matching with existing card database
- Manual override capabilities for accuracy

### Trading System
- Card trading functionality between users
- Marketplace features for buying/selling
- Trade request management
- Price tracking and valuation

## Data Flow

### Client-Server Communication
1. **API Requests**: All client requests go through the `/api` prefix
2. **Authentication**: JWT tokens sent via HTTP headers
3. **Real-time Updates**: WebSocket connections for chat and notifications
4. **File Uploads**: Base64 encoded images for card photos

### Database Operations
1. **User Management**: User creation, authentication, and profile updates
2. **Collection Tracking**: Card ownership and collection completion percentages
3. **Social Interactions**: Messages, conversations, and user relationships
4. **Activity Logging**: User actions for feeds and notifications

### State Management
- **Server State**: TanStack Query handles API calls and caching
- **Local State**: React hooks for component-level state
- **Persistent Storage**: localStorage for authentication tokens and user preferences

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Neon PostgreSQL database connection
- **drizzle-orm**: Type-safe ORM for database operations
- **@anthropic-ai/sdk**: AI integration for card recognition
- **@radix-ui/***: UI component primitives
- **@tanstack/react-query**: Server state management
- **bcryptjs**: Password hashing
- **jsonwebtoken**: JWT token management

### Development Tools
- **TypeScript**: Type safety across the entire codebase
- **Vite**: Fast development server and build tool
- **Tailwind CSS**: Utility-first CSS framework
- **ESBuild**: Fast JavaScript bundler for production

### UI/UX Libraries
- **Framer Motion**: Animations and transitions
- **@dnd-kit**: Drag and drop functionality
- **React Hook Form**: Form validation and management
- **Wouter**: Lightweight routing solution

## Deployment Strategy

### Development Environment
- **Port Configuration**: Development server runs on port 5000
- **Hot Reloading**: Vite provides instant updates during development
- **Database**: Neon PostgreSQL serverless database
- **Environment Variables**: Secure configuration management

### Production Build
- **Client Build**: Vite builds optimized React application to `dist/public`
- **Server Build**: ESBuild bundles Node.js server to `dist/index.js`
- **Static Assets**: Served through Express static middleware
- **Database Migrations**: Drizzle handles schema updates

### Replit Configuration
- **Modules**: nodejs-20, web, postgresql-16
- **Deployment Target**: Autoscale for dynamic scaling
- **Port Mapping**: Internal port 5000 mapped to external port 80
- **Build Process**: Automated build and deployment pipeline

## Changelog
- June 24, 2025. Updated Score Ligue 1 23/24 checklist structure with 2769 cards
  - Renamed "Bases" tab to "Bases num" with 9 numbered variants per player
  - Restructured Hits: 5 types with 3 variants each, 3 types with 1 variant
  - Added complete player names and teams for 200 base references
  - Maintained autographs (304 cards) and special 1/1 cards (350 cards)
- June 23, 2025. Initial setup

## User Preferences
Preferred communication style: Simple, everyday language.