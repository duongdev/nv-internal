import { z } from 'zod'

/**
 * Task Comment Input Schema
 *
 * Validates input for adding a comment to a task.
 *
 * Requirements:
 * - Comment text is required (1-5000 characters)
 * - Text is automatically trimmed
 * - Photo attachments are optional (0-5 files allowed)
 * - Supports both FormData (multipart) and JSON body
 *
 * Phase 1: Text-only comments
 * Phase 2: Comments with optional photo attachments (1-5 photos)
 *
 * Example usage:
 * ```typescript
 * // Phase 1: Text only
 * const input = { comment: "Fixed the AC unit" }
 * const validated = zTaskCommentInput.parse(input)
 *
 * // Phase 2: With photos
 * const formData = new FormData()
 * formData.append('comment', 'Fixed the AC unit')
 * formData.append('files', file1)
 * formData.append('files', file2)
 * ```
 */
export const zTaskCommentInput = z.object({
  comment: z
    .string()
    .trim()
    .min(1, 'Bình luận không được để trống')
    .max(5000, 'Bình luận quá dài (tối đa 5000 ký tự)'),

  // Optional photo attachments (Phase 2)
  // Note: When uploading a single file, it's received as File (not array)
  // When uploading multiple files, it's received as File[]
  files: z
    .union([z.instanceof(File), z.array(z.instanceof(File))])
    .transform((val) => (Array.isArray(val) ? val : [val]))
    .pipe(z.array(z.instanceof(File)).max(5, 'Tối đa 5 ảnh'))
    .optional(),
})

/**
 * Type inference for task comment input
 */
export type TaskCommentInput = z.infer<typeof zTaskCommentInput>
