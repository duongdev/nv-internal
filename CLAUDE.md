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

## 📚 Documentation Structure

Detailed documentation is organized in the `docs/` directory:

- **[Architecture Patterns](./docs/architecture/patterns/)** - Implementation patterns and best practices
- **[Development Guide](./docs/development/)** - Setup, commands, and workflows
- **[Testing Guide](./docs/testing/)** - Testing strategies and patterns

## Specialized Agent Usage

**IMPORTANT**: Claude Code should **ALWAYS prefer using specialized agents** for development tasks. Agents are purpose-built experts with deep domain knowledge and should be the default choice for implementation work.

### General Agent Usage Philosophy

**Default Behavior**:
- ✅ **USE AGENTS**: For all backend, frontend, and quality assurance tasks
- ✅ **USE AGENTS**: When implementing features, fixing bugs, or making architectural changes
- ❌ **Don't handle directly**: Complex implementation tasks without agent expertise
- ❌ **Don't handle directly**: Multi-step development work that requires specialized knowledge

**When to use agents vs. handling directly**:
- **Use agents**: Implementation, debugging, architecture, testing, documentation
- **Handle directly**: Simple file reads, answering questions, explaining code, quick fixes

### Backend Development Agent

**Agent**: `backend-expert`

**USE THIS AGENT FOR ALL BACKEND WORK**

**Capabilities**:
- API endpoint implementation and architecture
- Database schema design and Prisma operations
- Service layer business logic
- Hono route configuration and middleware
- Clerk authentication integration
- Backend testing with Jest
- System architecture decisions
- Performance optimization
- Security reviews

**When to invoke (ALWAYS for backend work)**:
- ✅ Implementing new API features or endpoints
- ✅ Designing database migrations or schema changes
- ✅ Debugging backend issues or authentication problems
- ✅ Reviewing backend code for best practices
- ✅ Writing or updating service layer functions
- ✅ Creating or modifying Hono routes
- ✅ Working with Prisma models or queries
- ✅ Adding or updating validation schemas

### Frontend Development Agent

**Agent**: `frontend-expert`

**USE THIS AGENT FOR ALL MOBILE/UI WORK**

**Capabilities**:
- React Native component implementation
- Expo features and mobile-specific functionality
- Mobile UI/UX design and implementation
- Navigation and routing with Expo Router
- TanStack Query state management
- NativeWind styling and responsive design
- Mobile app optimization
- API integration from mobile app
- Form handling and validation

**When to invoke (ALWAYS for frontend work)**:
- ✅ Building new mobile screens or components
- ✅ Implementing mobile-specific features
- ✅ Debugging mobile UI or navigation issues
- ✅ Optimizing mobile app performance
- ✅ Integrating with backend APIs
- ✅ Styling with NativeWind/Tailwind
- ✅ Managing client-side state with TanStack Query
- ✅ Working with Expo Router navigation

### Code Quality Agent

**Agent**: `code-quality-enforcer`

**USE THIS AGENT AFTER IMPLEMENTATION OR BEFORE COMMITS**

**Capabilities**:
- Validating code changes before commits
- Running pre-commit checks (format, lint, tests)
- TypeScript compilation checking and fixing
- Ensuring adherence to project standards
- Running targeted tests on changed files
- Building shared packages if modified

**When to invoke (ALWAYS after changes)**:
- ✅ After completing implementation work
- ✅ Before creating commits or pull requests
- ✅ When preparing code for review
- ✅ After fixing bugs or making changes
- ✅ When TypeScript errors need resolution

**Quality checks performed**:
1. TypeScript compilation: `npx tsc --noEmit` (fix all TS errors)
2. Format and lint: `pnpm exec biome check --write .`
3. Tests on changed code:
   - If API changes: `pnpm --filter @nv-internal/api test` (specific tests if possible)
   - If mobile changes: Test relevant screens/components only
4. Build shared packages if modified:
   - `pnpm --filter @nv-internal/prisma-client build`
   - `pnpm --filter @nv-internal/validation build`

**Important**: Only test changed files/modules unless full codebase testing is explicitly requested

### Documentation Tracking Agent

**Agent**: `task-doc-tracker`

**USE THIS AGENT FOR ALL DOCUMENTATION WORK**

**Capabilities**:
- Creating and maintaining task documentation in `.claude/tasks/`
- Tracking implementation progress and requirements
- Updating v1 feature plans in `.claude/plans/v1/`
- Extracting learnings and updating documentation
- Ensuring project knowledge is preserved
- Linking tasks to feature plans
- Documenting architectural decisions

**When to invoke (PROACTIVELY)**:
- ✅ Starting new feature development
- ✅ Completing implementations
- ✅ After significant code changes
- ✅ Before and after implementing v1 planned features
- ✅ When architectural decisions are made
- ✅ When patterns should be documented
- ✅ When updating enhancement ideas

**Documentation flow**:
1. Plan feature → Create task file
2. Implement → Update progress in task file
3. Complete → Mark as ✅, update v1 plan status
4. Extract learnings → Update documentation with patterns

### Agent Workflow Example

**Typical feature implementation flow**:

