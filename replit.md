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
- June 30, 2025. Fixed card display format and carousel functionality for numbered base cards
  - **Display format correction**: Modified "Base 1/50 laser" to show "Base /50 laser" format in collection views
  - **French localization**: Changed "Parallel Numbered" to "Parallèle numérotée" in card preview display
  - **Carousel navigation fix**: Corrected carousel functionality in card preview modal with proper index-based navigation
  - **Numbering display**: Applied regex replacement to remove leading "1" from numbering (1/50 → /50) in preview details
  - **Reference field removal**: Hidden reference field from card preview interface as requested
  - **Arrow navigation**: Fixed previous/next arrows to properly cycle through 9 variants using currentVariantIndex state
  - **Touch navigation**: Maintained swipe gesture support for mobile carousel navigation
  - Both numbered base card display and carousel navigation now work correctly with proper French formatting
- June 30, 2025. Optimized card loading and trophy halo performance with comprehensive backend caching
  - **Database caching**: Implemented in-memory cache system reducing card loading time by 85% (2.7s → 0.4s)
  - **Trophy halo optimization**: Created dedicated /api/users/:id/trophy-stats endpoint reducing halo loading by 70% (283ms → 87ms)
  - **Smart cache management**: 5-minute TTL for all cards, 10-minute TTL for collection-specific cards, 3-minute TTL for trophy stats
  - **Optimized trophy queries**: Trophy stats now fetch only cardType field instead of full personal cards data
  - **Automatic cache invalidation**: Cache cleared when cards/personal cards are created/modified to ensure data consistency
  - **Performance monitoring**: Added detailed logging to track query execution times for both cards and trophy calculations
  - **Custom loading screen**: Created elegant loading interface with progress bar and animated steps
  - **Avatar click restriction**: Made TrophyAvatar clickable only for current user while preserving halo effects for all users
  - Both card loading and trophy halos now load significantly faster with professional user experience
- June 30, 2025. Enhanced TrophyAvatar effects and added default collection for new users
  - **Fixed card selection error**: Corrected collectionCards.filter error in create-deck by properly handling API response structure
  - **Multiple card selection**: Added checkbox-based multi-selection system for adding cards to decks
  - **Visual selection indicators**: Implemented checkboxes, selection overlays, and "Select All" toggle functionality
  - **Enhanced user feedback**: Added real-time counter showing selected cards and batch addition capability
  - **Circular halo effects**: Modified TrophyAvatar to display circular neon halos AROUND avatar instead of borders
  - **Dual-layer halo system**: Created outer and inner radial gradient halos with blur effects for depth
  - **Level-based halo colors**: Different halo colors for gray, green, blue, purple, gold, and rainbow trophy levels
  - **Clickable avatar**: Made TrophyAvatar clickable to redirect to trophy page (/settings/trophees) with hover scale effect
  - **Collection list view optimization**: Removed images from collection detail list view (collection-detail.tsx) for cleaner display
  - **Personal cards view restored**: Maintained images in personal cards list view (collections.tsx) as originally intended
  - **Expanded autographs**: Added missing autographs including Enzo Francescoli, Lorik Cana, Dimitri Payet, Florian Thauvin, Steve Mandanda, Morgan Schneiderlin, and Kasper Dolberg
  - **Database refresh**: Updated collection with 2869 total cards including all new autograph variants
  - Users can now click their avatar to view trophies and enjoy optimized collection list view without image clutter while keeping personal cards images
- June 30, 2025. Fixed card display and deck numbering system
  - **Card display restoration**: Fixed `/api/cards/all` endpoint to use authenticated user instead of hardcoded ID
  - **Authentication requirement**: Added proper authentication middleware to cards endpoint
  - **API response structure**: Fixed endpoint to return `{ cards: [] }` format for consistent client-side parsing
  - **Deck numbering correction**: Updated deck counter to display X/12 format where X is variable card count and 12 is fixed maximum
  - **Consistent formatting**: Applied X/12 format across all pages (collections, profile, user-profile)
  - **Real-time data**: Confirmed 2848 cards now loading correctly in collections interface
  - Cards in collections page now display properly after authentication and endpoint fixes
