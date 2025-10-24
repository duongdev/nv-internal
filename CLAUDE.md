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

## Specialized Agent Usage

Claude Code uses specialized agents for different types of work. Understanding when to invoke each agent ensures efficient development:

### Backend Development Agent

**Agent**: `fullstack-backend-expert`

**Use for**:
- API endpoint implementation and architecture
- Database schema design and Prisma operations
- Service layer business logic
- Hono route configuration and middleware
- Clerk authentication integration
- Backend testing with Jest
- System architecture decisions

**When to invoke**:
- Implementing new API features or endpoints
- Designing database migrations
- Debugging backend issues or authentication problems
- Reviewing backend code for best practices

### Mobile Development Agent

**Agent**: `react-native-expert`

**Use for**:
- React Native component implementation
- Expo features and mobile-specific functionality
- Mobile UI/UX design and implementation
- Navigation and routing with Expo Router
- TanStack Query state management
- NativeWind styling and responsive design
- Mobile app optimization

**When to invoke**:
- Building new mobile screens or components
- Implementing mobile-specific features
- Debugging mobile UI or navigation issues
- Optimizing mobile app performance

### Code Quality Agent

**Agent**: `code-quality-enforcer`

**Use for**:
- Validating code changes before commits
- Running pre-commit checks (format, lint, tests)
- **TypeScript compilation checking and fixing**
- Ensuring adherence to project standards
- **IMPORTANT**: Only test changed files/modules unless full codebase testing is explicitly requested

**When to invoke**:
- After completing implementation work
- Before creating commits or pull requests
- When preparing code for review
- **NOT for**: Running entire test suite by default

**Quality checks performed**:
1. TypeScript compilation: `npx tsc --noEmit` (fix all TS errors)
2. Format and lint: `pnpm exec biome check --write .`
3. Tests on changed code:
   - If API changes: `pnpm --filter @nv-internal/api test` (specific tests if possible)
   - If mobile changes: Test relevant screens/components only
4. Build shared packages if modified:
   - `pnpm --filter @nv-internal/prisma-client build`
   - `pnpm --filter @nv-internal/validation build`

### Documentation Tracking Agent

**Agent**: `task-doc-tracker`

**Use for**:
- Creating and maintaining task documentation in `.claude/tasks/`
- Tracking implementation progress and requirements
- Updating v1 feature plans in `.claude/plans/v1/`
- Extracting learnings and updating `CLAUDE.md`
- Ensuring project knowledge is preserved

**When to invoke** (proactively):
- Starting new feature development
- Completing implementations
- After significant code changes
- Before and after implementing v1 planned features
- When architectural decisions are made

**Documentation flow**:
1. Plan feature → Create task file
2. Implement → Update progress in task file
3. Complete → Mark as ✅, update v1 plan status
4. Extract learnings → Update CLAUDE.md with patterns

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

### Pull Requests

**Merge Strategy**: PRs will be **squashed and merged** into the main branch.

**PR Title**: Use semantic commit format for PR titles since they become the final commit message after squashing.

Format: `<type>(<scope>): <description>`

Examples:

- `feat(mobile): add compact attachment list to activity feed`
- `fix(api): resolve database connection timeout issue`
- `refactor(mobile): improve attachment viewer performance`

**PR Description**: Include:

- Summary of changes
- Test plan
- Breaking changes (if any)
- Screenshots/demo (for UI changes)

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
- **Authentication**: Optimized to use JWT claims instead of fetching user data on every request (see Performance Optimization pattern below)

#### Route Organization Pattern

Follow RESTful principles with explicit mounting and clear resource boundaries:

**File Naming Convention:**
- All route files: `{resource}.route.ts` (e.g., `task.route.ts`, `payment.route.ts`)
- Service files: `{resource}.service.ts`
- Test files: `{resource}.route.test.ts`, `{resource}.service.test.ts`