1. **Documentation Setup**: Launch `task-doc-tracker` to create task file
2. **Implementation**: Launch `backend-expert` or `frontend-expert` for implementation
3. **Quality Assurance**: Launch `code-quality-enforcer` to verify changes
4. **Documentation Update**: Launch `task-doc-tracker` to mark complete and extract learnings

## Key Architecture Patterns

For detailed patterns, see [Architecture Patterns](./docs/architecture/patterns/). Key patterns include:

- **[Route Organization](./docs/architecture/patterns/route-organization.md)** - RESTful route structure and mounting
- **[GPS Verification](./docs/architecture/patterns/gps-verification.md)** - Accurate distance calculations
- **[Activity-Based Events](./docs/architecture/patterns/activity-event.md)** - Unified event logging
- **[Error Handling](./docs/architecture/patterns/error-handling.md)** - HTTPException usage
- **[Authentication](./docs/architecture/patterns/auth-middleware.md)** - Security best practices
- **[Payment Transactions](./docs/architecture/patterns/payment-transactions.md)** - Serverless-safe transactions
- **[File Uploads](./docs/architecture/patterns/file-upload.md)** - Hono RPC limitations
- **[Cache Invalidation](./docs/architecture/patterns/cache-invalidation.md)** - TanStack Query patterns
- **[Timezone Handling](./docs/architecture/patterns/timezone-handling.md)** - Modern TZDate for accurate date boundaries

### API Structure

- **Routes**: All routes in `apps/api/src/v1/` with authentication middleware from `@hono/clerk-auth`
- **Services**: Business logic in service files (`*.service.ts`)
- **Validation**: Use Zod schemas from `@nv-internal/validation`
- **Database**: Use Prisma client from `@nv-internal/prisma-client`
- **Testing**: Jest tests in `__tests__/` directories alongside source files
- **Transactions**: Use transactions for multi-model operations
- **Activity Logging**: Log all state changes to Activity table
- **Pagination**: Use cursor-based pagination for lists
- **Authentication**: Optimized to use JWT claims (see [Auth Optimization](./docs/architecture/patterns/auth-optimization.md))

### Mobile App Structure

- **Routing**: Expo Router file-based routing in `apps/mobile/app/`
- **Authentication**: Clerk SDK with protected routes using auth state
- **API Calls**: Use `callHonoApi` utility for type-safe API calls
- **State Management**: TanStack Query with aggressive caching (1 week gcTime)
- **Styling**: NativeWind (Tailwind for React Native) with sorted classes
  - **className Composition**: Use the `cn` utility from `@/lib/utils` for composing classNames with conditional logic
  - The `cn` utility combines `clsx` and `tailwind-merge` to properly merge and deduplicate Tailwind classes
- **Forms**: Present forms and inputs as modals
- **Components**: Follow existing component structure in `components/` directory
- **Accessibility**: All interactive elements have proper accessibility props (see [Mobile-MCP Testing](./docs/testing/mobile-mcp.md))

### Database Schema

- **Models**: Task, Customer, GeoLocation, Activity, Attachment, Payment
- **IDs**: Use prefixed IDs for readability (cust*, geo*, act_*, pay_*)
- **Task Status**: PREPARING → READY → IN_PROGRESS → ON_HOLD → COMPLETED
- **Client**: Generated to `packages/prisma-client/generated/`

## Library Documentation

**IMPORTANT**: Always use the **context7 MCP** to fetch the latest library documentation instead of relying on knowledge cutoff.

### When to Use Context7 MCP

Use context7 MCP tools for:
- ✅ Checking latest API changes and features
- ✅ Verifying correct usage patterns
- ✅ Finding code examples from official docs
- ✅ Ensuring compatibility with current versions
- ✅ Discovering new features or deprecations

### How to Use Context7

1. **Resolve Library ID** (first time for each library):
   ```
   mcp__context7__resolve-library-id
   libraryName: "prisma" (or "next.js", "hono", etc.)
   ```

2. **Get Documentation**:
   ```
   mcp__context7__get-library-docs
   context7CompatibleLibraryID: "/prisma/docs" (from step 1)
   topic: "transactions" (optional, to focus on specific topic)
   tokens: 5000 (optional, default is 5000)
   ```

### Common Libraries in This Project

When working with these libraries, ALWAYS check context7 first:
- **Hono**: Web framework for API routes
- **Prisma**: Database ORM and client
- **React Native**: Mobile app framework
- **Expo**: React Native tooling and SDK
- **TanStack Query**: Data fetching and caching
- **Clerk**: Authentication
- **Zod**: Schema validation
- **date-fns-tz**: Timezone handling

### Example Workflow

```
User: "How do I use Prisma transactions?"
Assistant: Let me check the latest Prisma documentation...
1. Uses mcp__context7__resolve-library-id with "prisma"
2. Uses mcp__context7__get-library-docs with topic "transactions"
3. Provides accurate answer based on latest docs
```

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

## Development Commands

For complete command reference, see [Development Commands](./docs/development/commands.md).

