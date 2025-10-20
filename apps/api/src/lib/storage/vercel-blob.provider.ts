import type {
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
        ) => Promise<unknown>
      }
    ).put
    await putFn(input.key, input.body as Blob | ArrayBuffer | ReadableStream, {
      access: 'private',
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

  async getSignedUrl(key: string): Promise<string> {
    // To be implemented later via @vercel/blob signing API
    return key
  }
}