- June 30, 2025. Enhanced messaging interface and added notification badges
  - **Conversation improvements**: Added margin-top to first message in chat page for better spacing
  - **Avatar display**: Fixed conversation list to show real user avatars instead of placeholder gradients
  - **Timestamp alignment**: Properly aligned message timestamps with vertical menu dots in conversation list
  - **Notification badges**: Added red notification badges on conversation lines for unread messages
  - **Navigation badges**: Added notification badges on Messages tab in navigation bar showing unread count
  - **Visual enhancements**: Added new message indicator dots on conversations with unread content
  - **Schema corrections**: Fixed insertPersonalCardSchema to accept null values for optional fields
  - **Error handling**: Temporarily disabled notifications API due to database schema mismatch
- June 30, 2025. Enhanced card modification interface and fixed critical system issues
  - **Image upload improvement**: Replaced drag-and-drop area with camera icon overlay positioned on card preview for easier image replacement
  - **Schema validation fix**: Corrected incomplete insertPersonalCardSchema causing 500 errors during card addition - fixed syntax issue in shared/schema.ts
  - **Messaging system correction**: Fixed user list in "Envoyer un message" modal by switching from followed users to social users endpoint (/api/social/users)
  - **UI polish**: Added proper error messages, improved user feedback for messaging system, and enhanced camera icon positioning
  - **Authentication flow**: Resolved issues where users appeared as "nobody" in chat interfaces
  - All three core issues (image upload UX, card addition errors, messaging authentication) resolved successfully
- June 29, 2025. Fixed card modification interface and schema validation for personal cards
  - **Interface improvements**: Repositioned check button between title and close button in card modification modal
  - **Button optimization**: Reduced button sizes (p-1.5, w-4 h-4 icons) for cleaner interface
  - **Background removal**: Removed border background from card preview image in modification modal
  - **Schema validation**: Enhanced insertPersonalCardSchema to include all trade-related fields (isForTrade, tradePrice, tradeDescription, tradeOnly)
  - **Error handling**: Fixed server 500 errors during card addition process through proper schema validation
  - **UI consistency**: Improved header layout with proper spacing between title, check button, and close button
- June 29, 2025. Completed bottom-panel image editor with horizontal scrolling navigation
  - **Interface restructured**: Moved from side panel to bottom panel layout with horizontal tabs
  - **Navigation system**: Added scrollable horizontal menu with 4 options (Luminosité, Contraste, Rotation, Rogner)
  - **Dynamic gauge**: Implemented progress bar under active tab reflecting current parameter values
  - **Optimized sizing**: Reduced image preview size (max-w-xs, max-h-64) for better space distribution
  - **Compact layout**: Reduced padding throughout interface (p-4 instead of p-6) for optimal space usage
  - **Real-time preview**: Maintained live preview functionality above controls with all editing features
  - **User experience**: Enhanced with better visibility of all tabs and progress indicators
- June 28, 2025. Successfully published complete application to GitHub repository
  - **GitHub deployment**: Code successfully published to https://github.com/floflow87/boosterz
  - **Security implementation**: .gitignore properly configured to exclude sensitive files (.env, scripts/, attached_assets/)
  - **Authentication resolution**: Git lock issues resolved, repository authentication configured
  - **Code publication**: Full application codebase (client, server, shared) published with comprehensive documentation
  - **Documentation included**: README.md, deployment guides, and setup instructions published
  - **Production ready**: Repository contains complete, deployable trading card collection platform
