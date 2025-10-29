# Fix Report Validation Timezone Issue

**Created**: 2025-10-29 18:02:40 UTC
**Status**: ✅ Completed
**Priority**: High
**Type**: Bug Fix

## Problem Statement

Users were unable to fetch reports for the current month (October 2025) due to a validation error claiming the end date was in the future, even though the date was valid in their timezone.

### Error Details

**Request**:
```
GET /v1/reports/summary?startDate=2025-10-01&endDate=2025-10-31&timezone=Asia%2FHo_Chi_Minh
```

**Error Response** (HTTP 400):
```json
{
  "level": 40,
  "time": 1761760394188,
  "name": "validation:error",
  "validationType": "query",
  "path": "/v1/reports/summary",
  "method": "GET",
  "errorCount": 1,
  "errors": [{
    "field": "endDate",
    "message": "Không thể tạo báo cáo cho ngày trong tương lai",
    "received": "2025-10-31"
  }]
}
```

## Root Cause Analysis

### The Issue

The validation in `packages/validation/src/report.zod.ts` (lines 226-247) was comparing dates without timezone awareness:

```typescript
.refine((data) => {
  const end = new Date(data.endDate)  // Creates date at midnight UTC
  const now = new Date()              // Current time in UTC
  // ... date comparison logic
  return endDateOnly <= nowDateOnly
}, {
  message: 'Không thể tạo báo cáo cho ngày trong tương lai',
  path: ['endDate'],
})
```

### Why It Failed

1. `new Date('2025-10-31')` creates **2025-10-31 00:00:00 UTC**
2. When user's local time is **2025-10-30 10:00 AM ICT (UTC+7)**
3. This is **2025-10-30 03:00:00 UTC** in actual UTC time
4. Comparison: `2025-10-31 00:00 UTC > 2025-10-30 03:00 UTC` → FAIL
5. Result: User gets "future date" error for October 31, even though it's valid in their timezone

### Example Timeline

```
User's local time:  2025-10-30 10:00:00 ICT (UTC+7)
                         ↓
UTC time:           2025-10-30 03:00:00 UTC

endDate parsed:     2025-10-31 00:00:00 UTC (21 hours in the future!)
                         ↓
Validation:         2025-10-31 > 2025-10-30 → FALSE (error thrown)
```

## Solution Implemented

### Approach: Remove Future Date Validation

**Decision**: Remove the `.refine()` validation that checks for future dates entirely.

**Rationale**:
1. ✅ **Backend naturally filters future dates**: The query uses `completedAt: { lte: endTz }` which excludes future tasks
2. ✅ **Business constraint**: No tasks can have `completedAt` in the future by design
3. ✅ **Simpler code**: Eliminates timezone edge cases and complexity
4. ✅ **Better UX**: Users can select current day without validation errors
5. ✅ **Graceful handling**: Future dates just return empty results instead of throwing errors

### Changes Made

**File**: `packages/validation/src/report.zod.ts`

**Before** (lines 226-247):
```typescript
.refine(
  (data) => {
    const end = new Date(data.endDate)
    const now = new Date()
    const endDateOnly = new Date(end.getFullYear(), end.getMonth(), end.getDate())
    const nowDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    return endDateOnly <= nowDateOnly
  },
  {
    message: 'Không thể tạo báo cáo cho ngày trong tương lai',
    path: ['endDate'],
  },
)
```

**After**:
- Removed the entire `.refine()` block for future date validation
- Added comprehensive documentation explaining why the validation was removed
- Updated JSDoc comments to reflect the change

**Documentation Added**:
```typescript
/**
 * Note: We do NOT validate that endDate is not in the future because:
 * 1. The backend query filters by completedAt <= endDate, which naturally excludes future tasks
 * 2. No tasks can have completedAt in the future (business constraint)
 * 3. Future date validation with timezones causes edge cases (e.g., current day rejection)
 * 4. Querying future dates simply returns empty results (graceful handling)
 */
```

## Testing & Verification

### Test Results

1. **TypeScript Compilation**: ✅ PASS
   ```bash
   npx tsc --noEmit
   # No errors
   ```

2. **Report Service Tests**: ✅ PASS (43 tests)
   ```bash
   pnpm --filter @nv-internal/api test -- report
   # PASS src/v1/reports/__tests__/report-summary.service.test.ts
   # PASS src/v1/reports/__tests__/report.service.test.ts
   # Test Suites: 2 passed, 2 total
   # Tests: 43 passed, 43 total
   ```

3. **Code Formatting**: ✅ PASS
   ```bash
   pnpm exec biome check --write .
   # No fixes needed
   ```

### Manual Verification Needed

After deployment, verify these scenarios work correctly:

1. **Current month query** (previously failing):
   ```
   GET /v1/reports/summary?startDate=2025-10-01&endDate=2025-10-31&timezone=Asia/Ho_Chi_Minh
   Expected: 200 OK with report data
   ```

2. **Future month query** (should return empty):
   ```
   GET /v1/reports/summary?startDate=2025-11-01&endDate=2025-11-30&timezone=Asia/Ho_Chi_Minh
   Expected: 200 OK with empty employees array
   ```

3. **Current day query**:
   ```
   GET /v1/reports/summary?startDate=2025-10-30&endDate=2025-10-30&timezone=Asia/Ho_Chi_Minh
   Expected: 200 OK with report data
   ```

4. **Cross-timezone boundary** (UTC midnight = 7 AM ICT):
   ```
   GET /v1/reports/summary?startDate=2025-10-30&endDate=2025-10-30&timezone=Asia/Ho_Chi_Minh
   Expected: Correct filtering based on ICT timezone, not UTC
   ```

