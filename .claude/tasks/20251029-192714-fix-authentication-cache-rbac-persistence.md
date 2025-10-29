# Fix Authentication Issues: Cache Clearing, RBAC, and Module Persistence

## Overview
Critical authentication and security issues have been identified in the mobile application that need immediate resolution. These issues affect data security, access control, and user experience for both admin and worker roles.

## Implementation Status: ⏳ In Progress

## Problem Analysis

### Issue 1: Cache Not Cleared on Logout
**Current Behavior**: When a user logs out, TanStack Query cached data persists in memory. When the same or different user logs back in, they can see data from the previous session.

**Security Impact**: HIGH - This is a critical data leak vulnerability where sensitive information from one user session can be exposed to another user.

**Root Cause Analysis**:
- TanStack Query maintains its cache in memory across logout/login cycles
- The logout handler in the mobile app does not properly clear the query client cache
- AsyncStorage and SecureStore data may also persist beyond logout
- The authentication context does not trigger cache invalidation on sign-out

**Affected Components**:
- `/apps/mobile/contexts/auth.tsx` - Authentication context and logout handler
- `/apps/mobile/lib/api.ts` - Query client configuration
- All screens using `useQuery` hooks that display sensitive data

### Issue 2: Worker Access Control Issue
**Current Behavior**: Workers (users with only WORKER role) can currently navigate to and access the admin module, which should be restricted to users with ADMIN role.

**Security Impact**: HIGH - Unauthorized access to administrative features could allow workers to view/modify data beyond their authorization level.

**Root Cause Analysis**:
- Insufficient role-based access control (RBAC) in the mobile app navigation
- Missing navigation guards in Expo Router for admin routes
- Possible lack of server-side validation for admin-only API endpoints
- Role checking logic may be checking for user existence rather than specific role permissions

**Affected Components**:
- `/apps/mobile/app/(app)/(tabs)/_layout.tsx` - Tab navigation access control
- `/apps/mobile/app/(app)/admin/` - All admin module screens
- `/apps/mobile/contexts/auth.tsx` - Role checking utilities
- API endpoints that should be admin-only but may lack proper middleware

### Issue 3: Module Preference Not Persisted
**Current Behavior**: Admins with both ADMIN and WORKER roles can switch between admin and worker modules via the user settings menu, but this preference is reset to default (admin) when the app is reopened.

**UX Impact**: MEDIUM - Poor user experience for admins who prefer to use the worker module as their default view.

**Root Cause Analysis**:
- Module preference is only stored in React state, not persisted to device storage
- No AsyncStorage implementation for saving user preferences
- App initialization does not check for saved preferences
- User settings screen updates state but doesn't persist the selection

**Affected Components**:
- `/apps/mobile/app/(app)/(tabs)/settings.tsx` - User settings and module switcher
- `/apps/mobile/contexts/auth.tsx` - Module preference state management
- App initialization logic that determines initial module

## Technical Investigation

### Current Authentication Flow Review
```typescript
// Current flow in /apps/mobile/contexts/auth.tsx
1. User logs in via Clerk
2. JWT token stored in SecureStore
3. User data fetched and stored in context
4. TanStack Query begins caching API responses
5. On logout:
   - Clerk.signOut() called
   - Token removed from SecureStore
   - Navigation reset to login
   - BUT: Query cache not cleared
```

### TanStack Query Cache Management
```typescript
// Current configuration in /apps/mobile/lib/api.ts
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24 * 7, // 1 week
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
})

// Missing: Cache clear on logout
// Need: queryClient.clear() or queryClient.removeQueries()
```

### Role-Based Access Control Review
```typescript
// Current RBAC implementation
- Clerk provides user roles in JWT
- Mobile app checks user.roles array
- Navigation conditionally renders based on roles
- BUT: No hard guards preventing navigation
- API may rely on client-side role checking
```

### Module Preference Storage Review
```typescript
// Current: State only
const [selectedModule, setSelectedModule] = useState('admin')

// Needed: AsyncStorage persistence
import AsyncStorage from '@react-native-async-storage/async-storage'
await AsyncStorage.setItem('modulePreference', module)
```

## Resolution Plan

### Issue 1 Resolution: Cache Clearing on Logout

#### Implementation Approach:
1. **Modify logout handler** in `/apps/mobile/contexts/auth.tsx`:
   ```typescript
   const handleLogout = async () => {
     try {
       // 1. Clear TanStack Query cache
       queryClient.clear() // Clears all cached data

       // 2. Clear AsyncStorage (except non-sensitive preferences)
       const keysToKeep = ['modulePreference', 'appSettings']
       const allKeys = await AsyncStorage.getAllKeys()
       const keysToRemove = allKeys.filter(key => !keysToKeep.includes(key))
       await AsyncStorage.multiRemove(keysToRemove)

       // 3. Clear SecureStore
       await SecureStore.deleteItemAsync('jwt_token')
       await SecureStore.deleteItemAsync('user_data')

       // 4. Sign out from Clerk
       await clerk.signOut()

       // 5. Reset navigation
       router.replace('/login')
     } catch (error) {
       console.error('Logout error:', error)
     }
   }
   ```

