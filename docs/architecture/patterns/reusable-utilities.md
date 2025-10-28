# Reusable Utilities Pattern

Extract common logic into utilities to follow DRY principle.

## Storage Provider Factory

```typescript
// apps/api/src/lib/storage/get-storage-provider.ts
import { LocalDiskProvider } from './local-disk.provider'
import { VercelBlobProvider } from './vercel-blob.provider'
import type { StorageProvider } from './storage.types'

export function getStorageProvider(): StorageProvider {
  const provider = process.env.STORAGE_PROVIDER || 'vercel-blob'

  if (provider === 'local' || provider === 'local-disk') {
    return new LocalDiskProvider()
  }

  return new VercelBlobProvider()
}

// Usage - replaces duplicate initialization logic
const storage = getStorageProvider()
```

## Base64 File Conversion

```typescript
// apps/api/src/lib/file-utils.ts
interface Base64Attachment {
  data: string
  mimeType: string
  filename: string
}

export function convertBase64AttachmentsToFiles(
  attachments: Base64Attachment[]
): File[] {
  return attachments.map((att) => {
    const buffer = Buffer.from(att.data, 'base64')
    const blob = new Blob([buffer], { type: att.mimeType })
    return new File([blob], att.filename, { type: att.mimeType })
  })
}
```

## Reusable Param Validators

```typescript
// packages/validation/src/params.zod.ts
export const zNumericIdParam = z.object({
  id: z.string()
    .regex(/^\d+$/, 'ID must be numeric')
    .transform((val) => parseInt(val, 10))
})

// Usage - ensures param is number, not string
.get('/:id', zValidator('param', zNumericIdParam), async (c) => {
  const { id } = c.req.valid('param')  // id is number!
  // No more parseInt needed
})
```

## Benefits

- ✅ Single source of truth
- ✅ Easier to add new providers/features
- ✅ Type-safe param handling
- ✅ Reduces code duplication