**Route Mounting Pattern:**
```typescript
// apps/api/src/v1/index.ts
export const hono = new Hono()
  .use('*', authMiddleware)

  // Resource-specific routes
  .route('/task', taskApp)           // Task CRUD operations
  .route('/task', taskEventsApp)     // Task events (check-in/out)
  .route('/payment', paymentApp)     // Payment CRUD operations
  .route('/user', userApp)           // User operations
```

**Resource Scoping Rules:**
- Primary resource operations: Mount at `/{resource}` (e.g., `/payment/:id`)
- Sub-resource operations: Mount at parent resource (e.g., `/task/:id/payments`)
- Multiple mounts on same path are allowed for logical grouping (e.g., task and task-events)

**Example: Payment System Routes**
```typescript
// payment.route.ts - mounted at /payment
PUT /v1/payment/:id                    // Update specific payment

// task.route.ts - mounted at /task
GET /v1/task/:id/payments              // List payments for task
PUT /v1/task/:id/expected-revenue      // Set expected revenue
```

**Anti-pattern**: Avoid implicit mounting (`.route('/', app)`) - always be explicit about path prefixes

### GPS Verification Pattern

When implementing location-based features:

- Use Haversine formula for distance calculation (see `apps/api/src/lib/geo.ts`)
- Store coordinates in GeoLocation model
- Set configurable threshold via environment variable (default 100m)
- Return warnings instead of hard failures for UX
- Example: Check-in system allows 100m threshold with warnings

**Anti-pattern**: Don't use simple lat/lng subtraction - it's inaccurate

```typescript
// ✅ Good - Haversine formula
import { calculateDistance } from '@/lib/geo'
const distance = calculateDistance(lat1, lon1, lat2, lon2)

// ❌ Bad - Simple subtraction
const distance = Math.sqrt((lat2-lat1)**2 + (lon2-lon1)**2) // Inaccurate!
```

### Activity-Based Event Pattern

When implementing task events (check-in/out, comments, status changes):

- **Reuse existing Activity model** for all event logging - zero DB changes needed
- Store event-specific data in flexible JSON payload field
- Upload attachments via existing `uploadTaskAttachments` service
- Create abstracted service functions for maximum code reuse (85% typical)
- All events appear in unified activity feed automatically

Example implementations:

```typescript
// Check-in/out events
{
  type: 'CHECK_IN' | 'CHECK_OUT',
  geoLocation: { id, lat, lng },
  distanceFromTask: number,
  attachments: [{ id, mimeType, originalFilename }],
  notes?: string,
  warnings?: string[]
}

// Comment events (new in v1)
{
  type: 'COMMENT',
  comment: 'Máy lạnh đã được vệ sinh',
  attachments?: [{ id, mimeType, originalFilename }],
  mentionedUsers?: ['usr_xxx'] // Future enhancement
}
```

**Benefits of Activity Pattern:**
- ✅ **Zero migrations** for new event types
- ✅ **85% code reuse** between different events
- ✅ Unified feed (all events chronological)
- ✅ Built-in indexing (topic, userId, createdAt)
- ✅ Flexible payload evolves without schema changes

See implementations:
- Check-in/out: `.claude/tasks/20251022-211855-implement-checkin-checkout-system.md`
- Comments: `.claude/tasks/20251023-050349-implement-task-comments.md`

### FormData Validation Pattern

When handling multipart/form-data uploads with Hono and Zod:

**Issue**: FormData sends all values as strings, and file fields can be either single `File` or `File[]`

**Solution**: Use flexible Zod schemas with coercion and transformation:

```typescript
// ✅ Good - Handle both single and multiple files
const schema = z.object({
  // Numeric fields - use coerce for string-to-number conversion
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),

  // File fields - handle both File and File[] with transformation
  files: z
    .union([
      z.instanceof(File),
      z.array(z.instanceof(File))
    ])
    .transform((val) => Array.isArray(val) ? val : [val])
    .pipe(z.array(z.instanceof(File)).min(1).max(10))
})

// ❌ Bad - Assumes files are always arrays
const schema = z.object({
  latitude: z.number(),  // Fails - FormData sends strings
  files: z.array(z.instanceof(File))  // Fails for single file
})
```

