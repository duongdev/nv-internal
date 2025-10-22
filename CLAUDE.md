# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NV Internal is a task management application for an air conditioning service company in Vietnam. This is a monorepo with pnpm workspaces containing a REST API and React Native mobile app.

### Core Architecture

- **API**: Hono-based REST API with PostgreSQL database, deployed on Vercel
- **Mobile**: Expo React Native app with Clerk authentication
- **Database**: PostgreSQL via Neon (serverless) with local Docker option
- **Authentication**: Clerk for user management
- **Packages**: Shared Prisma client and validation schemas

## Common Development Commands

### Root Level Commands

```bash
# Install dependencies for all packages
pnpm install

# Run tests for all packages
pnpm test

# Run API tests only
pnpm test:api

# Run verbose API tests
pnpm test:api:verbose

# Generate test coverage
pnpm test:coverage

# Code formatting and linting
pnpm biome:lint          # Lint only
pnpm biome:check         # Lint and auto-fix
pnpm biome:format        # Format code
```

### API Development (apps/api/)

```bash
# Start local development (requires database first)
docker compose -f docker-compose.dev.yml up    # Start local PostgreSQL
npx vc dev                                     # Start API server with Vercel dev, run in the root of the monorepo

# Build and deployment
pnpm build             # Build API only
pnpm vercel-build      # Build for Vercel deployment (includes packages + Prisma)

# Testing
pnpm test              # Run Jest tests
pnpm test:verbose      # Run with verbose output
pnpm test:watch        # Run in watch mode
pnpm test:coverage     # Generate coverage report

# Prisma operations
npx prisma generate    # Generate client (runs automatically in postinstall)
npx prisma migrate dev # Create and apply migrations in development
```

### Mobile Development (apps/mobile/)

```bash
# Development
pnpm dev               # Start Expo development server
pnpm android           # Run on Android device/emulator
pnpm ios               # Run on iOS device/simulator
pnpm web               # Run in web browser
pnpm clean             # Clean .expo and node_modules
```

### Shared Packages

```bash
# Build Prisma client package
pnpm --filter @nv-internal/prisma-client build

# Build validation package
pnpm --filter @nv-internal/validation build

# Build both packages
pnpm --filter @nv-internal/prisma-client build && pnpm --filter @nv-internal/validation build
```

## Code Quality and Commit Workflow

### Pre-commit Requirements

1. **Format and lint**: `pnpm exec biome check --write .`
2. **Run API tests**: `pnpm --filter @nv-internal/api test`
3. **Build packages** (optional, when changing shared code): `pnpm --filter @nv-internal/prisma-client build && pnpm --filter @nv-internal/validation build`

### Conventional Commits

Format: `<type>(<scope>): <description>`

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`
**Common scopes**: `api`, `mobile`, `prisma`, `validation`, `ci`, `docs`

Examples:

- `feat(api): add check-in photo attachment endpoint`
- `fix(mobile): prevent crash on task details for missing location`
- `refactor(prisma): extract prefixed id helper to shared client`

## Key Architecture Patterns

### API Structure

- **Routes**: All routes in `apps/api/src/v1/` with authentication middleware from `@hono/clerk-auth`
- **Services**: Business logic in service files (`*.service.ts`)
- **Validation**: Use Zod schemas from `@nv-internal/validation`
- **Database**: Use Prisma client from `@nv-internal/prisma-client`
- **Testing**: Jest tests in `__tests__/` directories alongside source files
- **Transactions**: Use transactions for multi-model operations
- **Activity Logging**: Log all state changes to Activity table
- **Pagination**: Use cursor-based pagination for lists

### Mobile App Structure

- **Routing**: Expo Router file-based routing in `apps/mobile/app/`
- **Authentication**: Clerk SDK with protected routes using auth state
- **API Calls**: Use `callHonoApi` utility for type-safe API calls
- **State Management**: TanStack Query with aggressive caching (1 week gcTime)
- **Styling**: NativeWind (Tailwind for React Native) with sorted classes
  - **className Composition**: Use the `cn` utility from `@/lib/utils` for composing classNames with conditional logic
  - The `cn` utility combines `clsx` and `tailwind-merge` to properly merge and deduplicate Tailwind classes
  - Example:

    ```tsx
    import { cn } from "@/lib/utils";

    <View
      className={cn(
        "rounded-lg bg-muted",
        compact ? "h-[77px] w-[77px]" : "h-24 w-24"
      )}
    />;
    ```

- **Forms**: Present forms and inputs as modals
- **Components**: Follow existing component structure in `components/` directory

### Database Schema

- **Models**: Task, Customer, GeoLocation, Activity, Attachment
- **IDs**: Use prefixed IDs for readability (cust*, geo*, act\_)
- **Task Status**: PREPARING → READY → IN_PROGRESS → ON_HOLD → COMPLETED
- **Client**: Generated to `packages/prisma-client/generated/`

## Development Guidelines

### Code Style

- **TypeScript**: Strict typing throughout
- **Biome**: For formatting and linting (replaces ESLint/Prettier)
- **File Size**: Keep files small and readable
- **Language**: Support Vietnamese language where applicable

### Security

- **Authentication**: All API routes require authentication middleware
- **Input Validation**: Server-side validation with Zod schemas
- **Transactions**: Use for multi-model operations
- **No Secrets**: Never hardcode credentials; use environment variables

### Testing

- **API Tests**: Jest tests in `__tests__/` directories
- **Coverage**: Target critical paths
- **Test Environment**: Node environment with ts-jest preset
- **Test Files**: Named `*.test.ts` alongside source files

## Important File Locations

- **API Routes**: `apps/api/src/v1/*/` (route.ts and service.ts files)
- **Mobile Screens**: `apps/mobile/app/` (file-based routing)
- **Database Schema**: `apps/api/prisma/schema.prisma`
- **Shared Validation**: `packages/validation/`
- **Shared Prisma Client**: `packages/prisma-client/`
- **Cursor Rules**: `.cursor/rules/` (project-specific guidelines)
- **Commit Commands**: `.cursor/commands/commit-changes.md`

## Project Scale Context

- **Team Size**: Small business (< 50 users)
- **Industry**: Air conditioning services in Vietnam
- **Platform**: Mobile-first for field workers
- **Features**: Task management, check-in/check-out, location tracking, photo attachments

## Environment Setup

1. Install pnpm package manager
2. Clone repository and run `pnpm install`
3. Set up environment variables (see .env.example files)
4. For local database: Start Docker Compose in `apps/api/`
5. Start API with `npx vc dev` in `apps/api/`
6. Start mobile app with `pnpm dev` in `apps/mobile/`
