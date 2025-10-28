# Hono RPC File Upload Limitation Pattern

When implementing file uploads with Hono RPC client in React Native.

## The Issue

Hono RPC client doesn't support FormData/file uploads properly.

## Current Limitation

Server uploads are limited to **4.5 MB** due to Vercel serverless function request body constraints. Files larger than this will receive `FUNCTION_PAYLOAD_TOO_LARGE` error.

## Future Solution

Client-side direct upload to Vercel Blob is documented in `.claude/enhancements/20251024-180000-client-side-direct-upload-optimization.md` which will:
- Remove the 4.5 MB limit (enable up to 5 TB uploads)
- Save $0.05/GB bandwidth costs
- Provide upload progress tracking
- Eliminate timeout risks

## Current Solution: Use Raw Fetch

Use raw fetch API for endpoints that accept file uploads:

```typescript
// ❌ BAD - Hono RPC doesn't handle FormData with files
import { hc } from 'hono/client'
const client = hc<AppType>(API_URL)

const formData = new FormData()
formData.append('file', imageFile)
formData.append('data', JSON.stringify(data))

// This will fail with 400 error or type mismatch
await client.v1.resource[':id'].$put({
  param: { id },
  form: formData  // Doesn't work!
})

// ✅ GOOD - Use raw fetch for file uploads
const formData = new FormData()
formData.append('file', imageFile)
formData.append('data', JSON.stringify(data))

const response = await fetch(`${API_URL}/v1/resource/${id}`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${await getToken()}`
  },
  body: formData
})

if (!response.ok) {
  const error = await response.json()
  throw new Error(error.message || 'Upload failed')
}

const result = await response.json()
```

## When to Use What

### Use raw fetch
- ✅ Any endpoint accepting file uploads
- ✅ Multipart form data with binary content
- ✅ Image/document uploads

### Hono RPC works fine
- ✅ JSON payloads
- ✅ Query parameters
- ✅ Simple form data (no files)

## Reference

See implementation: `.claude/tasks/20251024-payment-system-mobile-frontend.md#session-2-bug-fixes`
