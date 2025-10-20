# NV Internal - Task Management Application

## Project Overview

NV Internal is a task management application designed for an air conditioning service company in Vietnam. The app helps manage field service operations, including installation, repair, and maintenance tasks performed by technicians at customer locations.

## Scale & Scope

### Current Scale

- **Small Business**: Designed for teams of less than 50 users
- **Air Conditioning Services**: Specialized for cooling/AC system installation, repair, and maintenance
- **Vietnam Market**: Exclusively for operations within Vietnam
- **Field Service Focus**: Optimized for mobile workers who perform tasks at customer locations

### Technical Scale

- **Monorepo Architecture**: Organized with pnpm workspaces
- **Database**: PostgreSQL with Prisma ORM
- **API**: RESTful API built with Hono framework
- **Mobile**: Cross-platform React Native app with Expo
- **Authentication**: Clerk for user management and authentication
- **Platform Support**: Android and iOS devices

## Core Features

### Task Management

- **Task Creation**: Admins can create tasks with title, description, customer info, and location
- **Work Type Classification**: Tasks categorized as installation, repair, or maintenance
- **Task Assignment**: Tasks can be assigned to one or multiple workers
- **Status Tracking**: Tasks progress through states: PREPARING → READY → IN_PROGRESS → ON_HOLD → COMPLETED
- **Location Support**: Tasks can be associated with geographic locations with lat/lng coordinates
- **Customer Management**: Tasks can be linked to customers with contact information

### Check-in/Check-out System

- **Location-based Check-in**: Workers must check in at the task location
- **Photo Verification**: Workers can take photos during check-in/check-out to verify work
- **Time Tracking**: Automatic tracking of time spent on each task
- **Location Validation**: GPS coordinates to verify workers are at the correct location

### User Management

- **Role-Based Access Control**: Two primary roles - Admin and Worker
- **User Profiles**: Basic user information with avatars
- **Authentication**: Secure login with email/password and OAuth options (Google, Apple, GitHub)
- **User Administration**: Admins can create users, manage roles, and ban/unban accounts

### Activity Logging

- **Audit Trail**: All significant actions are logged to the Activity table
- **Action Tracking**: Records who did what, when, and with what payload
- **Topic Filtering**: Activities can be filtered by topic (task, user, etc.)

### Mobile App Features

- **Admin Interface**:
  - Task creation and management
  - User management
  - Overview of all tasks
  - Settings and configuration
- **Worker Interface**:
  - View assigned tasks
  - Check-in/check-out functionality with photo capture
  - Update task status
  - See task details and customer information
  - Navigate to task locations
- **Authentication Flow**: Complete auth flow including sign up, sign in, password reset
- **Responsive Design**: Optimized for mobile devices with touch-friendly interfaces

## Technical Architecture

### Backend (API)

- **Framework**: Hono with TypeScript
- **Database**: PostgreSQL via Neon (serverless) with local Docker option
- **ORM**: Prisma with prefixed IDs for readability
- **Authentication**: Clerk JWT middleware
- **Validation**: Zod schemas for type safety
- **Deployment**: Vercel serverless functions

### Mobile App

- **Framework**: Expo React Native with file-based routing
- **State Management**: TanStack Query for server state
- **UI**: NativeWind (Tailwind for React Native) with custom components
- **Navigation**: Expo Router with protected routes
- **Authentication**: Clerk SDK with secure token storage
- **Device Support**: Android and iOS platforms

### Shared Packages

- **@nv-internal/prisma-client**: Generated Prisma client with custom extensions
- **@nv-internal/validation**: Shared Zod schemas for type validation

## Current Status

### Completed Features

- ✅ Basic task CRUD operations
- ✅ User authentication and role management
- ✅ Task assignment and status updates
- ✅ Location support for tasks
- ✅ Customer management
- ✅ Activity logging
- ✅ Mobile app with admin and worker interfaces
- ✅ Infinite scrolling for task lists
- ✅ Real-time data synchronization

### In Progress