2. **Add cache reset on app state changes**:
   ```typescript
   // Listen for app state changes
   useEffect(() => {
     const subscription = AppState.addEventListener('change', nextAppState => {
       if (nextAppState === 'background' && !isAuthenticated) {
         queryClient.clear()
       }
     })
     return () => subscription.remove()
   }, [isAuthenticated])
   ```

### Issue 2 Resolution: Enforce Worker Access Control

#### Implementation Approach:
1. **Add navigation guards** in `/apps/mobile/app/(app)/(tabs)/_layout.tsx`:
   ```typescript
   const AdminTabGuard = ({ children }) => {
     const { user } = useAuth()
     const hasAdminRole = user?.roles?.includes('ADMIN')

     if (!hasAdminRole) {
       return <Redirect href="/(app)/(tabs)/worker" />
     }

     return children
   }
   ```

2. **Implement route protection** in `/apps/mobile/app/(app)/admin/_layout.tsx`:
   ```typescript
   export default function AdminLayout() {
     const { user } = useAuth()
     const router = useRouter()

     useEffect(() => {
       if (!user?.roles?.includes('ADMIN')) {
         router.replace('/(app)/(tabs)/worker')
       }
     }, [user])

     if (!user?.roles?.includes('ADMIN')) {
       return null // Prevent flash of unauthorized content
     }

     return <Stack />
   }
   ```

3. **Add server-side validation** in API middleware:
   ```typescript
   // /apps/api/src/middleware/rbac.ts
   export const requireAdmin = () => {
     return async (c, next) => {
       const auth = getAuth(c)
       if (!auth?.userId) {
         throw new HTTPException(401, { message: 'Unauthorized' })
       }

       const user = await userService.getUserById(auth.userId)
       if (!user.roles.includes('ADMIN')) {
         throw new HTTPException(403, { message: 'Forbidden: Admin access required' })
       }

       await next()
     }
   }
   ```

### Issue 3 Resolution: Persist Module Preference

#### Implementation Approach:
1. **Add AsyncStorage for preferences** in `/apps/mobile/contexts/auth.tsx`:
   ```typescript
   // Load preference on app start
   useEffect(() => {
     const loadPreferences = async () => {
       if (user?.roles?.includes('ADMIN') && user?.roles?.includes('WORKER')) {
         const savedModule = await AsyncStorage.getItem('modulePreference')
         if (savedModule && ['admin', 'worker'].includes(savedModule)) {
           setSelectedModule(savedModule)
         }
       }
     }
     loadPreferences()
   }, [user])

   // Save preference when changed
   const switchModule = async (module: 'admin' | 'worker') => {
     setSelectedModule(module)
     await AsyncStorage.setItem('modulePreference', module)
   }
   ```

2. **Update settings screen** in `/apps/mobile/app/(app)/(tabs)/settings.tsx`:
   ```typescript
   const handleModuleSwitch = async (module: 'admin' | 'worker') => {
     await auth.switchModule(module)
     // Show confirmation toast
     Toast.show({
       type: 'success',
       text1: 'Module preference saved',
       text2: `Default module set to ${module}`
     })
   }
   ```

3. **Handle edge cases**:
   ```typescript
   // If user role changes and saved preference is no longer valid
   useEffect(() => {
     const validatePreference = async () => {
       const savedModule = await AsyncStorage.getItem('modulePreference')
       if (savedModule === 'admin' && !user?.roles?.includes('ADMIN')) {
         // Reset to worker if admin access revoked
         await AsyncStorage.setItem('modulePreference', 'worker')
         setSelectedModule('worker')
       }
     }
     validatePreference()
   }, [user?.roles])
   ```

## Implementation Plan

### Phase 1: Cache Clearing (Priority: CRITICAL)
- [ ] Update authentication context with comprehensive logout handler
- [ ] Add queryClient.clear() to logout flow
- [ ] Implement AsyncStorage cleanup (selective removal)
- [ ] Add SecureStore data cleanup
- [ ] Test with both admin01 and worker01 accounts
- [ ] Verify no data persists after logout

### Phase 2: RBAC Enforcement (Priority: CRITICAL)
- [ ] Add navigation guards to admin tab
- [ ] Implement route protection in admin layout
- [ ] Add role checking utilities
- [ ] Create requireAdmin middleware for API
- [ ] Apply middleware to all admin endpoints
- [ ] Test worker01 cannot access admin module
- [ ] Test admin01 maintains full access

### Phase 3: Module Persistence (Priority: HIGH)
- [ ] Add AsyncStorage for module preference
- [ ] Load preference on app initialization
- [ ] Update settings screen to persist selection
- [ ] Handle role change edge cases
- [ ] Add preference migration for existing users
- [ ] Test persistence across app restarts

