# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a monorepo for a task management application with two main components:
- **API**: A Hono-based REST API deployed on Vercel with PostgreSQL database (Neon)
- **Mobile**: An Expo React Native mobile app with Clerk authentication

The project uses:
- **pnpm** as package manager with workspaces
- **Biome** for linting and formatting
- **TypeScript** throughout
- **Prisma** for database ORM
- **Clerk** for authentication
- **Neon** database with Prisma adapter for serverless

## Repository Structure

```
├── apps/
│   ├── api/           # Hono REST API
│   └── mobile/        # Expo React Native app
├── packages/
│   ├── prisma-client/ # Shared Prisma client
│   └── validation/    # Shared Zod schemas
├── biome.json         # Biome configuration
└── tsconfig.json      # TypeScript project references
```

## Development Commands

### Root Level
```bash
pnpm install          # Install dependencies for all packages
pnpm build            # Build all packages
```

### API (apps/api/)
```bash
# Start local development environment
docker compose -f docker-compose.dev.yml up    # Start local database first
npx vc dev                                     # Start API server with Vercel dev

# Build and deployment
pnpm vercel-build     # Build for Vercel deployment (generates Prisma client)
```

### Mobile (apps/mobile/)
```bash
pnpm dev              # Start Expo development server
pnpm android          # Run on Android
pnpm ios              # Run on iOS
pnpm web              # Run on web
pnpm clean            # Clean .expo and node_modules
```

### Packages
```bash
# In packages/prisma-client/
pnpm build            # Build Prisma client
pnpm prepublishOnly   # Build before publishing

# In packages/validation/
pnpm build            # Build validation schemas
pnpm check            # Run Biome checks
```

## Architecture

### API Architecture
- **Framework**: Hono with TypeScript
- **Database**: PostgreSQL via Neon with Prisma adapter for serverless
- **Local Development**: Docker Compose with local PostgreSQL
- **Authentication**: Clerk middleware
- **Structure**:
  - `src/index.ts` - Main app with global middlewares
  - `src/v1/` - Versioned API routes
  - `src/lib/prisma.ts` - Database connection with prefixed IDs
  - `src/v1/task/` - Task management endpoints
  - `src/v1/activity/` - Activity logging
  - `src/v1/user/` - User management

### Mobile App Architecture
- **Framework**: Expo Router with file-based routing
- **Authentication**: Clerk with token caching
- **State Management**: TanStack Query for server state
- **UI**: NativeWind (Tailwind for React Native) with custom primitives
- **Navigation**: Stack navigation with protected routes
- **Key Screens**:
  - `app/_layout.tsx` - Root layout with providers
  - `app/(auth)/` - Authentication flows
  - `app/admin/` - Admin interface with tabs
  - `app/worker/` - Worker interface
  - `app/(inputs)/location-picker` - Location selection modal

### Shared Packages
- **@nv-internal/prisma-client**: Generated Prisma client with custom extensions
- **@nv-internal/validation**: Zod schemas for type validation

## Database Schema

Key models:
- **Task**: Main task entity with status, assignees, location, and customer
- **Customer**: Task customers with phone numbers
- **GeoLocation**: Geographic locations with lat/lng
- **Activity**: Audit log for user actions

## Authentication & Authorization

- **API**: Uses Clerk JWT tokens with `@hono/clerk-auth`
- **Mobile**: Clerk SDK with secure token storage
- **Role-based**: Admin vs Worker permissions
- **Activity logging**: All actions are logged to Activity table

## Development Notes

### Database Setup
- **Local**: Use `docker compose -f docker-compose.dev.yml up` in `apps/api/` to start local PostgreSQL
- **Production**: Neon database with Prisma adapter automatically used in Vercel environment
- Prisma client is generated to `packages/prisma-client/generated/`
- Uses prefixed IDs (cust_, geo_, act_) for readability

### Code Style
- Uses Biome for consistent formatting and linting
- 2-space indentation, 80-character line width
- Single quotes for JavaScript, double for JSX
- Sorted Tailwind classes with `clsx`

### API Patterns
- All routes require authentication middleware
- Transactions used for multi-model operations
- Activity logging for all state changes
- Cursor-based pagination for lists

### Mobile Patterns
- Type-safe API calls via `callHonoApi` utility
- React Query with aggressive caching (1 week gcTime)
- Protected routes using Clerk auth state
- Modal presentations for forms and inputs