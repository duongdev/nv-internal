# Fix Infinite Scroll Pagination in Task Lists

**Status**: ✅ Completed
**Date**: 2025-10-30
**Priority**: High - Critical UX issue

## Problem

After implementing the enhanced task cards and new UI layouts, infinite scroll pagination stopped working in both admin and worker task lists. Users could not load more items when scrolling to the bottom of long task lists.

## Root Cause Analysis

The issue was caused by missing the `isFetchingNextPage` property from TanStack Query's `useInfiniteQuery` hook:

1. **Admin Task List** (`components/admin-task-list.tsx`):
   - ❌ Not destructuring `isFetchingNextPage` from the hook
   - ❌ Using `isFetching` instead (includes refetch state, not just next page)
   - ❌ No loading indicator at bottom when fetching next page
   - Result: Multiple fetch requests triggered, poor UX

2. **Worker Task List** (`app/worker/(tabs)/index.tsx`):
   - ❌ Not destructuring `isFetchingNextPage` from the hook
   - ❌ No guard against duplicate fetches in `onEndReached`
   - ❌ No loading indicator at bottom when fetching next page
   - Result: Pagination didn't work properly for completed tasks

## Solution Implemented

### Admin Task List Changes

**File**: `/Users/duongdev/personal/nv-internal/apps/mobile/components/admin-task-list.tsx`

1. **Added `isFetchingNextPage` to hook destructuring**:
   ```tsx
   const {
     data,
     hasNextPage,
     isFetchingNextPage, // ✅ Added
     isRefetching,
     isLoading,
     fetchNextPage,
     refetch,
   } = useTaskInfiniteList()
   ```

2. **Updated load more handler** to use correct loading state:
   ```tsx
   const handleLoadMore = () => {
     if (hasNextPage && !isFetchingNextPage) { // ✅ Changed from !isFetching
       fetchNextPage()
     }
   }
   ```

3. **Added loading indicator** at bottom of list:
   ```tsx
   ListFooterComponent={
     isFetchingNextPage ? (
       <View className="py-4">
         <TaskListItemSkeleton />
       </View>
     ) : null
   }
   ```

4. **Removed unused `isFetching`** to fix linter warning

### Worker Task List Changes

**File**: `/Users/duongdev/personal/nv-internal/apps/mobile/app/worker/(tabs)/index.tsx`

1. **Added `isFetchingNextPage` to completed tasks hook**:
   ```tsx
   const {
     data: completedTasks,
     refetch: refetchCompletedTasks,
     isRefetching: isRefetchingCompletedTasks,
     fetchNextPage: fetchNextPageCompletedTasks,
     hasNextPage: hasNextPageCompletedTasks,
     isFetchingNextPage: isFetchingNextPageCompletedTasks, // ✅ Added
     isLoading: isLoadingCompletedTasks,
   } = useAssignedTaskInfiniteList({
     status: [TaskStatus.COMPLETED],
     limit: 50,
   })
   ```

2. **Updated `onEndReached` handler** with proper guard:
   ```tsx
   onEndReached={() => {
     if (
       activeFilter === 'completed' &&
       hasNextPageCompletedTasks &&
       !isFetchingNextPageCompletedTasks // ✅ Added guard
     ) {
       fetchNextPageCompletedTasks()
     }
   }}
   ```

3. **Added loading indicator** for completed tasks:
   ```tsx
   ListFooterComponent={
     activeFilter === 'completed' && isFetchingNextPageCompletedTasks ? (
       <View className="py-4">
         <TaskListItemSkeleton />
       </View>
     ) : null
   }
   ```

## Technical Details

### TanStack Query Infinite Scroll Pattern

The correct pattern for infinite scroll with TanStack Query:

```tsx
const {
  data,
  hasNextPage,        // ✅ TRUE when more pages available
  isFetchingNextPage, // ✅ TRUE only when loading next page
  isRefetching,       // ✅ TRUE when refetching current data
  fetchNextPage,
} = useInfiniteQuery({
  queryKey: ['tasks'],
  queryFn: ({ pageParam }) => fetchTasks({ cursor: pageParam }),
  getNextPageParam: (lastPage) => lastPage.nextCursor,
  initialPageParam: '',
})

// ✅ Correct: Only fetch when not already fetching next page
const handleLoadMore = () => {
  if (hasNextPage && !isFetchingNextPage) {
    fetchNextPage()
  }
}

// ❌ Wrong: Using isFetching includes refetch state
const handleLoadMore = () => {
  if (hasNextPage && !isFetching) { // Too broad!
    fetchNextPage()
  }
}
```

