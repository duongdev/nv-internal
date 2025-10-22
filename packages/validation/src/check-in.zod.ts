import { z } from 'zod'

/**
 * Shared validation schema for both check-in and check-out events
 *
 * This schema supports two upload methods:
 * 1. Multipart/form-data with File objects (preferred for mobile)
 * 2. Base64-encoded attachments (fallback for compatibility)
 *
 * Requirements:
 * - At least 1 attachment required (enforced via refine)
 * - Maximum 10 attachments allowed
 * - GPS coordinates required (latitude, longitude)
 * - Optional notes (max 500 characters)
 */
export const zTaskEventInput = z
  .object({
    // GPS coordinates (required)
    latitude: z
      .number()
      .min(-90, 'Vĩ độ không hợp lệ')
      .max(90, 'Vĩ độ không hợp lệ'),
    longitude: z
      .number()
      .min(-180, 'Kinh độ không hợp lệ')
      .max(180, 'Kinh độ không hợp lệ'),

    // Multipart/form-data uploads (preferred)
    files: z
      .array(z.instanceof(File))
      .min(1, 'Cần ít nhất một tệp đính kèm')
      .max(10, 'Tối đa 10 tệp đính kèm')
      .optional(),

    // Alternative: Base64 uploads (for compatibility)
    attachments: z
      .array(
        z.object({
          data: z.string().min(1, 'Dữ liệu tệp không được rỗng'),
          filename: z.string().min(1, 'Tên tệp không được rỗng'),
          mimeType: z.string().min(1, 'Loại tệp không được rỗng'),
        }),
      )
      .min(1, 'Cần ít nhất một tệp đính kèm')
      .max(10, 'Tối đa 10 tệp đính kèm')
      .optional(),

    // Optional notes
    notes: z.string().trim().max(500, 'Ghi chú quá dài').optional(),
  })
  .refine((data) => data.files || data.attachments, {
    message: 'Cần ít nhất một tệp đính kèm (files hoặc attachments)',
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