**Key Points**:
- Always use `z.coerce.number()` for numeric FormData fields
- Handle both single `File` and `File[]` with union types
- Transform single files to arrays for consistent handling
- Pipe transformed values to final validation

See fix: `.claude/tasks/20251023-054410-implement-checkin-checkout-frontend.md#bug-fixes`

### Service Layer Error Handling Pattern

When implementing service layer functions, always use `HTTPException` for proper error handling:

**Issue**: Throwing plain `Error` objects loses type safety and requires manual error parsing in routes

**Solution**: Use Hono's `HTTPException` for consistent, type-safe error handling:

```typescript
// ✅ GOOD - HTTPException with proper status and message
import { HTTPException } from 'hono/http-exception'

export async function getTask(taskId: number) {
  const task = await prisma.task.findUnique({ where: { id: taskId } })

  if (!task) {
    throw new HTTPException(404, {
      message: 'Không tìm thấy công việc',
      cause: 'TASK_NOT_FOUND'
    })
  }

  return task
}

// ❌ BAD - Plain Error with custom status property
export async function getTask(taskId: number) {
  const task = await prisma.task.findUnique({ where: { id: taskId } })

  if (!task) {
    const err = new Error('TASK_NOT_FOUND') as Error & { status?: number }
    err.status = 404
    throw err  // Route must manually parse this!
  }

  return task
}
```

**Benefits**:
- ✅ Type-safe error handling
- ✅ Automatic status code propagation
- ✅ Consistent error structure
- ✅ Vietnamese error messages for users
- ✅ Error cause for debugging

See implementation guide: `.claude/tasks/20251023-160800-backend-code-quality-improvements.md`

### Authentication Middleware Pattern

**CRITICAL**: Never silently handle authentication failures - always throw proper errors:

```typescript
// ✅ GOOD - Throw on Clerk API failure
try {
  const user = await clerkClient.users.getUser(auth.userId)
  c.set('user', user)
  c.header('x-user-id', auth.userId)
} catch (error) {
  logger.error({ error, userId: auth.userId }, 'Failed to fetch user from Clerk')
  throw new HTTPException(401, {
    message: 'Không thể xác thực người dùng. Vui lòng đăng nhập lại.',
    cause: error
  })
}

// ❌ BAD - Silent fallback creates security vulnerability
try {
  const user = await clerkClient.users.getUser(auth.userId)
  c.set('user', user)
} catch (error) {
  // DANGER: Empty publicMetadata means no roles!
  c.set('user', { id: auth.userId, publicMetadata: {} })
}
```

**Security Risk**: Empty `publicMetadata` means no roles, which could bypass authorization checks!

### Logger Pattern

Use lazy logger instantiation for better performance:

```typescript
// ✅ GOOD - Create logger only when needed
.post('/', async (c) => {
  try {
    const result = await doSomething()
    return c.json(result)
  } catch (error) {
    const logger = getLogger('module.file:operation')  // Only on error
    logger.error({ error, context }, 'Operation failed')
    throw error
  }
})

// ❌ BAD - Always create logger even if not used
.post('/', async (c) => {
  const logger = getLogger('module:operation')  // Created even if not needed
  try {
    const result = await doSomething()
    return c.json(result)  // Logger never used here
  } catch (error) {
    logger.error({ error }, 'Operation failed')
    throw error
  }
})
```

**Logger Naming Convention**: Use `module.file:operation` format for consistent log filtering

### Reusable Utilities Pattern

Extract common logic into utilities to follow DRY principle:

