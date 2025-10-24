# Client-Side Direct Upload to Vercel Blob

## Overview

This enhancement implements client-side direct upload to Vercel Blob storage, bypassing the API server entirely for file uploads. This eliminates the 4.5 MB Vercel serverless request limit, reduces bandwidth costs, and enables uploads up to 5 TB per file.

## Status

💡 **Status**: Idea / Not Started
📅 **Created**: 2025-10-24
🎯 **Priority**: Medium-High (Post-v1)
⏱️ **Estimated Effort**: 4.5-6.5 days
🏷️ **Category**: Performance & Cost Optimization
📦 **Dependencies**: Vercel Blob storage (already enabled)

## Problem Analysis

### Current Architecture Issues

**Current Flow:**
```
Mobile App → API Server (FormData) → Vercel Blob → Database
           ↑                      ↑
    4.5 MB limit!          $0.05/GB cost!
```

**Critical Limitations:**
1. **Hard 4.5 MB limit**: Vercel serverless functions reject larger request bodies with `FUNCTION_PAYLOAD_TOO_LARGE`
2. **Bandwidth costs**: $0.05/GB for all uploads going through server
3. **Timeout risks**: 10s (hobby) or 60s (pro) timeout for slow uploads
4. **No progress indication**: Users can't see upload progress
5. **Configuration mismatch**: Current 50 MB config doesn't work due to 4.5 MB Vercel limit

### Vercel Platform Limits

From official documentation and testing:

**Serverless Function Limits:**
- Request body: **4.5 MB max** (hard limit, returns 413 error)
- Timeout: 10s (hobby), 60s (pro) without Fluid Compute
- Timeout: 300s (hobby), 800s (pro) with Fluid Compute
- Memory: 1024 MB (hobby), 3008 MB (pro)

**Vercel Blob Limits:**
- Max file size: **5 TB per blob** (massive headroom!)
- Cache limit: 512 MB (files >512 MB incur cache miss charges)
- Storage cost: $0.023/GB-month
- Bandwidth cost: $0.05/GB (server uploads)
- **Client uploads: FREE bandwidth!** (key optimization)

## Proposed Solution

### New Architecture

**Optimized Flow:**
```
Mobile App → API (get token) → Vercel Blob (direct) → API (callback) → Database
           ↓                 ↓                      ↓
      ~50ms request    Up to 5 TB!         Metadata only
```

**Benefits:**
- ✅ Bypass 4.5 MB limit (upload up to 5 TB!)
- ✅ Zero bandwidth costs (client uploads are free)
- ✅ No timeout risk (upload happens client-side)
- ✅ Upload progress tracking possible
- ✅ Faster uploads (direct to CDN)
- ✅ Better reliability (fewer hops)

### Technical Approach

#### 1. Backend: Token Generation Endpoint

Create a new endpoint that generates upload tokens using Vercel Blob's client upload API:

