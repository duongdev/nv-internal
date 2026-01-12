#!/usr/bin/env tsx
/**
 * Blob Storage Backup Script
 *
 * Downloads all blobs from Vercel Blob storage to local backup directory
 * and creates a manifest file with metadata.
 *
 * Usage:
 *   pnpm tsx scripts/backup-blobs.ts [options]
 *
 * Options:
 *   --dry-run    Show what would be done without downloading
 *   --output     Custom output directory (default: backups/blobs)
 *
 * Environment:
 *   BLOB_READ_WRITE_TOKEN  Vercel Blob token (required)
 *
 * Examples:
 *   pnpm tsx scripts/backup-blobs.ts
 *   pnpm tsx scripts/backup-blobs.ts --dry-run
 *   pnpm tsx scripts/backup-blobs.ts --output /tmp/blobs-backup
 */

import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { type ListBlobResultBlob, list } from '@vercel/blob'

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
}

function logInfo(message: string): void {
  console.log(`${colors.blue}[INFO]${colors.reset} ${message}`)
}

function logSuccess(message: string): void {
  console.log(`${colors.green}[OK]${colors.reset} ${message}`)
}

function logWarning(message: string): void {
  console.log(`${colors.yellow}[WARN]${colors.reset} ${message}`)
}

function logError(message: string): void {
  console.log(`${colors.red}[ERROR]${colors.reset} ${message}`)
}

interface BlobManifestEntry {
  pathname: string
  url: string
  downloadUrl: string
  size: number
  uploadedAt: string
  localPath: string
}

interface BlobManifest {
  createdAt: string
  totalBlobs: number
  totalSize: number
  blobs: BlobManifestEntry[]
}

interface CliOptions {
  dryRun: boolean
  outputDir: string
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2)
  const options: CliOptions = {
    dryRun: false,
    outputDir: join(process.cwd(), 'backups', 'blobs'),
  }

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--dry-run':
        options.dryRun = true
        break
      case '--output':
        if (args[i + 1]) {
          options.outputDir = args[i + 1]
          i++
        } else {
          logError('--output requires a path argument')
          process.exit(1)
        }
        break
      default:
        logError(`Unknown option: ${args[i]}`)
        console.log(
          'Usage: pnpm tsx scripts/backup-blobs.ts [--dry-run] [--output <path>]',
        )
        process.exit(1)
    }
  }

  return options
}

function checkEnv(): void {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    logError('BLOB_READ_WRITE_TOKEN environment variable is not set')
    logInfo('Get your token from Vercel Dashboard > Storage > Blob > Tokens')
    process.exit(1)
  }
  logSuccess('BLOB_READ_WRITE_TOKEN is configured')
}

function ensureDir(dir: string, dryRun: boolean): void {
  if (!existsSync(dir)) {
    if (dryRun) {
      logWarning(`DRY RUN - would create directory: ${dir}`)
    } else {
      mkdirSync(dir, { recursive: true })
      logSuccess(`Created directory: ${dir}`)
    }
  } else {
    logSuccess(`Directory exists: ${dir}`)
  }
}

async function listAllBlobs(): Promise<ListBlobResultBlob[]> {
  logInfo('Fetching blob list from Vercel...')

  const allBlobs: ListBlobResultBlob[] = []
  let cursor: string | undefined

  do {
    const result = await list({ cursor, limit: 1000 })
    allBlobs.push(...result.blobs)
    cursor = result.cursor
    logInfo(`Fetched ${allBlobs.length} blobs so far...`)
  } while (cursor)

  logSuccess(`Found ${allBlobs.length} blobs in storage`)
  return allBlobs
}

