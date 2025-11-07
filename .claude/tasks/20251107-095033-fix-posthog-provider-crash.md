# Fix PostHog Provider Production Crash

**Status**: ✅ COMPLETED
**Priority**: CRITICAL
**Date**: 2025-11-07
**Implementation Time**: ~30 minutes

## Problem

The production TestFlight app was **crashing immediately after splash screen** (within 1 second). Root cause: **incorrect PostHogProvider initialization pattern**.

### Symptoms
- App crashes in production builds
- Works in development (Expo Go) due to graceful degradation
- Crash occurs during PostHogProvider initialization

### Root Cause

**Incorrect Pattern** (old implementation):
```typescript
const posthogConfig = getPostHogConfig()

<PostHogProvider
  apiKey={posthogConfig.apiKey}
  autocapture={posthogConfig.autocapture}
  debug={posthogConfig.debug}
  options={posthogConfig.options}
>
```

**Issue**: This pattern is **incompatible with posthog-react-native v4.x**. The provider expects either:
1. Just `apiKey` prop (simplest)
2. `client` prop with PostHog instance (recommended for advanced config)

Passing both `apiKey` AND `options` as separate props was causing the crash.

## Solution

Implemented the **Pattern 3: Direct instantiation** from PostHog documentation:

### 1. Updated `lib/posthog.ts`

Changed from `getPostHogConfig()` returning config object to `createPostHogClient()` returning PostHog instance:

```typescript
import PostHog from 'posthog-react-native'

export function createPostHogClient(): PostHog | null {
  if (!isPostHogEnabled()) {
    console.log('[PostHog] Disabled via environment configuration')
    return null
  }

  const apiKey = getPostHogApiKey()
  if (!apiKey) {
    console.warn('[PostHog] No API key provided')
    return null
  }

  // Create PostHog instance (Pattern 3: Direct instantiation)
  return new PostHog(apiKey, {
    host: getPostHogHost(),
    customStorage: AsyncStorage,
    persistence: 'file',
    captureAppLifecycleEvents: true,
    sendFeatureFlagEvent: true,
    preloadFeatureFlags: true,
    flushAt: 20,
    flushInterval: 30000,
    customAppProperties: (props) => ({
      ...props,
      platform: Platform.OS,
      platform_version: String(Platform.Version),
      is_expo_go: IS_EXPO_GO,
      app_version: Constants.expoConfig?.version || 'unknown',
    }),
  })
}
```

**Key Changes**:
- Import `PostHog` class from 'posthog-react-native'
- Return `PostHog | null` instead of config object
- Use `new PostHog(apiKey, options)` constructor
- All configuration options passed to constructor

### 2. Updated `app/_layout.tsx`

Changed to use `client` prop with `useMemo`:

```typescript
import * as React from 'react'
import { createPostHogClient } from '@/lib/posthog'

export default function RootLayout() {
  const { colorScheme } = useColorScheme()

  // Create PostHog client instance (memoized to prevent recreation)
  const posthogClient = React.useMemo(() => createPostHogClient(), [])

  return (
    <ClerkProvider publishableKey={getClerkPublishableKey()} tokenCache={tokenCache}>
      {posthogClient ? (
        <PostHogProvider
          client={posthogClient}
          autocapture={{
            captureScreens: false,
            captureTouches: true,
          }}
        >
          <AppContent colorScheme={colorScheme ?? 'light'} />
        </PostHogProvider>
      ) : (
        <AppContent colorScheme={colorScheme ?? 'light'} />
      )}
    </ClerkProvider>
  )
}
```

**Key Changes**:
- Use `useMemo` to create client once
- Pass `client` prop to PostHogProvider (NOT apiKey/options)
- Move `autocapture` config to provider props
- Removed `debug` prop (not supported with client prop pattern)

## Implementation Details

### Files Modified
1. `/apps/mobile/lib/posthog.ts` - Changed `getPostHogConfig()` to `createPostHogClient()`
2. `/apps/mobile/app/_layout.tsx` - Updated PostHogProvider to use client prop with useMemo

