# Test Plan: Authentication

**Feature**: Authentication (Login/Logout with Clerk)
**Version**: 1.0.0
**Created**: 2025-10-30
**Last Updated**: 2025-10-30
**Status**: ⏳ Draft

## 📋 Feature Overview

### Description
User authentication system using Clerk for secure login/logout functionality, session management, and role-based access control.

### Business Requirements
- Users must authenticate to access the application
- Support email/password and OAuth login methods
- Maintain secure session management
- Role-based access control (Admin, Manager, Employee)
- Support Vietnamese language in authentication flows

### Technical Implementation
- **Frontend**: Clerk React Native SDK, auth context providers
- **Backend**: Clerk webhook integration, JWT validation
- **Database**: User model with Clerk ID mapping

### Related Documentation
- Implementation Task: `.claude/tasks/[pending].md`
- Clerk Documentation: Use context7 MCP for latest docs

## 🎯 Test Objectives

### Primary Goals
1. Verify all authentication methods work correctly
2. Ensure session persistence across app restarts
3. Validate role-based access control
4. Confirm security measures are effective

### Out of Scope
- Clerk dashboard configuration
- Backend webhook implementation details

## ✅ Success Criteria

### Functional Criteria
- [ ] Email/password login successful
- [ ] OAuth login successful (if configured)
- [ ] Logout clears session completely
- [ ] Session persists across app restarts
- [ ] Invalid credentials show appropriate errors
- [ ] Password reset flow works
- [ ] Role-based routing works correctly

### Non-Functional Criteria
- [ ] Login completes within 3 seconds
- [ ] Error messages in Vietnamese are clear
- [ ] Accessibility labels present
- [ ] Secure storage of credentials

## 📋 Prerequisites

### Test Environment
- **Device Requirements**: iOS 14+ / Android 10+
- **Network**: Stable internet connection
- **Permissions**: None required

### Test Data
- **User Accounts**:
  - Admin: admin@nvinternal.com / Test123!
  - Manager: manager@nvinternal.com / Test123!
  - Employee: employee@nvinternal.com / Test123!
  - Invalid: invalid@nvinternal.com / WrongPass
  - **QA Test Accounts**:
    - Admin with worker role: admin01 / admin01
    - Worker only: worker01 / worker01
- **Required Data**:
  - Valid Clerk configuration
  - Test environment API endpoints

### Setup Steps
1. Install fresh app instance
2. Clear any cached credentials
3. Ensure network connectivity

## 🧪 Test Scenarios

### Happy Path Scenarios

#### Scenario 1: Email/Password Login
**Priority**: High
**Test Data**: Valid credentials

| Step | Action | Expected Result | Actual Result | Status |
|------|--------|-----------------|---------------|---------|
| 1 | Open app | Login screen displays | | ⏳ |
| 2 | Enter valid email | Email accepted | | ⏳ |
| 3 | Enter valid password | Password accepted | | ⏳ |
| 4 | Tap login button | Loading indicator shows | | ⏳ |
| 5 | Wait for response | Navigate to home screen | | ⏳ |
| 6 | Verify user info | Correct user name displayed | | ⏳ |

**Verification Points**:
- [ ] User session created
- [ ] Correct role assigned
- [ ] Navigation to appropriate home screen

#### Scenario 2: Logout Flow
**Priority**: High
**Test Data**: Logged-in user

| Step | Action | Expected Result | Actual Result | Status |
|------|--------|-----------------|---------------|---------|
| 1 | Navigate to profile | Profile screen displays | | ⏳ |
| 2 | Tap logout button | Confirmation dialog shows | | ⏳ |
| 3 | Confirm logout | Session cleared | | ⏳ |
| 4 | Verify redirect | Login screen displays | | ⏳ |
| 5 | Try accessing protected route | Redirected to login | | ⏳ |

### Edge Cases

#### Scenario 3: Session Persistence
**Priority**: Medium
**Test Data**: Valid credentials

| Step | Action | Expected Result | Actual Result | Status |
|------|--------|-----------------|---------------|---------|
| 1 | Login successfully | Home screen displays | | ⏳ |
| 2 | Kill app completely | App closes | | ⏳ |
| 3 | Reopen app | Skip login, show home | | ⏳ |
| 4 | Verify user context | User data available | | ⏳ |

### Critical Security Scenarios

#### Scenario 4: Cache Clearing on Logout
**Priority**: CRITICAL
**Test Data**: admin01 and worker01 accounts
**Related Task**: `.claude/tasks/20251029-192714-fix-authentication-cache-rbac-persistence.md`

| Step | Action | Expected Result | Actual Result | Status |
|------|--------|-----------------|---------------|---------|
| 1 | Login as admin01 | Home screen displays | | ⏳ |
| 2 | Navigate to tasks list | Tasks displayed and cached | | ⏳ |
| 3 | Navigate to employee list | Employees displayed and cached | | ⏳ |
| 4 | Navigate to reports | Reports displayed and cached | | ⏳ |
| 5 | Go to settings and logout | Logout confirmation | | ⏳ |
| 6 | Confirm logout | Return to login screen | | ⏳ |
| 7 | Login as worker01 | Worker home screen displays | | ⏳ |
| 8 | Check network tab | Fresh API calls, no cached data | | ⏳ |
| 9 | Navigate to tasks | No admin01 data visible | | ⏳ |
| 10 | Verify all screens | All data belongs to worker01 | | ⏳ |