```typescript
// apps/api/src/v1/attachment/attachment.route.ts

import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { HTTPException } from 'hono/http-exception'

// Schema for token request
const uploadTokenSchema = z.object({
  taskId: z.number(),
  fileName: z.string(),
  fileSize: z.number(),
  mimeType: z.string(),
  category: z.enum(['CHECKOUT', 'INVOICE', 'GENERAL']).optional(),
})

// Add to existing attachment routes
attachmentApp
  .post('/upload-token',
    zValidator('json', uploadTokenSchema),
    async (c) => {
      const user = c.get('user')
      const { taskId, fileName, fileSize, mimeType, category } = c.req.valid('json')

      // Validate permissions (reuse existing logic)
      const task = await prisma.task.findUnique({ where: { id: taskId } })
      if (!task) {
        throw new HTTPException(404, { message: 'Không tìm thấy công việc' })
      }

      const isAdmin = await isUserAdmin({ user })
      const assigned = await isUserAssignedToTask({ user, task })
      if (!isAdmin && !assigned) {
        throw new HTTPException(403, {
          message: 'Bạn không có quyền tải tệp lên công việc này'
        })
      }

      // Validate file constraints
      if (fileSize > defaultUploadConfig.maxPerFileBytes) {
        const maxMB = defaultUploadConfig.maxPerFileBytes / 1024 / 1024
        throw new HTTPException(400, {
          message: `Tệp quá lớn (${Math.round(fileSize / 1024 / 1024)}MB). Kích thước tối đa: ${maxMB}MB`
        })
      }

      if (!defaultUploadConfig.allowedMimeTypes.includes(mimeType)) {
        throw new HTTPException(400, {
          message: `Loại tệp không được hỗ trợ: ${mimeType}`
        })
      }

      // Generate the upload token using Vercel Blob client upload
      try {
        const jsonResponse = await handleUpload({
          body: {
            type: 'blob.generate-client-token',
            payload: {
              pathname: `tasks/${taskId}/${new Date().getUTCFullYear()}/${
                new Date().getUTCMonth() + 1
              }/${new Date().getUTCDate()}/${crypto.randomUUID()}-${fileName}`,
              callbackUrl: `${process.env.API_URL}/v1/attachment/upload-complete`,
              clientPayload: JSON.stringify({
                taskId,
                userId: user.id,
                category,
                originalFilename: fileName,
                mimeType,
                size: fileSize,
              }),
            },
          } as HandleUploadBody,
          request: c.req.raw,
          onBeforeGenerateToken: async (pathname, clientPayload) => {
            // Additional validation before token generation
            // This runs server-side before token is created
            return {
              allowedContentTypes: [mimeType],
              maximumSizeInBytes: fileSize * 1.1, // Allow 10% overhead
              validUntil: Date.now() + 3600000, // 1 hour expiry
            }
          },
          onUploadCompleted: async ({ blob, tokenPayload }) => {
            // This callback is called after successful upload
            // Parse the client payload
            const payload = JSON.parse(tokenPayload as string)

            // Create attachment record in database
            const attachment = await prisma.$transaction(async (tx) => {
              // Generate blurhash for images
              let blurhashData = undefined
              if (mimeType.startsWith('image/')) {
                try {
                  // Fetch image and generate blurhash
                  const response = await fetch(blob.url)
                  const buffer = Buffer.from(await response.arrayBuffer())
                  blurhashData = await generateBlurhash(buffer)
                } catch (error) {
                  logger.warn({ error }, 'Failed to generate blurhash')
                }
              }

              // Create attachment record
              const att = await tx.attachment.create({
                data: {
                  taskId: payload.taskId,
                  provider: 'vercel-blob',
                  pathname: blob.pathname,
                  mimeType: payload.mimeType,
                  size: payload.size,
                  originalFilename: payload.originalFilename,
                  uploadedBy: payload.userId,
                  category: payload.category,
                  blurhash: blurhashData?.blurhash,
                  width: blurhashData?.width,
                  height: blurhashData?.height,
                }
              })

              // Log activity
              await createActivity({
                action: 'TASK_ATTACHMENTS_UPLOADED',
                userId: payload.userId,
                topic: { entityType: 'TASK', entityId: payload.taskId },
                payload: {
                  attachments: [{
                    id: att.id,
                    mimeType: att.mimeType,
                    originalFilename: att.originalFilename,
                  }]
                },
              }, tx)

              return att
            })

            logger.info({
              attachmentId: attachment.id,
              taskId: payload.taskId
            }, 'Client upload completed')
          },
        })

        return c.json(jsonResponse)
      } catch (error) {
        logger.error({ error }, 'Failed to generate upload token')
        throw new HTTPException(500, {
          message: 'Không thể tạo token tải lên. Vui lòng thử lại.'
        })
      }
    }
  )
```

#### 2. Backend: Upload Completion Callback

The callback endpoint that Vercel Blob calls after successful upload:

```typescript
// apps/api/src/v1/attachment/attachment.route.ts

// Callback endpoint for completed uploads
attachmentApp
  .post('/upload-complete',
    async (c) => {
      // Vercel Blob sends a POST with the upload result
      const body = await c.req.json() as {
        type: 'blob.upload-completed'
        payload: {
          blob: {
            url: string
            pathname: string
            contentType: string
            contentDisposition: string
          }
          tokenPayload: string // Our clientPayload from token generation
        }
      }

      if (body.type !== 'blob.upload-completed') {
        throw new HTTPException(400, { message: 'Invalid callback type' })
      }

      const { blob, tokenPayload } = body.payload
      const clientData = JSON.parse(tokenPayload)

      // The actual database update happens in onUploadCompleted above
      // This endpoint just acknowledges receipt

      return c.json({ success: true })
    }
  )
```

#### 3. Mobile: React Native Implementation

Since `@vercel/blob/client` doesn't work in React Native, implement direct upload with fetch:

```typescript
// apps/mobile/api/attachment/use-upload-attachments-v2.ts

import { useMutation, useQueryClient } from '@tanstack/react-query'
import type * as ImagePicker from 'expo-image-picker'
import { api } from '@/lib/api-client'

interface UploadToken {
  url: string           // Upload URL from Vercel
  clientToken: string   // Authorization token
}

/**
 * Request upload token from our API
 */
async function getUploadToken({
  taskId,
  fileName,
  fileSize,
  mimeType,
  category,
}: {
  taskId: number
  fileName: string
  fileSize: number
  mimeType: string
  category?: string
}): Promise<UploadToken> {
  const response = await api.v1.attachment['upload-token'].$post({
    json: { taskId, fileName, fileSize, mimeType, category }
  })

  if (!response.ok) {
    throw new Error('Failed to get upload token')
  }

  return response.json()
}

/**
 * Upload file directly to Vercel Blob
 */
async function uploadToVercelBlob({
  file,
  token,
  onProgress,
}: {
  file: {
    uri: string
    name: string
    type: string
    size: number
  }
  token: UploadToken
  onProgress?: (progress: number) => void
}): Promise<void> {
  // Create blob from file for React Native
  const response = await fetch(file.uri)
  const blob = await response.blob()

  // Option 1: Simple fetch (no progress)
  const uploadResponse = await fetch(token.url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token.clientToken}`,
      'Content-Type': file.type,
    },
    body: blob,
  })

  if (!uploadResponse.ok) {
    throw new Error(`Upload failed: ${uploadResponse.statusText}`)
  }

  // Option 2: With progress tracking using XMLHttpRequest
  // (XMLHttpRequest provides upload progress, fetch doesn't)
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        const progress = (event.loaded / event.total) * 100
        onProgress(progress)
      }
    })

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve()
      } else {
        reject(new Error(`Upload failed: ${xhr.statusText}`))
      }
    })

    xhr.addEventListener('error', () => {
      reject(new Error('Upload failed'))
    })

    xhr.open('PUT', token.url)
    xhr.setRequestHeader('Authorization', `Bearer ${token.clientToken}`)
    xhr.setRequestHeader('Content-Type', file.type)
    xhr.send(blob)
  })
}

/**
 * Complete client-side upload flow
 */
export function useClientUploadAttachments() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      taskId,
      assets,
      onProgress,
    }: {
      taskId: number
      assets: ImagePicker.ImagePickerAsset[]
      onProgress?: (fileName: string, progress: number) => void
    }) => {
      const results = []

      // Upload files sequentially to show individual progress
      for (const asset of assets) {
        const fileName = asset.fileName || 'file'
        const fileSize = asset.fileSize || 0
        const mimeType = asset.type || 'application/octet-stream'

        // Step 1: Get upload token
        const token = await getUploadToken({
          taskId,
          fileName,
          fileSize,
          mimeType,
        })

        // Step 2: Upload directly to Vercel Blob
        await uploadToVercelBlob({
          file: {
            uri: asset.uri,
            name: fileName,
            type: mimeType,
            size: fileSize,
          },
          token,
          onProgress: (progress) => {
            onProgress?.(fileName, progress)
          },
        })

        results.push({ fileName, success: true })
      }

      return results
    },
    onSuccess: (_, variables) => {
      // Invalidate queries after successful upload
      queryClient.invalidateQueries({
        queryKey: ['task', variables.taskId],
      })
      queryClient.invalidateQueries({
        queryKey: ['activities', `TASK_${variables.taskId}`],
      })

      const { toast } = require('@/components/ui/toasts')
      toast.success('Tải tệp lên thành công')
    },
    onError: (error) => {
      const { toast } = require('@/components/ui/toasts')
      toast.error(error.message || 'Không thể tải tệp lên')
    },
  })
}
```

#### 4. Mobile: Upload Progress UI

Implement a progress indicator for better UX:

```tsx
// apps/mobile/components/upload-progress-modal.tsx

import { Modal, View, Text, ProgressBar } from 'react-native'
import { useState } from 'react'

interface UploadProgress {
  fileName: string
  progress: number
  status: 'uploading' | 'completed' | 'failed'
}