#### Storage Provider Factory
```typescript
// apps/api/src/lib/storage/get-storage-provider.ts
import { LocalDiskProvider } from './local-disk.provider'
import { VercelBlobProvider } from './vercel-blob.provider'
import type { StorageProvider } from './storage.types'

export function getStorageProvider(): StorageProvider {
  const provider = process.env.STORAGE_PROVIDER || 'vercel-blob'

  if (provider === 'local' || provider === 'local-disk') {
    return new LocalDiskProvider()
  }

  return new VercelBlobProvider()
}

// Usage - replaces duplicate initialization logic
const storage = getStorageProvider()
```

#### Base64 File Conversion
```typescript
// apps/api/src/lib/file-utils.ts
interface Base64Attachment {
  data: string
  mimeType: string
  filename: string
}

export function convertBase64AttachmentsToFiles(
  attachments: Base64Attachment[]
): File[] {
  return attachments.map((att) => {
    const buffer = Buffer.from(att.data, 'base64')
    const blob = new Blob([buffer], { type: att.mimeType })
    return new File([blob], att.filename, { type: att.mimeType })
  })
}
```

#### Reusable Param Validators
```typescript
// packages/validation/src/params.zod.ts
export const zNumericIdParam = z.object({
  id: z.string()
    .regex(/^\d+$/, 'ID must be numeric')
    .transform((val) => parseInt(val, 10))
})

// Usage - ensures param is number, not string
.get('/:id', zValidator('param', zNumericIdParam), async (c) => {
  const { id } = c.req.valid('param')  // id is number!
  // No more parseInt needed
})
```

**Benefits**:
- ✅ Single source of truth
- ✅ Easier to add new providers/features
- ✅ Type-safe param handling
- ✅ Reduces code duplication

### Payment System Transaction Pattern

When implementing checkout with payment collection, follow this critical pattern to prevent serverless timeouts:

**Problem**: Uploading files inside Prisma transactions can cause timeout (Vercel limit: 10s hobby, 60s pro)

**Solution**: Upload files BEFORE transaction, then perform atomic database operations:

```typescript
// ✅ CORRECT: Upload files BEFORE transaction
export async function checkOutWithPayment({
  taskId, userId, checkoutFiles, invoiceFile, storage
}) {
  // Step 1: Upload files BEFORE transaction (prevents timeout)
  const checkoutAttachments = checkoutFiles
    ? await uploadTaskAttachments({
        taskId, files: checkoutFiles, storage, userId, category: 'CHECKOUT'
      })
    : []

  const invoiceAttachment = invoiceFile
    ? (await uploadTaskAttachments({
        taskId, files: [invoiceFile], storage, userId, category: 'INVOICE'
      }))[0]
    : null  // Invoice is OPTIONAL

  // Step 2: Atomic transaction with timeout configuration
  const result = await prisma.$transaction(async (tx) => {
    // Atomic status update - prevents race conditions
    const task = await tx.task.update({
      where: {
        id: taskId,
        status: 'IN_PROGRESS'  // Condition prevents concurrent checkout
      },
      data: { status: 'COMPLETED', completedAt: new Date() }
    })

    if (!task) {
      throw new HTTPException(409, {
        message: 'Công việc đã được checkout bởi người khác',
        cause: 'CONCURRENT_CHECKOUT'
      })
    }

    // Create payment if collected (using pre-uploaded attachment IDs)
    if (paymentData.paymentCollected) {
      const payment = await tx.payment.create({
        data: {
          taskId,
          amount: paymentData.paymentAmount,
          invoiceAttachmentId: invoiceAttachment?.id,  // OPTIONAL
          // ... other fields
        }
      })

      // Log payment activity
      await createActivity({
        action: 'PAYMENT_COLLECTED',
        payload: { hasInvoice: !!invoiceAttachment }
      }, tx)
    }

    return { task, payment }
  }, {
    timeout: 10000,   // 10s for serverless environment
    maxWait: 5000,    // Max 5s wait for lock
  })
}

// ❌ WRONG: Uploading files inside transaction causes timeout
await prisma.$transaction(async (tx) => {
  const attachments = await uploadTaskAttachments(...)  // TIMEOUT RISK!
  await tx.payment.create({ invoiceAttachmentId: attachments[0].id })
})
```

