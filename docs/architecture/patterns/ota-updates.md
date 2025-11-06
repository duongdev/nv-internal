# OTA Updates Pattern

## Overview

This pattern implements Over-The-Air (OTA) updates for React Native apps using Expo Updates. It provides automatic background update checks with user-controlled reload, ensuring updates are applied without disrupting user workflow.

## Key Principles

1. **User Control**: Users decide when to reload for updates
2. **Non-Disruptive**: Silent checks and downloads in background
3. **Graceful Degradation**: Works in all environments (Expo Go, dev, production)
4. **Hook-Only Pattern**: No provider needed for single-component state

## Architecture

### Hook-Only Pattern

Instead of a traditional Provider/Context pattern, this implementation uses a standalone hook that manages its own state:

```typescript
// ❌ Not needed - over-engineering for single consumer
export const UpdateProvider = ({ children }) => ...
export const useUpdateContext = () => ...

// ✅ Hook-Only - simpler and sufficient
export function useOTAUpdates(): OTAUpdateState & OTAUpdateActions {
  // All state and logic contained in the hook
}
```

**When to use Hook-Only pattern:**
- Single component consumes the state
- No cross-component communication needed
- State doesn't need to be globally accessible
- Reduces boilerplate and complexity

### Environment Detection

Critical for development experience - detect and handle Expo Go gracefully:

```typescript
import Constants from 'expo-constants';

// Modern API (Expo SDK 51+)
const IS_EXPO_GO = Constants.executionEnvironment === 'expo-go';

// Legacy API (deprecated but may see in older code)
// const IS_EXPO_GO = Constants.appOwnership === 'expo';

// Skip all OTA operations in Expo Go
if (IS_EXPO_GO || __DEV__) {
  return {
    isChecking: false,
    isDownloading: false,
    isUpdateAvailable: false,
    lastChecked: null,
    error: null,
    checkForUpdates: async () => {},
    reloadApp: async () => {}
  };
}
```

## Implementation

### Core Hook Structure

```typescript
// hooks/use-ota-updates.ts
export function useOTAUpdates(): OTAUpdateHook {
  const [state, setState] = useState<OTAUpdateState>(defaultState);
  const mountedRef = useRef(true);

  // Memory safety - check before setState
  const safeSetState = useCallback((updates: Partial<OTAUpdateState>) => {
    if (mountedRef.current) {
      setState(prev => ({ ...prev, ...updates }));
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Auto-check on mount (production only)
  useEffect(() => {
    if (!IS_EXPO_GO && !__DEV__) {
      checkForUpdates();
    }
  }, []);

  return { ...state, checkForUpdates, reloadApp };
}
```

### Persistence Layer

Store update state in AsyncStorage for continuity across app restarts:

```typescript
// lib/update-state.ts
const UPDATE_STATE_KEY = 'otaUpdateState';

export interface PersistedUpdateState {
  lastChecked: string | null;    // ISO date string
  lastUpdateId: string | null;   // Track update version
  dismissedUpdateId: string | null; // Allow dismissing updates
}

export async function saveUpdateState(state: PersistedUpdateState): Promise<void> {
  try {
    await AsyncStorage.setItem(UPDATE_STATE_KEY, JSON.stringify(state));
  } catch (error) {
    // Non-critical - log but don't throw
    console.error('[OTA] Failed to save update state:', error);
  }
}

export async function getUpdateState(): Promise<PersistedUpdateState | null> {
  try {
    const json = await AsyncStorage.getItem(UPDATE_STATE_KEY);
    return json ? JSON.parse(json) : null;
  } catch (error) {
    console.error('[OTA] Failed to load update state:', error);
    return null;
  }
}
```

### Update Check Strategy

Implement smart checking with minimum intervals and retry logic:

```typescript
const MIN_CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

async function checkForUpdatesWithRetry(retryCount = 0): Promise<void> {
  try {
    // Check minimum interval
    const state = await getUpdateState();
    if (state?.lastChecked) {
      const lastCheck = new Date(state.lastChecked);
      const timeSinceCheck = Date.now() - lastCheck.getTime();
      if (timeSinceCheck < MIN_CHECK_INTERVAL_MS) {
        console.log('[OTA] Skipping check - too soon');
        return;
      }
    }

    // Check for updates
    const update = await Updates.checkForUpdateAsync();

    if (update.isAvailable) {
      // Download in background
      await Updates.fetchUpdateAsync();

      // Save state
      await saveUpdateState({
        lastChecked: new Date().toISOString(),
        lastUpdateId: update.updateId,
        dismissedUpdateId: null
      });

      // Update UI
      safeSetState({ isUpdateAvailable: true });
    }
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      // Exponential backoff: 1s, 2s, 4s
      const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
      setTimeout(() => {
        checkForUpdatesWithRetry(retryCount + 1);
      }, delay);
    } else {
      safeSetState({ error });
    }
  }
}
```

### Progress Indication

Expo Updates doesn't provide download percentage, use indeterminate spinner:

```typescript
// ❌ Not available - expo-updates limitation
Updates.addListener((event) => {
  console.log(`Download progress: ${event.progress}%`);
});

// ✅ Use indeterminate spinner instead
import { ActivityIndicator } from 'react-native';

{isDownloading && (
  <View className="flex-row items-center gap-2">
    <ActivityIndicator size="small" />
    <Text>Đang tải cập nhật...</Text>
  </View>
)}
```

## UI Component

### Version Info Footer

Display version information with update status:

```tsx
// components/version-info-footer.tsx
export function VersionInfoFooter() {
  const {
    isChecking,
    isDownloading,
    isUpdateAvailable,
    lastChecked,
    error,
    checkForUpdates,
    reloadApp
  } = useOTAUpdates();

  const versionInfo = getVersionInfo();

  // Format relative time in Vietnamese
  const formatRelativeTime = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 30) return `${diffDays} ngày trước`;
    return `${Math.floor(diffDays / 30)} tháng trước`;
  };

  return (
    <View className="items-center gap-2 py-4">
      {/* Version info */}
      <Text className="text-xs text-muted-foreground">
        {versionInfo.fullString}
      </Text>

      {/* Update status */}
      {isChecking && (
        <Text className="text-xs text-muted-foreground">
          Đang kiểm tra cập nhật...
        </Text>
      )}

      {isDownloading && (
        <View className="flex-row items-center gap-2">
          <ActivityIndicator size="small" />
          <Text className="text-xs text-muted-foreground">
            Đang tải cập nhật...
          </Text>
        </View>
      )}

      {isUpdateAvailable && !isDownloading && (
        <Button size="sm" onPress={reloadApp}>
          <Text>Tải lại để cập nhật</Text>
        </Button>
      )}

      {error && (
        <TouchableOpacity onPress={checkForUpdates}>
          <Text className="text-xs text-destructive">
            Kiểm tra thất bại • Thử lại
          </Text>
        </TouchableOpacity>
      )}

      {lastChecked && !isChecking && !error && (
        <Text className="text-xs text-muted-foreground">
          Cập nhật {formatRelativeTime(lastChecked)}
        </Text>
      )}
    </View>
  );
}
```

## Vietnamese UI Strings

All user-facing text should be in Vietnamese:

```typescript
const UI_STRINGS = {
  checking: 'Đang kiểm tra cập nhật...',
  downloading: 'Đang tải cập nhật...',
  ready: 'Tải lại để cập nhật',
  error: 'Kiểm tra thất bại',
  retry: 'Thử lại',
  justNow: 'Vừa xong',
  minutesAgo: (n: number) => `${n} phút trước`,
  hoursAgo: (n: number) => `${n} giờ trước`,
  daysAgo: (n: number) => `${n} ngày trước`,
  monthsAgo: (n: number) => `${n} tháng trước`,
};
```

## Error Handling

### Network Errors

Handle with exponential backoff retry:

```typescript
const retryWithBackoff = async (
  fn: () => Promise<void>,
  maxRetries = 3,
  initialDelay = 1000
) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await fn();
      return;
    } catch (error) {
      if (i === maxRetries - 1) throw error;

      const delay = initialDelay * Math.pow(2, i);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};
```

### Production Logging

Use intentional console.log for OTA monitoring:

```typescript
// biome-ignore lint/suspicious/noConsole: Intentional OTA monitoring
console.log('[OTA] Update check started');

// biome-ignore lint/suspicious/noConsole: Track update events
console.log('[OTA] Update available:', updateId);

// Use console.error for actual errors
console.error('[OTA] Update check failed:', error);
```

## Testing

### Development (Expo Go)

```bash
# Start Expo dev server
pnpm dev

# Expected behavior:
# - Version displays with "Expo Go" as build
# - Shows "Development" channel
# - No OTA checks triggered
# - No errors in console
```

### Staging (EAS Build)

```bash
# Build staging APK
eas build --platform android --profile preview

# Publish OTA update
eas update --branch preview --message "Test update"

# Test scenarios:
# 1. Auto-check on launch
# 2. Manual check button
# 3. Download progress
# 4. Reload functionality
# 5. Error recovery
```

### Production Monitoring

Track these metrics:
- Update check success rate (> 95%)
- Download completion rate (> 90%)
- Adoption rate (80% in 48 hours)
- Error frequency and types

## Common Issues

### Issue: Updates not detected in development

**Cause**: Expo Go doesn't support OTA updates.

**Solution**: Test with EAS Build or standalone build.

### Issue: Rapid repeated checks

**Cause**: Missing minimum interval check.

**Solution**: Implement 5-minute minimum between checks:

```typescript
const MIN_CHECK_INTERVAL_MS = 5 * 60 * 1000;
// Check last check time before proceeding
```

### Issue: State updates on unmounted component

**Cause**: Async operations completing after unmount.

**Solution**: Use mounted ref pattern:

```typescript
const mountedRef = useRef(true);

useEffect(() => {
  return () => {
    mountedRef.current = false;
  };
}, []);

// Check before setState
if (mountedRef.current) {
  setState(newState);
}
```

### Issue: TypeScript error with `__DEV__`

**Cause**: Global not defined in TypeScript.

**Solution**: Add to biome.json:

```json
{
  "javascript": {
    "globals": ["__DEV__"]
  }
}
```

## Best Practices

1. **Always check environment** before OTA operations
2. **Use Hook-Only pattern** for single-component state
3. **Implement retry logic** with exponential backoff
4. **Check mounted status** before state updates
5. **Use Vietnamese strings** for all UI text
6. **Log intentionally** for production monitoring
7. **Test in staging** before production release
8. **Monitor adoption rates** after deployment

## References

- [Expo Updates Documentation](https://docs.expo.dev/versions/latest/sdk/updates/)
- [EAS Update Guide](https://docs.expo.dev/eas-update/introduction/)
- Implementation: `.claude/tasks/20251106-085928-app-version-tracking-ota-updates.md`
- Code files:
  - `apps/mobile/hooks/use-ota-updates.ts`
  - `apps/mobile/utils/version-helper.ts`
  - `apps/mobile/lib/update-state.ts`
  - `apps/mobile/components/version-info-footer.tsx`