# Logger Pattern

Use lazy logger instantiation for better performance.

## Correct Implementation

```typescript
// ✅ GOOD - Create logger only when needed
.post('/', async (c) => {
  try {
    const result = await doSomething()
    return c.json(result)
  } catch (error) {
    const logger = getLogger('module.file:operation')  // Only on error
    logger.error({ error, context }, 'Operation failed')
    throw error
  }
})
```

## Anti-pattern

```typescript
// ❌ BAD - Always create logger even if not used
.post('/', async (c) => {
  const logger = getLogger('module:operation')  // Created even if not needed
  try {
    const result = await doSomething()
    return c.json(result)  // Logger never used here
  } catch (error) {
    logger.error({ error }, 'Operation failed')
    throw error
  }
})
```

## Logger Naming Convention

Use `module.file:operation` format for consistent log filtering.

Examples:
- `api.task-route:create`
- `api.payment-service:process-payment`
- `mobile.task-details:fetch-data`
