import { z } from 'zod'

/**
 * Validation for checkout with optional payment collection
 *
 * This extends the existing checkout validation with payment fields.
 * Payment collection is completely optional - workers can checkout without collecting payment.
 *
 * Key features:
 * - FormData coercion for number fields (latitude, longitude, paymentAmount)
 * - Flexible file handling (single File or File[])
 * - Payment fields only required if paymentCollected is true
 * - VND currency validation (no decimals, max 10 billion)
 */
export const zCheckoutWithPayment = z
  .object({
    // GPS coordinates (required for checkout)
    // Note: FormData sends everything as strings, so we need to coerce to numbers
    latitude: z.coerce
      .number()
      .min(-90, 'Vĩ độ không hợp lệ')
      .max(90, 'Vĩ độ không hợp lệ'),
    longitude: z.coerce
      .number()
      .min(-180, 'Kinh độ không hợp lệ')
      .max(180, 'Kinh độ không hợp lệ'),

    // Checkout notes (optional)
    notes: z.string().trim().max(1000, 'Ghi chú quá dài').optional(),

    // Checkout photos (optional)
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

    // Payment collection fields (optional - only if task has expectedRevenue)
    paymentCollected: z.boolean().default(false),
    paymentAmount: z.coerce
      .number()
      .positive('Số tiền phải lớn hơn 0')
      .int('Đồng Việt Nam không có xu')
      .max(10_000_000_000, 'Số tiền quá lớn (tối đa 10 tỷ VND)')
      .optional(),
    paymentNotes: z.string().trim().max(500, 'Ghi chú quá dài').optional(),

    // Invoice file (optional - handled via FormData)
    // Single file only - if multiple provided, only first is used
    invoiceFile: z
      .union([z.instanceof(File), z.array(z.instanceof(File))])
      .transform((val) => (Array.isArray(val) ? val[0] : val))
      .pipe(
        z
          .instanceof(File)
          .refine(
            (file) =>
              ['image/jpeg', 'image/png', 'image/heic'].includes(
                file.type.toLowerCase(),
              ),
            'Chỉ chấp nhận ảnh định dạng JPEG, PNG, hoặc HEIC',
          ),
      )
      .optional(),
  })
  .refine(
    (data) => !data.paymentCollected || data.paymentAmount !== undefined,
    {
      message: 'Vui lòng nhập số tiền đã thu',
      path: ['paymentAmount'],
    },
  )

/**
 * Admin payment edit validation with required audit reason
 *
 * Requirements:
 * - Admin role required (checked in service layer)
 * - editReason is REQUIRED for audit trail (min 10 chars)
 * - At least one field must be edited (amount or notes)
 * - Amount validation same as checkout (positive integer, max 10 billion VND)
 */
export const zUpdatePayment = z
  .object({
    amount: z.coerce
      .number()
      .positive('Số tiền phải lớn hơn 0')
      .int('Đồng Việt Nam không có xu')
      .max(10_000_000_000, 'Số tiền quá lớn (tối đa 10 tỷ VND)')
      .optional(),
    notes: z
      .string()
      .trim()
      .max(500, 'Ghi chú quá dài (tối đa 500 ký tự)')
      .optional(),
    editReason: z
      .string()
      .trim()
      .min(10, 'Lý do chỉnh sửa phải có ít nhất 10 ký tự')
      .max(500, 'Lý do chỉnh sửa quá dài (tối đa 500 ký tự)'),

    // Invoice file replacement (optional)
    invoiceFile: z
      .union([z.instanceof(File), z.array(z.instanceof(File))])
      .transform((val) => (Array.isArray(val) ? val[0] : val))
      .pipe(
        z
          .instanceof(File)
          .refine(
            (file) =>
              ['image/jpeg', 'image/png', 'image/heic'].includes(
                file.type.toLowerCase(),
              ),
            'Chỉ chấp nhận ảnh định dạng JPEG, PNG, hoặc HEIC',
          ),
      )
      .optional(),
  })
  .refine((data) => data.amount !== undefined || data.notes !== undefined, {
    message: 'Vui lòng chỉnh sửa ít nhất một trường',
    path: ['_form'],
  })

/**
 * Task expected revenue validation (admin only)
 *
 * Used for setting expected payment amount on a task.
 * Null value means no payment expected.
 */
export const zTaskExpectedRevenue = z.object({
  expectedRevenue: z.coerce
    .number()
    .positive('Số tiền phải lớn hơn 0')
    .int('Đồng Việt Nam không có xu')
    .max(10_000_000_000, 'Số tiền quá lớn (tối đa 10 tỷ VND)')
    .nullable(),
  expectedCurrency: z.string().default('VND').optional(),
})

// Type exports for TypeScript
export type CheckoutWithPaymentValues = z.infer<typeof zCheckoutWithPayment>
export type UpdatePaymentValues = z.infer<typeof zUpdatePayment>
export type TaskExpectedRevenueValues = z.infer<typeof zTaskExpectedRevenue>
