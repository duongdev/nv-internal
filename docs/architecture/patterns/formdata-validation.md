# FormData Validation Pattern

When handling multipart/form-data uploads with Hono and Zod.

## The Challenge

FormData sends all values as strings, and file fields can be either single `File` or `File[]`.

## Solution: Flexible Zod Schemas

Use coercion and transformation for proper validation:

```typescript
// ✅ Good - Handle both single and multiple files
const schema = z.object({
  // Numeric fields - use coerce for string-to-number conversion
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),

  // File fields - handle both File and File[] with transformation
  files: z
    .union([
      z.instanceof(File),
      z.array(z.instanceof(File))
    ])
    .transform((val) => Array.isArray(val) ? val : [val])
    .pipe(z.array(z.instanceof(File)).min(1).max(10))
})
```

## Anti-pattern

```typescript
// ❌ Bad - Assumes files are always arrays
const schema = z.object({
  latitude: z.number(),  // Fails - FormData sends strings
  files: z.array(z.instanceof(File))  // Fails for single file
})
```

## Key Takeaways

- Always use `z.coerce.number()` for numeric FormData fields
- Handle both single `File` and `File[]` with union types
- Transform single files to arrays for consistent handling
- Pipe transformed values to final validation

## Reference

See fix details: `.claude/tasks/20251023-054410-implement-checkin-checkout-frontend.md#bug-fixes`
