# API Library Utilities

This directory contains shared utilities and helpers for the NV Internal API.

## Validation Error Handler

### Overview

Enhanced validation error logging for Hono routes using Zod schemas. Automatically logs detailed validation errors when requests fail validation, making debugging significantly easier.

### Features

- ✅ **Automatic Error Logging**: Logs validation errors with field names, messages, and received values
- ✅ **Sensitive Data Protection**: Automatically redacts passwords, tokens, and other sensitive fields
- ✅ **Backward Compatible**: Response format unchanged, only adds logging
- ✅ **Type-Safe**: Full TypeScript support with proper type inference
- ✅ **Customizable**: Allows custom error handlers when needed

### Basic Usage

Replace `@hono/zod-validator` imports with our enhanced version:

```typescript
// ❌ OLD - No error logging
import { zValidator } from '@hono/zod-validator'

// ✅ NEW - Automatic error logging
import { zValidator } from '@/lib/z-validator'
```

That's it! Validation errors will now be logged automatically with detailed information.

### Example

```typescript
import { zValidator } from '@/lib/z-validator'
import { z } from 'zod'
import { Hono } from 'hono'

const app = new Hono()

const userSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  age: z.number().min(18, 'Must be at least 18'),
  email: z.string().email('Invalid email'),
})

app.post('/users', zValidator('json', userSchema), async (c) => {
  const user = c.req.valid('json')
  // ... create user
  return c.json({ user })
})
```

### Validation Error Logs

When validation fails, you'll see logs like this:

```json
{
  "level": 40,
  "name": "validation:error",
  "validationType": "json",
  "path": "/users",
  "method": "POST",
  "errorCount": 3,
  "errors": [
    {
      "field": "name",
      "message": "Name must be at least 3 characters",
      "received": "AB",
      "expected": "min 3"
    },
    {
      "field": "age",
      "message": "Must be at least 18",
      "received": 16,
      "expected": "min 18"
    },
    {
      "field": "email",
      "message": "Invalid email",
      "received": "not-an-email"
    }
  ],
  "msg": "Validation failed"
}
```

### Response Format

The API response format remains unchanged:

```json
{
  "error": "Validation failed",
  "validationType": "json",
  "details": [
    {
      "field": "name",
      "message": "Name must be at least 3 characters"
    },
    {
      "field": "age",
      "message": "Must be at least 18"
    }
  ]
}
```

### Custom Error Handler

If you need custom error handling, you can still provide your own handler:

```typescript
app.post(
  '/users',
  zValidator('json', userSchema, (result, c) => {
    if (!result.success) {
      // Custom error response
      return c.json({ custom: 'error message' }, 422)
    }
  }),
  async (c) => {
    const user = c.req.valid('json')
    // ...
  }
)
```

### Sensitive Field Protection

The following field names are automatically redacted in logs (case-insensitive):

- `password`
- `token`
- `secret`
- `apiKey` / `api_key`
- `accessToken` / `access_token`
- `refreshToken` / `refresh_token`
- `privateKey` / `private_key`

Example:

```typescript
// Input
{ password: "weak" }

// Log output
{ field: "password", received: "[REDACTED]" }
```

### Migration Guide

To enable enhanced logging in existing routes:

1. **Replace import**:
   ```typescript
   // Before
   import { zValidator } from '@hono/zod-validator'

   // After
   import { zValidator } from '@/lib/z-validator'
   ```

2. **No other changes needed** - existing code works as-is!

3. **Optional**: If you have custom error handlers that only log and return 400, you can remove them:
   ```typescript
   // Before
   zValidator('json', schema, (result, c) => {
     if (!result.success) {
       logger.error({ errors: result.error.issues }, 'Validation failed')
       return c.json({ error: 'Validation failed', details: result.error.issues }, 400)
     }
   })

   // After - automatic logging!
   zValidator('json', schema)
   ```

### Testing

The validation error handler is thoroughly tested. See:
- `src/lib/__tests__/validation-error-handler.test.ts`

Run tests:
```bash
pnpm --filter @nv-internal/api test -- validation-error-handler.test.ts
```

### Implementation Details

- **Location**: `src/lib/validation-error-handler.ts` - Core error handling logic
- **Wrapper**: `src/lib/z-validator.ts` - Enhanced zValidator wrapper
- **Logger**: Uses `getLogger('validation:error')` for consistent naming
- **Performance**: Lazy logger instantiation (only created on validation failure)

### Benefits

1. **Faster Debugging**: See exactly what validation failed without manually testing
2. **Better Logs**: Structured logs with field paths, expected vs received values
3. **Security**: Automatic sensitive data redaction
4. **Zero Overhead**: Logger only created when validation fails
5. **Backward Compatible**: No breaking changes to existing routes

---

## Other Utilities

### Logger (`log.ts`)

Pino logger with environment-aware configuration.

```typescript
import { getLogger } from '@/lib/log'

const logger = getLogger('module.file:operation')
logger.info('Operation completed')
logger.error({ error }, 'Operation failed')
```

### Storage Providers (`storage/`)

Abstracted file storage with local disk and Vercel Blob support.

```typescript
import { getStorageProvider } from '@/lib/storage/get-storage-provider'

const storage = getStorageProvider()
const url = await storage.upload(file, key)
```

### Geo Utilities (`geo.ts`)

Haversine distance calculation for GPS coordinates.

```typescript
import { calculateDistance } from '@/lib/geo'

const distance = calculateDistance(lat1, lon1, lat2, lon2)
```
