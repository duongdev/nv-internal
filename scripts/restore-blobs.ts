#!/usr/bin/env tsx
/**
 * Blob Storage Restore Script
 *
 * Restores blobs to Vercel Blob storage from a local backup.
 * Reads the blobs-manifest.json to know what files to upload.
 *
 * Usage:
 *   pnpm tsx scripts/restore-blobs.ts [options]
 *
 * Options:
 *   --confirm    REQUIRED: Confirm you want to restore (safety measure)
 *   --dry-run    Show what would be done without uploading
 *   --input      Custom input directory (default: backups/blobs)
 *   --skip-existing  Skip files that already exist in blob storage
 *
 * Environment:
 *   BLOB_READ_WRITE_TOKEN  Vercel Blob token (required)
 *
 * Examples:
 *   pnpm tsx scripts/restore-blobs.ts --confirm
 *   pnpm tsx scripts/restore-blobs.ts --dry-run
 *   pnpm tsx scripts/restore-blobs.ts --input /path/to/backup/blobs --confirm
 */

import { existsSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { list, put } from '@vercel/blob'

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

function logCritical(message: string): void {
  console.log(`${colors.red}[CRITICAL]${colors.reset} ${message}`)
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
  confirm: boolean
  dryRun: boolean
  inputDir: string
  skipExisting: boolean
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2)
  const options: CliOptions = {
    confirm: false,
    dryRun: false,
    inputDir: join(process.cwd(), 'backups', 'blobs'),
    skipExisting: false,
  }

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--confirm':
        options.confirm = true
        break
      case '--dry-run':
        options.dryRun = true
        break
      case '--skip-existing':
        options.skipExisting = true
        break
      case '--input':
        if (args[i + 1]) {
          options.inputDir = args[i + 1]
          i++
        } else {
          logError('--input requires a path argument')
          process.exit(1)
        }
        break
      default:
        logError(`Unknown option: ${args[i]}`)
        console.log(
          'Usage: pnpm tsx scripts/restore-blobs.ts --confirm [--dry-run] [--input <path>] [--skip-existing]',
        )
        process.exit(1)
    }
  }

  return options
}

function checkConfirmation(options: CliOptions): void {
  if (options.dryRun) {
    return
  }

  if (!options.confirm) {
    console.log('')
    logCritical('=========================================')
    logCritical('       BLOB RESTORE WARNING')
    logCritical('=========================================')
    console.log('')
    logWarning('This operation will upload files to Vercel Blob storage!')
    logWarning('Existing blobs with the same pathname will be overwritten.')
    console.log('')
    logInfo('To proceed, add the --confirm flag:')
    logInfo('  pnpm tsx scripts/restore-blobs.ts --confirm')
    console.log('')
    logInfo('To preview what would happen, use --dry-run:')
    logInfo('  pnpm tsx scripts/restore-blobs.ts --dry-run')
    console.log('')
    process.exit(1)
  }
}

function checkEnv(): void {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    logError('BLOB_READ_WRITE_TOKEN environment variable is not set')
    logInfo('Get your token from Vercel Dashboard > Storage > Blob > Tokens')
    process.exit(1)
  }
  logSuccess('BLOB_READ_WRITE_TOKEN is configured')
}

function checkInputDir(dir: string): void {
  if (!existsSync(dir)) {
    logError(`Input directory does not exist: ${dir}`)
    process.exit(1)
  }
  logSuccess(`Input directory: ${dir}`)
}

