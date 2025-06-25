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
- June 25, 2025. Complete profile system with real data and functional tabs
  - Fixed deck count display in KPIs to show actual user decks from database
  - Implemented "Decks" tab to display user's created decks with navigation to deck details
  - Implemented "En vente" tab to show user's personal cards marked for sale
  - Added API endpoints for user-specific decks and sale cards
  - Enhanced card display with fallback images and improved layout
  - Clickable usernames redirect to user profiles correctly
- June 25, 2025. Implemented real counts display on user profiles
  - Added calculation of real collections count from user's actual collections
  - Added calculation of real cards count from owned cards across all collections
  - Added personal cards count (excluding sold cards) to total cards calculation
  - Added real completion percentage based on owned/total cards ratio
  - Profile pages now show authentic data: followers, following, collections, cards, completion
- June 24, 2025. Implemented real followers count display on user profiles
  - Added getFollowingCount method to storage interface
  - Enhanced follow/unfollow methods to update user followers count in database
  - Added updateFollowersCount helper to maintain accurate follower statistics
  - Profile pages now show actual follower counts from database instead of mock data
- June 24, 2025. Fixed "Mes posts" section to correctly access nested user data structure
  - Corrected data access from currentUser.user instead of currentUser directly
  - Fixed avatar display to use currentUser.user.avatar from API response
  - Updated username/name display to use currentUser.user.name and currentUser.user.username
  - Resolved "Utilisateur @username" display issue with proper data binding
- June 24, 2025. Fixed login page 404 error by adding /login route to application routing
- June 24, 2025. Fixed post headers in "Mes posts" to display correct user data
  - Updated post headers to show user's real avatar from database (base64 image)
  - Fixed username and name display to show "FLORENT MARTIN @Floflow87"
  - Corrected data structure access for current user information
  - Post headers now properly match the user's profile data from settings
- June 24, 2025. Fixed social system logic to match user requirements
  - "À la une" tab now shows only posts from followed users (empty if not following anyone)
  - "Marché" tab shows marketplace cards from all users except current user
  - "Découvrir" tab shows all users except current user with working autocomplete
  - "Mes posts" tab shows only current user's posts with ability to create new posts
  - Fixed feed endpoints to properly filter followed users' content
  - Added marketplace filtering to exclude current user's own cards
- June 24, 2025. Implemented autocomplete search functionality in discovery section
  - Added real-time user search with dropdown suggestions
  - Fixed useEffect and useRef import issues in social component
  - Search works by username, name, and email with profile previews
  - Added click-outside behavior to close autocomplete dropdown
  - Users can follow/unfollow directly from search results
- June 24, 2025. Fixed user authentication bug in social features
  - Corrected "Mes posts" section to show posts from currently logged-in user
  - Fixed hardcoded user ID issues in social page and chat
  - Added proper authentication system to get current user ID
  - Updated user profile queries to use authenticated user data
- June 24, 2025. Comprehensive autograph system update based on Excel checklist
  - Implemented exact autograph variants from official Excel checklist: /199, /99, /49, /25, /10, /5, /3, /2
  - Added season field (22/23, 23/24) to card addition form and display
  - Enhanced autocompletion to show all players with AUTO/INSERT badges
  - Improved drag & drop fluidity in deck management with better visual feedback
  - Fixed share button colors in deck interface (changed to black text)
  - Updated autograph players according to exact Excel data: 19 players with specific variant distributions
  - Added Purple(/5) variant type for autographs according to checklist
- June 24, 2025. Fixed deployment configuration issues
  - Removed Python dependencies causing virtual environment errors
  - Deleted pyproject.toml and .pythonlibs directory
  - Cleaned deployment to use Node.js-only toolchain
  - Verified build process uses vite and esbuild exclusively
- June 24, 2025. Fixed collection detail page filtering and navigation
  - Corrected "Bases num." to show Parallel Laser/Swirl cards (200 players × 9 variants = 1800 cards)  
  - Removed redundant "Parallèles" tab as requested
  - Fixed "Autographes" tab to display autograph cards correctly
  - Verified hits structure: 360 total Insert cards across 8 different types
  - Updated Score Ligue 1 23/24 checklist structure
- June 23, 2025. Initial setup

## User Preferences
Preferred communication style: Simple, everyday language.

## Access Credentials
**Compte "Mac la menace" (maxlamenace):**
- Username: maxlamenace  
- Password: Test25
- User ID: 999
- Email: maxlamenace@yopmail.com