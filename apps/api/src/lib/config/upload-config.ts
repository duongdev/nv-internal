export interface UploadConfig {
  maxFiles: number
  maxPerFileBytes: number
  maxTotalBytes: number
  allowedMimeTypes: string[]
}

function parseNumberEnv(name: string, fallback: number): number {
  const v = process.env[name]
  if (!v) {
    return fallback
  }
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

function parseCsv(name: string, fallback: string[]): string[] {
  const v = process.env[name]
  if (!v) {
    return fallback
  }
  return v
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

export const defaultUploadConfig: UploadConfig = {
  maxFiles: parseNumberEnv('UPLOAD_MAX_FILES', 10),
  maxPerFileBytes: parseNumberEnv('UPLOAD_MAX_PER_FILE_MB', 50) * 1024 * 1024,
  maxTotalBytes: parseNumberEnv('UPLOAD_MAX_TOTAL_MB', 50) * 1024 * 1024,
  allowedMimeTypes: parseCsv('UPLOAD_ALLOWED_MIME_CSV', [
    'application/pdf',
    // images
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif',
    // videos
    'video/mp4',
    'video/quicktime',
    'video/webm',
  ]),
}
