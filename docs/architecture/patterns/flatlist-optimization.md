# FlatList Optimization Pattern

## Overview

FlatList optimization is critical for mobile performance when displaying large datasets. This pattern ensures 60fps scrolling performance even with hundreds of items.

## Problem: ScrollView Performance

ScrollView renders all children immediately, causing:
- High memory usage
- Slow initial render
- Janky scrolling with many items
- Poor performance on older devices

```typescript
// ❌ BAD: ScrollView with many items
<ScrollView>
  {employees.map(employee => (
    <EmployeeCard key={employee.id} employee={employee} />
  ))}
</ScrollView>
```

## Solution: Optimized FlatList

Use FlatList with proper optimization props:

```typescript
// ✅ GOOD: Optimized FlatList
export default function EmployeeList({ employees }) {
  const ITEM_HEIGHT = 80; // Fixed height for each item

  const renderItem = useCallback(({ item }) => (
    <EmployeeCard employee={item} onPress={handlePress} />
  ), [handlePress]);

  const keyExtractor = useCallback((item) => item.id, []);

  const getItemLayout = useCallback((data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  }), []);

  return (
    <FlatList
      data={employees}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      getItemLayout={getItemLayout}

      // Virtualization props
      initialNumToRender={10}
      maxToRenderPerBatch={10}
      windowSize={10}
      removeClippedSubviews={true}

      // Performance props
      updateCellsBatchingPeriod={50}
      onEndReachedThreshold={0.5}

      // Additional features
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      }

      ListEmptyComponent={EmptyState}
      ListHeaderComponent={HeaderComponent}
      contentContainerStyle={{ paddingBottom: 20 }}
    />
  );
}
```

## Key Optimization Techniques

### 1. getItemLayout

When items have fixed height, provide `getItemLayout`:

```typescript
const getItemLayout = (data, index) => ({
  length: ITEM_HEIGHT,
  offset: ITEM_HEIGHT * index,
  index,
});
```

Benefits:
- Instant scrolling to any position
- No need to measure items dynamically
- Better scroll performance

### 2. Memoization

Prevent unnecessary re-renders:

```typescript
// Memoize render function
const renderItem = useCallback(({ item }) => (
  <Item data={item} />
), []);

// Memoize key extractor
const keyExtractor = useCallback((item) => item.id, []);

// Memoize item component
const Item = memo(({ data }) => (
  <View>
    <Text>{data.name}</Text>
  </View>
));
```

### 3. Virtualization Props

Control how many items are kept in memory:

```typescript
{
  initialNumToRender: 10,    // Initial batch size
  maxToRenderPerBatch: 10,   // Items per batch during scroll
  windowSize: 10,            // Viewport multiplier for offscreen rendering
  removeClippedSubviews: true, // Remove offscreen views (Android)
}
```

### 4. Search and Filtering

Implement client-side filtering for instant response:

```typescript
const filteredData = useMemo(() => {
  if (!searchQuery) return data;

  const query = searchQuery.toLowerCase();
  return data.filter(item =>
    item.name.toLowerCase().includes(query) ||
    item.email?.toLowerCase().includes(query)
  );
}, [data, searchQuery]);
```

## Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Scroll FPS | 60fps | Use React DevTools Profiler |
| Initial Render | <200ms | Performance.now() |
| Memory Usage | <100MB | Device profiler |
| Time to Interactive | <1s | Lighthouse metrics |

## Common Patterns

### Pull-to-Refresh

```typescript
<FlatList
  refreshControl={
    <RefreshControl
      refreshing={refreshing}
      onRefresh={async () => {
        setRefreshing(true);
        await refetch();
        setRefreshing(false);
      }}
      colors={['#3b82f6']} // Android
      tintColor="#3b82f6"  // iOS
    />
  }
/>
```

### Empty State

```typescript
const ListEmptyComponent = () => (
  <View className="p-8 items-center">
    <Text className="text-muted-foreground">
      No items found
    </Text>
  </View>
);
```

### Loading More (Pagination)

```typescript
<FlatList
  onEndReached={loadMore}
  onEndReachedThreshold={0.5}
  ListFooterComponent={isLoadingMore ? <Spinner /> : null}
/>
```

## Anti-Patterns to Avoid

❌ **Don't**: Use ScrollView for large lists
❌ **Don't**: Skip keyExtractor (causes re-render issues)
❌ **Don't**: Put FlatList inside ScrollView
❌ **Don't**: Use index as key with dynamic data
❌ **Don't**: Forget to memoize renderItem

## Debugging Tips

1. **Enable FlatList debug props**:
   ```typescript
   <FlatList
     debug // Shows rendering information
     disableVirtualization // Temporarily disable for debugging
   />
   ```

2. **Monitor performance**:
   ```typescript
   const onScroll = useCallback((event) => {
     console.log('Scroll FPS:', event.nativeEvent.velocity);
   }, []);
   ```

3. **Use React DevTools Profiler** to identify slow renders

## Platform-Specific Optimizations

### Android

```typescript
<FlatList
  removeClippedSubviews={true} // Android only
  legacyImplementation={false}  // Use new implementation
/>
```

### iOS

```typescript
<FlatList
  maintainVisibleContentPosition={{
    minIndexForVisible: 0,
  }}
/>
```

## Related Patterns

- [Mobile Performance](../mobile-performance.md)
- [Client-Side Search](./client-search.md)
- [Defensive Programming](./defensive-api.md)

## References

- Implementation: `.claude/tasks/20251029-145000-employee-report-monthly-summary-enhancement.md`
- Component: `/apps/mobile/app/admin/reports/index.tsx`
- React Native Docs: https://reactnative.dev/docs/flatlist