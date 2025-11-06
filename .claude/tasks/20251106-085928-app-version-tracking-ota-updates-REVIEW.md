# Implementation Review: App Version Tracking & OTA Updates

**Reviewer**: Claude Code
**Review Date**: 2025-11-06
**Task File**: `.claude/tasks/20251106-085928-app-version-tracking-ota-updates.md`
**Status**: ✅ **APPROVED WITH RECOMMENDATIONS**

---

## Executive Summary

The proposed implementation plan is **technically sound and well-structured**. It aligns with existing project patterns, follows Expo best practices, and addresses the business requirements effectively. However, there are several **critical improvements** and **architectural adjustments** needed before implementation.

**Overall Assessment**:
- ✅ **Architecture**: Solid approach using expo-updates API
- ✅ **Integration**: Fits well with existing patterns
- ⚠️ **Missing Dependencies**: Need `expo-application` and `expo-constants`
- ⚠️ **Provider Pattern**: Should use standard Context pattern (no separate provider file needed)
- ⚠️ **Testing Strategy**: Needs enhancements for Expo Go limitations
- ⚠️ **Performance**: Add proper error boundaries and state persistence

---

## 1. Validation of Technical Approach

### ✅ **Expo Updates Integration - APPROVED**

**Current State**:
- `expo-updates` version `~29.0.12` is already installed in `package.json`
- This is the correct version for Expo SDK 54
- No additional configuration needed for basic functionality

**Why This Approach Works**:
1. **Standard Expo Pattern**: Using `expo-updates` is the recommended approach for OTA updates
2. **Non-Disruptive**: Manual reload pattern respects user workflow (aligns with UX best practices)
3. **Background Download**: Efficient, doesn't block UI
4. **Silent Checks**: Good UX, no popup fatigue

### ✅ **Version Information Approach - APPROVED WITH CHANGES**

**Proposed**: Install `expo-application` and `expo-constants`

**Current State**:
- ✅ `expo-constants` is **already available** via Expo SDK (detected in dependency tree: `expo-constants@18.0.8`)
- ❌ `expo-application` is **NOT installed** - needs to be added

**Required Changes**:
```bash
# Only need to install expo-application
pnpm add expo-application
```

**Why expo-application is needed**:
- Provides `Application.nativeApplicationVersion` (e.g., "1.0.0")
- Provides `Application.nativeBuildVersion` (e.g., "123")
- More reliable than Constants.manifest for version info

---

## 2. Architectural Recommendations

### ⚠️ **CRITICAL: Provider Pattern Simplification**

**Problem with Proposed Approach**:
The plan proposes creating a separate `UpdateProvider` component file, but this doesn't match the existing codebase patterns.

