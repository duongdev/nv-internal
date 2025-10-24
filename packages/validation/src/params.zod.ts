import { z } from 'zod'

/**
 * Reusable param validators for consistent route parameter handling
 *
 * These validators ensure params are properly typed and validated before reaching service layer.
 * Route params are always strings, so we need to transform them to appropriate types.
 */

/**
 * Validates a numeric ID parameter (e.g., task ID)
 *
 * Example usage:
 * ```ts
 * .get('/:id', zValidator('param', zNumericIdParam), async (c) => {
 *   const { id } = c.req.valid('param')  // id is number, not string!
 *   // ...
 * })
 * ```
 */
export const zNumericIdParam = z.object({
  id: z
    .string()
    .regex(/^\d+$/, 'ID phải là số')
    .transform((val) => parseInt(val, 10)),
})

/**
 * Validates a CUID parameter (e.g., payment ID, attachment ID)
 *
 * CUIDs follow the format: c[a-z0-9]{24} (25 characters total)
 * Example: clh3x2y4z000008l7abc1def2
 *
 * Example usage:
 * ```ts
 * .get('/:id', zValidator('param', zCuidParam), async (c) => {
 *   const { id } = c.req.valid('param')  // id is validated CUID string
 *   // ...
 * })
 * ```
 */
export const zCuidParam = z.object({
  id: z
    .string()
    .regex(/^c[a-z0-9]{24}$/, 'ID không hợp lệ')
    .length(25, 'ID không hợp lệ'),
})

// Type exports
export type NumericIdParam = z.infer<typeof zNumericIdParam>
export type CuidParam = z.infer<typeof zCuidParam>
