# Fix Checkout with Payment 400 Validation Error

## Overview

Fixed a 400 validation error that occurred when workers attempted to checkout with payment collection. The issue was caused by a type mismatch between the frontend sending boolean values as strings via FormData and the backend expecting actual boolean types.

## Implementation Status

✅ Completed

## Problem Analysis

### Root Cause

**Frontend behavior (apps/mobile/hooks/use-checkout-with-payment.ts:116)**:
```typescript
formData.append('paymentCollected', 'true')  // Sends string 'true'
```

**Backend validation (packages/validation/src/payment.zod.ts:53 - BEFORE FIX)**:
```typescript
paymentCollected: z.boolean().default(false)  // Expects actual boolean
```

**Result**: Zod validation fails because the string `'true'` is not coercible to boolean `true` by default, causing a 400 Bad Request error.

### Why This Happened

FormData is a web API that only supports string values. When you call `formData.append(key, value)`, non-string values are automatically converted to strings:
- `formData.append('paymentCollected', 'true')` → sends `"true"` (string)
- The backend receives `"true"` as a string, not boolean `true`
- Zod's `z.boolean()` validator rejects string values without explicit coercion

This is a common pattern when working with multipart/form-data uploads in REST APIs.

## Solution

### Implementation

Added boolean coercion to the validation schema to handle both actual booleans (for JSON APIs) and string representations (for FormData APIs):

**packages/validation/src/payment.zod.ts:53-63**:
```typescript
// Payment collection fields (optional - only if task has expectedRevenue)
// Note: FormData sends boolean as string 'true' or 'false', so we need to coerce
paymentCollected: z
  .union([z.boolean(), z.string()])
  .transform((val) => {
    if (typeof val === 'boolean') return val
    if (typeof val === 'string') {
      return val.toLowerCase() === 'true'
    }
    return false
  })
  .default(false),
```

### Validation Test Results

Verified the fix handles all common scenarios:

```bash
✅ Test 1 PASSED: paymentCollected='true' (string) coerced to boolean: true
✅ Test 2 PASSED: paymentCollected='false' (string) coerced to boolean: false
✅ Test 3 PASSED: paymentCollected=true (boolean) preserved: true
✅ Test 4 PASSED: Missing paymentCollected defaults to: false
✅ Test 5 PASSED: Correctly rejects missing amount when paymentCollected=true
```

## Testing

### Unit Tests
- ✅ All existing API tests pass (8 suites, 100 tests)
- ✅ Task event service tests pass (check-in, check-out)
- ✅ Payment validation schema tests pass

### Manual Validation Tests
Created comprehensive tests to verify:
1. String `'true'` → boolean `true` conversion
2. String `'false'` → boolean `false` conversion
3. Boolean values pass through unchanged
4. Missing field defaults to `false`
5. Validation still requires `paymentAmount` when `paymentCollected=true`

## Impact Analysis

### What Works Now
- ✅ Workers can checkout **with** payment collection
- ✅ Workers can checkout **without** payment collection
- ✅ Invoice file upload is optional (as designed)
- ✅ Payment amount validation enforced when payment collected
- ✅ Both JSON API and FormData API work correctly

### Backward Compatibility
- ✅ Existing check-in functionality unaffected
- ✅ Checkout without payment unaffected
- ✅ JSON API clients (if any) continue to work
- ✅ No database schema changes required

### Performance
- ✅ No performance impact (transformation is O(1))
- ✅ Validation remains type-safe at compile time

## Related Files

### Modified
- `packages/validation/src/payment.zod.ts` - Added boolean coercion

### Rebuilt
- `packages/validation/dist/` - Rebuilt validation package

### Tested
- `apps/api/src/v1/task-events/task-event.route.ts` - Checkout endpoint
- `apps/api/src/v1/task-events/task-event.service.ts` - Checkout service
- `apps/mobile/hooks/use-checkout-with-payment.ts` - Frontend hook

## Key Learnings

### FormData Validation Pattern

**Critical insight**: When validating FormData inputs with Zod, remember:

1. **All FormData values are strings** - Even if you send a number or boolean, it arrives as a string
2. **Use `z.coerce` for numbers** - `z.coerce.number()` handles string-to-number conversion
3. **Use union + transform for booleans** - `z.boolean()` doesn't coerce strings automatically
4. **Single vs array file handling** - Files can be `File` or `File[]` depending on upload count

### Recommended Pattern

```typescript
// ✅ Good - Handles FormData strings
const schema = z.object({
  // Numbers from FormData
  amount: z.coerce.number().positive(),

  // Booleans from FormData
  isActive: z
    .union([z.boolean(), z.string()])
    .transform((val) => {
      if (typeof val === 'boolean') return val
      return val.toLowerCase() === 'true'
    })
    .default(false),

  // Files from FormData
  files: z
    .union([z.instanceof(File), z.array(z.instanceof(File))])
    .transform((val) => Array.isArray(val) ? val : [val])
    .pipe(z.array(z.instanceof(File)))
    .optional()
})

// ❌ Bad - Assumes clean JSON data
const schema = z.object({
  amount: z.number(),      // Fails on FormData
  isActive: z.boolean(),   // Fails on FormData
  files: z.array(z.instanceof(File))  // Fails on single file
})
```

### Why Not Just Send JSON?

You might wonder: "Why not just send JSON instead of FormData?"

**Answer**: File uploads require multipart/form-data. You cannot send files (binary data) in JSON format without base64 encoding, which is:
- ❌ Inefficient (33% size increase)
- ❌ Slow (encoding/decoding overhead)
- ❌ Memory intensive (entire file in memory)

FormData is the standard way to upload files in REST APIs, so handling string coercion is necessary.

## References

- Related pattern: `.claude/tasks/20251023-054410-implement-checkin-checkout-frontend.md#bug-fixes`
- Original plan: `.claude/plans/v1/01-payment-system.md`
- Validation patterns: `CLAUDE.md#formdata-validation-pattern`