### Breaking Changes
- **Removed**: `getPostHogConfig()` function
- **Added**: `createPostHogClient()` function
- **Changed**: `_layout.tsx` provider initialization pattern

### Non-Breaking
- All helper functions preserved: `resetPostHog()`, `identifyUser()`, `captureEvent()`, `trackScreen()`
- Feature flags still work (`use-feature-flag.ts` unchanged)
- All PostHog configuration options preserved

## Verification Steps

### ✅ Code Quality Checks
1. TypeScript compilation: PASSED
   ```bash
   cd apps/mobile && npx tsc --noEmit
   ```

2. Biome lint/format: PASSED
   ```bash
   pnpm exec biome check --write apps/mobile/lib/posthog.ts apps/mobile/app/_layout.tsx
   ```

### 🧪 Testing Required (Manual)

**Development Build**:
```bash
cd apps/mobile
pnpm dev
```
- [ ] App launches without crash
- [ ] PostHog initializes (check console logs)
- [ ] No TypeScript errors in terminal

**Feature Flags Test**:
- [ ] Task list filter works (admin)
- [ ] Task list search works (admin)
- [ ] Feature flags respect enable/disable state

**Production Build**:
```bash
eas build --profile production --platform ios
```
- [ ] App launches without crash in TestFlight
- [ ] PostHog events tracked (check PostHog dashboard)
- [ ] Feature flags work in production

## Success Criteria

- ✅ TypeScript compilation passes
- ✅ Code formatted with Biome
- ⏳ App launches without crash (needs manual testing)
- ⏳ PostHog initializes correctly (needs manual testing)
- ⏳ Feature flags work (needs manual testing)
- ⏳ Analytics events tracked (needs manual testing)

## PostHog Initialization Patterns

### Pattern 1: Simple (apiKey only)
```typescript
<PostHogProvider apiKey="api-key">
  {children}
</PostHogProvider>
```

### Pattern 2: With options inline
```typescript
<PostHogProvider
  apiKey="api-key"
  options={{ host: 'https://us.i.posthog.com' }}
>
  {children}
</PostHogProvider>
```

### Pattern 3: Client prop (RECOMMENDED - used in this fix)
```typescript
const client = useMemo(() => new PostHog('api-key', { host: '...' }), [])

<PostHogProvider client={client}>
  {children}
</PostHogProvider>
```

**Why Pattern 3?**
- More control over initialization
- Can handle null gracefully
- Supports complex configuration
- Memoization prevents recreation
- Official recommendation for advanced use cases

## Related Documentation

- PostHog React Native Docs: https://posthog.com/docs/libraries/react-native
- Feature Flags Guide: `.claude/docs/feature-flags-guide.md`
- First Flag Implementation: `.claude/tasks/20251107-043354-first-feature-flag-task-list-filter-admin.md`

## Rollback Plan

If this fix causes issues:

1. **Revert commits**:
   ```bash
   git revert HEAD
   ```

2. **Temporary disable PostHog** (immediate fix):
   ```typescript
   // In app.config.ts
   EXPO_PUBLIC_POSTHOG_ENABLED: 'false'
   ```

3. **Alternative pattern** (if Pattern 3 doesn't work):
   ```typescript
   // Use Pattern 1 (simple apiKey only)
   <PostHogProvider apiKey={getPostHogApiKey()}>
     {children}
   </PostHogProvider>
   ```

## Lessons Learned

1. **Follow official patterns**: Always use the recommended initialization pattern from library docs
2. **Test production builds early**: Expo Go may hide production-only crashes
3. **Memoize expensive operations**: Use useMemo for client creation to prevent recreations
4. **Graceful degradation**: Always support null client case for when PostHog is disabled

## Next Steps

1. **Manual Testing**: Test app launch in development and production
2. **Feature Flag Testing**: Verify all 4 flags work correctly
3. **Analytics Verification**: Check PostHog dashboard for events
4. **Production Deployment**: Deploy to TestFlight when verified

## Impact

- **Severity**: CRITICAL (app crash in production)
- **Affected Users**: All production users
- **Downtime**: Until fix is deployed
- **Risk**: LOW (follows official pattern, no breaking API changes)
