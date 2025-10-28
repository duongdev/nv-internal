# Development Commands

Quick reference for common development tasks.

## Root Level Commands

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

## API Development (apps/api/)

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

## Mobile Development (apps/mobile/)

```bash
# Development
pnpm dev               # Start Expo development server
pnpm android           # Run on Android device/emulator
pnpm ios               # Run on iOS device/simulator
pnpm web               # Run in web browser
pnpm clean             # Clean .expo and node_modules
```

## Shared Packages

```bash
# Build Prisma client package
pnpm --filter @nv-internal/prisma-client build

# Build validation package
pnpm --filter @nv-internal/validation build

# Build both packages
pnpm --filter @nv-internal/prisma-client build && pnpm --filter @nv-internal/validation build
```