- 🔄 Photo attachment functionality for check-in/check-out
- 🔄 Location-based check-in/check-out system
- 🔄 Work type classification (install/repair/maintain)
- 🔄 Push notifications for task updates

## Future Plans & Roadmap

### Short Term (Next 3 months)

1. **Enhanced Check-in/Check-out System**
   - Photo capture with timestamp and location
   - GPS-based location verification
   - Automatic time tracking
   - Check-in/out history and reports

2. **Work Type Specialization**
   - Custom forms for different work types
   - Checklists for installation, repair, and maintenance
   - Required parts and tools tracking
   - Work completion verification

3. **Reporting & Analytics**
   - Task completion metrics
   - Worker performance analytics
   - Time spent on different work types
   - Customer satisfaction tracking

### Medium Term (3-6 months)

1. **Expanded Integrations**
   - Calendar integration for scheduling
   - SMS notifications for customers
   - Inventory management for parts
   - Invoice generation

2. **Advanced Features**
   - Route optimization for workers
   - Weather integration for outdoor work
   - Customer history and equipment tracking
   - Warranty management

3. **Web Dashboard**
   - Full-featured web interface for administrators
   - Advanced reporting dashboard
   - Bulk operations for task management
   - Customer management portal

### Long Term (6+ months)

1. **Enterprise Features**
   - Multiple service branches support
   - Advanced permissions system
   - API for third-party integrations
   - White-labeling options

2. **AI & Automation**
   - Smart task assignment based on location and availability
   - Predictive maintenance scheduling
   - Automated customer notifications
   - Voice-activated commands

3. **Scaling & Performance**
   - Advanced caching strategies
   - Database optimization for large datasets
   - CDN implementation for media files
   - Performance monitoring and alerting

## Development Guidelines

### Code Quality

- **TypeScript**: Strict typing throughout the codebase
- **Biome**: For consistent formatting and linting
- **Testing**: Unit and integration tests for critical paths
- **Documentation**: Comprehensive inline documentation

### Development Workflow

- **Feature Branching**: All work done on feature branches
- **Code Reviews**: Required for all changes
- **CI/CD**: Automated testing and deployment
- **Environment Management**: Separate environments for dev, staging, and production

### Commit Guidelines

- **Conventional Commits**: Use `<type>(<scope>): <description>`
  - Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`
  - Common scopes: `api`, `mobile`, `prisma`, `validation`, `ci`, `docs`
- **Split commits by concern**: If changes span different areas, create multiple focused commits to ease review, cherry-picking, and reverts. Use `git add -p` to stage by hunk.
- **Pre-commit checks**:
  - Format/lint: `pnpm exec biome check --write .`
  - API tests: `pnpm --filter @nv-internal/api test`
  - Optional (when changing shared packages): `pnpm --filter @nv-internal/prisma-client build && pnpm --filter @nv-internal/validation build`
- See the detailed command flow in `.cursor/commands/commit-changes.md`.

### Security Considerations

- **Authentication**: Secure token-based authentication
- **Authorization**: Role-based access control
- **Data Protection**: Encrypted data transmission and storage
- **Audit Logging**: Complete audit trail for all actions

## Getting Started

For new developers joining the project:

1. **Setup Environment**
   - Install pnpm package manager
   - Clone the repository
   - Run `pnpm install` to install dependencies
   - Set up environment variables (see .env.example files)

2. **Local Development**
   - Start the API: `cd apps/api && npx vc dev`
   - Start the mobile app: `cd apps/mobile && pnpm dev`
   - For local database: `cd apps/api && docker compose -f docker-compose.dev.yml up`

3. **Understanding the Codebase**
   - Read the CLAUDE.md file for detailed architecture information
   - Review the database schema in `apps/api/prisma/schema.prisma`
   - Explore the API routes in `apps/api/src/v1/`
   - Check the mobile app screens in `apps/mobile/app/`

## Contact & Support

- **Project Lead**: Dustin Do <dustin.do95@gmail.com>
- **Documentation**: See CLAUDE.md for detailed technical guidance
- **Issues**: Use the project's issue tracker for bug reports and feature requests
