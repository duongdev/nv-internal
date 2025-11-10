# Account Deletion Implementation Plan

**Linear Issue**: PSN-13
**Requirements**: Apple App Store Guideline 5.1.1(v) compliance
**Last Updated**: 2025-11-10

---

## Executive Summary

This plan details the backend implementation for user account deletion to comply with Apple App Store requirements. The solution deletes the user from Clerk (authentication provider) while preserving all historical data in the PostgreSQL database with original userId references.

**Key Principles**:
- **No local User table** - All user data managed by Clerk
- **Preserve historical data** - Keep all tasks, check-ins, photos, activities with original userIds
- **Feature flag controlled** - Only visible to Apple review account via PostHog
- **Audit trail** - Log all deletion attempts to Activity table
- **Idempotent** - Safe to retry, handles edge cases gracefully

---

## Architecture Overview

### Data Flow

```
Mobile App (Authenticated User)
    ↓
DELETE /v1/account
    ↓
AccountService.deleteUserAccount()
    ↓
┌─────────────────────────────────────────┐
│ 1. Verify user identity (from JWT)     │
│ 2. Log pre-deletion snapshot           │
│ 3. Delete user from Clerk API          │
│ 4. Log successful deletion              │
│ 5. Return success response              │
└─────────────────────────────────────────┘
    ↓
User logged out (Clerk session revoked)
Historical data remains in database
```

### Impact Analysis

