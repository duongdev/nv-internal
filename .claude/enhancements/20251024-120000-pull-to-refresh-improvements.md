# Pull-to-Refresh UX Improvements

## Overview

Improve pull-to-refresh functionality across multiple screens in the mobile app to enhance user experience when dealing with network errors, empty states, and data refresh scenarios.

## Status

⏳ **Not Started**

## Problem Analysis

### Current Issues

1. **Task Details Screen Error State**
   - When task details fails to load (404 or network error), the screen shows "not found" error
   - Users cannot pull to refresh to retry loading
   - Only option is to navigate back and try again
   - Poor UX when network is unstable

2. **Empty State Refresh Issues**
   - Worker task list shows no empty state when there are no tasks
   - Even when empty state is shown, it doesn't support pull-to-refresh
   - Users expect to be able to pull to refresh on empty lists
   - Admin screens may have similar issues

3. **Inconsistent Refresh Behavior**
   - Some screens support pull-to-refresh, others don't
   - Error states are handled inconsistently
   - No unified approach to refresh functionality

### User Impact

- **Frustration**: Users must navigate back and forth when errors occur
- **Confusion**: Inconsistent behavior across screens
- **Productivity Loss**: Extra steps needed to refresh data
- **Poor Network Experience**: App feels broken in poor network conditions

## Proposed Solution

### 1. Unified Refresh Component

Create a reusable wrapper component that handles:
- Pull-to-refresh gesture
- Error states with retry
- Empty states with refresh capability
- Loading states

```typescript
interface RefreshableScreenProps {
  onRefresh: () => Promise<void>;
  isLoading?: boolean;
  error?: Error | null;
  isEmpty?: boolean;
  emptyMessage?: string;
  children: React.ReactNode;
}

export function RefreshableScreen({
  onRefresh,
  isLoading,
  error,
  isEmpty,
  emptyMessage,
  children
}: RefreshableScreenProps) {
  // Implement ScrollView with RefreshControl
  // Handle error state with retry button
  // Handle empty state with pull-to-refresh
  // Render children when data is available
}
```

### 2. Task Details Screen Improvements

```typescript
// apps/mobile/app/(tabs)/(tasks)/[id].tsx
export default function TaskDetailsScreen() {
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ['task', id],
    retry: false, // Don't auto-retry, let user control
  });

  return (
    <RefreshableScreen
      onRefresh={refetch}
      isLoading={isLoading}
      error={error}
      isEmpty={false}
    >
      {data && <TaskDetailsContent task={data} />}
    </RefreshableScreen>
  );
}
```

### 3. Task List Screen Improvements

```typescript
// apps/mobile/app/(tabs)/(home)/index.tsx
export default function TaskListScreen() {
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ['tasks'],
  });

  return (
    <RefreshableScreen
      onRefresh={refetch}
      isLoading={isLoading}
      error={error}
      isEmpty={data?.length === 0}
      emptyMessage="Không có công việc nào"
    >
      <TaskList tasks={data || []} />
    </RefreshableScreen>
  );
}
```

### 4. Empty State Component

```typescript
interface EmptyStateProps {
  message: string;
  icon?: string;
  onRefresh?: () => void;
  canRefresh?: boolean;
}

export function EmptyState({ message, icon, onRefresh, canRefresh }: EmptyStateProps) {
  return (
    <ScrollView
      refreshControl={
        canRefresh ? (
          <RefreshControl refreshing={false} onRefresh={onRefresh} />
        ) : undefined
      }
      contentContainerStyle={styles.container}
    >
      <View style={styles.content}>
        {icon && <Icon name={icon} size={64} />}
        <Text>{message}</Text>
        {canRefresh && (
          <Text style={styles.hint}>Kéo xuống để làm mới</Text>
        )}
      </View>
    </ScrollView>
  );
}
```

## Implementation Plan

### Phase 1: Core Components
- [ ] Create `RefreshableScreen` wrapper component
- [ ] Create improved `EmptyState` component with refresh support
- [ ] Create unified `ErrorState` component with retry
- [ ] Add proper TypeScript types

### Phase 2: Task Screens
- [ ] Update Task Details screen to use RefreshableScreen
- [ ] Update Worker Task List to show empty state with refresh
- [ ] Update Admin Task List to show empty state with refresh
- [ ] Test error recovery scenarios

### Phase 3: Other Screens
- [ ] Update Employee List screen
- [ ] Update Activity Feed screen
- [ ] Update Settings screen (if applicable)
- [ ] Ensure consistency across all screens

### Phase 4: Testing & Polish
- [ ] Test on iOS devices
- [ ] Test on Android devices
- [ ] Test with network throttling
- [ ] Test offline scenarios
- [ ] Add haptic feedback for refresh gesture
- [ ] Add smooth animations

## Benefits

### User Benefits
- **Improved Recovery**: Easy to recover from errors
- **Consistent Experience**: Same behavior across all screens
- **Better Feedback**: Clear indication of what's happening
- **Reduced Frustration**: No need to navigate back on errors

### Technical Benefits
- **Code Reuse**: Single component handles all refresh scenarios
- **Maintainability**: Centralized refresh logic
- **Consistency**: Unified error handling
- **Testability**: Easy to test refresh behavior

## Technical Considerations

### Performance
- Debounce refresh to prevent spam
- Cancel in-flight requests when new refresh starts
- Cache invalidation strategy

### Accessibility
- Screen reader support for error/empty states
- Proper focus management
- Announce refresh completion

### Platform Differences
- iOS: Native bounce effect
- Android: Material Design refresh indicator
- Ensure both platforms feel native

## Estimated Effort

**Total Estimate**: 2-3 days

### Breakdown
- Core components: 0.5 days
- Task screens: 1 day
- Other screens: 0.5 days
- Testing & polish: 1 day

## Priority

**High** - This directly impacts user experience and productivity, especially in poor network conditions which are common for field workers.

## Dependencies

- TanStack Query for data fetching
- React Native's RefreshControl component
- Existing screen components

## Related Items

- General UX improvements
- Offline support (future enhancement)
- Network resilience improvements

## Success Metrics

- All screens support pull-to-refresh
- Error states are recoverable without navigation
- Empty states clearly indicate refresh capability
- Consistent behavior across iOS and Android
- User feedback shows reduced frustration

## Notes

- Consider adding offline queue in future for better network resilience
- May want to add "last updated" timestamp to screens
- Consider implementing optimistic updates where appropriate
- Should coordinate with any future offline support implementation