# Test Data Isolation Best Practices

This guide explains how to properly manage test data in the NV Internal project to prevent test data from leaking into development or production databases.

## Overview

**CRITICAL**: Test data should NEVER persist beyond test execution. Always clean up test data in `afterEach` or `beforeEach` hooks.

## The Problem (Resolved)

On 2025-10-30, dummy test data was accidentally left in the development database after running integration tests. This happened because:

1. **Test file created data in `beforeEach`**: The test suite in `/apps/api/src/v1/task/__tests__/task-search.service.test.ts` created test customers, geo locations, and tasks
2. **Data was cleaned up in `beforeEach`**: The cleanup ran BEFORE each test, which works during test execution
3. **No cleanup after test suite**: After all tests completed, the data from the last test remained in the database

## The Solution

### ✅ Correct Pattern: Clean Up in Both Places

```typescript
describe('MyFeature', () => {
  // Clean up BEFORE tests
  beforeEach(async () => {
    await prisma.task.deleteMany()
    await prisma.customer.deleteMany()
    await prisma.geoLocation.deleteMany()
  })

  // Clean up AFTER all tests
  afterAll(async () => {
    await prisma.task.deleteMany()
    await prisma.customer.deleteMany()
    await prisma.geoLocation.deleteMany()
  })

  // Your tests...
})
```

### Why Both?

- **`beforeEach`**: Ensures clean state before each test (isolation between tests)
- **`afterAll`**: Removes data after test suite completes (prevents database pollution)

## Database Cleanup Scripts

### Check for Test Data

Run this script to check if test data exists in the database:

```bash
cd apps/api
npx tsx scripts/check-test-data.ts
```

This script identifies:
- Test customers (names like "Nguyễn Văn A", "Trần Thị B")
- Test geo locations (with test coordinates)
- Test tasks (with test titles)
- Related activities, attachments, and payments

### Clean Test Data

If test data is found, clean it up with:

```bash
# Dry run (see what would be deleted)
npx tsx scripts/clean-test-data.ts --dry-run

# Actually delete the data
npx tsx scripts/clean-test-data.ts --confirm
```

**⚠️ WARNING**: This operation is irreversible! Always run dry-run first.

## Test Database Configuration

### Option 1: Separate Test Database (Recommended)

Use a completely separate database for tests:

```env
# .env.test
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mydb_test"
```

Configure Jest to use test environment:

```javascript
// jest.config.js
module.exports = {
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  // ...
}
```

```typescript
// src/test/setup.ts
import { getPrisma } from '../lib/prisma'

// Set test database URL
process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/mydb_test'

beforeAll(async () => {
  // Optionally: Run migrations on test database
})

afterAll(async () => {
  const prisma = getPrisma()
  await prisma.$disconnect()
})
```

### Option 2: Transaction Rollback (Advanced)

Use transactions and rollback to isolate test data:

```typescript
describe('MyFeature', () => {
  let prisma: PrismaClient

  beforeEach(async () => {
    // Start transaction
    prisma = await prisma.$transaction(async (tx) => {
      // Run test with tx
      return tx
    })
  })

  afterEach(async () => {
    // Rollback happens automatically
  })
})
```

**Note**: This approach is complex with Prisma and may not work with all test scenarios.

### Option 3: In-Memory Database (Not Supported)

PostgreSQL doesn't support true in-memory databases. SQLite could be used for unit tests, but:
- ❌ Different SQL dialect (PostgreSQL vs SQLite)
- ❌ Different features (arrays, JSON, extensions)
- ❌ Not representative of production

## Test Data Patterns

### Use Distinctive Test Data

Make test data easily identifiable:

```typescript
// ✅ Good: Clearly test data
const testCustomer = await prisma.customer.create({
  data: {
    name: '[TEST] Nguyễn Văn A',
    phone: '0000000000', // Obviously fake
  },
})

// ❌ Bad: Looks like real data
const customer = await prisma.customer.create({
  data: {
    name: 'John Smith',
    phone: '555-1234',
  },
})
```

### Use Test Prefixes

Add test prefixes to identify test data:

```typescript
const TEST_PREFIX = '[TEST]'

const testCustomer = await prisma.customer.create({
  data: {
    name: `${TEST_PREFIX} Customer Name`,
    phone: '0000000000',
  },
})
```

### Use Date Markers

Use dates in the past or future to identify test data:

```typescript
const testTask = await prisma.task.create({
  data: {
    title: 'Test Task',
    createdAt: new Date('2000-01-01'), // Obviously old
    scheduledAt: new Date('2099-12-31'), // Far future
  },
})
```

## Common Pitfalls

### ❌ Don't: Rely on `beforeEach` Only

```typescript
// BAD: Last test's data remains after suite
describe('MyFeature', () => {
  beforeEach(async () => {
    await prisma.task.deleteMany() // Only cleans BEFORE tests
  })
  // Missing afterAll cleanup
})
```

### ❌ Don't: Use Production Database for Tests

```typescript
// BAD: Tests run against production
const DATABASE_URL = process.env.DATABASE_URL // Could be production!
```

### ❌ Don't: Create Data Without Cleanup

```typescript
// BAD: No cleanup at all
describe('MyFeature', () => {
  it('creates a task', async () => {
    const task = await prisma.task.create({
      data: { title: 'Test' },
    })
    // Task remains in database forever!
  })
})
```

### ✅ Do: Always Clean Up

```typescript
// GOOD: Complete cleanup strategy
describe('MyFeature', () => {
  beforeEach(async () => {
    await prisma.task.deleteMany()
  })

  afterAll(async () => {
    await prisma.task.deleteMany()
  })

  it('creates a task', async () => {
    const task = await prisma.task.create({
      data: { title: '[TEST] Task' },
    })
    expect(task).toBeDefined()
  })
})
```

## Verification Checklist

Before committing test code, verify:

- [ ] Test uses `beforeEach` for clean state
- [ ] Test uses `afterAll` to clean up after suite
- [ ] Test data has distinctive markers (names, dates, etc.)
- [ ] Tests don't use production database
- [ ] Run `check-test-data.ts` to verify no data leaked
- [ ] All tests pass in isolation (`jest --runInBand`)

## CI/CD Considerations

In CI/CD pipelines:

1. **Use ephemeral databases**: Spin up fresh database per run
2. **Clean up after tests**: Ensure cleanup runs even if tests fail
3. **Check for leaked data**: Run `check-test-data.ts` after test suite
4. **Fail build if data leaked**: Treat leaked test data as a test failure

Example GitHub Actions:

```yaml
- name: Run tests
  run: pnpm --filter @nv-internal/api test

- name: Check for leaked test data
  run: |
    cd apps/api
    npx tsx scripts/check-test-data.ts
    # Exit with error if test data found
```

## Historical Context

**When**: 2025-10-30
**Issue**: Test data leaked into development database
**Cause**: Tests used `beforeEach` but not `afterAll` for cleanup
**Impact**: 6 test records (1 customer, 1 geo location, 4 tasks) remained in database
**Resolution**: Created cleanup scripts and updated documentation
**Task**: `.claude/tasks/20251030-HHMMSS-cleanup-test-data.md`

## References

- [Jest Setup and Teardown](https://jestjs.io/docs/setup-teardown)
- [Prisma Testing Guide](https://www.prisma.io/docs/guides/testing)
- Test file: `/apps/api/src/v1/task/__tests__/task-search.service.test.ts`
- Cleanup script: `/apps/api/scripts/clean-test-data.ts`
- Check script: `/apps/api/scripts/check-test-data.ts`