**Current Codebase Pattern Analysis**:
- **No existing provider components** in `apps/mobile/components/providers/` (directory doesn't exist)
- All global state uses React Context directly within `_layout.tsx` or hooks
- Examples:
  - `ClerkProvider` - imported from library
  - `ThemeProvider` - imported from `@react-navigation/native`
  - `QueryClientProvider` - imported from `@tanstack/react-query`
  - Custom state managed via hooks (e.g., `useColorScheme`, `useAuth`)

**Recommended Architecture**:

**Option 1: Hook-Only Pattern (RECOMMENDED)**
```typescript
// apps/mobile/hooks/use-ota-updates.ts
export function useOTAUpdates() {
  const [state, setState] = useState<OTAUpdateState>({ ... })

  // All update logic in hook
  const checkForUpdates = async () => { ... }
  const reloadApp = async () => { ... }

  // Auto-check on mount
  useEffect(() => {
    checkForUpdates()
  }, [])

  return { ...state, checkForUpdates, reloadApp }
}

// apps/mobile/utils/version-helper.ts
export function getVersionInfo(): VersionInfo {
  // All version getters here
}
```

**Usage in Component**:
```typescript
// apps/mobile/components/version-info-footer.tsx
export function VersionInfoFooter() {
  const updateState = useOTAUpdates()
  const versionInfo = getVersionInfo()

  return <View>...</View>
}
```

**Option 2: Context Pattern (If Global State Needed)**
Only use if multiple components need the same update state:

```typescript
// apps/mobile/hooks/use-ota-updates.ts
const OTAUpdateContext = createContext<OTAUpdateContextValue | null>(null)

export function OTAUpdateProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<OTAUpdateState>({ ... })
  // ... implementation
  return (
    <OTAUpdateContext.Provider value={{ ...state, ... }}>
      {children}
    </OTAUpdateContext.Provider>
  )
}

export function useOTAUpdates() {
  const context = useContext(OTAUpdateContext)
  if (!context) throw new Error('useOTAUpdates must be used within OTAUpdateProvider')
  return context
}
```

**Wrap in _layout.tsx**:
```typescript
// apps/mobile/app/_layout.tsx
import { OTAUpdateProvider } from '@/hooks/use-ota-updates'

<ClerkProvider ...>
  <ThemeProvider ...>
    <QueryClientProvider ...>
      <OTAUpdateProvider>  {/* Add here */}
        <KeyboardProvider>
          ...
        </KeyboardProvider>
      </OTAUpdateProvider>
    </QueryClientProvider>
  </ThemeProvider>
</ClerkProvider>
```

**Recommendation**: Start with **Option 1 (Hook-Only)** since only one component (VersionInfoFooter) will consume this state. Upgrade to Option 2 only if needed.

### ⚠️ **State Persistence Strategy**

**Issue**: Plan mentions "Persist last check time in AsyncStorage" but doesn't detail implementation.

**Recommended Pattern** (following existing `module-preference.ts` pattern):

```typescript
// apps/mobile/lib/update-state.ts
import AsyncStorage from '@react-native-async-storage/async-storage'

const UPDATE_STATE_KEY = 'otaUpdateState'

export interface PersistedUpdateState {
  lastChecked: string | null // ISO date string
  lastUpdateId: string | null
}

export async function saveUpdateState(state: PersistedUpdateState): Promise<void> {
  try {
    await AsyncStorage.setItem(UPDATE_STATE_KEY, JSON.stringify(state))
  } catch (error) {
    console.error('Error saving update state:', error)
    // Non-critical error, don't throw
  }
}

export async function getUpdateState(): Promise<PersistedUpdateState | null> {
  try {
    const state = await AsyncStorage.getItem(UPDATE_STATE_KEY)
    return state ? JSON.parse(state) : null
  } catch (error) {
    console.error('Error getting update state:', error)
    return null
  }
}

export async function clearUpdateState(): Promise<void> {
  try {
    await AsyncStorage.removeItem(UPDATE_STATE_KEY)
  } catch (error) {
    console.error('Error clearing update state:', error)
  }
}
```

**Usage in Hook**:
```typescript
// Load on mount
useEffect(() => {
  const loadState = async () => {
    const saved = await getUpdateState()
    if (saved?.lastChecked) {
      setLastChecked(new Date(saved.lastChecked))
    }
  }
  loadState()
}, [])

// Save on check
useEffect(() => {
  if (lastChecked) {
    saveUpdateState({
      lastChecked: lastChecked.toISOString(),
      lastUpdateId: currentUpdateId,
    })
  }
}, [lastChecked])
```

---

## 3. Integration Points Analysis

### ✅ **Settings Screen Footer Placement - APPROVED**

**Current Structure**:
```tsx
// apps/mobile/app/admin/(tabs)/settings.tsx
<ScrollView
  bounces={false}
  className="flex-1 bg-background"
  contentContainerClassName="px-4 pt-safe pb-24"  // Note: pb-24 for tab bar
>
  <UserSettingsScreen isAdminView />
</ScrollView>
```

**Recommended Integration**:
```tsx
// apps/mobile/components/user-settings/user-settings-screen.tsx
export const UserSettingsScreen = ({ isAdminView }) => {
  return (
    <View className="gap-4">
      <UserHeader user={user} />
      <MenuGroup>{/* theme switcher */}</MenuGroup>
      {/* ... other menu groups ... */}

      {/* Add footer at bottom */}
      <VersionInfoFooter className="mt-8" />
    </View>
  )
}
```

**Why This Works**:
- ✅ Footer scrolls with content (better UX)
- ✅ Consistent spacing with `gap-4` pattern
- ✅ `mt-8` adds separation from last menu group
- ✅ Works for both admin and worker views

**Alternative** (if footer should be sticky):
```tsx
// apps/mobile/app/admin/(tabs)/settings.tsx
<View className="flex-1 bg-background">
  <ScrollView
    className="flex-1"
    contentContainerClassName="px-4 pt-safe pb-4"
  >
    <UserSettingsScreen isAdminView />
  </ScrollView>
  <VersionInfoFooter className="px-4 pb-safe border-t border-border" />
</View>
```

**Recommendation**: Use **scrolling footer** (first approach) for better mobile UX.

### ✅ **Component Styling Pattern - APPROVED**

**Existing Pattern Analysis** (from `badge.tsx`, `text.tsx`):
- Uses `class-variance-authority` for variant management
- Uses `cn()` utility from `@/lib/utils` for className composition
- Supports `className` prop for customization
- Uses NativeWind/Tailwind classes consistently

**Recommended Footer Component Structure**:
```typescript
// apps/mobile/components/version-info-footer.tsx
import { ActivityIndicator, Pressable, View } from 'react-native'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/text'
import { useOTAUpdates } from '@/hooks/use-ota-updates'
import { cn } from '@/lib/utils'
import { getVersionInfo } from '@/utils/version-helper'

export interface VersionInfoFooterProps {
  className?: string
}

export function VersionInfoFooter({ className }: VersionInfoFooterProps) {
  const {
    isChecking,
    isDownloading,
    isUpdateAvailable,
    downloadProgress,
    lastChecked,
    error,
    checkForUpdates,
    reloadApp,
  } = useOTAUpdates()

  const { version, buildNumber, channel, fullString } = getVersionInfo()

  return (
    <View className={cn('items-center gap-2 py-4', className)}>
      {/* Version line */}
      <Text variant="muted" className="text-center">
        {fullString}
      </Text>

      {/* Status line */}
      {isChecking && (
        <View className="flex-row items-center gap-2">
          <ActivityIndicator size="small" />
          <Text variant="small" className="text-muted-foreground">
            Checking for updates...
          </Text>
        </View>
      )}

      {isDownloading && (
        <View className="w-full gap-1">
          <View className="flex-row items-center justify-between">
            <Text variant="small" className="text-muted-foreground">
              Downloading update...
            </Text>
            <Text variant="small" className="text-muted-foreground">
              {Math.round(downloadProgress * 100)}%
            </Text>
          </View>
          <View className="h-1 bg-muted rounded-full overflow-hidden">
            <View
              className="h-full bg-primary"
              style={{ width: `${downloadProgress * 100}%` }}
            />
          </View>
        </View>
      )}

      {isUpdateAvailable && !isDownloading && (
        <Button
          variant="outline"
          size="sm"
          onPress={reloadApp}
          className="mt-2"
        >
          <Text>Reload to Update</Text>
        </Button>
      )}

      {error && (
        <View className="flex-row items-center gap-2">
          <Text variant="small" className="text-destructive">
            Update check failed
          </Text>
          <Button
            variant="ghost"
            size="sm"
            onPress={checkForUpdates}
          >
            <Text>Retry</Text>
          </Button>
        </View>
      )}

      {lastChecked && !isChecking && !error && (
        <Text variant="small" className="text-muted-foreground">
          Last checked: {formatRelativeTime(lastChecked)}
        </Text>
      )}
    </View>
  )
}

function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return `${diffDays}d ago`
}
```

---

## 4. Potential Issues & Solutions

### 🔴 **CRITICAL: Expo Go Limitations**

**Problem**: `expo-updates` doesn't work in Expo Go during development.

**Current Plan**: "Use mock data for development testing"

**Enhanced Solution**:
```typescript
// apps/mobile/hooks/use-ota-updates.ts
import * as Updates from 'expo-updates'
import Constants from 'expo-constants'

const IS_EXPO_GO = Constants.appOwnership === 'expo'
const IS_DEV = __DEV__

export function useOTAUpdates() {
  const [state, setState] = useState<OTAUpdateState>({
    isChecking: false,
    isDownloading: false,
    isUpdateAvailable: false,
    downloadProgress: 0,
    lastChecked: null,
    error: null,
  })

  const checkForUpdates = async () => {
    // Skip in Expo Go or development
    if (IS_EXPO_GO || IS_DEV) {
      console.log('[OTA] Skipping update check (Expo Go or dev mode)')
      return
    }

    try {
      setState(prev => ({ ...prev, isChecking: true, error: null }))

      const update = await Updates.checkForUpdateAsync()

      if (update.isAvailable) {
        setState(prev => ({ ...prev, isDownloading: true }))
        await Updates.fetchUpdateAsync()
        setState(prev => ({
          ...prev,
          isUpdateAvailable: true,
          isDownloading: false,
          lastChecked: new Date(),
        }))
      } else {
        setState(prev => ({
          ...prev,
          isChecking: false,
          lastChecked: new Date(),
        }))
      }
    } catch (error) {
      console.error('[OTA] Update check failed:', error)
      setState(prev => ({
        ...prev,
        isChecking: false,
        isDownloading: false,
        error: error instanceof Error ? error : new Error('Unknown error'),
      }))
    }
  }

  const reloadApp = async () => {
    if (IS_EXPO_GO || IS_DEV) {
      console.log('[OTA] Skipping reload (Expo Go or dev mode)')
      return
    }

    try {
      await Updates.reloadAsync()
    } catch (error) {
      console.error('[OTA] Reload failed:', error)
    }
  }

  // Auto-check on mount (only in production builds)
  useEffect(() => {
    if (!IS_EXPO_GO && !IS_DEV) {
      checkForUpdates()
    }
  }, [])

  return { ...state, checkForUpdates, reloadApp }
}
```

**Version Helper with Expo Go Handling**:
```typescript
// apps/mobile/utils/version-helper.ts
import * as Application from 'expo-application'
import Constants from 'expo-constants'

const IS_EXPO_GO = Constants.appOwnership === 'expo'

export interface VersionInfo {
  version: string
  buildNumber: string
  channel: string
  fullString: string
}

export function getAppVersion(): string {
  if (IS_EXPO_GO) {
    return Constants.expoConfig?.version || 'Dev'
  }
  return Application.nativeApplicationVersion || 'Unknown'
}

export function getBuildNumber(): string {
  if (IS_EXPO_GO) {
    return 'Expo Go'
  }
  return Application.nativeBuildVersion || 'Unknown'
}

export function getUpdateChannel(): string {
  if (IS_EXPO_GO) {
    return 'Development'
  }
  // Get channel from EAS Update configuration
  return Constants.expoConfig?.updates?.channel || 'Production'
}

export function getVersionString(): string {
  const version = getAppVersion()
  const build = getBuildNumber()
  return `v${version} (${build})`
}

export function getVersionInfo(): VersionInfo {
  const version = getAppVersion()
  const buildNumber = getBuildNumber()
  const channel = getUpdateChannel()
  const fullString = `v${version} (${buildNumber}) • ${channel}`

  return { version, buildNumber, channel, fullString }
}
```

### ⚠️ **Download Progress Tracking**

**Issue**: The plan mentions `downloadProgress` but doesn't show how to track it.

**Solution**: Use `Updates.useUpdateEvents` listener:
```typescript
import { useEffect } from 'react'
import * as Updates from 'expo-updates'

export function useOTAUpdates() {
  const [downloadProgress, setDownloadProgress] = useState(0)

  useEffect(() => {
    if (IS_EXPO_GO || IS_DEV) return

    const listener = Updates.addListener(event => {
      if (event.type === Updates.UpdateEventType.UPDATE_AVAILABLE) {
        console.log('[OTA] Update available:', event.manifest)
      } else if (event.type === Updates.UpdateEventType.ERROR) {
        console.error('[OTA] Update error:', event.message)
        setState(prev => ({
          ...prev,
          error: new Error(event.message),
          isDownloading: false,
        }))
      } else if (event.type === Updates.UpdateEventType.NO_UPDATE_AVAILABLE) {
        console.log('[OTA] No update available')
      }
    })

    return () => listener.remove()
  }, [])

  // Note: Download progress is not directly available in expo-updates
  // We can only show indeterminate progress during fetchUpdateAsync()
  // Update plan to remove specific percentage display
}
```

**Recommendation**: Update the plan to show **indeterminate progress** (spinner) instead of percentage, as `expo-updates` doesn't provide granular download progress callbacks.

### ⚠️ **Error Handling & Retry Logic**

**Issue**: Plan mentions "exponential backoff, max 3 attempts" but doesn't implement it.

**Recommended Implementation**:
```typescript
const MAX_RETRIES = 3
const INITIAL_RETRY_DELAY = 1000 // 1 second

async function checkForUpdatesWithRetry(retryCount = 0): Promise<void> {
  try {
    setState(prev => ({ ...prev, isChecking: true, error: null }))

    const update = await Updates.checkForUpdateAsync()

    if (update.isAvailable) {
      setState(prev => ({ ...prev, isDownloading: true }))
      await Updates.fetchUpdateAsync()
      setState(prev => ({
        ...prev,
        isUpdateAvailable: true,
        isDownloading: false,
        lastChecked: new Date(),
      }))
    } else {
      setState(prev => ({
        ...prev,
        isChecking: false,
        lastChecked: new Date(),
      }))
    }
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount)
      console.log(`[OTA] Retry ${retryCount + 1}/${MAX_RETRIES} in ${delay}ms`)

      await new Promise(resolve => setTimeout(resolve, delay))
      return checkForUpdatesWithRetry(retryCount + 1)
    }

    console.error('[OTA] All retries exhausted:', error)
    setState(prev => ({
      ...prev,
      isChecking: false,
      isDownloading: false,
      error: error instanceof Error ? error : new Error('Update check failed'),
    }))
  }
}
```

### ⚠️ **Network State Awareness**

**Enhancement**: Check network connectivity before update checks.

```typescript
import NetInfo from '@react-native-community/netinfo'

async function checkForUpdates() {
  if (IS_EXPO_GO || IS_DEV) return

  // Check network connectivity
  const netInfo = await NetInfo.fetch()
  if (!netInfo.isConnected) {
    console.log('[OTA] No network connection, skipping update check')
    return
  }

  // Optionally: only check on WiFi to save cellular data
  if (netInfo.type !== 'wifi') {
    console.log('[OTA] Not on WiFi, skipping update check')
    return
  }

  // Proceed with update check...
}
```

**Required Dependency**:
```bash
pnpm add @react-native-community/netinfo
```

**Recommendation**: Add this as a **Phase 8** enhancement, not critical for initial implementation.

---

## 5. File Structure Recommendations

**Proposed Structure** (Updated):
```
apps/mobile/
├── hooks/
│   └── use-ota-updates.ts          # All OTA update logic (NEW)
├── utils/
│   └── version-helper.ts           # Version info getters (NEW)
├── lib/
│   └── update-state.ts             # AsyncStorage persistence (NEW)
├── components/
│   └── version-info-footer.tsx     # UI component (NEW)
└── app/
    ├── admin/(tabs)/settings.tsx   # Integrate footer (MODIFY)
    └── worker/(tabs)/settings.tsx  # Integrate footer (MODIFY)
```

**Changes from Original Plan**:
- ❌ **Removed**: `components/providers/update-provider.tsx` (not needed)
- ✅ **Added**: `lib/update-state.ts` (for persistence)
- ✅ **Kept**: All other files as proposed

---

## 6. Testing Strategy Improvements

### **Development Testing** (Expo Go)
```typescript
// Create a dev-only test panel
// apps/mobile/components/dev-version-test-panel.tsx (for testing only)

if (__DEV__) {
  export function DevVersionTestPanel() {
    const versionInfo = getVersionInfo()

    return (
      <View className="p-4 bg-yellow-100 dark:bg-yellow-900 rounded-md">
        <Text variant="small">Dev Testing Panel</Text>
        <Text variant="muted">Version: {versionInfo.version}</Text>
        <Text variant="muted">Build: {versionInfo.buildNumber}</Text>
        <Text variant="muted">Channel: {versionInfo.channel}</Text>
        <Text variant="muted">Full: {versionInfo.fullString}</Text>
      </View>
    )
  }
}
```

### **Staging Testing Checklist** (Enhanced)
- [ ] Build initial APK/IPA with EAS Build
- [ ] Verify version display matches expected values
- [ ] Deploy OTA update with version bump
- [ ] Open app and wait 5 seconds (auto-check triggers)
- [ ] Verify "Downloading update..." appears
- [ ] Verify "Update ready • Reload" button appears
- [ ] Tap reload and verify app restarts
- [ ] Verify new version displays after reload
- [ ] Test error scenario: Turn on airplane mode and force check
- [ ] Verify error message appears with retry button
- [ ] Turn off airplane mode and test retry
- [ ] Test background interruption: Kill app during download
- [ ] Reopen app and verify download resumes or restarts

### **Production Monitoring** (Add to Plan)
```typescript
// Add error tracking with Sentry (if available)
import * as Sentry from '@sentry/react-native'

catch (error) {
  Sentry.captureException(error, {
    tags: { feature: 'ota-updates' },
    extra: {
      updateId: Updates.updateId,
      manifest: Updates.manifest,
    },
  })
}
```

---

## 7. Performance Considerations

### ✅ **Non-blocking Operations - APPROVED**
All async operations use proper async/await patterns.

### ⚠️ **Memory Management**
Add cleanup in hook:
```typescript
useEffect(() => {
  let mounted = true

  async function check() {
    const result = await checkForUpdates()
    if (mounted) {
      setState(result)
    }
  }

  check()

  return () => {
    mounted = false
  }
}, [])
```

### ⚠️ **Battery Optimization**
Current plan: "Checks only on app launch" ✅ Good!

**Additional Recommendation**: Add minimum check interval to prevent rapid checks:
```typescript
const MIN_CHECK_INTERVAL_MS = 5 * 60 * 1000 // 5 minutes

async function checkForUpdates() {
  const lastState = await getUpdateState()
  if (lastState?.lastChecked) {
    const timeSinceLastCheck = Date.now() - new Date(lastState.lastChecked).getTime()
    if (timeSinceLastCheck < MIN_CHECK_INTERVAL_MS) {
      console.log('[OTA] Skipping check, too soon since last check')
      return
    }
  }

  // Proceed with check...
}
```

---

## 8. Security Considerations

### ✅ **Code Signing - APPROVED**
Expo/EAS handles update verification automatically. No additional action needed.

### ✅ **HTTPS Only - APPROVED**
EAS Update URL uses HTTPS by default.

### ⚠️ **Sensitive Data in Logs**
**Recommendation**: Add log sanitization:
```typescript
// Don't log full update manifests (may contain sensitive URLs)
console.log('[OTA] Update check result:', {
  isAvailable: update.isAvailable,
  updateId: update.manifest?.id,
  // Omit full manifest
})
```

---

## 9. Missing Considerations

### 🔴 **CRITICAL: TypeScript Types**

The plan doesn't include TypeScript types. Add:

```typescript
// apps/mobile/hooks/use-ota-updates.ts
export interface OTAUpdateState {
  isChecking: boolean
  isDownloading: boolean
  isUpdateAvailable: boolean
  downloadProgress: number
  lastChecked: Date | null
  error: Error | null
}

export interface OTAUpdateActions {
  checkForUpdates: () => Promise<void>
  reloadApp: () => Promise<void>
}

export type OTAUpdateHook = OTAUpdateState & OTAUpdateActions
```

### ⚠️ **Accessibility**

Add accessibility props:
```typescript
<Button
  variant="outline"
  size="sm"
  onPress={reloadApp}
  accessible
  accessibilityLabel="Reload app to apply update"
  accessibilityHint="Restarts the app with the latest version"
>
  <Text>Reload to Update</Text>
</Button>
```

### ⚠️ **Internationalization (i18n)**

Plan uses hardcoded English strings. Consider:
```typescript
// For v1: Use Vietnamese strings (app is Vietnam-focused)
<Text>Tải lại để cập nhật</Text>
<Text>Kiểm tra cập nhật...</Text>
<Text>Tải xuống cập nhật...</Text>
<Text>Kiểm tra thất bại</Text>
<Text>Thử lại</Text>
```

### ⚠️ **Loading State on Reload**

Add loading indicator before reload:
```typescript
const [isReloading, setIsReloading] = useState(false)

const reloadApp = async () => {
  setIsReloading(true)
  // Show loading overlay or toast
  await Updates.reloadAsync()
}
```

---

## 10. Recommended Implementation Order (UPDATED)

### **Phase 0: Pre-Implementation** (10 min)
- [ ] Review this document thoroughly
- [ ] Approve architectural decisions
- [ ] Prepare TypeScript types file

### **Phase 1: Dependencies** (5 min)
- [ ] Install `expo-application` only (Constants already available)
- [ ] Verify TypeScript types available

### **Phase 2: Core Utilities** (15 min)
- [ ] Create `utils/version-helper.ts` with Expo Go handling
- [ ] Create `lib/update-state.ts` for persistence
- [ ] Add TypeScript types

### **Phase 3: OTA Update Hook** (30 min)
- [ ] Create `hooks/use-ota-updates.ts` with all logic
- [ ] Implement Expo Go detection
- [ ] Add error handling with retry
- [ ] Add state persistence
- [ ] Test in development (should gracefully skip)

### **Phase 4: UI Component** (25 min)
- [ ] Create `components/version-info-footer.tsx`
- [ ] Implement all states (normal, checking, downloading, ready, error)
- [ ] Add Vietnamese strings
- [ ] Add accessibility props
- [ ] Style with NativeWind

### **Phase 5: Integration** (10 min)
- [ ] Update `components/user-settings/user-settings-screen.tsx`
- [ ] Add VersionInfoFooter at bottom
- [ ] Test in Expo Go (should show version, no update check)

### **Phase 6: Testing** (45 min)
- [ ] Test in Expo Go: Version display works, no crashes
- [ ] Build staging APK/IPA with EAS Build
- [ ] Deploy initial version
- [ ] Publish OTA update
- [ ] Test full update flow
- [ ] Test error scenarios
- [ ] Test retry mechanism
- [ ] Verify persistence works

### **Phase 7: Documentation** (15 min)
- [ ] Update task file with implementation notes
- [ ] Document any deviations from plan
- [ ] Add screenshots to task file
- [ ] Create usage guide for team

### **Total Estimated Time: ~2.5 hours** (vs. original 2 hours)

---

## 11. Final Recommendations

### **Critical Changes Required**:
1. ✅ Install `expo-application` only (not `expo-constants`)
2. ✅ Use Hook-Only pattern, not separate Provider file
3. ✅ Add `lib/update-state.ts` for persistence
4. ✅ Implement Expo Go detection in all functions
5. ✅ Show indeterminate progress, not percentage
6. ✅ Add retry logic with exponential backoff
7. ✅ Use Vietnamese strings throughout
8. ✅ Add accessibility props
9. ✅ Add TypeScript types explicitly

### **Nice-to-Have Enhancements**:
1. Network state awareness (Phase 8)
2. Minimum check interval (5 minutes)
3. Sentry error tracking integration
4. Update changelog display
5. Schedule reload for later
6. Beta channel support

### **What Works Well in Original Plan**:
- ✅ Overall architecture approach
- ✅ Manual reload UX decision
- ✅ Background download strategy
- ✅ Silent update checks
- ✅ Phase breakdown structure
- ✅ Testing scenarios
- ✅ Error handling philosophy
- ✅ Security considerations

---

## 12. Compatibility Checks

### ✅ **Expo Go Compatibility**
- **Status**: ✅ Compatible with graceful degradation
- **Strategy**: Detect Expo Go and skip OTA checks, show version info only
- **Impact**: Development experience unchanged

### ✅ **EAS Build/Update Compatibility**
- **Status**: ✅ Fully compatible
- **Requirements**:
  - EAS Update configured in `app.json`
  - Update URL set correctly
  - Runtime version managed properly
- **Action**: Verify `app.json` has correct EAS Update config before Phase 6

### ✅ **Platform-Specific Considerations**
- **iOS**: ✅ No special handling needed
- **Android**: ✅ No special handling needed
- **Both**: Uses same `expo-updates` API

### ⚠️ **Dependency Conflicts**
**Issue Detected**: `expo-doctor` shows duplicate dependencies:
```
expo-constants: 18.0.8, 18.0.9, 18.0.10
react-native-safe-area-context: 4.5.0, 5.6.1
```

**Impact on This Feature**: ⚠️ Low impact, but should be resolved
**Recommendation**: Run `pnpm dedupe` before implementation to clean up duplicates

---

## 13. Code Quality Checklist

Before marking task as complete:
- [ ] All TypeScript types defined explicitly
- [ ] No `any` types used
- [ ] Proper error boundaries around async operations
- [ ] All strings in Vietnamese
- [ ] Accessibility props on all interactive elements
- [ ] Follows existing NativeWind styling patterns
- [ ] Uses existing UI components (Button, Badge, Text)
- [ ] Follows existing utility patterns (cn, module-preference)
- [ ] No console.log in production (use console.error only)
- [ ] Proper cleanup in useEffect hooks
- [ ] State updates check mounted status
- [ ] All async functions have try/catch
- [ ] Biome checks pass (`pnpm biome:check --write .`)

---

## 14. Success Criteria (UPDATED)

### **Must Have** (v1):
- ✅ Version info displays correctly in settings
- ✅ Graceful handling in Expo Go (no crashes)
- ✅ Auto-check on app launch in production builds
- ✅ Background download without blocking UI
- ✅ Manual reload button when update ready
- ✅ Error state with retry button
- ✅ Last checked timestamp persistence
- ✅ Vietnamese strings throughout
- ✅ Accessibility support

### **Should Have** (v1.1):
- Network state awareness
- Minimum check interval
- Update event listeners
- Sentry error tracking

### **Could Have** (v2):
- Update changelog display
- Schedule reload feature
- Beta channel switcher
- Force update support
- Differential updates

---

## Conclusion

**Overall Assessment**: ✅ **APPROVED FOR IMPLEMENTATION**

The plan is solid but requires the critical changes outlined above. The biggest adjustments are:
1. Simplifying the provider pattern to hook-only
2. Adding proper Expo Go detection
3. Implementing state persistence
4. Switching to Vietnamese strings
5. Adding TypeScript types

**Estimated Implementation Time**: ~2.5 hours (vs. original 2 hours)

**Risk Level**: 🟢 **LOW** with recommended changes

**Next Steps**:
1. Review this document with team
2. Approve architectural decisions
3. Update task file with changes
4. Begin implementation starting with Phase 0

---

**Reviewer**: Claude Code
**Review Complete**: 2025-11-06
**Recommendation**: APPROVED WITH MODIFICATIONS