function sanitizeFilename(pathname: string): string {
  // Replace any problematic characters and preserve directory structure
  return pathname.replace(/[<>:"|?*]/g, '_')
}

async function downloadBlob(
  blob: ListBlobResultBlob,
  localPath: string,
): Promise<void> {
  const response = await fetch(blob.downloadUrl)
  if (!response.ok) {
    throw new Error(
      `Failed to download ${blob.pathname}: ${response.status} ${response.statusText}`,
    )
  }

  const buffer = Buffer.from(await response.arrayBuffer())

  // Ensure parent directory exists
  const parentDir = dirname(localPath)
  if (!existsSync(parentDir)) {
    mkdirSync(parentDir, { recursive: true })
  }

  writeFileSync(localPath, buffer)
}

function formatBytes(bytes: number): string {
  if (bytes === 0) {
    return '0 B'
  }
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`
}

// Parallel download with concurrency limit
async function downloadWithConcurrency<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  concurrency: number,
): Promise<R[]> {
  const results: R[] = []
  const executing: Promise<void>[] = []

  for (const item of items) {
    const p = fn(item).then((result) => {
      results.push(result)
    })

    executing.push(p)

    if (executing.length >= concurrency) {
      await Promise.race(executing)
      // Remove completed promises
      for (let i = executing.length - 1; i >= 0; i--) {
        const status = await Promise.race([
          executing[i].then(() => 'fulfilled'),
          Promise.resolve('pending'),
        ])
        if (status === 'fulfilled') {
          executing.splice(i, 1)
        }
      }
    }
  }

  await Promise.all(executing)
  return results
}

async function backupBlobs(
  blobs: ListBlobResultBlob[],
  options: CliOptions,
): Promise<BlobManifest> {
  const manifest: BlobManifest = {
    createdAt: new Date().toISOString(),
    totalBlobs: blobs.length,
    totalSize: 0,
    blobs: [],
  }

  // Build manifest entries first
  for (const blob of blobs) {
    const localFilename = sanitizeFilename(blob.pathname)

    const entry: BlobManifestEntry = {
      pathname: blob.pathname,
      url: blob.url,
      downloadUrl: blob.downloadUrl,
      size: blob.size,
      uploadedAt: blob.uploadedAt.toISOString(),
      localPath: localFilename,
    }

    manifest.blobs.push(entry)
    manifest.totalSize += blob.size

    if (options.dryRun) {
      logInfo(
        `DRY RUN - would download: ${blob.pathname} (${formatBytes(blob.size)})`,
      )
    }
  }

  if (options.dryRun) {
    return manifest
  }

  // Download in parallel with concurrency limit
  const CONCURRENCY = 10
  let downloaded = 0
  let failed = 0
  const startTime = Date.now()

  logInfo(
    `Downloading ${blobs.length} blobs with ${CONCURRENCY} parallel connections...`,
  )

  await downloadWithConcurrency(
    blobs,
    async (blob) => {
      const localFilename = sanitizeFilename(blob.pathname)
      const localPath = join(options.outputDir, localFilename)

      try {
        await downloadBlob(blob, localPath)
        downloaded++
        // Show progress every 10 downloads
        if (downloaded % 10 === 0 || downloaded === blobs.length) {
          const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
          logInfo(`Progress: ${downloaded}/${blobs.length} (${elapsed}s)`)
        }
      } catch (error) {
        failed++
        const message = error instanceof Error ? error.message : String(error)
        logError(`Failed to download ${blob.pathname}: ${message}`)
      }
    },
    CONCURRENCY,
  )

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1)
  logInfo('')
  logSuccess(`Downloaded: ${downloaded}/${blobs.length} in ${totalTime}s`)
  if (failed > 0) {
    logWarning(`Failed: ${failed}`)
  }

  return manifest
}

function saveManifest(manifest: BlobManifest, options: CliOptions): void {
  const manifestPath = join(options.outputDir, 'blobs-manifest.json')

  if (options.dryRun) {
    logWarning(`DRY RUN - would save manifest to: ${manifestPath}`)
    logInfo(
      `Manifest would contain ${manifest.totalBlobs} entries, total size: ${formatBytes(manifest.totalSize)}`,
    )
    return
  }

  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
  logSuccess(`Manifest saved: ${manifestPath}`)
  logInfo(`Total blobs: ${manifest.totalBlobs}`)
  logInfo(`Total size: ${formatBytes(manifest.totalSize)}`)
}

async function main(): Promise<void> {
  console.log('')
  logInfo('Blob Storage Backup Script')
  logInfo('==========================')
  console.log('')

  const options = parseArgs()

  if (options.dryRun) {
    logWarning('Running in DRY RUN mode - no downloads will be made')
    console.log('')
  }

  // Pre-flight checks
  logInfo('Running pre-flight checks...')
  checkEnv()
  ensureDir(options.outputDir, options.dryRun)
  console.log('')

  // List all blobs
  const blobs = await listAllBlobs()
  console.log('')

  if (blobs.length === 0) {
    logWarning('No blobs found in storage')
    console.log('')
    logSuccess('Blob backup complete (nothing to download)')
    return
  }

  // Download blobs
  logInfo('Starting blob download...')
  const manifest = await backupBlobs(blobs, options)
  console.log('')

  // Save manifest
  saveManifest(manifest, options)
  console.log('')

  logSuccess('Blob backup complete!')
  console.log('')
  console.log(`BACKUP_DIR=${options.outputDir}`)
}

main().catch((error) => {
  logError(
    `Unexpected error: ${error instanceof Error ? error.message : String(error)}`,
  )
  process.exit(1)
})