**Key Implementation Requirements:**
- ✅ Upload files before transaction (prevents timeout)
- ✅ Atomic task status update with conditional `where` clause (prevents race conditions)
- ✅ Use pre-uploaded attachment IDs inside transaction
- ✅ Configure transaction timeout (10s for serverless)
- ✅ Invoice attachment is nullable/optional (trust workers)
- ✅ Activity logging includes audit trail with change history

**Database Schema for Payment System:**
```prisma
model Payment {
  id                  String      @id @default(cuid())
  amount              Decimal     @db.Decimal(15, 4)  // GAAP-compliant precision
  currency            String      @default("VND")     // ISO 4217 code
  invoiceAttachmentId String?                         // OPTIONAL invoice
  invoiceAttachment   Attachment? @relation(...)
  // ... other fields
}

model Task {
  expectedRevenue  Decimal?  @db.Decimal(15, 4)  // Admin sets expected amount
  expectedCurrency String    @default("VND")
  payments         Payment[]                      // Auto-created at checkout
}
```

**Race Condition Prevention:**
The atomic status update ensures only one worker can complete the checkout:
```typescript
// First worker: succeeds
const task = await tx.task.update({
  where: { id: 123, status: 'IN_PROGRESS' },
  data: { status: 'COMPLETED' }
})  // ✅ Returns updated task

// Second worker (concurrent): fails
const task = await tx.task.update({
  where: { id: 123, status: 'IN_PROGRESS' },  // No longer IN_PROGRESS!
  data: { status: 'COMPLETED' }
})  // ❌ Returns null, throw 409 Conflict
```

See implementation: `.claude/plans/v1/01-payment-system.md`

### Hono RPC File Upload Limitation Pattern

When implementing file uploads with Hono RPC client in React Native:

**Issue**: Hono RPC client doesn't support FormData/file uploads properly

**Current Limitation**: Server uploads are limited to **4.5 MB** due to Vercel serverless function request body constraints. Files larger than this will receive `FUNCTION_PAYLOAD_TOO_LARGE` error.

**Future Solution**: Client-side direct upload to Vercel Blob is documented in `.claude/enhancements/20251024-180000-client-side-direct-upload-optimization.md` which will:
- Remove the 4.5 MB limit (enable up to 5 TB uploads)
- Save $0.05/GB bandwidth costs
- Provide upload progress tracking
- Eliminate timeout risks

**Current Solution**: Use raw fetch API for endpoints that accept file uploads:

```typescript
// ❌ BAD - Hono RPC doesn't handle FormData with files
import { hc } from 'hono/client'
const client = hc<AppType>(API_URL)

const formData = new FormData()
formData.append('file', imageFile)
formData.append('data', JSON.stringify(data))

// This will fail with 400 error or type mismatch
await client.v1.resource[':id'].$put({
  param: { id },
  form: formData  // Doesn't work!
})

// ✅ GOOD - Use raw fetch for file uploads
const formData = new FormData()
formData.append('file', imageFile)
formData.append('data', JSON.stringify(data))

const response = await fetch(`${API_URL}/v1/resource/${id}`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${await getToken()}`
  },
  body: formData
})

if (!response.ok) {
  const error = await response.json()
  throw new Error(error.message || 'Upload failed')
}

const result = await response.json()
```

**When to use raw fetch**:
- ✅ Any endpoint accepting file uploads
- ✅ Multipart form data with binary content
- ✅ Image/document uploads

**When Hono RPC works fine**:
- ✅ JSON payloads
- ✅ Query parameters
- ✅ Simple form data (no files)

See implementation: `.claude/tasks/20251024-payment-system-mobile-frontend.md#session-2-bug-fixes`