function loadManifest(inputDir: string): BlobManifest {
  const manifestPath = join(inputDir, 'blobs-manifest.json')

  if (!existsSync(manifestPath)) {
    logError(`Manifest file not found: ${manifestPath}`)
    logInfo(
      'Run backup-blobs.ts first to create a backup with manifest, or check the input directory.',
    )
    process.exit(1)
  }

  try {
    const content = readFileSync(manifestPath, 'utf-8')
    const manifest = JSON.parse(content) as BlobManifest
    logSuccess(
      `Loaded manifest: ${manifest.totalBlobs} blobs from ${manifest.createdAt}`,
    )
    return manifest
  } catch (error) {
    logError(
      `Failed to parse manifest: ${error instanceof Error ? error.message : String(error)}`,
    )
    process.exit(1)
  }
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

async function listExistingBlobs(): Promise<Set<string>> {
  logInfo('Fetching existing blobs from Vercel...')

  const existingPaths = new Set<string>()
  let cursor: string | undefined

  do {
    const result = await list({ cursor, limit: 1000 })
    for (const blob of result.blobs) {
      existingPaths.add(blob.pathname)
    }
    cursor = result.cursor
  } while (cursor)

  logSuccess(`Found ${existingPaths.size} existing blobs in storage`)
  return existingPaths
}

async function restoreBlobs(
  manifest: BlobManifest,
  options: CliOptions,
): Promise<{ uploaded: number; skipped: number; failed: number }> {
  const stats = { uploaded: 0, skipped: 0, failed: 0 }

  // Get existing blobs if skip-existing is enabled
  let existingBlobs: Set<string> | null = null
  if (options.skipExisting && !options.dryRun) {
    existingBlobs = await listExistingBlobs()
  }

  console.log('')
  logInfo('Starting blob restore...')
  console.log('')

  for (let i = 0; i < manifest.blobs.length; i++) {
    const entry = manifest.blobs[i]
    const localFilePath = join(options.inputDir, entry.localPath)
    const progress = `[${i + 1}/${manifest.blobs.length}]`

    // Check if file exists locally
    if (!existsSync(localFilePath)) {
      logError(`${progress} Local file not found: ${entry.localPath}`)
      stats.failed++
      continue
    }

    // Check if skip-existing applies
    if (options.skipExisting && existingBlobs?.has(entry.pathname)) {
      logWarning(`${progress} Skipping (exists): ${entry.pathname}`)
      stats.skipped++
      continue
    }

    if (options.dryRun) {
      logInfo(
        `${progress} Would upload: ${entry.pathname} (${formatBytes(entry.size)})`,
      )
      stats.uploaded++
      continue
    }

    try {
      const fileContent = readFileSync(localFilePath)
      const fileStats = statSync(localFilePath)

      await put(entry.pathname, fileContent, {
        access: 'public',
        addRandomSuffix: false,
      })

      logSuccess(
        `${progress} Uploaded: ${entry.pathname} (${formatBytes(fileStats.size)})`,
      )
      stats.uploaded++
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      logError(`${progress} Failed to upload ${entry.pathname}: ${message}`)
      stats.failed++
    }
  }

  return stats
}

async function main(): Promise<void> {
  console.log('')
  console.log(
    `${colors.red}=========================================${colors.reset}`,
  )
  console.log(`${colors.red}     BLOB STORAGE RESTORE SCRIPT${colors.reset}`)
  console.log(
    `${colors.red}=========================================${colors.reset}`,
  )
  console.log('')

  const options = parseArgs()

  if (options.dryRun) {
    logWarning('Running in DRY RUN mode - no uploads will be made')
    console.log('')
  } else {
    logCritical('WARNING: This will upload files to Vercel Blob storage!')
    console.log('')
  }

  // Pre-flight checks
  logInfo('Running pre-flight checks...')
  checkEnv()
  checkInputDir(options.inputDir)
  checkConfirmation(options)
  console.log('')

  // Load manifest
  const manifest = loadManifest(options.inputDir)

  if (manifest.blobs.length === 0) {
    logWarning('No blobs in manifest - nothing to restore')
    console.log('')
    logSuccess('Blob restore complete (nothing to upload)')
    return
  }

  logInfo(`Total size to restore: ${formatBytes(manifest.totalSize)}`)
  console.log('')

  // Restore blobs
  const stats = await restoreBlobs(manifest, options)
  console.log('')

  // Summary
  logInfo('Restore Summary:')
  logInfo(`  Uploaded: ${stats.uploaded}`)
  if (stats.skipped > 0) {
    logInfo(`  Skipped: ${stats.skipped}`)
  }
  if (stats.failed > 0) {
    logWarning(`  Failed: ${stats.failed}`)
  }
  console.log('')

  if (stats.failed > 0) {
    logWarning('Blob restore completed with errors')
    process.exit(1)
  } else {
    logSuccess('Blob restore complete!')
  }

  console.log('')
  console.log(`RESTORE_STATUS=${stats.failed > 0 ? 'partial' : 'success'}`)
  console.log(`UPLOADED=${stats.uploaded}`)
  console.log(`SKIPPED=${stats.skipped}`)
  console.log(`FAILED=${stats.failed}`)
}

main().catch((error) => {
  logError(
    `Unexpected error: ${error instanceof Error ? error.message : String(error)}`,
  )
  process.exit(1)
})
