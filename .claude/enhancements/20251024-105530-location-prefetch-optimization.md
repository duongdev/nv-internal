# Location Prefetch Optimization for Check-in/Checkout

## Overview

Performance optimization to prefetch and maintain GPS location while workers are on the task details screen, making check-in/checkout operations feel instantaneous by eliminating the location fetch delay when the action button is tapped.

## Implementation Status

⏳ **Not Started** - Feature enhancement documented for future implementation

## Problem Analysis

### Current Behavior
1. Worker opens task details screen
2. Worker taps check-in/out button
3. Navigation to check-in/out screen occurs
4. GPS location is requested (may take 2-10 seconds)
5. Worker waits for location before proceeding
6. Form submission occurs

### Pain Points
- **Location fetch delay**: 2-10 seconds wait after tapping action button
- **Poor UX**: Worker perceives the app as slow/unresponsive
- **Wasted time**: Location could have been fetched while reading task details
- **Permission prompts**: May interrupt flow if permissions not granted

### Proposed Solution
Prefetch GPS location when the task details screen is opened and keep it updated, so it's immediately available when needed.

## Implementation Plan

### Phase 1: Location Prefetch Hook
- [ ] Create `apps/mobile/hooks/use-location-prefetch.ts`
  - [ ] Request location permissions on mount (if not granted)
  - [ ] Start location watching when task details opens
  - [ ] Update location every 30 seconds while screen is active
  - [ ] Store location in local state with timestamp
  - [ ] Handle permission denials gracefully
  - [ ] Stop watching on unmount to save battery

### Phase 2: Task Details Integration
- [ ] Update `apps/mobile/app/worker/tasks/[taskId]/index.tsx`
  - [ ] Initialize location prefetch hook for READY/IN_PROGRESS tasks
  - [ ] Show subtle GPS indicator when location is ready
  - [ ] Pass prefetched location to check-in/out navigation params
  - [ ] Display accuracy indicator (optional)

### Phase 3: Check-in/Out Screen Updates
- [ ] Modify `apps/mobile/hooks/use-task-event.ts`
  - [ ] Accept initial location from navigation params
  - [ ] Use prefetched location if recent (<60 seconds old)
  - [ ] Fallback to fresh fetch if stale or missing
  - [ ] Show instant distance calculation with prefetched data

### Phase 4: Optimizations
- [ ] Implement smart prefetch triggers:
  - [ ] Start prefetch when task card is visible in list (preview)
  - [ ] Aggressive prefetch for tasks near worker's current location
  - [ ] Cache location for 5 minutes to handle app switching
- [ ] Battery optimization:
  - [ ] Use coarse location for initial prefetch
  - [ ] Switch to fine location only when action is likely
  - [ ] Stop watching after 10 minutes of inactivity

## Technical Approach

### Location Prefetch Hook Example
```typescript
interface LocationPrefetchResult {
  location: GeolocationPosition | null;
  accuracy: number | null;
  timestamp: number | null;
  isStale: boolean;
  error: string | null;
  requestFresh: () => Promise<void>;
}

export function useLocationPrefetch(
  enabled: boolean = true,
  options?: {
    maxAge?: number;        // Max age in ms before considered stale (default: 60000)
    updateInterval?: number; // Update interval in ms (default: 30000)
    highAccuracy?: boolean;  // Use high accuracy GPS (default: true)
  }
): LocationPrefetchResult
```

### Navigation with Prefetched Location
```typescript
// In task details screen
const { location } = useLocationPrefetch(
  task.status === 'READY' || task.status === 'IN_PROGRESS'
);

// Navigate with prefetched data
router.push({
  pathname: '/worker/tasks/[taskId]/check-in',
  params: {
    taskId: task.id,
    prefetchedLat: location?.coords.latitude,
    prefetchedLng: location?.coords.longitude,
    prefetchedAccuracy: location?.coords.accuracy,
    prefetchedTimestamp: location?.timestamp
  }
});
```

