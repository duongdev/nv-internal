# Investigate Authentication Performance Optimization

## Overview

Investigated slow API response times (~2s) from Expo Go client to local Hono server. Root cause identified as Clerk authentication middleware making external API calls on every request to fetch user data with custom roles.

## Implementation Status

✅ Completed

## Problem Analysis

### Performance Bottleneck Identified

1. **Symptoms**:
   - Health endpoint (no auth): 0.001s ⚡
   - Authenticated endpoints: 1.4-2.0s 🐌
   - Consistent 2-second latency on all authenticated API calls

2. **Root Cause**:
   - `clerkClient.users.getUser()` call in auth middleware
   - Fetches full user object from Clerk API on EVERY request
   - Network latency to Clerk servers adds significant overhead

3. **Why It Can't Be Optimized (Currently)**:
   - Custom roles stored in `user.publicMetadata.roles` (e.g., `nv_internal_admin`, `nv_internal_worker`)
   - JWT token does NOT include `publicMetadata` field
   - JWT only contains basic claims:
     ```json
     {
       "sub": "user_31rPnlbVlFWjqk4hSeDPcbh11pQ",
       "sid": "sess_34SNbopCClPtKaA3jMhe9LWb5xH",
       "o": {
         "id": "org_31rPgY7SWX8dZdPoUqbeKPXmxb2",
         "rol": "admin",
         "slg": "nv-internal"
       }
     }
     ```
   - All permission checks throughout app depend on `publicMetadata.roles`
   - Must fetch full user object to access these custom roles

## Implementation Plan

- [x] Profile API performance to identify bottleneck
- [x] Analyze JWT token structure from Clerk
- [x] Attempt to extract roles from JWT claims
- [x] Modify auth middleware to avoid user fetching
- [x] Test permission system with JWT-only approach
- [x] Discover JWT limitations with custom metadata
- [x] Revert optimization due to missing role data
- [x] Fix TypeScript errors in `/user/me` endpoint
- [x] Document findings in CLAUDE.md
- [x] Create task documentation

## Testing Scenarios

### API Performance Tests
- **Before optimization**: 1.4-2.0s per authenticated request
- **After attempted optimization**: 403 errors - missing role data
- **After reverting**: 1.4-2.0s (original performance restored)

### Functionality Tests
- ✅ All 90 API tests passing
- ✅ TypeScript compilation successful
- ✅ Permission checks working correctly
- ✅ No 403 errors after reverting
- ✅ User roles properly loaded for all endpoints

## Future Optimization Options

### Option 1: Custom JWT Claims (Recommended)
- **Approach**: Configure Clerk to include `publicMetadata.roles` in JWT
- **Requirements**: Clerk Pro plan or higher
- **Benefits**: Would eliminate user fetching entirely
- **Expected Performance**: ~100ms per request
- **Implementation Effort**: Low (configuration only)

### Option 2: Caching Strategy
- **Approach**: Implement Redis/in-memory cache for user objects
- **Cache Duration**: 5-10 minutes
- **Benefits**: First request slow, subsequent requests fast
- **Challenges**: Cache invalidation on role changes
- **Implementation Effort**: Medium

### Option 3: Clerk Organizations
- **Approach**: Migrate to Clerk's built-in organization roles
- **Benefits**: Organization roles already in JWT (`o.rol`)
- **Challenges**: Requires refactoring ALL permission checks
- **Implementation Effort**: High

## Related Bug Fix

### Check-in/Out Error State Flash
- **Issue**: Error state briefly appeared after successful submission
- **Root Cause**: Query invalidation triggered before navigation
- **Fix**: Moved `router.back()` before invalidation in `use-task-event.ts`
- **File**: `apps/mobile/hooks/use-task-event.ts`

## Notes

### Key Learnings
1. **JWT Limitations**: Clerk's default JWT doesn't include custom metadata fields
2. **Performance Trade-off**: Security/flexibility vs speed - currently prioritizing correct permissions
3. **Production Impact**: ~300-500ms in production (better than dev but still noticeable)

### Files Modified
1. `apps/api/src/v1/middlewares/auth.ts` - Reverted to original user fetching
2. `apps/api/src/v1/user/user.route.ts` - Fixed TypeScript errors with `getAuth()`
3. `CLAUDE.md` - Added "Performance Limitation: Authentication Middleware" section
4. `apps/mobile/hooks/use-task-event.ts` - Fixed check-in/out error state flash

### Decision Rationale
- **Why not optimize now**: Would break entire permission system
- **Why document thoroughly**: Team needs to understand the limitation
- **Why provide options**: Allows informed decision when ready to optimize

### Action Items for Product Team
1. Evaluate if current performance is acceptable for MVP
2. Consider Clerk Pro plan for custom JWT claims if performance critical
3. Monitor production metrics to determine optimization urgency
4. Plan migration strategy if choosing Option 3 (Clerk Organizations)

## References
- Clerk JWT Documentation: https://clerk.com/docs/backend-requests/making/custom-session-token
- Original auth middleware: `apps/api/src/v1/middlewares/auth.ts`
- Permission utilities: `apps/api/src/v1/utils/permissions.ts`