export function UploadProgressModal({
  visible,
  uploads,
  onClose,
}: {
  visible: boolean
  uploads: UploadProgress[]
  onClose: () => void
}) {
  const totalProgress = uploads.reduce((sum, u) => sum + u.progress, 0) / uploads.length

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-white rounded-t-xl p-4">
          <Text className="text-lg font-semibold mb-4">
            Đang tải lên...
          </Text>

          {/* Overall progress */}
          <View className="mb-4">
            <ProgressBar progress={totalProgress / 100} />
            <Text className="text-sm text-muted-foreground mt-1">
              {Math.round(totalProgress)}% hoàn thành
            </Text>
          </View>

          {/* Individual file progress */}
          <View className="space-y-2">
            {uploads.map((upload, index) => (
              <View key={index} className="flex-row items-center">
                <Text className="flex-1 text-sm" numberOfLines={1}>
                  {upload.fileName}
                </Text>
                <View className="w-24">
                  <ProgressBar
                    progress={upload.progress / 100}
                    color={
                      upload.status === 'completed' ? 'green' :
                      upload.status === 'failed' ? 'red' : 'blue'
                    }
                  />
                </View>
                <Text className="text-xs ml-2 w-10 text-right">
                  {Math.round(upload.progress)}%
                </Text>
              </View>
            ))}
          </View>

          {totalProgress === 100 && (
            <Button onPress={onClose} className="mt-4">
              Đóng
            </Button>
          )}
        </View>
      </View>
    </Modal>
  )
}
```

### Migration Strategy

#### Phase 1: Parallel Implementation (1-2 days)
1. Deploy token generation endpoint
2. Keep existing upload endpoint active
3. Add feature flag: `ENABLE_CLIENT_UPLOAD`

#### Phase 2: Mobile Rollout (2-3 days)
1. Implement client upload in mobile app
2. Use feature flag to control which method
3. A/B test with subset of users
4. Monitor error rates and success metrics

#### Phase 3: Validation (1 day)
1. Verify all uploads working correctly
2. Check database records created properly
3. Ensure activity logs accurate
4. Validate blurhash generation

#### Phase 4: Cleanup (0.5 days)
1. Remove old server upload code
2. Update documentation
3. Increase file size limits (no longer constrained)

### Configuration Changes

Update environment variables and limits:

```typescript
// apps/api/src/lib/config/upload-config.ts

export const defaultUploadConfig: UploadConfig = {
  maxFiles: parseNumberEnv('UPLOAD_MAX_FILES', 10),
  // Can now support much larger files!
  maxPerFileBytes: parseNumberEnv('UPLOAD_MAX_PER_FILE_MB', 500) * 1024 * 1024,
  maxTotalBytes: parseNumberEnv('UPLOAD_MAX_TOTAL_MB', 1000) * 1024 * 1024,
  allowedMimeTypes: [
    // ... existing types
  ],
}
```

## Testing Strategy

### Unit Tests

```typescript
// apps/api/src/v1/attachment/__tests__/attachment.route.test.ts

describe('Client Upload Token', () => {
  it('should generate token for authorized user', async () => {
    // Mock user with task assignment
    const response = await app.request('/v1/attachment/upload-token', {
      method: 'POST',
      headers: { Authorization: 'Bearer token' },
      body: JSON.stringify({
        taskId: 1,
        fileName: 'test.jpg',
        fileSize: 1024 * 1024,
        mimeType: 'image/jpeg',
      }),
    })

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.url).toBeDefined()
    expect(body.clientToken).toBeDefined()
  })

  it('should reject oversized files', async () => {
    const response = await app.request('/v1/attachment/upload-token', {
      method: 'POST',
      headers: { Authorization: 'Bearer token' },
      body: JSON.stringify({
        taskId: 1,
        fileName: 'huge.mp4',
        fileSize: 1024 * 1024 * 1024, // 1 GB
        mimeType: 'video/mp4',
      }),
    })

    expect(response.status).toBe(400)
  })

  it('should reject unauthorized users', async () => {
    // Mock user without task assignment
    const response = await app.request('/v1/attachment/upload-token', {
      method: 'POST',
      headers: { Authorization: 'Bearer other-token' },
      body: JSON.stringify({
        taskId: 1,
        fileName: 'test.jpg',
        fileSize: 1024,
        mimeType: 'image/jpeg',
      }),
    })

    expect(response.status).toBe(403)
  })
})
```

### Integration Tests

```typescript
// apps/api/src/v1/attachment/__tests__/client-upload.integration.test.ts