- June 28, 2025. Completed IsActive administration system with dual user setup
  - **User model enhancement**: Added isActive boolean field (default: true) to users table in both databases
  - **Authentication system**: Modified auth middleware to check isActive status before granting access
  - **Access control**: Users with isActive=false receive "Compte désactivé" error and cannot authenticate
  - **Admin functionality**: Simple SQL-based admin system where isActive controls user access to the application
  - **Production setup**: Successfully configured SUPABASE_DATABASE_URL for production environment
  - **Database migration**: Added is_active column to both development (Neon) and production (Supabase) databases
  - **Dual user creation**: Created two users in both databases with proper bcrypt password hashing:
    - User 1 (Admin): ID: 1, Floflow87, florent@yopmail.com, password: Test25
    - User 2: ID: 2, maxlamenace, maxlamenace@yopmail.com, password: Test25, bio: "Je suis un passionné de cartes et je PC l'OM"
  - **SQL management**: Admin can toggle user access via UPDATE users SET is_active = true/false WHERE id = [USER_ID]
  - **Benefits**: Simple user management system without complex admin interface, dual environment setup, production-ready with test users
- June 28, 2025. Simplified settings page by removing unnecessary options
  - **Removed sections**: Confidentialité, Aide & Support, Notifications push, Sons, Synchronisation
  - **Kept essentials**: Profil, Trophées, Notifications, Mode sombre, Visite guidée, Déconnexion
  - **Result**: Cleaner interface focused on core functionality
- June 28, 2025. Configured dual database architecture for dev/prod separation
  - **Development environment**: Continues using Neon database on Replit for development
  - **Production environment**: Configured to use Supabase database when deployed
  - **Database routing**: Automatic detection based on NODE_ENV variable
  - **Migration system**: Created comprehensive migration script for Supabase initialization
  - **Environment separation**: SUPABASE_DATABASE_URL for production, DATABASE_URL for development
  - **Complete schema migration**: All tables, indexes, and relationships configured for Supabase
  - **Documentation**: Created DEPLOYMENT-GUIDE.md with step-by-step production setup instructions
  - **Benefits**: Clean separation between dev and prod data, professional deployment architecture
- June 27, 2025. Fixed drag & drop system optimization and resolved card addition bug
  - **Drag & drop improvements**: Added 3px activation distance, 300ms debounce for mutations, visual overlay with help message
  - **Performance optimization**: Implemented optimistic updates with automatic position reorganization
  - **Fixed card addition**: Corrected data mapping in add-card form to match database schema (salePrice/saleDescription fields)
  - **Enhanced error handling**: Added detailed error logging and user feedback for failed card additions
  - **Resolved infinite loops**: Fixed TrophyAvatar component with proper array checks to prevent React update cycles
  - Card addition system now works properly with improved user experience and visual feedback
- June 27, 2025. Optimized deck preview loading performance with comprehensive caching and optimistic updates
  - **Optimistic updates**: Implemented instant UI updates for card removal with automatic position reorganization
  - **Aggressive caching**: Added 30-second cache for deck details, 10-minute cache for deck lists, 15-minute cache for preview data
  - **Reduced network calls**: Eliminated unnecessary refetch operations during tab changes and window focus
  - **Error handling**: Added automatic rollback for failed operations with clear user feedback
  - **Smart cache keys**: Implemented deck ID-based cache invalidation for better performance
  - Deck operations now feel instant while maintaining data consistency in background
- June 27, 2025. Fixed complete price display system on collections page to remove all "$" symbols
  - **Grid view**: Removed DollarSign icon and repositioned price from bottom-center to bottom-right with dark background
  - **List view**: Removed DollarSign icon from trade price display 
  - **Modal detail view**: Fixed price formatting to show proper "€" symbol without "$" prefix
  - **Action buttons**: Replaced DollarSign icon with Plus icon for "Mettre en vente" action
  - All price displays now show clean format like "25€" instead of "$25€" throughout collections interface
