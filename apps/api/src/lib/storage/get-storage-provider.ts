import { LocalDiskProvider } from './local-disk.provider'
import type { StorageProvider } from './storage.types'
import { VercelBlobProvider } from './vercel-blob.provider'

/**
 * Factory function to get the configured storage provider
 *
 * This eliminates duplicate provider initialization code across routes.
 * The provider is determined by the STORAGE_PROVIDER environment variable.
 *
 * Example usage:
 * ```ts
 * const storage = getStorageProvider()
 * await storage.put({ key, body, contentType })
 * ```
 *
 * @returns StorageProvider instance (VercelBlobProvider or LocalDiskProvider)
 */
export function getStorageProvider(): StorageProvider {
  const provider = process.env.STORAGE_PROVIDER || 'vercel-blob'

  if (provider === 'local' || provider === 'local-disk') {
    return new LocalDiskProvider()
  }

  return new VercelBlobProvider()
}