**Quick reference**:
```bash
# Root commands
pnpm install              # Install dependencies
pnpm test                 # Run all tests
pnpm biome:check          # Format and lint

# API development
npx vc dev                # Start API server (from root)
pnpm --filter @nv-internal/api test  # Run API tests

# Mobile development
pnpm dev                  # Start Expo (from apps/mobile/)
pnpm ios                  # Run on iOS
pnpm android              # Run on Android
```

## Task Documentation

**IMPORTANT**: When implementing features or fixes, always document your work in `.claude/tasks/`:

1. **Create Task Files**: Use format `YYYYMMDD-HHMMSS-description.md` for descending sort by creation time
   - Date and time in UTC
   - Example: `20251022-224500-fix-attachment-counting-and-ui.md`

2. **Keep Documentation Updated**: Update task files throughout the implementation process
   - Document problem analysis
   - Track implementation steps and progress
   - Record testing results and decisions made
   - Note any deviations from the original plan

3. **Benefits**:
   - Provides audit trail of changes
   - Helps onboard team members
   - Documents architectural decisions
   - Makes it easy to review past implementations

## V1 Feature Planning

**IMPORTANT**: Before implementing v1 features, review and improve the plans in `.claude/plans/v1/`:

### Planning Structure

- **Master Plan**: `.claude/plans/v1/README.md` - Navigation, progress tracking, timeline
- **Feature Plans**: Detailed specifications for each major feature
  - `01-payment-system.md` - Payment tracking & invoices
  - `02-checkin-checkout.md` - GPS-verified check-in/out
  - `03-monthly-reports.md` - Employee performance reports
  - `04-task-crud.md` - Edit/delete tasks
  - `05-employee-management.md` - Profile updates & deletion

### Before Implementation

1. **Review the feature plan** - Read the complete specification
2. **Brainstorm improvements** - Identify edge cases, security issues, performance concerns
3. **Update the plan** - Document improvements before writing code
4. **Create task file** - Link task documentation to the v1 plan
5. **Implement** - Follow the improved plan
6. **Update status** - Mark plan sections as completed

### Linking Plans to Tasks

When creating task files for v1 features:
- Reference the plan file: "Implements Phase 1 from `.claude/plans/v1/01-payment-system.md`"
- Note any deviations from the plan with rationale
- Update plan status when task is completed

## Enhancement Ideas Documentation

**For future features and optimizations not in v1 scope**, document in `.claude/enhancements/`:

### When to Create Enhancement Documentation
- Performance optimizations discovered during development
- UX improvements suggested by users or identified during testing
- Technical debt reduction opportunities
- Feature extensions beyond v1 requirements
- Edge case handling improvements

See `.claude/enhancements/` for detailed specifications and `.claude/enhancements/20251024-120300-enhancement-priorities.md` for priority roadmap.

## Backend Architecture Refactoring (Planned)

**Status**: 📋 Planning complete, awaiting team approval

A comprehensive backend refactoring plan has been created to improve code quality, maintainability, and align with SOLID principles while optimizing for Hono + Vercel serverless environments.

### Documentation

- **Full Plan**: `.claude/tasks/20251024-212000-backend-refactoring-plan-solid.md`
- **Executive Summary**: `.claude/tasks/REFACTORING-EXECUTIVE-SUMMARY.md`
- **Timeline**: 18-20 weeks (Week 0 + Phases 0-6)

### When to Apply

**Not yet implemented** - This is a planned architectural improvement. Current code should follow existing patterns documented in this file and `docs/architecture/patterns/`. Post-refactoring, new patterns will replace current service layer implementation.

## Important File Locations

- **API Routes**: `apps/api/src/v1/*/` (route.ts and service.ts files)
- **Mobile Screens**: `apps/mobile/app/` (file-based routing)
- **Database Schema**: `apps/api/prisma/schema.prisma`
- **Shared Validation**: `packages/validation/`
- **Shared Prisma Client**: `packages/prisma-client/`
- **Architecture Patterns**: `docs/architecture/patterns/` (detailed implementation patterns)
- **Development Guides**: `docs/development/` (setup, commands, workflows)
- **Testing Guides**: `docs/testing/` (testing strategies)
- **Task Documentation**: `.claude/tasks/` (implementation tracking)
- **V1 Feature Plans**: `.claude/plans/v1/` (detailed feature specifications & roadmap)
- **Enhancement Ideas**: `.claude/enhancements/` (future features & optimizations)
- **Refactoring Plans**: `.claude/tasks/REFACTORING-*.md` (architecture refactoring documentation)

## Project Scale Context

- **Team Size**: Small business (< 50 users)
- **Industry**: Air conditioning services in Vietnam
- **Platform**: Mobile-first for field workers
- **Features**: Task management, check-in/check-out, location tracking, photo attachments

## Environment Setup

For complete setup guide, see [Environment Setup](./docs/development/setup.md).

**Quick start**:
1. Install pnpm package manager
2. Clone repository and run `pnpm install`
3. Set up environment variables (see .env.example files)
4. For local database: Start Docker Compose in `apps/api/`
5. Start API with `npx vc dev` from root
6. Start mobile app with `pnpm dev` in `apps/mobile/`
