import { zValidator as honoZValidator } from '@hono/zod-validator'
import type { Context, ValidationTargets } from 'hono'
import type { z } from 'zod'
import { createValidationErrorHandler } from './validation-error-handler'

/**
 * Enhanced zValidator with automatic validation error logging
 *
 * This is a wrapper around @hono/zod-validator that automatically logs
 * detailed validation errors when validation fails, making debugging easier.
 *
 * Features:
 * - Logs validation errors with field names, messages, and received values
 * - Sanitizes sensitive fields (password, token, etc.) in logs
 * - Maintains backward compatibility with existing error responses
 * - Allows custom error handlers to override default behavior
 *
 * @example
 * ```typescript
 * // Basic usage - logs errors automatically
 * app.post('/users', zValidator('json', userSchema), async (c) => {
 *   const user = c.req.valid('json')
 *   // ...
 * })
 *
 * // Custom error handler - overrides default logging
 * app.post('/users', zValidator('json', userSchema, (result, c) => {
 *   if (!result.success) {
 *     return c.json({ custom: 'error' }, 400)
 *   }
 * }), async (c) => {
 *   const user = c.req.valid('json')
 *   // ...
 * })
 * ```
 *
 * @param target - Validation target (param, json, form, query)
 * @param schema - Zod schema to validate against
 * @param hook - Optional custom error handler (overrides default logging)
 */
export function zValidator<
  // biome-ignore lint/suspicious/noExplicitAny: Match Zod's ZodType signature
  T extends z.ZodType<any, any, any>,
  Target extends keyof ValidationTargets,
>(
  target: Target,
  schema: T,
  hook?: (
    result: { success: boolean; error?: z.ZodError },
    c: Context,
  ) => Response | void,
) {
  // If custom hook provided, use it without our error handler
  if (hook) {
    // @ts-expect-error - Hook signature is compatible but TS can't verify it
    return honoZValidator(target, schema, hook)
  }

  // Otherwise, use our error handler with logging
  // Only use error handler for supported validation types
  if (
    target === 'param' ||
    target === 'json' ||
    target === 'form' ||
    target === 'query'
  ) {
    // @ts-expect-error - Type is validated at runtime
    return honoZValidator(target, schema, createValidationErrorHandler(target))
  }

  // For other validation types (like 'header'), use default behavior
  return honoZValidator(target, schema)
}