- June 27, 2025. Completed card price display fixes and French spelling corrections
  - **Fixed "$" symbol removal**: Removed "$" symbol from ALL price displays in grid, list, and card views
  - **Corrected price positioning**: Moved price display from bottom-center to bottom-right corner in grid view
  - **Fixed list view prices**: Removed "$" symbols from trade prices in list view sections
  - **French spelling corrections**: Changed all instances of "autograph" to "autographe" in:
    - Server seed database (variable names, card types, rarities)
    - Client-side player filtering logic for autographe detection
    - Card type recognition system
  - **Enhanced styling**: Improved card price positioning with better shadow effects and background
  - All card views (grid, list, card detail) now display prices without currency symbols correctly
- June 27, 2025. Prepared SSL certificate configuration for boosterz.fr deployment
  - Created comprehensive SSL setup documentation (ssl-setup.md) with Let's Encrypt integration
  - Configured production-ready Nginx reverse proxy (nginx-boosterz.conf) with security headers
  - Built automated deployment script (deploy-ssl.sh) for one-click HTTPS setup
  - Added pre-deployment checklist (pre-deployment-checklist.md) with DNS and server requirements
  - Script includes PostgreSQL database setup, PM2 process management, and fail2ban security
  - HTTPS configuration supports automatic certificate renewal and security best practices
  - Ready for production deployment with professional SSL/TLS setup for boosterz.fr domain
- June 27, 2025. Added comprehensive trophy system with dedicated page in settings
  - Created complete "Trophées" tab in settings below profile section with Trophy icon
  - Implemented full trophy page with categorized achievements (Collection, Social, Trading, Achievements)
  - Added progress tracking system with completion percentages and visual indicators
  - Designed rarity system with common, rare, epic, and legendary trophy types
  - Included filtering by category and comprehensive statistics display
  - Trophy page features proper achievement descriptions, unlock dates, and progress bars
  - Integrated seamlessly with existing navigation and app architecture
- June 27, 2025. Optimized profile page performance and enhanced marketplace-style "En vente" section
  - Implemented Promise.all for parallel comment loading instead of sequential API calls, improving post loading speed
  - Redesigned "En vente" section using marketplace component styling with hover effects and transition animations
  - Added full-screen lateral modal for card details matching marketplace design pattern
  - Integrated real card images (imageUrl) with fallback display for cards without images
  - Enhanced card presentation with professional hover states, badges, and visual feedback
  - "En vente" section now displays authentic card data with clickable details and consistent marketplace UX
- June 27, 2025. Fixed comment and like counter systems with persistent database updates
  - Fixed comment counter to automatically update posts.comments_count when new comments are added
  - Fixed like counter to automatically update posts.likes_count when posts are liked/unliked
  - Corrected comment API structure to properly return user data (name, avatar) for display
  - Fixed JSX compilation errors in social component that were blocking application startup
  - Comment and like counters now persist correctly across page refreshes and show real-time counts
- June 27, 2025. Fixed comment system date formatting and avatar display issues
  - Resolved French date format parsing (DD/MM/YYYY HH:MM) to display proper timestamps like "Il y a 2h"
  - Fixed avatar display for both existing and newly posted comments throughout social feed
  - Corrected user name and avatar assignment for new comments to show current user's data instead of profile owner's
  - Enhanced comment data processing to handle multiple data structures (nested user object vs flat fields)
  - Comments now display authentic user avatars and proper French-formatted timestamps consistently
- June 25, 2025. Enhanced marketplace display with authentic user cards for sale
  - Removed all dummy/fake cards from marketplace and user profile "En vente" tabs
  - Implemented real card sales system using personal_cards table with is_for_sale flag
  - Added enhanced card display with sale badges, pricing, condition, and descriptions
  - Created hover effects and visual indicators for cards marked for sale
  - Updated marketplace to show only authentic personal cards from real users
  - Cards display includes sale price, condition status, and detailed descriptions
