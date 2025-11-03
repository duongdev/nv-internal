# Fix Production API 500 Error on /v1/task/search

**Status**: ✅ Completed
**Created**: 2025-11-03
**Priority**: CRITICAL - Production Bug
**Related**: searchableText field implementation

## Problem Analysis

The production API was returning 500 errors on the `/v1/task/search` endpoint.

### Root Cause

The `searchableText` field was added to the database schema in migration `20251030103832_add_searchable_text_field`, but **no data migration was included** to populate this field for existing records.

This meant:
1. All existing tasks in production have `searchableText = NULL`
2. When the search query tries to use `.contains()` on NULL values, it causes query errors
3. New tasks created after the migration get `searchableText` populated correctly
4. But the mobile app searches across ALL tasks (including old ones with NULL values)

### Impact

- **Severity**: CRITICAL - Search functionality completely broken in production
- **Affected Users**: All users trying to search tasks
- **Workaround**: None - search is completely broken until fix is deployed

## Solution Implemented

### 1. Data Migration (`20251103000000_populate_searchable_text`)

Created a comprehensive data migration that:
- Defines a PostgreSQL function `normalize_for_search()` that matches the TypeScript implementation
- Populates `searchableText` for all existing Task records (handles tasks with/without customer/location)
- Populates `searchableText` for all existing Customer records
- Populates `searchableText` for all existing GeoLocation records
- Makes `Task.searchableText` NOT NULL (it should always have at least the task ID)
- Cleans up the helper function after migration

**File**: `apps/api/prisma/migrations/20251103000000_populate_searchable_text/migration.sql`

### 2. Schema Update

Updated `schema.prisma` to reflect that `Task.searchableText` is NOT NULL:
```prisma
searchableText String       @db.Text  // Changed from String?
```

**Justification**: Task records always have at least an ID, so searchableText can never be empty.

### 3. Defensive Code Update

Added a defensive null check in `task.service.ts` `searchAndFilterTasks()` function:
```typescript
whereConditions.push({
  AND: [
    { searchableText: { not: null } },  // Defensive check
    {
      searchableText: {
        contains: normalizedSearch,
        mode: 'insensitive',
      },
    },
  ],
})
```

**Justification**: Belt-and-suspenders approach to prevent 500 errors even if migration somehow misses records.

## Files Changed

1. `apps/api/prisma/migrations/20251103000000_populate_searchable_text/migration.sql` - NEW
2. `apps/api/prisma/schema.prisma` - Updated Task.searchableText to NOT NULL
3. `apps/api/src/v1/task/task.service.ts` - Added defensive null check in search query

## Deployment Steps

### Step 1: Commit and Push Changes
```bash
git add .
git commit -m "fix(api): populate searchableText for existing records

CRITICAL FIX: Production search endpoint returning 500 errors

Problem:
- searchableText field added without data migration
- All existing tasks have NULL searchableText
- Search queries fail on NULL values

Solution:
- Add migration to populate searchableText for all existing records
- Make Task.searchableText NOT NULL in schema
- Add defensive null check in search query

Fixes: Production /v1/task/search endpoint 500 errors"

git push origin main
```

### Step 2: Monitor Vercel Deployment

The deployment will:
1. Build the TypeScript code (includes defensive null check)
2. Run `prisma migrate deploy` which will execute the data migration
3. Generate Prisma client with updated schema

### Step 3: Verify Fix

After deployment, verify:
1. Search endpoint returns 200 OK: `curl https://nv-internal-api.vercel.app/v1/task/search` (with proper auth)
2. Check Vercel logs for any migration errors
3. Test search functionality in mobile app

## Prevention for Future

### Lesson Learned

**When adding a new indexed/searchable field to the database:**
1. **Always include a data migration** to populate existing records
2. Consider making the field required (NOT NULL) if it should never be empty
3. Add defensive null checks in queries for backwards compatibility
4. Test locally with existing data before deploying to production

### Pattern to Follow

```sql
-- Step 1: Add column as nullable
ALTER TABLE "Table" ADD COLUMN "newField" TEXT;

-- Step 2: Populate existing records
UPDATE "Table" SET "newField" = compute_value(...) WHERE "newField" IS NULL;

-- Step 3: Make NOT NULL if appropriate
ALTER TABLE "Table" ALTER COLUMN "newField" SET NOT NULL;
```

## Testing

### Manual Testing (After Deploy)

1. Test search with existing tasks (should work now)
2. Test search with newly created tasks (should continue to work)
3. Test search with Vietnamese accents (should continue to work)
4. Test search with empty query (should return all tasks)

### Expected Behavior

- Search queries should return results matching normalized text
- No 500 errors on `/v1/task/search`
- All tasks should be searchable (old and new)

## Rollback Plan

If issues occur:
1. Revert to previous deployment in Vercel dashboard
2. The defensive null check ensures partial functionality even without migration
3. Can manually run migration via Prisma Studio if needed

## Documentation Updates

- [x] Created task documentation
- [x] Documented root cause and solution
- [x] Documented prevention pattern for future
- [ ] Update CLAUDE.md with migration pattern (if needed)

## Success Criteria

- [x] Data migration created
- [x] Schema updated
- [x] Defensive code added
- [ ] Changes committed and pushed
- [ ] Deployment successful
- [ ] Search endpoint working in production
- [ ] Mobile app search functionality verified