**Verification Points**:
- [ ] TanStack Query cache completely cleared
- [ ] No data from previous session visible
- [ ] All API calls are fresh (not from cache)
- [ ] AsyncStorage cleared (except preferences)
- [ ] SecureStore tokens removed

#### Scenario 5: Worker Access Control (RBAC)
**Priority**: CRITICAL
**Test Data**: worker01 account
**Related Task**: `.claude/tasks/20251029-192714-fix-authentication-cache-rbac-persistence.md`

| Step | Action | Expected Result | Actual Result | Status |
|------|--------|-----------------|---------------|---------|
| 1 | Login as worker01 | Worker module loads | | ⏳ |
| 2 | Check bottom tabs | Only worker tabs visible | | ⏳ |
| 3 | Try URL manipulation to /admin | Redirected to worker module | | ⏳ |
| 4 | Check settings menu | No admin module option | | ⏳ |
| 5 | Attempt admin API call | 403 Forbidden response | | ⏳ |
| 6 | Try accessing admin reports | Access denied | | ⏳ |
| 7 | Verify navigation stack | No admin routes accessible | | ⏳ |

**Verification Points**:
- [ ] Worker cannot see admin tabs
- [ ] Worker cannot navigate to admin routes
- [ ] Admin API endpoints return 403
- [ ] No admin features exposed in UI
- [ ] Navigation guards prevent access

#### Scenario 6: Module Preference Persistence
**Priority**: HIGH
**Test Data**: admin01 account (has both ADMIN and WORKER roles)
**Related Task**: `.claude/tasks/20251029-192714-fix-authentication-cache-rbac-persistence.md`

| Step | Action | Expected Result | Actual Result | Status |
|------|--------|-----------------|---------------|---------|
| 1 | Login as admin01 | Admin module loads (default) | | ⏳ |
| 2 | Go to settings | Module switcher visible | | ⏳ |
| 3 | Switch to worker module | Worker module loads | | ⏳ |
| 4 | Verify UI change | Worker tabs/features shown | | ⏳ |
| 5 | Force quit app | App closes completely | | ⏳ |
| 6 | Reopen app | Worker module loads (persisted) | | ⏳ |
| 7 | Switch back to admin | Admin module loads | | ⏳ |
| 8 | Force quit app | App closes | | ⏳ |
| 9 | Reopen app | Admin module loads (persisted) | | ⏳ |
| 10 | Clear app data | Preferences reset | | ⏳ |
| 11 | Login again | Admin module loads (default) | | ⏳ |

**Verification Points**:
- [ ] Module preference saved to AsyncStorage
- [ ] Preference survives app restart
- [ ] Preference survives phone restart
- [ ] UI reflects selected module
- [ ] Preference cleared on app data clear

### Error Scenarios

#### Scenario 7: Invalid Credentials
**Priority**: High
**Test Data**: Invalid credentials

| Step | Action | Expected Result | Actual Result | Status |
|------|--------|-----------------|---------------|---------|
| 1 | Enter invalid email | Email accepted | | ⏳ |
| 2 | Enter wrong password | Password accepted | | ⏳ |
| 3 | Tap login | Error message in Vietnamese | | ⏳ |
| 4 | Verify message | Clear error description | | ⏳ |
| 5 | Retry with valid | Login successful | | ⏳ |

## 🔄 Regression Tests

### Critical Paths to Verify
- [ ] Existing user sessions remain valid
- [ ] API calls include auth headers
- [ ] Protected routes still secured

## 📊 Test Execution

### Test Coverage

| Area | Scenarios | Passed | Failed | Blocked | Coverage |
|------|-----------|---------|---------|----------|-----------|
| Happy Path | 2 | | | | 0% |
| Edge Cases | 1 | | | | 0% |
| Critical Security | 3 | | | | 0% |
| Error Handling | 1 | | | | 0% |
| **Total** | **7** | **0** | **0** | **0** | **0%** |

## 🐛 Defects Found

### Bug Summary
(To be filled during testing)

## 📈 Test Metrics

### Execution Metrics
- **Total Test Cases**: 7
- **Executed**: 0 (0%)
- **Passed**: 0 (0%)
- **Failed**: 0 (0%)
- **Blocked**: 0 (0%)
- **Critical Issues**: 3 (pending fix)

## 🎬 Test Evidence

### Screenshots
(To be captured during testing)

## ✍️ Sign-off

### Test Completion Criteria
- [ ] All scenarios executed
- [ ] Critical bugs resolved
- [ ] Security validated
- [ ] Vietnamese language verified

## 📝 Notes and Observations

### Critical Issues Identified (2025-10-29)
Three critical authentication issues have been documented and require immediate attention:
1. **Cache Not Cleared on Logout**: Security risk - cached data persists after logout
2. **Worker Access Control Issue**: Workers can access admin module (should be blocked)
3. **Module Preference Not Persisted**: Admin module selection resets on app restart

See `.claude/tasks/20251029-192714-fix-authentication-cache-rbac-persistence.md` for complete implementation plan.

### Improvements Suggested
(To be filled during testing)

### Follow-up Items
- [ ] Fix critical authentication issues (Task: 20251029-192714)
- [ ] Execute comprehensive test plan with QA accounts
- [ ] Add automated tests for authentication flows
- [ ] Document RBAC patterns for future features
- [ ] Consider implementing session timeout
- [ ] Add audit logging for authentication events