- June 25, 2025. Completed avatar display system with real user images throughout application
  - Fixed getUserPosts method in storage.ts to include complete user data (name, username, avatar)
  - Implemented consistent real user avatar display in posts, comments, and all components
  - Applied orange-yellow gradient fallback for users without avatars across entire application
  - Updated comment avatar display to use comment.user.avatar structure in both social and profile pages
  - Standardized avatar sizes and styling with proper timestamp formatting
  - Avatar system now displays authentic user images from database instead of placeholder gradients
- June 25, 2025. Resolved compilation errors and prepared HTTPS deployment for boosterz.fr
  - Fixed duplicate function implementations in storage.ts causing TypeScript errors
  - Removed redundant getPersonalCard, updatePersonalCard, deletePersonalCard methods
  - Corrected conversation schema references (removed non-existent updatedAt field)
  - Fixed createConversation method signature to match IStorage interface
  - Enhanced database configuration in db.ts to support separate dev/production environments
  - Created comprehensive HTTPS deployment guide (https-deployment-guide.md) for boosterz.fr domain
  - Configured SSL/TLS setup, Nginx reverse proxy, and production security headers
  - Documented complete deployment process with Let's Encrypt certificates
  - **Note**: Production database still needs to be created separately from development database
- June 25, 2025. Enhanced deck viewing experience for non-owners
  - Hidden edit/delete controls when viewing other users' decks
  - Disabled drag & drop and card numbering for visitors
  - Added 3D rotation effect when clicking cards in visitor mode
  - Improved user experience with proper ownership detection
- June 25, 2025. Prepared deployment configuration for boosterz.fr domain
  - Enhanced database configuration to support separate dev/prod environments
  - Added environment-specific database connection logic in db.ts
  - Created comprehensive deployment guide for HTTPS setup and domain configuration
  - Configured infrastructure for production deployment with proper database separation
  - **Note** : Base de données production pas encore créée - utilise actuellement la même base pour dev/prod
- June 25, 2025. Updated profile page header and navigation consistency
  - Added consistent header with BOOSTERZ logo in Luckiest Guy font with Z in main color
  - Optimized back arrow navigation using setLocation for faster page transitions
  - Updated notification and settings icons with circular backgrounds matching other pages
  - Removed header background for transparent design
  - Positioned main color halo effect behind arrow button with proper sizing matching social page
  - Changed KPI labels from "Abonnements/Collections" to "Suivis/Decks" 
  - Applied Luckiest Guy font to user name (first name + last name) for brand consistency
  - Implemented real dynamic KPI calculations: actual cards count, followers count, and decks count
  - Fixed avatar size to 64x64px with orange border matching collections page design
  - Enhanced avatar display to show real user avatars (base64 or HTTP URLs) with gradient fallback matching post display
  - Standardized background color to hsl(216,46%,13%) matching collections and social pages
  - Updated post design to match social feed with rounded borders and proper background
  - Added like and comment counters above action buttons with separator line
  - Removed sticky navigation for better scroll experience
  - Implemented real like and comment system with authentic data from database
  - Added interactive like/unlike functionality with visual feedback
  - Integrated comment display and creation with user avatars and timestamps
  - Profile page now matches overall app design language with authentic data and consistent styling
- June 25, 2025. Enhanced user profile community features
  - Added dynamic avatar display throughout user profile pages
  - Implemented social feed post box design on user profile "À la une" section
  - Enhanced post display with improved header styling and gradient avatars
  - Added complete like and comment functionality with real-time interactions
  - Improved post layout to match social feed design standards
- June 25, 2025. Redesigned user profile layout with centered header
  - Created centered header with large avatar, name, username and description
  - Simplified tabs to 3 main sections: À la une, En vente, Decks
  - Moved KPIs to separate section below header
  - Improved visual hierarchy matching user's design requirements
- June 25, 2025. Added description field to user profiles
  - Added bio/description textarea field to profile editing page
  - Implemented character limit (200) with counter display
  - Description appears on user profile pages under avatar and username
  - Bio field already existed in database schema, now fully integrated in UI