### Cache Invalidation Pattern

When performing mutations that affect multiple queries in React Native:

```typescript
// ✅ Good - Invalidate all affected queries after mutation
const queryClient = useQueryClient();

const mutation = useMutation({
  mutationFn: async (data) => {
    // Perform mutation
    return response;
  },
  onSuccess: () => {
    // Invalidate all affected queries
    queryClient.invalidateQueries({ queryKey: ['task', taskId] });
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    queryClient.invalidateQueries({ queryKey: ['activities', `TASK_${taskId}`] });
  }
});

// ❌ Bad - Forgetting to invalidate queries
const mutation = useMutation({
  mutationFn: async (data) => { /* ... */ },
  // Missing onSuccess - UI won't update!
});
```

**Key Query Patterns**:
- Task details: `['task', taskId]`
- Task list: `['tasks']`
- Activity feed: `['activities', topicId]`
- Always invalidate all related queries to ensure UI consistency

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

### Authentication Performance Optimization

**✅ Optimization Implemented:** Custom JWT Claims

We've configured Clerk to include `publicMetadata` in session tokens, **eliminating the need to fetch user data from Clerk API on every request**.

**Custom claims configuration** (Clerk Dashboard → Sessions → Customize session token):

```json
{
  "metadata": {
    "roles": "{{user.public_metadata.roles}}",
    "phoneNumber": "{{user.public_metadata.phoneNumber}}",
    "defaultPasswordChanged": "{{user.public_metadata.defaultPasswordChanged}}"
  }
}
```

**Implementation** (see `apps/api/src/v1/middlewares/auth.ts`):

```typescript
// Read user metadata from JWT session claims (fast)
const sessionClaims = auth.sessionClaims as CustomJwtSessionClaims

const user: Partial<User> = {
  id: auth.userId,
  publicMetadata: sessionClaims.metadata || {
    roles: [],
    defaultPasswordChanged: false
  }
}
```

**Performance improvement:**
- **Before:** Development ~2000ms, Production ~300-500ms per request
- **After:** Development ~100ms, Production ~50ms per request
- **Improvement:** 95% faster in dev, 90% faster in prod

**Key benefits:**
- ✅ No external API calls in auth middleware
- ✅ Authorization checks use JWT claims directly
- ✅ Minimal user object with only needed fields
- ✅ Backward compatible (graceful fallback for old sessions)

**Trade-offs:**
- Role changes require JWT refresh (~1 minute for automatic refresh)
- For immediate effect, user must logout/login
- Acceptable for role changes (rare administrative operation)

**TypeScript types** (see `apps/api/src/types/globals.d.ts`):

```typescript
interface CustomJwtSessionClaims {
  metadata?: UserPublicMetadata
}
```

**Cookie size:** ~100 bytes added (well under 1.2KB limit)

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

3. **Task File Structure**:

   ```markdown
   # Task Title

   ## Overview

   Brief description of the task

   ## Implementation Status

   ⏳ In Progress / ✅ Completed

   ## Problem Analysis

   Detailed analysis of the issue

   ## Implementation Plan

   - [ ] Step 1
   - [ ] Step 2

   ## Testing Scenarios

   Test cases and results

   ## Notes

   Important decisions and context
   ```

4. **Benefits**:
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

### Enhancement File Structure
```markdown
# Enhancement Title

## Overview
What and why

## Implementation Status
⏳ Not Started / 📋 Planned / 🔄 In Progress / ✅ Completed

## Problem Analysis
Current behavior and pain points

## Proposed Solution
Technical approach

## Implementation Plan
Phases and steps

## Benefits
User and technical benefits

## Priority
Critical / High / Medium / Low

## Estimated Effort
Development time estimate
```

### Examples of Enhancements
- **Performance**: Location prefetching for instant check-in/out
- **UX**: Offline mode with sync queue
- **Technical**: Migration to React Query v5
- **Feature**: Batch task assignment