describe('Client Upload E2E', () => {
  it('should complete full upload flow', async () => {
    // 1. Request token
    const tokenResponse = await requestUploadToken({
      taskId: 1,
      fileName: 'test.jpg',
      fileSize: 1024,
      mimeType: 'image/jpeg',
    })

    expect(tokenResponse.url).toBeDefined()

    // 2. Simulate Vercel Blob callback
    const callbackResponse = await app.request('/v1/attachment/upload-complete', {
      method: 'POST',
      body: JSON.stringify({
        type: 'blob.upload-completed',
        payload: {
          blob: {
            url: 'https://blob.vercel-storage.com/test.jpg',
            pathname: 'tasks/1/2024/10/24/uuid-test.jpg',
            contentType: 'image/jpeg',
          },
          tokenPayload: JSON.stringify({
            taskId: 1,
            userId: 'user_123',
            originalFilename: 'test.jpg',
            mimeType: 'image/jpeg',
            size: 1024,
          }),
        },
      }),
    })

    expect(callbackResponse.status).toBe(200)

    // 3. Verify database record created
    const attachment = await prisma.attachment.findFirst({
      where: { pathname: 'tasks/1/2024/10/24/uuid-test.jpg' },
    })

    expect(attachment).toBeDefined()
    expect(attachment?.originalFilename).toBe('test.jpg')

    // 4. Verify activity logged
    const activity = await prisma.activity.findFirst({
      where: {
        action: 'TASK_ATTACHMENTS_UPLOADED',
        topic: 'TASK_1',
      },
      orderBy: { createdAt: 'desc' },
    })

    expect(activity).toBeDefined()
  })
})
```

### E2E Tests (Mobile)

```typescript
// apps/mobile/__tests__/upload.e2e.test.ts

describe('Client Upload Mobile', () => {
  it('should upload image from camera', async () => {
    // Mock camera capture
    const asset = {
      uri: 'file:///path/to/image.jpg',
      fileName: 'photo.jpg',
      fileSize: 2048000,
      type: 'image/jpeg',
    }

    // Mock token endpoint
    fetchMock.post('/v1/attachment/upload-token', {
      url: 'https://blob.vercel-storage.com/upload',
      clientToken: 'test-token',
    })

    // Mock Vercel Blob upload
    fetchMock.put('https://blob.vercel-storage.com/upload', 200)

    // Execute upload
    const result = await uploadWithProgress({
      taskId: 1,
      assets: [asset],
      onProgress: (fileName, progress) => {
        console.log(`${fileName}: ${progress}%`)
      },
    })

    expect(result).toEqual([
      { fileName: 'photo.jpg', success: true }
    ])
  })
})
```

## Security Considerations

### Token Security
- Tokens expire in 1 hour (configurable)
- Include user ID in token for audit trail
- Validate permissions before token generation
- Token is single-use (Vercel Blob invalidates after use)

### File Validation
- Validate MIME type server-side before token generation
- Enforce file size limits in token constraints
- Re-validate in callback before database insert
- Scan for malware if implementing virus scanning

### Rate Limiting
```typescript
// Add rate limiting to token generation
import { rateLimiter } from '@/lib/rate-limiter'

attachmentApp.use('/upload-token', rateLimiter({
  points: 10,        // 10 tokens
  duration: 60,      // per minute
  keyPrefix: 'upload-token',
}))
```

## Performance Optimizations

### 1. Parallel Uploads
For multiple files, request all tokens first, then upload in parallel:

```typescript
// Request all tokens
const tokens = await Promise.all(
  assets.map(asset => getUploadToken({
    taskId,
    fileName: asset.fileName,
    fileSize: asset.fileSize,
    mimeType: asset.type,
  }))
)

