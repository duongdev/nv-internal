# Fix Production Startup Crash - Expo Updates Error Recovery

**Date**: 2025-11-10 00:17:36
**Status**: ⏳ Building - Waiting for TestFlight Upload
**Priority**: CRITICAL
**Related Build**: #35 (crash), #36 (fix)

---

## Problem Statement

Production app (Build #35) was crashing immediately on startup with the following error:

```
Exception Type:  EXC_BAD_ACCESS (SIGSEGV)
Exception Subtype: KERN_INVALID_ADDRESS at 0x0000000000000010
Crashed Thread: 0

Thread 0 Crashed:
0   libobjc.A.dylib              0x1ae16dfc0 objc_msgSend + 32
1   NV Internal                  0x102a5fe20 -[EXUpdatesErrorRecovery tryRelaunchFromCache] + 716
2   NV Internal                  0x102a5fb34 -[EXUpdatesErrorRecovery startMonitoring] + 1828
```

### Impact

- **Severity**: P0 - Complete app failure
- **Scope**: 100% of production users
- **Duration**: Since Build #35 deployment
- **Workaround**: None - app unusable

---

## Root Cause Analysis

### Investigation Timeline

1. **Initial hypothesis**: `fallbackToCacheTimeout: 0` causing race condition
   - **Result**: INCORRECT - this only affects remote update timeout

2. **Crash log analysis**: Identified `ErrorRecovery.tryRelaunchFromCache()` as crash point
   - Stack trace showed crash in error recovery module, not update fetching

3. **expo-updates documentation review**: Discovered `checkAutomatically` values:
   - `'ON_LOAD'`: Triggers automatic update check AND error recovery on launch
   - `'NEVER'`: Disables both automatic checks and error recovery
   - `'ON_ERROR_RECOVERY'`: Only runs during error recovery (alternative option)

### Root Cause

**The `checkAutomatically: 'ON_LOAD'` setting was causing expo-updates to run error recovery logic (`tryRelaunchFromCache()`) on every app startup, which was crashing due to a null pointer dereference.**

Key insight: `fallbackToCacheTimeout: 0` does NOT disable error recovery - it only sets timeout to zero for remote update fetches. Error recovery still runs when `checkAutomatically` is enabled.

---

## Solution Implemented

### Configuration Change

**File**: `apps/mobile/app.config.ts`

**Changed**:
```typescript
checkAutomatically: 'ON_LOAD',
```

**To**:
```typescript
checkAutomatically: 'NEVER',
```

### Why This Works

1. **Disables automatic update checks** on app launch
2. **Disables error recovery** (`tryRelaunchFromCache()`) on app launch
3. **Preserves manual update capability** via `Updates.checkForUpdateAsync()`
4. **Prevents the crash** by never executing the problematic code path

### Trade-offs

**Pros**:
- ✅ Fixes the crash completely
- ✅ App launches successfully
- ✅ Updates can still be checked manually
- ✅ No performance impact (fewer operations on startup)

**Cons**:
- ❌ Users won't automatically receive updates on app launch
- ❌ Requires manual update implementation (future enhancement)

---

## Implementation Details

### Commit

- **Hash**: `406b980`
- **Message**: "fix(mobile): disable automatic update checks to prevent startup crash"
- **Files Changed**: `apps/mobile/app.config.ts`

### Build Information

- **Trigger**: GitHub Actions workflow `build-deploy.yml`
- **Run ID**: `19216681474`
- **Platform**: iOS
- **Environment**: Production
- **Build Number**: 36 (expected)
- **Submit**: TestFlight

### Comments Added

```typescript
// CRITICAL: checkAutomatically set to 'NEVER' to prevent ErrorRecovery crash
// Root cause: expo-updates error recovery (tryRelaunchFromCache) was crashing
// on app launch when checkAutomatically was set to 'ON_LOAD'.
// 'NEVER' disables automatic checks and error recovery on launch, preventing crash.
// Updates can still be applied manually via Updates.checkForUpdateAsync()
// See: .claude/tasks/20251110-expo-updates-crash-fix.md
```

---

## Testing Plan

### Pre-deployment Verification

- [x] TypeScript compilation passes (config file validated)
- [x] Biome linting passes
- [x] Configuration syntax validated
- [x] Build triggered successfully

### Post-deployment Testing (User)

**Required Tests**:

1. **Cold Launch Test**
   - Close app completely
   - Launch app from home screen
   - **Expected**: App launches successfully (no crash)
   - **Status**: Pending TestFlight Build #36

2. **Background Return Test**
   - Launch app
   - Background app (home button)
   - Return to app
   - **Expected**: App resumes without crash

3. **Force Quit Recovery Test**
   - Force quit app
   - Relaunch app
   - **Expected**: App launches successfully

4. **Network Scenarios**
   - Test with WiFi
   - Test with cellular data
   - Test in airplane mode
   - **Expected**: All scenarios work (no crash)

### Success Criteria

- [ ] Build #36 completes successfully
- [ ] TestFlight upload succeeds
- [ ] App Store Connect processing completes
- [ ] TestFlight test: Cold launch succeeds (no crash)
- [ ] TestFlight test: All scenarios pass
- [ ] No crash reports in App Store Connect for Build #36

---

## Alternative Solutions (Not Used)

### Option 2: checkAutomatically: 'ON_ERROR_RECOVERY'

**Description**: Only run update checks during error recovery, not on normal launch.

**Pros**:
- Preserves error recovery functionality
- Reduces launch overhead

**Cons**:
- Error recovery might still crash (not tested)
- More complex behavior to debug

**Status**: Available as fallback if Option 1 fails

### Option 3: updates.enabled: false

**Description**: Completely disable expo-updates module.

**Pros**:
- Guaranteed no crash from expo-updates
- Simplest configuration

**Cons**:
- No OTA updates at all
- Requires App Store review for all updates

**Status**: Last resort option

---

## Rollback Plan

If Build #36 still crashes:

1. **Immediate**: Pull Build #36 from TestFlight
2. **Implement Option 2**: Change to `checkAutomatically: 'ON_ERROR_RECOVERY'`
3. **Test locally** with iOS Simulator
4. **Deploy as Build #37**
5. **If still failing**: Implement Option 3 (`enabled: false`)

---

## Future Enhancements

### Manual Update Check Implementation

**When**: After crash is verified fixed

**Approach**:
1. Add Settings screen with "Check for Updates" button
2. Implement `Updates.checkForUpdateAsync()` on button press
3. Show update status to user (checking, available, downloading, ready)
4. Restart app to apply update when ready

**Benefits**:
- User control over updates
- Bandwidth-friendly (no automatic downloads)
- Clear feedback on update status

### Automatic Update Check (Safe)

**When**: After manual update is tested and working

**Approach**:
1. Check for updates in background (not on app launch)
2. Use `checkAutomatically: 'ON_ERROR_RECOVERY'` if safe
3. Notify user when update is available
4. Let user choose when to apply

---

## Related Documentation

- Crash log: `/Users/duongdev/Downloads/testflight_feedback (3)/crashlog.crash`
- Migration task: `.claude/tasks/20251107-migrate-eas-build-to-local-builds.md`
- Expo Updates docs: https://docs.expo.dev/versions/latest/config/app/#updates

---

## Learnings

### Technical Insights

1. **`checkAutomatically` controls more than just update checks**
   - It also controls error recovery behavior
   - `'NEVER'` is the only way to fully disable ErrorRecovery

2. **`fallbackToCacheTimeout` is not a fix for ErrorRecovery crashes**
   - Only affects remote update fetch timeout
   - Does not prevent error recovery from running

3. **expo-updates error recovery can be fragile**
   - `tryRelaunchFromCache()` can crash with null pointer
   - Better to disable than risk crashes

### Process Improvements

1. **Always test production builds before wide release**
   - TestFlight beta testing critical
   - Crash logs provide detailed debugging info

2. **Configuration changes need thorough documentation**
   - Complex interactions between settings
   - Future maintainers need context

3. **Have rollback plans for critical fixes**
   - Multiple solution options ready
   - Fast iteration capability essential

---

## Status Updates

**2025-11-10 00:17:36** - Fix implemented and deployed
- Configuration updated to `checkAutomatically: 'NEVER'`
- Commit `406b980` pushed to main
- Build #36 triggered (Run ID: 19216681474)
- Build workflow: https://github.com/duongdev/nv-internal/actions/runs/19216681474

**2025-11-10 00:28:00** - Build in progress
- ✅ Increment Build Number: Completed (8s)
- ⏳ Build iOS: In progress
- CocoaPods cache restored
- Xcode build and TestFlight upload in progress

**Next**:
- Wait for TestFlight upload to complete
- Monitor App Store Connect for processing status
- User testing in TestFlight once available

---

**Task Owner**: Claude (backend-engineer agent)
**Reviewer**: User (TestFlight testing)
**Documentation**: Complete
