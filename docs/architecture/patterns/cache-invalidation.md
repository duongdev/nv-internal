# Cache Invalidation Pattern

When performing mutations that affect multiple queries in React Native.

## Correct Implementation

Always invalidate all affected queries after mutation:

```typescript
// ✅ Good - Invalidate all affected queries after mutation
const queryClient = useQueryClient();

const mutation = useMutation({
  mutationFn: async (data) => {
    // Perform mutation
    return response;
  },
  onSuccess: () => {
    // Invalidate all affected queries
    queryClient.invalidateQueries({ queryKey: ['task', taskId] });
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    queryClient.invalidateQueries({ queryKey: ['activities', `TASK_${taskId}`] });
  }
});
```

## Anti-pattern

```typescript
// ❌ Bad - Forgetting to invalidate queries
const mutation = useMutation({
  mutationFn: async (data) => { /* ... */ },
  // Missing onSuccess - UI won't update!
});
```

## Key Query Patterns

- Task details: `['task', taskId]`
- Task list: `['tasks']`
- Activity feed: `['activities', topicId]`

**Important**: Always invalidate all related queries to ensure UI consistency across the app.