// Upload in parallel with concurrency limit
const CONCURRENT_UPLOADS = 3
const results = await pLimit(CONCURRENT_UPLOADS,
  assets.map((asset, i) => () =>
    uploadToVercelBlob({
      file: asset,
      token: tokens[i],
    })
  )
)
```

### 2. Resume on Failure
Implement retry logic for failed uploads:

```typescript
async function uploadWithRetry(file, token, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await uploadToVercelBlob({ file, token })
    } catch (error) {
      if (attempt === maxRetries) throw error

      // Exponential backoff
      await new Promise(resolve =>
        setTimeout(resolve, Math.pow(2, attempt) * 1000)
      )
    }
  }
}
```

### 3. Chunked Uploads (Future)
For very large files, implement chunked upload:

```typescript
// Future enhancement for files > 100 MB
async function uploadInChunks(file, token) {
  const CHUNK_SIZE = 10 * 1024 * 1024 // 10 MB chunks
  const chunks = Math.ceil(file.size / CHUNK_SIZE)

  for (let i = 0; i < chunks; i++) {
    const start = i * CHUNK_SIZE
    const end = Math.min(start + CHUNK_SIZE, file.size)
    const chunk = file.slice(start, end)

    await uploadChunk(chunk, token, i, chunks)
  }
}
```

## Cost Analysis

### Current Costs (Server Upload)
- **Bandwidth**: $0.05/GB for all uploads
- **Execution time**: ~2-5s per upload (serverless costs)
- **Example**: 100 GB/month = $5.00 bandwidth + execution costs

### With Client Upload
- **Bandwidth**: $0.00 (client uploads free!)
- **Execution time**: ~50ms for token generation
- **Example**: 100 GB/month = $0.00 bandwidth + minimal execution
- **Savings**: ~$5/month per 100 GB uploaded

### ROI Calculation
- **Implementation**: 4.5-6.5 days
- **Monthly savings**: $5-50 depending on usage
- **Break-even**: 6-12 months at current usage
- **Additional value**: Better UX, no size limits, progress tracking

## Rollback Plan

If issues arise during deployment:

1. **Immediate**: Toggle feature flag to disable client uploads
2. **Mobile**: Force app update if critical bug
3. **Backend**: Revert token generation endpoint
4. **Data**: Attachments already uploaded remain valid

Keep old upload code for 30 days after full migration.

## Monitoring & Metrics

### Key Metrics to Track
- Upload success rate (before/after)
- Average upload time
- Failed upload reasons
- Token generation latency
- Bandwidth usage reduction
- User satisfaction scores

### Alerts to Configure
```typescript
// Datadog/Sentry alerts
- Token generation failures > 5%
- Upload callback failures > 1%
- Token generation latency > 1s
- Unusual upload patterns (security)
```

## Documentation Updates

### API Documentation
```yaml
# OpenAPI spec addition
/v1/attachment/upload-token:
  post:
    summary: Generate client upload token
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            required: [taskId, fileName, fileSize, mimeType]
    responses:
      200:
        description: Upload token generated
        content:
          application/json:
            schema:
              type: object
              properties:
                url:
                  type: string
                  description: Vercel Blob upload URL
                clientToken:
                  type: string
                  description: Authorization token
```

### Mobile Documentation
- Update upload guide with new flow
- Document progress callback usage
- Add troubleshooting section

## Future Enhancements

### Phase 2: Advanced Features
1. **Resumable uploads**: Save upload state locally
2. **Background uploads**: Continue when app backgrounded
3. **Compression**: Client-side image/video compression
4. **Thumbnails**: Generate client-side for faster preview

### Phase 3: Enterprise Features
1. **Virus scanning**: Integrate with ClamAV or similar
2. **DLP scanning**: Detect sensitive data
3. **Watermarking**: Add company watermark to images
4. **Encryption**: End-to-end encryption for sensitive files

## Decision Log

- **Why not use expo-file-system?** Doesn't support Vercel Blob auth headers properly
- **Why sequential uploads?** Better progress UX, can show per-file status
- **Why 1-hour token expiry?** Balance between security and user convenience
- **Why keep callback endpoint?** Required by Vercel Blob for completion notification

## Implementation Checklist

### Backend Tasks
- [ ] Create token generation endpoint
- [ ] Implement upload callback endpoint
- [ ] Add permission validation
- [ ] Configure Vercel Blob client upload
- [ ] Add rate limiting
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Update API documentation

### Mobile Tasks
- [ ] Implement token request function
- [ ] Create direct upload with fetch/XHR
- [ ] Add progress tracking
- [ ] Build progress UI component
- [ ] Handle retry logic
- [ ] Update attachment picker
- [ ] Write tests
- [ ] Test on iOS and Android

### DevOps Tasks
- [ ] Add feature flag
- [ ] Configure monitoring
- [ ] Set up alerts
- [ ] Plan rollback strategy
- [ ] Document deployment steps

### Testing & Validation
- [ ] Test with various file sizes
- [ ] Test poor network conditions
- [ ] Test token expiration
- [ ] Test permission edge cases
- [ ] Load test token generation
- [ ] Validate cost reduction
- [ ] User acceptance testing

## Related Documents

- Current implementation: `apps/api/src/v1/attachment/attachment.service.ts`
- Mobile upload: `apps/mobile/api/attachment/use-upload-attachments.ts`
- Storage providers: `apps/api/src/lib/storage/`
- Upload config: `apps/api/src/lib/config/upload-config.ts`
- Vercel Blob docs: https://vercel.com/docs/storage/vercel-blob

## Notes

- This optimization becomes more valuable as the company grows
- Consider implementing after v1 features are stable
- Client upload is industry best practice (S3, Azure, GCS all support it)
- React Native compatibility was the main technical challenge identified
- Solution provided works around the Hono RPC and @vercel/blob/client limitations