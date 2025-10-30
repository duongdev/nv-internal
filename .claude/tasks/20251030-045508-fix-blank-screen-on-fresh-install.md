# Fix Blank Screen on Fresh Install

**Created**: 2025-10-30 04:55 UTC
**Status**: ✅ Completed
**Type**: Critical Bug Fix
**Component**: Mobile App - Authentication Flow

## Problem

When the app is freshly installed (user is not authenticated), the app shows a **blank screen** instead of redirecting to the sign-in screen. This is a critical UX issue that prevents new users from accessing the app.

## Root Cause Analysis

The authentication routing flow had a fundamental flaw:

1. **index.tsx**: Unconditionally redirected all users to `/module-transit`
2. **_layout.tsx**: `module-transit` was inside `Stack.Protected guard={isSignedIn}` block
3. **module-transit.tsx**: Had fallback logic to redirect unauthenticated users to sign-in, but this code **never executed**

**Why the blank screen occurred**:
- Unauthenticated users were redirected to `/module-transit` from index
- But `module-transit` is protected by `Stack.Protected guard={isSignedIn}`
- Protected screens show nothing when the guard fails → **blank screen**
- The fallback logic in module-transit.tsx never ran because the component never mounted

## Solution Implemented

**Fixed index.tsx to handle authentication-based routing**:

```typescript
// Before: Unconditional redirect
export default function Index() {
  return <Redirect href="/module-transit" />
}

// After: Auth-aware routing
export default function Index() {
  const { isSignedIn, isLoaded } = useAuth()

  // Show loading while auth state is being determined
  if (!isLoaded) {
    return <ActivityIndicator />
  }

  // Redirect based on authentication state
  if (!isSignedIn) {
    return <Redirect href="/(auth)/sign-in" />
  }

  return <Redirect href="/module-transit" />
}
```

**Key improvements**:
1. ✅ Check authentication state before redirecting
2. ✅ Show loading indicator while auth state is loading (`!isLoaded`)
3. ✅ Redirect unauthenticated users directly to sign-in
4. ✅ Only send authenticated users to module-transit

## Files Modified

- **apps/mobile/app/index.tsx**: Added auth-aware routing logic
- **apps/mobile/app/module-transit.tsx**: Updated comment to clarify user is guaranteed to be authenticated

## Testing Recommendations

### Manual Testing
1. **Fresh Install Test**:
   - Uninstall app completely
   - Reinstall and launch
   - ✅ Should immediately show sign-in screen (not blank screen)

2. **Authenticated User Test**:
   - Sign in as worker
   - Close and reopen app
   - ✅ Should route to correct module (worker/admin) based on role

3. **Loading State Test**:
   - Clear app data
   - Launch app with slow network
   - ✅ Should show loading indicator while auth state loads

4. **Module Switching Test**:
   - Switch between admin/worker modules
   - ✅ Module transit should still work for authenticated users

### Automated Testing (Future)
Consider adding E2E tests with Mobile-MCP:
- Test fresh install flow
- Test sign-in flow
- Test module routing for different roles

## Impact

**Before**: Users see blank screen on fresh install → app appears broken → high bounce rate
**After**: Users immediately see sign-in screen → clear path to authentication → better UX

## Architectural Pattern Established

**Index Screen Responsibility**:
- The root index screen should handle **initial routing decisions**
- Check authentication state before routing to protected screens
- Show appropriate loading states while auth state loads
- This prevents routing to protected screens that will show blank

**Protected Screen Guards**:
- `Stack.Protected` guards work correctly but show nothing when guard fails
- Don't rely on protected screens to handle unauthenticated state
- Handle auth routing **before** reaching protected screens

## Related Documentation

- Pattern: Authentication Flow (should be documented)
- Pattern: [Tabs Navigation](../../docs/architecture/patterns/tabs-navigation.md)
- Component: Stack.Protected guards in _layout.tsx

## Lessons Learned

1. **Guard Behavior**: `Stack.Protected` guards don't redirect - they just prevent rendering
2. **Entry Point Responsibility**: The entry point (index.tsx) should make routing decisions, not rely on nested screens
3. **Auth State Loading**: Always handle `!isLoaded` state to prevent flash of wrong content
4. **Critical Path Testing**: Fresh install flow is critical and should be part of release checklist

## Follow-up Tasks

- [ ] Add E2E test for fresh install flow
- [ ] Add E2E test for authenticated user routing
- [ ] Document Authentication Flow pattern in docs/architecture/patterns/
- [ ] Add fresh install test to release checklist
