# Implement Loading State for Task Attachment Uploads

## Overview

Added loading toast notifications to provide visual feedback during attachment upload operations using the `@backpackapp-io/react-native-toast` library's loading toast feature.

## Implementation Status

✅ Completed

## Problem Analysis

The mobile app lacked immediate visual feedback when users initiated attachment uploads (via camera, gallery, or file picker). Users couldn't tell if the upload was in progress, leading to potential confusion about whether their action was registered.

### Requirements

1. Show loading toast immediately when upload starts
2. Display dynamic message based on file count
3. Automatically dismiss loading toast when upload completes (success or error)
4. Work across all upload methods (camera, gallery, file picker)
5. Maintain type safety with TypeScript

## Implementation Plan

- [x] Add `toast.dismiss()` method to toast wrapper
- [x] Modify upload hook to support loading toast lifecycle
- [x] Update attachment upload sheet to show loading toasts
- [x] Test TypeScript compilation
- [x] Run API tests
- [x] Format and lint code
- [x] Fix loading toast auto-dismissing after 3 seconds
- [x] Implement 30-second maximum duration
- [x] Add minimum 1-second display time

## Implementation Details

### 1. Toast Wrapper Enhancement

**File**: `apps/mobile/components/ui/toasts.tsx`

Added `dismiss` method and fixed loading toast duration:

```typescript
export const toast = {
  // ... existing methods
  loading: (message: string, options?: ToastOptions) =>
    $toast.loading(message, {
      ...DEFAULT_TOAST_OPTIONS,
      // Loading toasts should persist indefinitely until explicitly dismissed
      duration: Number.POSITIVE_INFINITY,
      ...options,
    }),
  dismiss: (id: string) => $toast.dismiss(id),
  // ... rest
}
```

**Key Fix**: Loading toast was initially inheriting `duration: 3000` from `DEFAULT_TOAST_OPTIONS`, causing it to auto-dismiss after 3 seconds. Now explicitly overrides with `Number.POSITIVE_INFINITY` to persist indefinitely, while still allowing custom duration via options parameter.

### 2. Upload Hook Modifications

**File**: `apps/mobile/api/attachment/use-upload-attachments.ts`

**Key Changes**:
- Extended mutation variables type to include optional `loadingToastId` and `toastStartTime` parameters
- Made `onSuccess` and `onError` callbacks `async` to support minimum display time
- Implemented 1-second minimum display time to ensure users see the loading indicator
- Modified callbacks to dismiss loading toast only after both conditions met:
  - Request has completed (success or error)
  - Minimum 1 second has elapsed

**Important TypeScript Fix**:
Initially used spread operator (`...args`) which caused TypeScript error `Object is of type 'unknown'`. Fixed by destructuring parameters properly:

```typescript
// Before (caused TS error):
onSuccess: (...args) => {
  const loadingToastId = args[1].loadingToastId  // TS2571 error
}

// After (fixed):
onSuccess: async (data, variables, ...args) => {
  const loadingToastId = variables.loadingToastId  // Type-safe
  const toastStartTime = variables.toastStartTime

  // Ensure minimum display time
  if (loadingToastId && toastStartTime) {
    const MIN_DISPLAY_TIME = 1000
    const elapsed = Date.now() - toastStartTime
    if (elapsed < MIN_DISPLAY_TIME) {
      await new Promise(resolve => setTimeout(resolve, MIN_DISPLAY_TIME - elapsed))
    }
    toast.dismiss(loadingToastId)
  }
}
```

### 3. Upload Sheet Component

**File**: `apps/mobile/components/attachment-upload-sheet.tsx`

**Key Changes**:
- Added `useRef` import and `loadingToastIdRef` for tracking toast ID
- Imported `toast` utility
- Modified `uploadFiles` function with 30-second maximum duration and dynamic messages:

```typescript
const uploadFiles = async (assets) => {
  const fileCount = assets.length
  const loadingMessage = fileCount === 1
    ? 'Đang tải lên 1 tệp...'
    : `Đang tải lên ${fileCount} tệp...`

  // 30-second maximum duration using built-in duration option
  const toastId = toast.loading(loadingMessage, { duration: 30000 })
  const toastStartTime = Date.now()
  loadingToastIdRef.current = toastId

  try {
    await uploadMutation.mutateAsync({
      taskId,
      assets,
      loadingToastId: toastId,
      toastStartTime,
    })
  } finally {
    loadingToastIdRef.current = null
  }
}
```

**Implementation Evolution**:
- **Initial approach**: Manual setTimeout/clearTimeout for 30-second timeout
- **Final approach**: Used library's built-in `duration` option for cleaner code
- **Benefit**: Simplified implementation by leveraging toast library's native functionality

**Upload Flow**:
1. User selects file(s) via camera/gallery/file picker
2. `uploadFiles()` is called
3. Loading toast is created with 30-second duration and timestamp is recorded
4. Upload mutation is triggered with toast ID and start time
5. Hook ensures minimum 1-second display before dismissing
6. On success/error, upload hook dismisses loading toast
7. Success/error toast is shown
8. If upload takes >30 seconds, toast auto-dismisses (safety timeout)