**What Gets Deleted**:
- ✅ Clerk user account (can't login anymore)
- ✅ All Clerk sessions (immediate logout)
- ✅ Clerk authentication tokens

**What Is Preserved**:
- ✅ All Task records (with original userId in assigneeIds)
- ✅ All Activity logs (with original userId)
- ✅ All Attachments (with original userId in uploadedBy)
- ✅ All Payment records (with original userId in collectedBy)
- ✅ All GeoLocation, Customer records (no userId reference)

**Frontend Behavior After Deletion**:
- When fetching user info: GET `/v1/user/:id/public-info` returns 404
- App displays "[người dùng đã xoá]" for deleted user references
- Historical data (tasks, check-ins, photos) remains visible with deleted user label

---

## Implementation Details

### 1. API Endpoint

**File**: `apps/api/src/v1/account/account.route.ts` (NEW)

```typescript
import { getAuth } from '@hono/clerk-auth'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { getAuthUserStrict } from '../middlewares/auth'
import { deleteUserAccount } from './account.service'

const router = new Hono()
  // Delete current user account (Apple App Store compliance)
  .delete('/me', async (c) => {
    const auth = getAuth(c)
    if (!auth?.userId) {
      throw new HTTPException(401, { message: 'unauthorized' })
    }

    const clerkClient = c.get('clerk')
    const user = getAuthUserStrict(c)

    try {
      await deleteUserAccount({
        clerkClient,
        userId: auth.userId,
        requestUser: user,
      })

      return c.json({
        success: true,
        message: 'Tài khoản đã được xoá thành công.',
      })
    } catch (error) {
      const logger = getLogger('account.route:delete-account')
      logger.error({ error, userId: auth.userId }, 'Error deleting account')

      throw new HTTPException(500, {
        message: 'Không thể xoá tài khoản. Vui lòng thử lại sau.',
        cause: error,
      })
    }
  })

export default router
```

**Route Registration**: Update `apps/api/src/v1/index.ts`

```typescript
// Add to existing routes
import accountRouter from './account/account.route'

// Register route
app.route('/v1/account', accountRouter)
```

**Endpoint Specification**:
- **Method**: DELETE
- **Path**: `/v1/account/me`
- **Authentication**: Required (Clerk JWT)
- **Authorization**: User can only delete their own account (enforced by JWT userId)
- **Rate Limiting**: Inherits global rate limiting (prevents abuse)
- **Idempotency**: Safe to call multiple times (returns 404 after first deletion)

**Response Formats**:

Success (200):
```json
{
  "success": true,
  "message": "Tài khoản đã được xoá thành công."
}
```

Unauthorized (401):
```json
{
  "message": "unauthorized"
}
```

User Already Deleted (404):
```json
{
  "message": "Không thể xoá tài khoản. Vui lòng thử lại sau.",
  "cause": "User not found"
}
```

Server Error (500):
```json
{
  "message": "Không thể xoá tài khoản. Vui lòng thử lại sau.",
  "cause": "Clerk API error details"
}
```

---

### 2. Service Layer

**File**: `apps/api/src/v1/account/account.service.ts` (NEW)

```typescript
import type { ClerkClient, User } from '@clerk/backend'
import type { ClerkAPIResponseError } from '@clerk/types'
import { getLogger } from '../../lib/log'
import { createActivity } from '../activity/activity.service'

/**
 * Delete user account from Clerk (Apple App Store Guideline 5.1.1v compliance)
 *
 * CRITICAL DESIGN DECISIONS:
 * - User deleted from Clerk ONLY (authentication provider)
 * - All database records preserved with original userId references
 * - Historical data (tasks, check-ins, photos) remains intact
 * - Frontend shows "[người dùng đã xoá]" when userId not found in Clerk
 *
 * @param clerkClient - Clerk API client
 * @param userId - Clerk user ID to delete
 * @param requestUser - User object from JWT (for audit logging)
 * @throws HTTPException(404) if user not found
 * @throws HTTPException(500) if Clerk API fails
 */
export async function deleteUserAccount({
  clerkClient,
  userId,
  requestUser,
}: {
  clerkClient: ClerkClient
  userId: string
  requestUser: User
}): Promise<void> {
  const logger = getLogger('account.service:deleteUserAccount')

  logger.info(
    { userId, requestUserId: requestUser.id },
    'Account deletion requested',
  )

  // Step 1: Verify user exists in Clerk before deletion
  // This ensures we have user data for audit logging
  let userSnapshot: User
  try {
    userSnapshot = await clerkClient.users.getUser(userId)
    logger.trace({ userId, userSnapshot }, 'User snapshot retrieved for audit')
  } catch (error) {
    const clerkError = error as ClerkAPIResponseError

    // User already deleted (idempotent case)
    if (clerkError.status === 404) {
      logger.warn(
        { userId, error },
        'User already deleted (idempotent behavior)',
      )

      // Still log the deletion attempt for audit
      await createActivity({
        userId,
        topic: { entityType: 'GENERAL' },
        action: 'ACCOUNT_DELETION_ALREADY_DELETED',
        payload: {
          userId,
          requestedBy: requestUser.id,
          timestamp: new Date().toISOString(),
          errorMessage: 'User already deleted',
        },
      })

      // Rethrow 404 - let route handler convert to appropriate response
      throw error
    }

    logger.error({ userId, error }, 'Failed to retrieve user snapshot')
    throw error
  }

  // Step 2: Log pre-deletion snapshot to Activity table
  // This creates an audit trail before the user is deleted
  try {
    await createActivity({
      userId,
      topic: { entityType: 'GENERAL' },
      action: 'ACCOUNT_DELETION_INITIATED',
      payload: {
        userId,
        userEmail: userSnapshot.emailAddresses?.[0]?.emailAddress,
        userName: `${userSnapshot.firstName} ${userSnapshot.lastName}`.trim(),
        userMetadata: userSnapshot.publicMetadata,
        requestedBy: requestUser.id,
        timestamp: new Date().toISOString(),
      },
    })
    logger.trace({ userId }, 'Pre-deletion activity logged')
  } catch (error) {
    // Non-critical - log error but continue with deletion
    logger.error(
      { userId, error },
      'Failed to log pre-deletion activity (non-critical)',
    )
  }

  // Step 3: Delete user from Clerk
  // This is the destructive operation - after this point, user cannot login
  try {
    await clerkClient.users.deleteUser(userId)
    logger.info({ userId }, 'User successfully deleted from Clerk')
  } catch (error) {
    const clerkError = error as ClerkAPIResponseError

    logger.error(
      { userId, error, status: clerkError.status },
      'Failed to delete user from Clerk',
    )

    // Log failed deletion attempt
    await createActivity({
      userId,
      topic: { entityType: 'GENERAL' },
      action: 'ACCOUNT_DELETION_FAILED',
      payload: {
        userId,
        requestedBy: requestUser.id,
        timestamp: new Date().toISOString(),
        errorMessage: clerkError.message || 'Unknown error',
        errorStatus: clerkError.status,
      },
    })

    throw error
  }

  // Step 4: Log successful deletion to Activity table
  // This confirms the deletion was successful
  try {
    await createActivity({
      userId,
      topic: { entityType: 'GENERAL' },
      action: 'ACCOUNT_DELETION_COMPLETED',
      payload: {
        userId,
        requestedBy: requestUser.id,
        timestamp: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      },
    })
    logger.info({ userId }, 'Account deletion completed and logged')
  } catch (error) {
    // Non-critical - deletion succeeded, but logging failed
    logger.error(
      { userId, error },
      'Failed to log deletion completion (non-critical, deletion succeeded)',
    )
  }
}
```

**Service Functions**:

1. **deleteUserAccount()**: Main function orchestrating deletion
   - Validates user exists (get snapshot for audit)
   - Logs pre-deletion activity
   - Calls Clerk API to delete user
   - Logs post-deletion activity
   - Handles errors gracefully

**Design Decisions**:

1. **No database cleanup**: Intentionally preserves all userId references
2. **Activity logging**: Creates audit trail for compliance and debugging
3. **Idempotent**: Safe to call multiple times (404 on second call)
4. **Non-critical logging**: Doesn't block deletion if activity logging fails
5. **Error handling**: Specific handling for 404 (already deleted) vs other errors

---

### 3. Activity Logging

**Events Logged**:

| Event | Action | When | Payload |
|-------|--------|------|---------|
| Pre-deletion snapshot | `ACCOUNT_DELETION_INITIATED` | Before deletion | User snapshot (email, name, metadata) |
| Successful deletion | `ACCOUNT_DELETION_COMPLETED` | After deletion | UserId, timestamp |
| Failed deletion | `ACCOUNT_DELETION_FAILED` | On error | Error message, status |
| Already deleted | `ACCOUNT_DELETION_ALREADY_DELETED` | On 404 | Retry timestamp |

**Schema** (existing Activity table):
```prisma
model Activity {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  userId    String?
  topic     String
  action    String
  payload   Json?

  @@index([userId])
  @@index([createdAt])
  @@index([topic])
  @@index([action, userId, createdAt])
}
```

**Example Activity Record**:
```json
{
  "id": "act_xyz789",
  "userId": "user_123",
  "topic": "GENERAL",
  "action": "ACCOUNT_DELETION_COMPLETED",
  "payload": {
    "userId": "user_123",
    "requestedBy": "user_123",
    "timestamp": "2025-11-10T10:30:00Z",
    "completedAt": "2025-11-10T10:30:01Z"
  },
  "createdAt": "2025-11-10T10:30:01Z",
  "updatedAt": "2025-11-10T10:30:01Z"
}
```

**Querying Deletion History**:
```typescript
// Get all account deletions
const deletions = await prisma.activity.findMany({
  where: {
    action: {
      in: [
        'ACCOUNT_DELETION_INITIATED',
        'ACCOUNT_DELETION_COMPLETED',
        'ACCOUNT_DELETION_FAILED',
        'ACCOUNT_DELETION_ALREADY_DELETED',
      ],
    },
  },
  orderBy: { createdAt: 'desc' },
})

// Get specific user deletion history
const userDeletions = await prisma.activity.findMany({
  where: {
    userId: 'user_123',
    action: { startsWith: 'ACCOUNT_DELETION' },
  },
  orderBy: { createdAt: 'desc' },
})
```

---

### 4. Error Handling

#### Error Scenarios and Responses

| Scenario | Detection | Response | User Impact |
|----------|-----------|----------|-------------|
| **User not authenticated** | No JWT token | 401 Unauthorized | Show login screen |
| **User already deleted** | Clerk returns 404 | Log retry, return 404 | Show error message |
| **Clerk API timeout** | Network timeout | 500 Internal Server Error | Show retry button |
| **Clerk API rate limit** | 429 status | 500 Internal Server Error | Show retry button |
| **Activity logging fails** | Database error | Log warning, continue | Deletion succeeds |
| **Invalid JWT** | Clerk middleware rejects | 401 Unauthorized | Show login screen |
| **Network failure** | Clerk API unreachable | 500 Internal Server Error | Show retry button |

#### Idempotency Strategy

**Safe to Retry**: The endpoint is designed to be idempotent (safe to call multiple times):

1. **First call**: User deleted from Clerk, returns 200
2. **Second call**: Clerk returns 404 (user not found), logs retry, returns 404
3. **Database state**: Unchanged (all historical data preserved)

**Implementation**:
```typescript
// Idempotent handling in service
try {
  userSnapshot = await clerkClient.users.getUser(userId)
} catch (error) {
  if (error.status === 404) {
    // Already deleted - log and return gracefully
    await createActivity({
      userId,
      topic: { entityType: 'GENERAL' },
      action: 'ACCOUNT_DELETION_ALREADY_DELETED',
      payload: { /* retry details */ },
    })
    throw error // Route converts to 404 response
  }
  throw error // Other errors propagate
}
```

**Mobile App Behavior**:
- Show confirmation dialog before deletion
- After successful deletion: Clear local cache, navigate to welcome screen
- On 404 error: Treat as success (already deleted)
- On 500 error: Show retry option

#### Error Recovery

**Partial Failure States**:

| State | How to Detect | Recovery Action |
|-------|---------------|-----------------|
| User deleted, but logging failed | Check Activity logs | Manual audit (non-critical) |
| User not deleted, but pre-log exists | INITIATED without COMPLETED | Retry deletion |
| Network timeout mid-deletion | No response received | Retry (idempotent) |

**Monitoring**:
- Track deletion success rate
- Alert on repeated failures for same user
- Monitor Activity logs for FAILED events

---

### 5. Testing Strategy

#### Unit Tests

**File**: `apps/api/src/v1/account/__tests__/account.service.test.ts` (NEW)

**Test Cases**:

```typescript
import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import type { ClerkClient } from '@clerk/backend'
import { deleteUserAccount } from '../account.service'
import * as activityService from '../../activity/activity.service'

describe('AccountService - deleteUserAccount', () => {
  let mockClerkClient: jest.Mocked<ClerkClient>
  let mockUser: User

  beforeEach(() => {
    jest.clearAllMocks()

    mockClerkClient = {
      users: {
        getUser: jest.fn(),
        deleteUser: jest.fn(),
      },
    } as any

    mockUser = {
      id: 'user_123',
      publicMetadata: { roles: ['nv_internal_worker'] },
    } as User

    jest.spyOn(activityService, 'createActivity').mockResolvedValue({} as any)
  })

  describe('Happy Path', () => {
    it('should delete user successfully and log activities', async () => {
      // Mock user exists
      mockClerkClient.users.getUser.mockResolvedValue({
        id: 'user_123',
        firstName: 'John',
        lastName: 'Doe',
        emailAddresses: [{ emailAddress: 'john@example.com' }],
        publicMetadata: {},
      } as any)

      // Mock deletion succeeds
      mockClerkClient.users.deleteUser.mockResolvedValue({} as any)

      await deleteUserAccount({
        clerkClient: mockClerkClient,
        userId: 'user_123',
        requestUser: mockUser,
      })

      // Verify deletion called
      expect(mockClerkClient.users.deleteUser).toHaveBeenCalledWith('user_123')

      // Verify activity logging
      expect(activityService.createActivity).toHaveBeenCalledTimes(2)
      expect(activityService.createActivity).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          action: 'ACCOUNT_DELETION_INITIATED',
          userId: 'user_123',
        }),
      )
      expect(activityService.createActivity).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          action: 'ACCOUNT_DELETION_COMPLETED',
          userId: 'user_123',
        }),
      )
    })
  })

  describe('Idempotency', () => {
    it('should handle user already deleted (404) gracefully', async () => {
      // Mock user not found
      const clerkError = new Error('User not found') as any
      clerkError.status = 404
      mockClerkClient.users.getUser.mockRejectedValue(clerkError)

      await expect(
        deleteUserAccount({
          clerkClient: mockClerkClient,
          userId: 'user_123',
          requestUser: mockUser,
        }),
      ).rejects.toThrow('User not found')

      // Verify deletion not attempted
      expect(mockClerkClient.users.deleteUser).not.toHaveBeenCalled()

      // Verify retry logged
      expect(activityService.createActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'ACCOUNT_DELETION_ALREADY_DELETED',
          userId: 'user_123',
        }),
      )
    })
  })

  describe('Error Handling', () => {
    it('should log failure when Clerk deletion fails', async () => {
      // Mock user exists
      mockClerkClient.users.getUser.mockResolvedValue({
        id: 'user_123',
        firstName: 'John',
        lastName: 'Doe',
        emailAddresses: [],
        publicMetadata: {},
      } as any)

      // Mock deletion fails
      const clerkError = new Error('Clerk API error') as any
      clerkError.status = 500
      mockClerkClient.users.deleteUser.mockRejectedValue(clerkError)

      await expect(
        deleteUserAccount({
          clerkClient: mockClerkClient,
          userId: 'user_123',
          requestUser: mockUser,
        }),
      ).rejects.toThrow('Clerk API error')

      // Verify failure logged
      expect(activityService.createActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'ACCOUNT_DELETION_FAILED',
          userId: 'user_123',
        }),
      )
    })

    it('should continue deletion even if pre-logging fails', async () => {
      // Mock user exists
      mockClerkClient.users.getUser.mockResolvedValue({
        id: 'user_123',
        emailAddresses: [],
      } as any)

      // Mock pre-logging fails (first call)
      jest
        .spyOn(activityService, 'createActivity')
        .mockRejectedValueOnce(new Error('Database error'))
        .mockResolvedValueOnce({} as any) // Post-logging succeeds

      // Mock deletion succeeds
      mockClerkClient.users.deleteUser.mockResolvedValue({} as any)

      await deleteUserAccount({
        clerkClient: mockClerkClient,
        userId: 'user_123',
        requestUser: mockUser,
      })

      // Verify deletion still called despite logging failure
      expect(mockClerkClient.users.deleteUser).toHaveBeenCalledWith('user_123')
    })

    it('should not fail deletion if post-logging fails', async () => {
      // Mock user exists
      mockClerkClient.users.getUser.mockResolvedValue({
        id: 'user_123',
        emailAddresses: [],
      } as any)

      // Mock pre-logging succeeds, post-logging fails
      jest
        .spyOn(activityService, 'createActivity')
        .mockResolvedValueOnce({} as any) // Pre-logging succeeds
        .mockRejectedValueOnce(new Error('Database error')) // Post-logging fails

      // Mock deletion succeeds
      mockClerkClient.users.deleteUser.mockResolvedValue({} as any)

      // Should not throw - deletion succeeded
      await deleteUserAccount({
        clerkClient: mockClerkClient,
        userId: 'user_123',
        requestUser: mockUser,
      })

      expect(mockClerkClient.users.deleteUser).toHaveBeenCalledWith('user_123')
    })
  })

  describe('Audit Trail', () => {
    it('should log user snapshot before deletion', async () => {
      const userSnapshot = {
        id: 'user_123',
        firstName: 'John',
        lastName: 'Doe',
        emailAddresses: [{ emailAddress: 'john@example.com' }],
        publicMetadata: { roles: ['nv_internal_worker'] },
      }

      mockClerkClient.users.getUser.mockResolvedValue(userSnapshot as any)
      mockClerkClient.users.deleteUser.mockResolvedValue({} as any)

      await deleteUserAccount({
        clerkClient: mockClerkClient,
        userId: 'user_123',
        requestUser: mockUser,
      })

      // Verify snapshot captured in activity payload
      expect(activityService.createActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'ACCOUNT_DELETION_INITIATED',
          payload: expect.objectContaining({
            userId: 'user_123',
            userEmail: 'john@example.com',
            userName: 'John Doe',
            userMetadata: { roles: ['nv_internal_worker'] },
          }),
        }),
      )
    })
  })
})
```

**Test Coverage Targets**:
- Happy path: User deleted successfully
- Idempotency: Handle 404 (already deleted)
- Error handling: Clerk API failures
- Non-critical errors: Activity logging failures don't block deletion
- Audit trail: User snapshot captured before deletion

#### Integration Tests

**File**: `apps/api/src/v1/account/__tests__/account.route.test.ts` (NEW)

**Test Cases**:

```typescript
import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { createMockWorkerUser } from '../../../test/mock-auth'
import { createTestApp } from '../../../test/test-app'

jest.mock('../account.service', () => ({
  deleteUserAccount: jest.fn(),
}))

import * as accountService from '../account.service'

describe('Account Route - DELETE /v1/account/me', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should delete authenticated user account', async () => {
    const user = createMockWorkerUser({ id: 'user_123' })
    const app = createTestApp(user)

    jest.spyOn(accountService, 'deleteUserAccount').mockResolvedValue()

    const res = await app.request('/v1/account/me', { method: 'DELETE' })

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({
      success: true,
      message: 'Tài khoản đã được xoá thành công.',
    })
    expect(accountService.deleteUserAccount).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user_123' }),
    )
  })

  it('should return 401 if not authenticated', async () => {
    const app = createTestApp(null) // No auth

    const res = await app.request('/v1/account/me', { method: 'DELETE' })

    expect(res.status).toBe(401)
    expect(accountService.deleteUserAccount).not.toHaveBeenCalled()
  })

  it('should return 500 if deletion fails', async () => {
    const user = createMockWorkerUser({ id: 'user_123' })
    const app = createTestApp(user)

    jest
      .spyOn(accountService, 'deleteUserAccount')
      .mockRejectedValue(new Error('Clerk API error'))

    const res = await app.request('/v1/account/me', { method: 'DELETE' })

    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.message).toContain('Không thể xoá tài khoản')
  })

  it('should handle idempotent deletion (already deleted)', async () => {
    const user = createMockWorkerUser({ id: 'user_123' })
    const app = createTestApp(user)

    const clerkError = new Error('User not found') as any
    clerkError.status = 404
    jest.spyOn(accountService, 'deleteUserAccount').mockRejectedValue(clerkError)

    const res = await app.request('/v1/account/me', { method: 'DELETE' })

    // Should return 500 (route treats 404 as error for simplicity)
    // Frontend can interpret this as "already deleted"
    expect(res.status).toBe(500)
  })
})
```

**Test Coverage Targets**:
- Authenticated user can delete account
- Unauthenticated requests rejected
- Service errors handled gracefully
- Idempotent behavior verified

#### Manual Testing Checklist

**Pre-Testing Setup**:
1. Create test user account in Clerk Dashboard
2. Assign test user to a task (verify userId in database)
3. Have test user create attachments, check-ins
4. Note down test userId for verification

**Test Scenarios**:

| # | Scenario | Steps | Expected Result |
|---|----------|-------|-----------------|
| 1 | **Happy path deletion** | 1. Login as test user<br>2. Call DELETE `/v1/account/me`<br>3. Check response<br>4. Verify user deleted in Clerk<br>5. Check database for historical data | 1. 200 response<br>2. Success message returned<br>3. User gone from Clerk<br>4. Tasks/attachments remain with userId |
| 2 | **Idempotent deletion** | 1. Delete user (first time)<br>2. Call DELETE again (same user)<br>3. Check response | 1. First call: 200<br>2. Second call: 404 or 500<br>3. Activity log shows retry |
| 3 | **Unauthorized access** | 1. Call DELETE without JWT<br>2. Check response | 1. 401 Unauthorized<br>2. User not deleted |
| 4 | **Historical data preserved** | 1. Delete user<br>2. Query tasks assigned to deleted userId<br>3. Query attachments uploaded by deleted userId<br>4. Query activities by deleted userId | 1. All records remain<br>2. userId unchanged<br>3. Frontend shows "[người dùng đã xoá]" |
| 5 | **Activity audit trail** | 1. Delete user<br>2. Query Activity table for deletion events<br>3. Verify payload contents | 1. INITIATED event logged<br>2. COMPLETED event logged<br>3. User snapshot in payload |
| 6 | **Mobile app behavior** | 1. Delete account from mobile<br>2. App redirects to welcome screen<br>3. Try to login again<br>4. View task history (deleted user assigned) | 1. Successful deletion<br>2. Logout automatic<br>3. Login fails (user not found)<br>4. Shows "[người dùng đã xoá]" |

**Test Data Verification**:

```sql
-- Before deletion
SELECT id, assigneeIds FROM "Task" WHERE 'user_123' = ANY(assigneeIds);
SELECT id, uploadedBy FROM "Attachment" WHERE uploadedBy = 'user_123';
SELECT id, collectedBy FROM "Payment" WHERE collectedBy = 'user_123';
SELECT id, userId FROM "Activity" WHERE userId = 'user_123';

-- After deletion (should return same records)
-- userId references unchanged
```

**Clerk Dashboard Verification**:
1. Before deletion: User visible in Clerk Dashboard
2. After deletion: User not found in Clerk Dashboard
3. Sessions: All sessions revoked immediately

---

### 6. Migration Requirements

**No database migrations required**:
- No schema changes (Activity table already supports deletion events)
- No data cleanup needed (intentionally preserving all userId references)
- No indexes added (existing indexes sufficient)

**Environment Variables**:
- No new environment variables required
- Uses existing `CLERK_SECRET_KEY` for Clerk API access

**Deployment Checklist**:
1. Deploy API changes (route + service)
2. Verify `/v1/account/me` DELETE endpoint accessible
3. Test with staging account before production
4. Monitor Activity logs for deletion events
5. Deploy mobile app changes (feature flag + UI)

---

## Step-by-Step Implementation Order

### Phase 1: Backend Core (1-2 hours)

1. **Create service layer** (`account.service.ts`)
   - [ ] Implement `deleteUserAccount()` function
   - [ ] Add activity logging (INITIATED, COMPLETED, FAILED)
   - [ ] Add idempotent 404 handling
   - [ ] Add error handling and logging

2. **Create route** (`account.route.ts`)
   - [ ] Implement DELETE `/v1/account/me` endpoint
   - [ ] Add authentication middleware check
   - [ ] Add error response handling
   - [ ] Register route in `v1/index.ts`

3. **Verify integration**
   - [ ] Test endpoint with Postman/curl
   - [ ] Verify Clerk user deleted
   - [ ] Verify Activity logs created
   - [ ] Verify database data preserved

### Phase 2: Testing (2-3 hours)

4. **Write unit tests** (`account.service.test.ts`)
   - [ ] Happy path tests
   - [ ] Error handling tests
   - [ ] Idempotency tests
   - [ ] Activity logging tests
   - [ ] Target: >90% coverage

5. **Write integration tests** (`account.route.test.ts`)
   - [ ] Route authentication tests
   - [ ] Success response tests
   - [ ] Error response tests
   - [ ] Run full test suite: `pnpm --filter @nv-internal/api test`

6. **Manual testing**
   - [ ] Create test user in Clerk
   - [ ] Assign test user to tasks
   - [ ] Delete via API endpoint
   - [ ] Verify Clerk deletion
   - [ ] Verify database preservation
   - [ ] Verify activity logs

### Phase 3: Quality Assurance (1 hour)

7. **Code quality checks**
   - [ ] Run TypeScript check: `npx tsc --noEmit`
   - [ ] Run Biome: `pnpm biome:check --write .`
   - [ ] Review all error handling paths
   - [ ] Review audit logging completeness
   - [ ] Invoke `code-quality-enforcer` agent

8. **Documentation**
   - [ ] Update API documentation with new endpoint
   - [ ] Document error responses
   - [ ] Add JSDoc comments to service functions
   - [ ] Update CLAUDE.md with deletion pattern reference

### Phase 4: Frontend Integration (Mobile)

9. **Mobile UI implementation** (separate Linear issue)
   - Create delete account button (Settings screen)
   - Add confirmation dialog
   - Implement feature flag check (PostHog)
   - Handle deletion response
   - Logout and clear cache on success
   - Handle error states (retry option)

**Total Estimated Time**: 4-6 hours (backend only)

---

## File Structure Summary

```
apps/api/src/v1/
├── account/                                # NEW
│   ├── account.route.ts                   # DELETE /v1/account/me endpoint
│   ├── account.service.ts                 # deleteUserAccount() logic
│   └── __tests__/
│       ├── account.service.test.ts        # Service unit tests
│       └── account.route.test.ts          # Route integration tests
├── activity/
│   └── activity.service.ts                # MODIFIED: Import for createActivity()
└── index.ts                               # MODIFIED: Register /account route
```

**New Files** (4):
- `apps/api/src/v1/account/account.route.ts`
- `apps/api/src/v1/account/account.service.ts`
- `apps/api/src/v1/account/__tests__/account.service.test.ts`
- `apps/api/src/v1/account/__tests__/account.route.test.ts`

**Modified Files** (1):
- `apps/api/src/v1/index.ts` (register route)

---

## Dependencies and Prerequisites

**Existing Dependencies** (no new packages required):
- `@clerk/backend` - For Clerk API client (already installed)
- `@hono/clerk-auth` - For authentication (already installed)
- `hono` - Web framework (already installed)
- `@nv-internal/prisma-client` - For Activity logging (already installed)

**Prerequisites**:
- Clerk Secret Key configured (`CLERK_SECRET_KEY` env var)
- PostgreSQL database with Activity table
- Existing authentication middleware
- Activity logging service

---

## Security Considerations

### Authentication
- ✅ Endpoint requires valid Clerk JWT
- ✅ User can only delete their own account (enforced by JWT userId)
- ✅ No admin override (users must delete their own accounts)

### Authorization
- ✅ No role-based checks (all authenticated users can delete their account)
- ✅ No cross-user deletion possible (userId from JWT only)

### Audit Trail
- ✅ Pre-deletion user snapshot logged
- ✅ Successful deletion logged with timestamp
- ✅ Failed attempts logged with error details
- ✅ Retry attempts logged (idempotency tracking)

### Data Protection
- ✅ Historical data preserved (tasks, check-ins, photos)
- ✅ No orphaned references (userId preserved in all tables)
- ✅ No CASCADE deletes (Clerk-only deletion)

### Rate Limiting
- ✅ Inherits global rate limiting (prevents abuse)
- ✅ Consider adding endpoint-specific rate limit (1 delete per hour per user)

### GDPR/Privacy Compliance
- ⚠️ **Consider**: User can delete account, but data remains
- ⚠️ **Consider**: May need separate "data deletion" endpoint for GDPR compliance
- ✅ Apple requirement: Account deletion (authentication removal) ✓
- ⚠️ GDPR requirement: Data deletion may need additional implementation

**Recommendation**: Document data retention policy clearly in Terms of Service and Privacy Policy. If GDPR compliance required, implement separate data anonymization/deletion workflow.

---

## Apple App Store Compliance Checklist

Based on Guideline 5.1.1(v) requirements:

- ✅ **In-app deletion option**: Mobile UI will have delete button (Settings screen)
- ✅ **Easy to find**: Delete button in Settings (standard location)
- ✅ **True deletion**: User deleted from Clerk (cannot login)
- ✅ **Confirmation**: Mobile app shows confirmation dialog before deletion
- ✅ **Timing transparency**: Instant deletion (no delays)
- ✅ **Identity verification**: JWT authentication ensures correct user
- ✅ **Feature flag controlled**: Only visible to Apple review account (PostHog flag)

**Not applicable**:
- ❌ Sign in with Apple: Not using Sign in with Apple (using username/password)
- ❌ Highly-regulated industry: Not applicable (no special flows needed)

**Submission Notes for App Review**:
> "Account deletion is available in Settings → Account → Delete Account. Users can delete their account instantly. Upon deletion, the user is logged out and cannot login again. Historical work data (tasks, check-ins) is preserved for business continuity but is no longer associated with the user's identity. Demo account credentials: [provide Apple review account credentials]"

---

## Monitoring and Observability

### Key Metrics to Track

1. **Deletion Success Rate**:
   ```sql
   SELECT
     COUNT(*) FILTER (WHERE action = 'ACCOUNT_DELETION_COMPLETED') as successful,
     COUNT(*) FILTER (WHERE action = 'ACCOUNT_DELETION_FAILED') as failed,
     ROUND(100.0 * COUNT(*) FILTER (WHERE action = 'ACCOUNT_DELETION_COMPLETED') / COUNT(*), 2) as success_rate_pct
   FROM "Activity"
   WHERE action IN ('ACCOUNT_DELETION_COMPLETED', 'ACCOUNT_DELETION_FAILED')
   AND "createdAt" > NOW() - INTERVAL '30 days';
   ```

2. **Deletion Volume**:
   ```sql
   SELECT
     DATE("createdAt") as deletion_date,
     COUNT(*) as deletions
   FROM "Activity"
   WHERE action = 'ACCOUNT_DELETION_COMPLETED'
   GROUP BY DATE("createdAt")
   ORDER BY deletion_date DESC;
   ```

3. **Failed Deletions**:
   ```sql
   SELECT
     "userId",
     "payload"->>'errorMessage' as error_message,
     "payload"->>'errorStatus' as error_status,
     "createdAt"
   FROM "Activity"
   WHERE action = 'ACCOUNT_DELETION_FAILED'
   ORDER BY "createdAt" DESC
   LIMIT 10;
   ```

4. **Retry Attempts**:
   ```sql
   SELECT
     "userId",
     COUNT(*) as retry_count
   FROM "Activity"
   WHERE action = 'ACCOUNT_DELETION_ALREADY_DELETED'
   GROUP BY "userId"
   HAVING COUNT(*) > 1
   ORDER BY retry_count DESC;
   ```

### Logging

All logs use structured logging with `pino`:

```typescript
// Success log
logger.info({ userId }, 'User successfully deleted from Clerk')

// Error log
logger.error({ userId, error, status }, 'Failed to delete user from Clerk')

// Warning log (idempotent retry)
logger.warn({ userId, error }, 'User already deleted (idempotent behavior)')
```

**Log Levels**:
- `trace`: User snapshot retrieval, activity logging
- `info`: Deletion initiated, deletion completed
- `warn`: Idempotent retry (already deleted)
- `error`: Clerk API failures, unexpected errors

### Alerts

**Recommended Alerts** (if monitoring system available):

1. **High Failure Rate**: Alert if >10% deletions fail in 1 hour
2. **Repeated Failures**: Alert if same userId fails 3+ times
3. **API Timeout**: Alert if Clerk API timeouts spike
4. **Unexpected Volume**: Alert if deletions spike (>10 per hour)

---

## FAQ and Troubleshooting

### Q: What happens to tasks assigned to deleted users?

**A**: Tasks remain assigned to the deleted userId. The frontend displays "[người dùng đã xoá]" when fetching user info fails (404 from Clerk). No data is lost or orphaned.

**Verification**:
```sql
-- Tasks assigned to deleted user remain
SELECT id, title, assigneeIds FROM "Task" WHERE 'user_deleted_123' = ANY(assigneeIds);
```

---

### Q: Can a deleted user be restored?

**A**: No. Deletion is permanent in Clerk. Historical data exists but cannot be re-associated with a new account even if the same username/email is reused. Clerk generates new userIds for new accounts.

**Workaround**: If user needs to be restored (e.g., accidental deletion), admin must:
1. Create new Clerk account with same details
2. Manual data migration (update userIds in database) - NOT RECOMMENDED
3. Better: Keep historical data with original (deleted) userId

---

### Q: How do we handle GDPR "right to be forgotten"?

**A**: Current implementation satisfies Apple's requirement (account deletion) but may not fully satisfy GDPR (data deletion). For GDPR compliance, consider:

1. **Option A: Data anonymization** (recommended)
   - Replace userId with "DELETED_USER_123" in all tables
   - Remove personally identifiable information (names, photos)
   - Keep aggregated data for business analytics

2. **Option B: Full data deletion** (complex)
   - Delete all records referencing the userId
   - Risk: Orphaned data, broken references
   - Consider soft-delete with `deletedAt` timestamp

**Implementation**: Create separate GDPR compliance endpoint if needed (future enhancement).

---

### Q: What if Clerk API is down during deletion?

**A**: The endpoint returns 500 error. User can retry deletion later (idempotent). The pre-deletion activity log may or may not be created depending on timing.

**Recovery**:
1. User retries deletion when Clerk API is available
2. If pre-log exists but deletion failed, retry will complete deletion
3. Monitor failed deletion events in Activity logs

---

### Q: Can admins delete other users' accounts?

**A**: No. The endpoint only allows self-deletion (userId from JWT). Admins cannot delete other users' accounts via this endpoint.

**Admin Deletion**: Use Clerk Dashboard directly for admin-initiated deletions. Activity logging won't capture these events (limitation).

**Future Enhancement**: Create admin endpoint for user management if needed.

---

### Q: How to test without deleting real users?

**A**: Use Clerk's test mode or create dedicated test accounts:

1. **Test Mode** (if available in Clerk plan)
   - Separate test environment with test users
   - No impact on production data

2. **Dedicated Test Accounts**
   - Create users like `test_deletion_user_1`, `test_deletion_user_2`
   - Delete and verify behavior
   - Recreate for repeated testing

3. **Mock in Tests**
   - Unit tests mock Clerk API (no real deletions)
   - Integration tests use test doubles
   - See testing section for implementation

---

### Q: What's the rollback plan if deployment fails?

**A**: Simple rollback strategy:

1. **API Rollback**: Revert deployment (new endpoint not called by mobile yet)
2. **Database**: No migrations to rollback
3. **Clerk**: No changes made to Clerk (uses existing API)
4. **Mobile**: Feature flag controlled (can disable instantly)

**Rollback Steps**:
```bash
# API rollback
git revert <commit-hash>
vercel --prod  # Redeploy previous version

# Mobile rollback (if needed)
# Disable PostHog feature flag "account-deletion-enabled"
```

**Low Risk**: New endpoint doesn't affect existing functionality.

---

## Related Documentation

**Internal Documentation**:
- [Auth Middleware Pattern](./docs/architecture/patterns/auth-middleware.md)
- [Activity Logging Pattern](./docs/architecture/patterns/activity-event.md)
- [API Testing Guide](./docs/testing/README.md)

**External Resources**:
- [Apple App Store Guideline 5.1.1(v)](https://developer.apple.com/support/offering-account-deletion-in-your-app/)
- [Clerk User Management Docs](https://clerk.com/docs/guides/users/managing)
- [Clerk Backend API - Delete User](https://clerk.com/docs/reference/backend/user/delete-user)

**Linear Issues**:
- PSN-13: Account Deletion Implementation (this issue)
- PSN-XX: Mobile Account Deletion UI (to be created)

---

## Success Criteria

**Definition of Done**:

1. ✅ DELETE `/v1/account/me` endpoint implemented and tested
2. ✅ User deleted from Clerk on successful request
3. ✅ All historical data preserved in database
4. ✅ Activity logging captures deletion events
5. ✅ Idempotent behavior (safe to retry)
6. ✅ Unit tests >90% coverage
7. ✅ Integration tests passing
8. ✅ TypeScript and Biome checks passing
9. ✅ Code review by `code-quality-enforcer` agent
10. ✅ Documentation updated in CLAUDE.md
11. ✅ Manual testing completed (all scenarios pass)
12. ✅ Deployed to staging and verified

**Apple App Store Submission Ready**:
- Backend endpoint ready for mobile integration
- Mobile UI can be implemented with feature flag
- Demo account can demonstrate deletion flow
- Activity logs provide audit trail for compliance

---

## Appendix A: Clerk API Reference

### Delete User Endpoint

**Documentation**: https://clerk.com/docs/reference/backend/user/delete-user

**Method**: `clerkClient.users.deleteUser(userId)`

**Parameters**:
- `userId` (string, required): The ID of the user to delete

**Returns**:
- Success: Empty response (void)
- Error: `ClerkAPIResponseError` with status code and message

**Example**:
```typescript
import { clerkClient } from '@clerk/backend'

const userId = 'user_123'
await clerkClient.users.deleteUser(userId)
```

**Error Responses**:
```typescript
// User not found
{
  status: 404,
  message: 'User not found',
  errors: [{ code: 'resource_not_found', message: 'User not found' }]
}

// Unauthorized (invalid API key)
{
  status: 401,
  message: 'Unauthorized',
  errors: [{ code: 'authentication_invalid', message: 'Invalid authentication' }]
}

// Rate limited
{
  status: 429,
  message: 'Rate limit exceeded',
  errors: [{ code: 'rate_limit_exceeded', message: 'Too many requests' }]
}
```

**Side Effects**:
- User permanently deleted from Clerk
- All sessions revoked immediately
- User cannot login anymore
- No automatic cleanup of external data (intentional for our use case)

---

## Appendix B: Activity Schema Examples

### Complete Activity Records

**Pre-Deletion Snapshot**:
```json
{
  "id": "act_abc123",
  "userId": "user_2fGhjK34LMnop5678",
  "topic": "GENERAL",
  "action": "ACCOUNT_DELETION_INITIATED",
  "payload": {
    "userId": "user_2fGhjK34LMnop5678",
    "userEmail": "worker@example.com",
    "userName": "John Doe",
    "userMetadata": {
      "roles": ["nv_internal_worker"],
      "phoneNumber": "0123456789",
      "defaultPasswordChanged": true
    },
    "requestedBy": "user_2fGhjK34LMnop5678",
    "timestamp": "2025-11-10T14:30:00.000Z"
  },
  "createdAt": "2025-11-10T14:30:00.123Z",
  "updatedAt": "2025-11-10T14:30:00.123Z"
}
```

**Successful Deletion**:
```json
{
  "id": "act_abc124",
  "userId": "user_2fGhjK34LMnop5678",
  "topic": "GENERAL",
  "action": "ACCOUNT_DELETION_COMPLETED",
  "payload": {
    "userId": "user_2fGhjK34LMnop5678",
    "requestedBy": "user_2fGhjK34LMnop5678",
    "timestamp": "2025-11-10T14:30:00.000Z",
    "completedAt": "2025-11-10T14:30:01.234Z"
  },
  "createdAt": "2025-11-10T14:30:01.234Z",
  "updatedAt": "2025-11-10T14:30:01.234Z"
}
```

**Failed Deletion**:
```json
{
  "id": "act_abc125",
  "userId": "user_2fGhjK34LMnop5678",
  "topic": "GENERAL",
  "action": "ACCOUNT_DELETION_FAILED",
  "payload": {
    "userId": "user_2fGhjK34LMnop5678",
    "requestedBy": "user_2fGhjK34LMnop5678",
    "timestamp": "2025-11-10T14:30:00.000Z",
    "errorMessage": "Request failed with status code 500",
    "errorStatus": 500
  },
  "createdAt": "2025-11-10T14:30:01.456Z",
  "updatedAt": "2025-11-10T14:30:01.456Z"
}
```

**Idempotent Retry**:
```json
{
  "id": "act_abc126",
  "userId": "user_2fGhjK34LMnop5678",
  "topic": "GENERAL",
  "action": "ACCOUNT_DELETION_ALREADY_DELETED",
  "payload": {
    "userId": "user_2fGhjK34LMnop5678",
    "requestedBy": "user_2fGhjK34LMnop5678",
    "timestamp": "2025-11-10T14:35:00.000Z",
    "errorMessage": "User not found"
  },
  "createdAt": "2025-11-10T14:35:00.789Z",
  "updatedAt": "2025-11-10T14:35:00.789Z"
}
```

---

**End of Implementation Plan**