### Phase 4: Testing & Verification
- [ ] Run full authentication test suite
- [ ] Perform security audit of access control
- [ ] Test with QA accounts (admin01, worker01)
- [ ] Verify no regression in existing features
- [ ] Update documentation

## Testing Scenarios

### Test Case 1: Cache Clearing
```
1. Login as admin01
2. Navigate through multiple screens to populate cache
3. View tasks, employees, reports
4. Logout
5. Login as worker01
6. Verify: No data from admin01 session visible
7. Check network tab: Fresh API calls made
```

### Test Case 2: Worker Access Control
```
1. Login as worker01 (password: worker01)
2. Attempt to navigate to /admin routes
3. Verify: Redirected to worker module
4. Check console: No admin API calls succeed
5. Verify: Cannot access admin features via URL manipulation
```

### Test Case 3: Module Persistence
```
1. Login as admin01 (has both ADMIN and WORKER roles)
2. Switch to worker module via settings
3. Force quit app
4. Reopen app
5. Verify: App opens to worker module
6. Switch to admin module
7. Force quit and reopen
8. Verify: App opens to admin module
```

### Test Case 4: Edge Cases
```
1. Test rapid logout/login cycles
2. Test switching users without logout
3. Test network failure during logout
4. Test app crash during cache clearing
5. Test preference persistence after app updates
```

## Files to Modify

### Mobile App
- `/apps/mobile/contexts/auth.tsx` - Main authentication context
- `/apps/mobile/lib/api.ts` - Query client configuration
- `/apps/mobile/app/(app)/(tabs)/_layout.tsx` - Tab navigation guards
- `/apps/mobile/app/(app)/admin/_layout.tsx` - Admin route protection
- `/apps/mobile/app/(app)/(tabs)/settings.tsx` - Module switcher UI
- `/apps/mobile/app/_layout.tsx` - Root layout initialization

### API
- `/apps/api/src/middleware/rbac.ts` - Create RBAC middleware
- `/apps/api/src/v1/admin/**/route.ts` - Apply admin middleware
- `/apps/api/src/v1/auth/route.ts` - Validate roles in auth endpoints

### Shared Packages
- `/packages/validation/src/auth.ts` - Add role validation schemas

## Security Considerations

1. **Token Management**:
   - Ensure all tokens are cleared from memory and storage
   - Invalidate refresh tokens on server side
   - Consider token rotation after logout

2. **Data Sanitization**:
   - Clear all PII from cache
   - Remove any downloaded files/images
   - Clear form data and drafts

3. **RBAC Enforcement**:
   - Never trust client-side role checks alone
   - Always validate permissions server-side
   - Log unauthorized access attempts
   - Consider rate limiting on auth endpoints

4. **Session Hijacking Prevention**:
   - Implement device fingerprinting
   - Track session anomalies
   - Force re-authentication for sensitive operations

5. **Audit Logging**:
   - Log all authentication events
   - Track role-based access attempts
   - Monitor for suspicious patterns

## Success Criteria

- ✅ No cached data visible after logout (verified with test accounts)
- ✅ Workers cannot access admin module under any circumstances
- ✅ Admin module preference persists across app sessions
- ✅ All existing authentication features continue to work
- ✅ Security audit passes with no critical findings
- ✅ Performance not degraded by cache clearing
- ✅ No memory leaks from incomplete cleanup
- ✅ QA sign-off using provided test accounts

## Related Documentation

- Authentication Test Plan: `.claude/qa/test-plans/01-authentication.md`
- Auth Middleware Pattern: `docs/architecture/patterns/auth-middleware.md`
- Auth Optimization: `docs/architecture/patterns/auth-optimization.md`
- Clerk Integration: `docs/architecture/patterns/clerk-auth.md`
- CLAUDE.md Security Guidelines: See Security section

## Notes

- This is a critical security fix that should be deployed as soon as possible
- Consider adding automated tests to prevent regression
- May need to coordinate with backend team for API middleware changes
- Consider adding monitoring for failed authentication attempts
- Document the new RBAC pattern for future features
- Consider implementing a "remember me" feature separately from module preference

## Deployment Considerations

1. **Rollout Strategy**:
   - Deploy API changes first (backward compatible)
   - Deploy mobile app update with forced update flag
   - Monitor error rates and user reports

2. **Migration**:
   - Existing users will need to re-login after update
   - Module preferences will default to admin for eligible users
   - Consider showing a "What's New" dialog explaining changes

3. **Monitoring**:
   - Track logout completion rates
   - Monitor unauthorized access attempts
   - Alert on unusual authentication patterns

## References

- Clerk Auth Documentation: https://clerk.com/docs
- TanStack Query Cache Management: https://tanstack.com/query/latest/docs/react/guides/caching
- AsyncStorage API: https://react-native-async-storage.github.io/async-storage/
- Expo SecureStore: https://docs.expo.dev/versions/latest/sdk/securestore/
- OWASP Mobile Security: https://owasp.org/www-project-mobile-security/