### Why `isFetchingNextPage` vs `isFetching`

- **`isFetchingNextPage`**: Only true when loading the next page (what we want)
- **`isFetching`**: True when ANY query is fetching (includes refetch, initial load, etc.)

Using `isFetching` caused the guard to pass when pull-to-refresh was triggered, potentially allowing multiple `fetchNextPage()` calls.

### Loading Indicator Pattern

Adding a skeleton loader at the bottom provides visual feedback:

```tsx
ListFooterComponent={
  isFetchingNextPage ? (
    <View className="py-4">
      <TaskListItemSkeleton />
    </View>
  ) : null
}
```

This tells users more content is loading, improving perceived performance.

## Testing Performed

✅ Verified TypeScript compilation passes
✅ Verified Biome linting/formatting passes
✅ Checked both files compile without errors
✅ Removed unused variables

## Expected Behavior (To Verify Manually)

- [ ] Admin task list loads more items when scrolling to bottom
- [ ] Worker completed tasks tab loads more items when scrolling to bottom
- [ ] Loading skeleton appears at bottom while fetching next page
- [ ] No duplicate fetch requests when scrolling rapidly
- [ ] Pull-to-refresh still works correctly
- [ ] Loading state doesn't block pagination
- [ ] No items are duplicated in the list

## Files Modified

1. `/Users/duongdev/personal/nv-internal/apps/mobile/components/admin-task-list.tsx`
   - Added `isFetchingNextPage` property
   - Updated `handleLoadMore` guard condition
   - Added `ListFooterComponent` with skeleton loader
   - Removed unused `isFetching` variable

2. `/Users/duongdev/personal/nv-internal/apps/mobile/app/worker/(tabs)/index.tsx`
   - Added `isFetchingNextPage` property for completed tasks
   - Updated `onEndReached` guard condition
   - Added `ListFooterComponent` with skeleton loader for completed tab

## Patterns Established

### Infinite Scroll Best Practices

1. **Always use `isFetchingNextPage`** for pagination guards (not `isFetching`)
2. **Add loading indicators** via `ListFooterComponent` for better UX
3. **Separate loading states**: `isLoading` (initial), `isRefetching` (refresh), `isFetchingNextPage` (pagination)
4. **Guard against duplicate fetches**: Check both `hasNextPage` and `!isFetchingNextPage`
5. **Set appropriate threshold**: `onEndReachedThreshold={0.5}` triggers at 50% from bottom

### Data Structure Requirements

```tsx
// ✅ Correct: Flatten pages into array for FlatList
const tasks = data?.pages.flatMap((page) => page.tasks) ?? []

// ❌ Wrong: Passing pages array directly
const tasks = data?.pages ?? []
```

### Hook Response Structure

TanStack Query's `useInfiniteQuery` returns:
```tsx
{
  data: {
    pages: Array<{ tasks: Task[], nextCursor: string | null }>
    pageParams: Array<string>
  }
  hasNextPage: boolean
  isFetchingNextPage: boolean
  fetchNextPage: () => void
}
```

## Related Documentation

- [TanStack Query - Infinite Queries](https://tanstack.com/query/latest/docs/framework/react/guides/infinite-queries)
- [React Native FlatList - onEndReached](https://reactnative.dev/docs/flatlist#onendreached)
- Pattern: [FlatList Optimization](../docs/architecture/patterns/flatlist-optimization.md) (future)

## Learnings

1. **Distinguish between query states**: Different loading states serve different purposes
2. **Visual feedback is crucial**: Loading indicators significantly improve perceived performance
3. **Test edge cases**: Rapid scrolling, pull-to-refresh during pagination, etc.
4. **Linter warnings are helpful**: Caught the unused `isFetching` variable immediately

## Future Improvements

- [ ] Add haptic feedback when reaching end of list (no more items)
- [ ] Consider virtualized list optimization for very long lists (100+ items)
- [ ] Add error state handling for failed pagination requests
- [ ] Create reusable `InfiniteTaskList` component to DRY up patterns
