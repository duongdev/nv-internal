# NV Internal API

Backend REST API for the NV Internal task management system.

## Prerequisites

- [Vercel CLI](https://vercel.com/docs/cli) installed globally
- [pnpm](https://pnpm.io/) package manager
- Node.js 18+

## Development

To develop locally:

```bash
pnpm install
vc dev
```

Open http://localhost:3000

To build locally:

```bash
pnpm install
vc build
```

## Testing

**IMPORTANT**: All tests use mocks and do NOT connect to the real database. This ensures tests are:
- Fast (no network overhead)
- Isolated (no data corruption)
- Safe (never touch production/development data)

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with verbose output
pnpm test:verbose

# Run tests with coverage
pnpm test:coverage
```

### Test Architecture

All tests use the **mock-based approach** for database operations:

1. **Mock Prisma Client**: Tests use `createMockPrismaClient()` from `src/test/prisma-mock.ts`
2. **Mock Authentication**: Tests use `createMockAdminUser()` and `createMockWorkerUser()` from `src/test/mock-auth.ts`
3. **No Real Database**: Tests never connect to PostgreSQL or any external database

### Safety Guarantees

✅ **Safe to run anytime**: Tests never create or delete real data
✅ **Fast execution**: All tests complete in under 2 seconds
✅ **No cleanup needed**: No database state to reset
✅ **Parallel execution**: Tests can run concurrently without conflicts

### Test File Structure

```
src/
├── v1/
│   ├── task/
│   │   ├── __tests__/
│   │   │   ├── task.service.test.ts       # Uses mocks
│   │   │   ├── task-search.service.test.ts # Uses mocks
│   │   │   └── task.route.test.ts         # Uses mocks
│   │   ├── task.service.ts
│   │   └── route.ts
│   └── ...
└── test/
    ├── prisma-mock.ts    # Mock Prisma client factory
    └── mock-auth.ts      # Mock user factory
```

### Writing New Tests

When adding new tests, ALWAYS use mocks:

```typescript
// ❌ WRONG: Using real Prisma client
import { getPrisma } from '../../../lib/prisma'
const prisma = getPrisma()

// ✅ CORRECT: Using mock Prisma client
import { createMockPrismaClient, resetPrismaMock } from '../../../test/prisma-mock'

const mockPrisma = createMockPrismaClient()
jest.mock('../../../lib/prisma', () => ({
  getPrisma: () => mockPrisma,
}))

beforeEach(() => {
  resetPrismaMock(mockPrisma)
})
```

## Deployment

To deploy:

```bash
pnpm install
vc deploy
```