### Smart Stale Detection
```typescript
const isLocationStale = (timestamp: number, maxAge: number = 60000) => {
  return Date.now() - timestamp > maxAge;
};

// In check-in/out screen
const usePrefetchedLocation =
  prefetchedTimestamp &&
  !isLocationStale(prefetchedTimestamp) &&
  prefetchedAccuracy < 100; // Only use if accurate enough
```

## Benefits

### User Experience
- ✅ **Instant check-in/out**: No waiting for GPS lock
- ✅ **Smoother flow**: Permissions handled proactively
- ✅ **Better perception**: App feels faster and more responsive
- ✅ **Reduced frustration**: Workers can complete tasks quicker

### Performance
- ✅ **Reduced latency**: 2-10 second improvement per check-in/out
- ✅ **Better GPS accuracy**: More time for GPS to stabilize
- ✅ **Fewer timeouts**: Location ready before user action

### Technical
- ✅ **Backward compatible**: Graceful fallback to current behavior
- ✅ **Battery efficient**: Smart watching with automatic cleanup
- ✅ **Permission handling**: Proactive rather than reactive

## Considerations

### Battery Impact
- **Mitigation**: Stop watching after inactivity
- **Mitigation**: Use coarse location initially
- **Mitigation**: Limit update frequency to 30 seconds
- **Impact**: Minimal with proper lifecycle management

### Privacy
- **Mitigation**: Only track when task details is open
- **Mitigation**: Clear location data on screen unmount
- **Mitigation**: Respect user's permission choices
- **Impact**: No additional privacy concerns

### Edge Cases
1. **App backgrounded**: Stop watching, resume on foreground
2. **Permission denied**: Fallback to current behavior
3. **Location services off**: Show helpful message
4. **Stale location**: Automatically refresh if >60 seconds old
5. **Poor GPS signal**: Use last known good location if recent

## Success Criteria

- [ ] Check-in/out starts within 1 second of button tap (90% of time)
- [ ] Location accuracy maintained at current levels
- [ ] Battery impact <2% over 8-hour workday
- [ ] No regression in current functionality
- [ ] Graceful handling of all edge cases

## Testing Scenarios

### Functional Testing
1. Open task details → verify location starts prefetching
2. Wait 30 seconds → verify location updates
3. Tap check-in → verify instant navigation with location
4. Background app → verify location watching stops
5. Return to app → verify location resumes

### Performance Testing
1. Measure time from button tap to check-in screen ready
2. Compare battery usage with/without prefetch
3. Test with poor GPS signal conditions
4. Test with rapid task switching

### Edge Case Testing
1. Deny location permission → verify graceful degradation
2. Turn off location services → verify error handling
3. Switch between multiple tasks rapidly
4. Test with very old devices (low memory)

## Related Documentation

- **Check-in/out Implementation**: `.claude/tasks/20251023-054410-implement-checkin-checkout-frontend.md`
- **Backend Implementation**: `.claude/tasks/20251022-211855-implement-checkin-checkout-system.md`
- **V1 Plan**: `.claude/plans/v1/02-checkin-checkout.md`

## Priority

**Medium** - Nice-to-have optimization that improves UX but not critical for v1 launch

## Estimated Effort

- **Development**: 1-2 days
- **Testing**: 0.5 days
- **Total**: 1.5-2.5 days

## Notes

### Why This Matters
Field workers often work in areas with poor cellular coverage. Getting a GPS lock can take significant time. By prefetching location while they're reading task details (typically 10-30 seconds), we can make the check-in/out action feel instant.

### Implementation Timing
This optimization should be implemented after the core check-in/checkout system is stable and well-tested in production. It's a refinement that can be added without modifying the core functionality.

### Alternative Approaches Considered
1. **Background location tracking**: Too battery intensive, privacy concerns
2. **Location caching across app**: Complexity, stale data issues
3. **Predictive prefetch**: Over-engineering for current scale

### Decision
Document for future implementation as a post-v1 enhancement. The current implementation works correctly, and this optimization can be added transparently later without breaking changes.