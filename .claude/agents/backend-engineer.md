# Backend Engineer Agent

**Agent**: `backend-engineer`

**USE THIS AGENT FOR ALL BACKEND WORK**

## Overview

The backend-engineer agent is your expert for all server-side development, API design, database operations, and backend architecture decisions in the NV Internal project.

## Capabilities

- API endpoint implementation and architecture
- Database schema design and Prisma operations
- Service layer business logic
- Hono route configuration and middleware
- Clerk authentication integration
- Backend testing with Jest
- System architecture decisions
- Performance optimization
- Security reviews

## When to Invoke (ALWAYS for backend work)

Invoke this agent for:

- ✅ Implementing new API features or endpoints
- ✅ Designing database migrations or schema changes
- ✅ Debugging backend issues or authentication problems
- ✅ Reviewing backend code for best practices
- ✅ Writing or updating service layer functions
- ✅ Creating or modifying Hono routes
- ✅ Working with Prisma models or queries
- ✅ Adding or updating validation schemas

## Project-Specific Context

The backend-engineer agent is configured with generic backend development expertise. When working on this project, it needs to be aware of these NV Internal-specific details:

### Technology Stack

- **Framework**: Hono-based REST API
- **Database**: PostgreSQL via Neon (serverless)
- **ORM**: Prisma
- **Authentication**: Clerk with @hono/clerk-auth middleware
- **Deployment**: Vercel serverless functions
- **Validation**: Zod schemas in `@nv-internal/validation` package
- **Testing**: Jest with ts-jest preset, mock-based (no real database)

### Project Architecture

- **Monorepo Structure**: pnpm workspaces with apps/api, apps/mobile, and shared packages
- **API Routes**: Located in `apps/api/src/v1/` with service layer pattern
- **Shared Packages**:
  - `@nv-internal/validation` - Zod validation schemas
  - `@nv-internal/prisma-client` - Shared Prisma client
- **Database Schema**: Task management system with prefixed IDs (cust\*, geo\*, act_\*, pay_\*)
- **Authentication**: All routes require Clerk middleware; no public endpoints
- **Testing**: Tests in `__tests__/` directories alongside source files

### Key Implementation Patterns

- Use prefixed IDs for all models (follow patterns: cust\*, geo\*, act_\*, pay_\*)
- Log all state changes to Activity table for audit trails
- Use Prisma transactions for multi-model operations
- Place business logic in `*.service.ts` files, not route handlers
- Define Zod schemas in `@nv-internal/validation` for type safety
- Follow cursor-based pagination for lists
- Use Clerk JWT claims for optimized authentication (see Auth Optimization pattern)

### Quality Standards

- Run `pnpm biome:check --write .` before committing
- Ensure all tests pass: `pnpm --filter @nv-internal/api test`
- Use conventional commit format: `type(scope): description`
- Rebuild shared packages if modified:
  - `pnpm --filter @nv-internal/prisma-client build`
  - `pnpm --filter @nv-internal/validation build`

## Reference Documentation

- **Architecture patterns**: `docs/architecture/patterns/`
- **Testing patterns**: `docs/testing/` and `apps/api/README.md#testing`
- **V1 feature plans**: `.claude/plans/v1/`
- **Database patterns**: `docs/architecture/database-patterns.md`

## Common Workflows

### Implementing a New API Endpoint

1. **Design Phase**
   - Review requirements and existing patterns
   - Design API contract (request/response schemas)
   - Identify database operations needed
   - Consider authentication and authorization

2. **Implementation Phase**
   - Create Zod validation schema in `@nv-internal/validation`
   - Implement service layer logic in `*.service.ts`
   - Create route handler in `apps/api/src/v1/*/route.ts`
   - Add Clerk authentication middleware
   - Log state changes to Activity table if applicable

3. **Testing Phase**
   - Write unit tests for service layer
   - Write integration tests for route handler
   - Mock Prisma client using `createMockPrismaClient()`
   - Verify all tests pass

4. **Quality Check**
   - Run TypeScript compiler: `npx tsc --noEmit`
   - Run Biome checks: `pnpm biome:check --write .`
   - Rebuild shared packages if modified
   - Invoke `code-quality-enforcer` agent for final validation

### Database Schema Changes

1. **Design Schema**
   - Follow prefixed ID patterns
   - Consider relationships and indexes
   - Plan for Activity logging if needed

2. **Create Migration**
   - Update `schema.prisma`
   - Run `npx prisma migrate dev`
   - Update Zod schemas in `@nv-internal/validation`

3. **Update Code**
   - Update service layer functions
   - Update type definitions
   - Rebuild `@nv-internal/prisma-client` package

4. **Test Changes**
   - Update tests with new schema
   - Verify migrations work correctly

## Best Practices

### Database Operations

- **Always use transactions** for multi-model operations
- **Log to Activity table** for all state changes
- **Use proper indexes** for performance (GIN for arrays, composite for common queries)
- **Follow SearchableText pattern** for multi-field search
- **Use cursor-based pagination** for lists

### API Design

- **RESTful conventions** - Follow standard HTTP methods and status codes
- **Input validation** - Always validate with Zod schemas
- **Error handling** - Use HTTPException from Hono
- **Authentication** - Require Clerk middleware on all routes
- **Documentation** - Add JSDoc comments to service functions

### Testing

- **Mock-based testing** - NEVER use real database in tests
- **Comprehensive coverage** - Test happy paths and error cases
- **Fast tests** - Target <2 seconds for full test suite
- **Isolated tests** - Each test should be independent

### Security

- **Never commit secrets** - Use environment variables
- **Validate all inputs** - Server-side validation with Zod
- **Use transactions** - Prevent partial state updates
- **Audit trail** - Log all important actions to Activity table

## Related Agents

- **frontend-engineer** - For mobile app integration
- **code-quality-enforcer** - For pre-commit validation
- **task-doc-tracker** - For documentation updates
- **qa-ui** - For end-to-end testing

## Quick Reference Links

- [Route Organization Pattern](../../docs/architecture/patterns/route-organization.md)
- [Activity-Based Events Pattern](../../docs/architecture/patterns/activity-event.md)
- [Error Handling Pattern](../../docs/architecture/patterns/error-handling.md)
- [Auth Middleware Pattern](../../docs/architecture/patterns/auth-middleware.md)
- [Payment Transactions Pattern](../../docs/architecture/patterns/payment-transactions.md)
- [API Testing Guide](../../apps/api/README.md#testing)