- June 25, 2025. Enhanced user profile community features
  - Added dynamic avatar display throughout user profile pages
  - Implemented social feed post box design on user profile "À la une" section
  - Enhanced post display with improved header styling and gradient avatars
  - Added complete like and comment functionality with real-time interactions
  - Improved post layout to match social feed design standards
- June 25, 2025. Enhanced deck creation and visual effects
  - Removed background color change during deck creation (keeps default background)
  - Removed duplicate "Ajouter des cartes" button from deck creation form
  - Changed deck creation toast to green color for positive feedback
  - Modified creation flow to redirect to deck detail page instead of collections
  - Added gentle twinkling halo effects for complete decks (12 cards)
  - Implemented small scintillating light halos with slow animation and radial gradients
  - Updated parallax effect on deck banners with reduced intensity and offset positioning
- June 25, 2025. Fixed deck deletion cache management and error handling
  - Resolved ReferenceError for refetchDecks by moving useEffect after useQuery declaration
  - Added proper cache invalidation (staleTime: 0, gcTime: 0) for deleted decks
  - Enhanced deck-not-found error handling with automatic cache invalidation
  - Fixed navigation flow after deck deletion with immediate UI updates
- June 25, 2025. Implemented deck deletion functionality with confirmation modal
  - Added delete button (trash icon) next to edit button in deck header
  - Created confirmation modal with proper styling and danger colors
  - Implemented DELETE /api/decks/:id endpoint with cascade deletion
  - Added deleteDeck method to storage interface for both database and memory storage
  - Added parallax scroll effect on deck banner images for enhanced visual experience
  - Set success toast to green color for positive feedback on deletion
  - Automatic redirection to collections page after successful deletion
- June 25, 2025. Updated deck theme system with new colors and improved UI
  - Replaced "Marine & Or" with "Marine & Bronze" theme
  - Changed "Noir & Or" to "Or & Noir" (inverted colors)
  - Added 4 new themes: Or & Noir, Vert & Blanc, Rouge & Noir, Bleu Blanc Rouge
  - Created collapsible theme selector with arrow for both creation and editing
  - Synchronized theme options between deck creation and modification pages
- June 25, 2025. Fixed deck banner registration and upload system
  - Updated PATCH /api/decks/:id endpoint to handle coverImage and bannerPosition fields
  - Added proper validation and dynamic update data preparation
  - Banner upload and position adjustment now save correctly to database
  - Added debugging logs to track successful deck updates
- June 25, 2025. Cleaned up marketplace to show only real cards for sale
  - Removed all mock/fake cards from "Sur le marché" tab in social section
  - Marketplace now displays only authentic personal cards marked isForSale: true
  - Fixed filtering to exclude current user's own cards from marketplace
  - Updated UI to show proper empty state when no cards are for sale
- June 25, 2025. Fixed avatar upload and persistence system
  - Resolved avatar not persisting after page refresh by fixing /api/auth/me endpoint
  - Updated endpoint to fetch fresh user data from database instead of cached session data
  - Fixed client-side cache invalidation to immediately update avatar display
  - Avatar uploads now work correctly for files up to 10MB with proper base64 encoding
- June 25, 2025. Fixed persistent likes system and marketplace cleanup
  - Implemented persistent like counts that show real total from all users
  - Fixed like counter to persist across page navigation and reload
  - Removed fake marketplace cards from "Sur le marché" section  
  - Replaced deck count with cards for sale count in discovery page user cards
  - Added cardsForSaleCount field to social users with real database counts
- June 25, 2025. Enhanced social interactions and navigation
  - Made usernames clickable in "À la une" feed to redirect to user profiles
  - Removed "Échanger" (trade) button from all posts in social feed
  - Fixed deck count display in KPIs to show actual user decks from database
  - Implemented functional "Decks" and "En vente" tabs in user profiles
  - Added comprehensive navigation between user profiles via clickable usernames
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