## Future Optimizations & Known Limitations

### File Upload Optimization (Post-v1)

**Current Limitation**: File uploads limited to 4.5 MB due to Vercel serverless constraints

**Planned Solution**: Client-side direct upload to Vercel Blob
- Implementation plan: `.claude/enhancements/20251024-180000-client-side-direct-upload-optimization.md`
- Removes 4.5 MB limit (enables up to 5 TB uploads)
- Saves $0.05/GB bandwidth costs
- Provides upload progress tracking
- Better reliability and performance

### Other Documented Enhancements

See `.claude/enhancements/` for detailed specifications:
- Pull-to-refresh improvements
- Search and filter system
- E2E testing strategy
- Location prefetch optimization

Priority roadmap: `.claude/enhancements/20251024-120300-enhancement-priorities.md`

## Backend Architecture Refactoring (Planned)

**Status**: 📋 Planning complete, awaiting team approval

A comprehensive backend refactoring plan has been created to improve code quality, maintainability, and align with SOLID principles while optimizing for Hono + Vercel serverless environments.

### Refactoring Principles (Post-Implementation)

**Core Architecture**:
- Request-scoped dependency injection (not singleton)
- Selective repository pattern (complex queries only)
- No controller layer (idiomatic Hono)
- Lazy service initialization
- Upload files BEFORE transactions

**Key Patterns**:

#### Request-Scoped DI Container
```typescript
// Hono Context provides request-scoped dependencies
export function createRequestContainer(c: Context): Container {
  const prisma = getPrisma()  // Singleton connection pool
  const user = c.get('user')  // Request-specific

  return {
    get taskService() {
      return new TaskService(/* lazy init */)
    }
  }
}
```

#### Selective Repository Pattern
```typescript
// ✅ Repository for complex queries
taskRepo.findCompleteTask(id)  // 5+ includes

// ✅ Direct Prisma for simple CRUD
prisma.task.findUnique({ where: { id } })
```

#### Unified Error Handling
```typescript
// AppError hierarchy for consistent errors
throw new NotFoundError('Task')  // 404
throw new ForbiddenError('Permission denied')  // 403
throw new ValidationError('Invalid data', errors)  // 400
```

#### Stateless Authorization Service
```typescript
// Pass user to methods, not constructor
authService.canCreateTask(user)
authService.canViewTask(user, task)
```

### Performance Targets

- **Cold Start**: <200ms (p95)
- **Memory Usage**: <800MB peak
- **Bundle Size**: +50% max increase
- **Test Coverage**: 60% → 70%
- **Code Duplication**: <20%

### Documentation

- **Full Plan**: `.claude/tasks/20251024-212000-backend-refactoring-plan-solid.md`
- **Executive Summary**: `.claude/tasks/REFACTORING-EXECUTIVE-SUMMARY.md`
- **Timeline**: 18-20 weeks (Week 0 + Phases 0-6)
- **Expert Review**: 3 specialized agents (backend, documentation, quality)

### When to Apply

**Not yet implemented** - This is a planned architectural improvement. Current code should follow existing patterns documented above. Post-refactoring, these new patterns will replace current service layer implementation.

## Important File Locations

- **API Routes**: `apps/api/src/v1/*/` (route.ts and service.ts files)
- **Mobile Screens**: `apps/mobile/app/` (file-based routing)
- **Database Schema**: `apps/api/prisma/schema.prisma`
- **Shared Validation**: `packages/validation/`
- **Shared Prisma Client**: `packages/prisma-client/`
- **Task Documentation**: `.claude/tasks/` (implementation tracking)
- **V1 Feature Plans**: `.claude/plans/v1/` (detailed feature specifications & roadmap)
- **Enhancement Ideas**: `.claude/enhancements/` (future features & optimizations)
- **Refactoring Plans**: `.claude/tasks/REFACTORING-*.md` (architecture refactoring documentation)
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
