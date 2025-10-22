import type {
  GetSignedUrlOptions,
  PutObjectInput,
  PutObjectResult,
  StorageProvider,
} from './storage.types'

// Lazy import to avoid bundling in environments without provider
type VercelBlobModule = typeof import('@vercel/blob')
let vercelModule: VercelBlobModule | null = null

async function ensureSdk() {
  if (!vercelModule) {
    vercelModule = await import('@vercel/blob')
  }
}

export class VercelBlobProvider implements StorageProvider {
  public readonly name = 'vercel-blob'

  async put(input: PutObjectInput): Promise<PutObjectResult> {
    await ensureSdk()
    // Private by default; type defs may not yet include 'private', so cast
    type PutOptions = {
      access?: 'public' | 'private'
      addRandomSuffix?: boolean
      contentType?: string
    }
    const putFn = (
      vercelModule as unknown as {
        put: (
          key: string,
          body: Blob | ArrayBuffer | ReadableStream,
          options?: PutOptions,
        ) => Promise<{ url: string }>
      }
    ).put
    await putFn(input.key, input.body as Blob | ArrayBuffer | ReadableStream, {
      access: 'public',
      addRandomSuffix: false,
      contentType: input.contentType,
    })
    return { key: input.key }
  }

  async delete(key: string): Promise<void> {
    // Optional: implement using @vercel/blob delete API later
    key
    return undefined
  }

  async getSignedUrl(key: string, opts?: GetSignedUrlOptions): Promise<string> {
    // Note: Vercel Blob SDK doesn't support signed URLs with expiration
    // For public access files, we return a URL that will be proxied through
    // the API's /v1/attachments/view/:token endpoint with JWT validation
    // This ensures time-limited access even for Vercel Blob storage

    // We'll use the same JWT approach as LocalDiskProvider
    const secret = process.env.ATTACHMENT_JWT_SECRET
    if (!secret) {
      throw new Error('ATTACHMENT_JWT_SECRET environment variable is required')
    }

    const expiresInSec = opts?.expiresInSec ?? 3600 // Default: 1 hour
    const dispositionFilename = opts?.dispositionFilename

    const payload = {
      key,
      provider: this.name,
      ...(dispositionFilename && { filename: dispositionFilename }),
    }

    const jwt = await import('jsonwebtoken')
    const token = jwt.default.sign(payload, secret, {
      expiresIn: expiresInSec,
    })

    return `/v1/attachments/view/${token}`
  }
}