## Alternative Solutions Considered

### Option A: Timezone-Aware Validation (Not Chosen)

```typescript
import { TZDate } from '@date-fns/tz'

.refine((data) => {
  const endDateInTz = TZDate.tz(data.timezone, `${data.endDate}T23:59:59`)
  const now = new Date()
  return endDateInTz <= now
}, {
  message: 'Không thể tạo báo cáo cho ngày trong tương lai',
  path: ['endDate'],
})
```

**Pros**:
- ✅ Most accurate validation
- ✅ Respects user's timezone

**Cons**:
- ❌ More complex
- ❌ Requires TZDate import in validation package
- ❌ Still prone to edge cases (what if user is at midnight?)
- ❌ Adds unnecessary validation layer when backend handles it

### Option C: End of Day Comparison (Not Chosen)

Compare end of day in user's timezone instead of start.

**Cons**:
- ❌ Most complex solution
- ❌ Might allow "future" dates in edge cases
- ❌ Over-engineering for a problem that doesn't need frontend validation

## Impact Assessment

### Affected Components

1. **Validation Package** (`@nv-internal/validation`):
   - Modified: `src/report.zod.ts`
   - Rebuilt after changes

2. **API Routes**:
   - `/v1/reports/summary` (employees summary report)
   - Behavior: Now accepts any valid date range (within 92-day limit)

3. **Mobile App**:
   - No changes needed
   - Will work correctly with current month queries

### Behavior Changes

**Before**:
- ❌ Current day/month queries rejected if parsed as "future" in UTC
- ❌ Timezone-dependent errors for valid dates
- ❌ Poor UX: Users can't generate today's reports

**After**:
- ✅ All valid date ranges accepted (format + range checks only)
- ✅ Current day/month queries work reliably
- ✅ Future dates return empty results (graceful)
- ✅ Backend query naturally filters out impossible dates

### Risk Assessment

**Risk Level**: Low

**Risks**:
- ⚠️ Users can technically request reports for future dates
- ✅ Mitigated: Backend query filters by `completedAt`, so future tasks never appear
- ✅ Mitigated: Business logic prevents tasks with future `completedAt`

**Benefits**:
- ✅ Fixes critical UX issue (current month reports)
- ✅ Reduces code complexity
- ✅ Eliminates timezone edge cases
- ✅ Aligns validation with backend behavior

## Implementation Timeline

- **Analysis & Planning**: 10 minutes
- **Code Changes**: 5 minutes
- **Testing & Verification**: 10 minutes
- **Documentation**: 15 minutes
- **Total Time**: ~40 minutes

## Related Files

- **Modified**:
  - `/packages/validation/src/report.zod.ts`

- **Tests** (no changes needed):
  - `/apps/api/src/v1/reports/__tests__/report-summary.service.test.ts`
  - `/apps/api/src/v1/reports/__tests__/report.service.test.ts`

- **API Service** (no changes):
  - `/apps/api/src/v1/reports/report.service.ts` (uses `completedAt` filtering)

## Learnings

1. **Timezone Validation is Hard**: When validating dates with timezone parameters, always consider how `new Date()` parses strings (defaults to UTC midnight)

2. **Backend is Source of Truth**: If the backend query naturally handles edge cases (like future dates), frontend validation might be unnecessary defensive programming

3. **Simplicity Wins**: Sometimes removing code is better than adding complexity to fix edge cases

4. **User-Centric Validation**: Validation should help users avoid errors, not create false positives for valid inputs

5. **Document Decisions**: Always document WHY validation was removed or changed, not just WHAT changed

## Follow-Up Actions

- [x] Remove future date validation
- [x] Update documentation in schema
- [x] Rebuild validation package
- [x] Run TypeScript checks
- [x] Run all report tests
- [x] Format code with Biome
- [x] Create task documentation
- [ ] Deploy to staging (pending)
- [ ] Manual verification in staging (pending)
- [ ] Deploy to production (pending)
- [ ] Monitor error logs for any related issues (pending)

## Deployment Notes

**Pre-Deployment**:
1. Ensure validation package is rebuilt: `pnpm --filter @nv-internal/validation build`
2. Verify API tests pass: `pnpm --filter @nv-internal/api test`
3. Check TypeScript compilation: `npx tsc --noEmit`

**Post-Deployment**:
1. Test current month query immediately
2. Monitor error logs for validation errors
3. Check Sentry/monitoring for any new issues
4. Verify mobile app can fetch current month reports

**Rollback Plan**:
- Revert commit restoring the `.refine()` validation
- Rebuild validation package
- Redeploy API

## Additional Context

### Why This Bug Wasn't Caught Earlier

1. **Development Testing**: Developers likely tested with historical dates (last month) which wouldn't trigger the issue
2. **Test Coverage**: Tests use fixed dates in the past (2025-01-15, etc.), so they didn't catch the timezone edge case
3. **Timezone Assumptions**: The validation assumed all date comparisons would be in UTC, but didn't account for user's timezone parameter

### Best Practices Going Forward

1. **Test Current Day**: Always include test cases for "today" when validating dates
2. **Timezone Awareness**: If accepting timezone parameters, ensure all date logic respects them
3. **Backend First**: Let backend handle business logic constraints; use frontend validation for format/range checks only
4. **Document Assumptions**: Clearly document timezone assumptions in validation logic

---

**Status**: ✅ Code complete, awaiting deployment and manual verification
