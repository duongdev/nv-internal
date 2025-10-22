import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import type {
  PutObjectInput,
  PutObjectResult,
  StorageProvider,
} from './storage.types'

const UPLOAD_ROOT = join(process.cwd(), '.uploads')

/**
 * Local disk storage provider for development
 * Stores files in .uploads directory
 * Supports both web File objects (Blob) and React Native files
 */
export class LocalDiskProvider implements StorageProvider {
  public readonly name = 'local-disk'

  async put(input: PutObjectInput): Promise<PutObjectResult> {
    const filePath = join(UPLOAD_ROOT, input.key)
    mkdirSync(dirname(filePath), { recursive: true })

    let buffer: Buffer
    const body = input.body

    try {
      // Handle web File objects (includes React Native files via Hono FormData)
      if (body instanceof Blob) {
        buffer = Buffer.from(await body.arrayBuffer())
      } else if (body instanceof ArrayBuffer) {
        buffer = Buffer.from(body)
      } else if (Buffer.isBuffer(body)) {
        buffer = body
      } else {
        throw new Error(`Unsupported body type: ${typeof body}, constructor: ${body?.constructor?.name}`)
      }
    } catch (error) {
      throw new Error(`Failed to convert body to buffer: ${error}`)
    }

    writeFileSync(filePath, buffer)
    return { key: input.key }
  }

  async delete(_key: string): Promise<void> {
    return undefined
  }

  async getSignedUrl(key: string): Promise<string> {
    return `/dev-uploads/${key}`
  }
}