## Testing Scenarios

### Unit Tests

✅ All API tests pass (68 tests)
- Attachment service tests
- Attachment route tests
- Task service tests
- Task route tests
- Auth middleware tests

### TypeScript Compilation

✅ TypeScript compilation passes with no errors
- Fixed type safety issue with mutation callbacks
- All types properly inferred

### Code Quality

✅ Biome formatting and linting passes
- No formatting issues
- No linting warnings

## Files Modified

1. `/apps/mobile/components/ui/toasts.tsx` - Added dismiss method
2. `/apps/mobile/api/attachment/use-upload-attachments.ts` - Loading toast lifecycle management
3. `/apps/mobile/components/attachment-upload-sheet.tsx` - Loading toast display logic

## Technical Decisions

### Why use `useRef` for toast ID?

Using `useRef` instead of state ensures the toast ID doesn't trigger re-renders and is accessible throughout the component lifecycle without causing unnecessary updates.

### Why pass `loadingToastId` to mutation?

This approach keeps the toast lifecycle management centralized in the upload hook's callbacks, ensuring consistent cleanup across all upload scenarios (success, error, or network failure).

### Why override default duration with `Number.POSITIVE_INFINITY`?

The toast wrapper's `DEFAULT_TOAST_OPTIONS` includes `duration: 3000`, which was causing loading toasts to auto-dismiss after 3 seconds. By explicitly setting `duration: Number.POSITIVE_INFINITY`, loading toasts persist indefinitely by default, while still allowing specific use cases (like the upload toast) to override with a custom duration (30 seconds).

### Why use built-in duration option instead of manual timeout?

Initial implementation used `setTimeout`/`clearTimeout` for the 30-second maximum. The final implementation uses the library's built-in `duration` option, which:
- Reduces code complexity (no manual timeout management)
- Leverages native library functionality
- Maintains consistent pattern with other toast methods
- Automatically handles cleanup

### Dynamic Loading Messages

Messages adapt to file count for better UX:
- Single file upload: Clear, singular message
- Multiple files: Shows exact count for transparency

### Minimum Display Time Strategy

Ensures users always see the loading indicator, even for very fast uploads:
- Tracks when toast was shown (`toastStartTime`)
- Waits minimum 1 second before dismissing
- Only applies if upload completes faster than 1 second
- Prevents jarring UX where loading indicator flashes too briefly

## User Experience Improvements

1. **Immediate Feedback**: Users see loading indicator the moment upload starts
2. **Progress Clarity**: Dynamic message indicates how many files are being uploaded
3. **Persistent Indicator**: Toast persists throughout entire upload (1-30 seconds)
4. **Minimum Visibility**: Even fast uploads show loading indicator for at least 1 second
5. **Safety Timeout**: Auto-dismisses after 30 seconds to prevent stuck toasts
6. **Proper Cleanup**: Loading toast is always dismissed, preventing UI pollution
7. **Consistent Behavior**: Same loading experience across all upload methods
8. **Vietnamese Language**: All messages in Vietnamese for target users

## Notes

### Library Documentation

Used official documentation from: https://nickdebaise.github.io/packages/react-native-toast/getting-started/#loading-toast

Key API methods:
- `toast.loading(message, options?)` - Returns toast ID, accepts optional duration
- `toast.dismiss(id)` - Dismisses specific toast by ID
- Default behavior: Toast persists until explicitly dismissed
- Duration option: Can override with specific milliseconds or `Number.POSITIVE_INFINITY`

### Critical Bug Fix

**Problem**: Loading toast was auto-dismissing after 3 seconds despite request still processing.

**Root Cause**: The `DEFAULT_TOAST_OPTIONS` object containing `duration: 3000` was being spread into all toast types, including loading toasts. Loading toasts should persist indefinitely by default.

**Solution**: Explicitly override duration in loading toast:
```typescript
loading: (message: string, options?: ToastOptions) =>
  $toast.loading(message, {
    ...DEFAULT_TOAST_OPTIONS,
    duration: Number.POSITIVE_INFINITY,  // Override default 3s duration
    ...options,  // Allow custom duration (e.g., 30s for uploads)
  })
```

### Implementation Iterations

1. **Version 1**: Basic loading toast with manual dismissal
2. **Version 2**: Added manual setTimeout for 30-second timeout
3. **Version 3** (Final):
   - Fixed 3-second auto-dismiss bug
   - Used built-in duration option for 30-second max
   - Added 1-second minimum display time
   - Cleaner code with proper type safety

### Future Enhancements

Potential improvements for future iterations:
1. Show upload progress percentage (requires backend changes)
2. Cancel upload functionality
3. Retry failed uploads
4. Batch upload status (e.g., "2 of 5 files uploaded")
5. Upload speed indicator (MB/s)

## Related Tasks

- Previous: [20251022-224500-fix-attachment-counting-and-ui.md](./20251022-224500-fix-attachment-counting-and-ui.md) - Fixed attachment counting and deletion UX
- Previous: Implemented soft delete for attachments
- Previous: Added attachment viewer and activity feed integration
