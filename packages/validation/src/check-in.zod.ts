import { z } from 'zod'

/**
 * Shared validation schema for both check-in and check-out events
 *
 * This schema supports two upload methods:
 * 1. Multipart/form-data with File objects (preferred for mobile)
 * 2. Base64-encoded attachments (fallback for compatibility)
 *
 * Requirements:
 * - Attachments are optional (0-10 files allowed)
 * - GPS coordinates required (latitude, longitude)
 * - Optional notes (max 500 characters)
 */
export const zTaskEventInput = z.object({
  // GPS coordinates (required)
  // Note: FormData sends everything as strings, so we need to coerce to numbers
  latitude: z.coerce
    .number()
    .min(-90, 'Vĩ độ không hợp lệ')
    .max(90, 'Vĩ độ không hợp lệ'),
  longitude: z.coerce
    .number()
    .min(-180, 'Kinh độ không hợp lệ')
    .max(180, 'Kinh độ không hợp lệ'),

  // Multipart/form-data uploads (optional)
  // Note: When uploading a single file, it's received as File (not array)
  // When uploading multiple files, it's received as File[]
  files: z
    .union([z.instanceof(File), z.array(z.instanceof(File))])
    .transform((val) => (Array.isArray(val) ? val : [val]))
    .pipe(z.array(z.instanceof(File)).max(10, 'Tối đa 10 tệp đính kèm'))
    .optional(),

  // Alternative: Base64 uploads (for compatibility, optional)
  attachments: z
    .array(
      z.object({
        data: z.string().min(1, 'Dữ liệu tệp không được rỗng'),
        filename: z.string().min(1, 'Tên tệp không được rỗng'),
        mimeType: z.string().min(1, 'Loại tệp không được rỗng'),
      }),
    )
    .max(10, 'Tối đa 10 tệp đính kèm')
    .optional(),

  // Optional notes
  notes: z.string().trim().max(500, 'Ghi chú quá dài').optional(),
})

/**
 * Semantic aliases for clarity
 * Both check-in and check-out use the same validation schema
 */
export const zCheckInInput = zTaskEventInput
export const zCheckOutInput = zTaskEventInput

export type TaskEventInput = z.infer<typeof zTaskEventInput>
export type CheckInInput = z.infer<typeof zCheckInInput>
export type CheckOutInput = z.infer<typeof zCheckOutInput>
