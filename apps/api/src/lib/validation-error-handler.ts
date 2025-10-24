import type { Context } from 'hono'
import type { z } from 'zod'
import { getLogger } from './log'

/**
 * List of sensitive field names that should not be logged in validation errors
 * to prevent leaking credentials or sensitive data in logs
 */
const SENSITIVE_FIELDS = [
  'password',
  'token',
  'secret',
  'apiKey',
  'api_key',
  'accessToken',
  'access_token',
  'refreshToken',
  'refresh_token',
  'privateKey',
  'private_key',
]

/**
 * Check if a field name contains sensitive information
 */
function isSensitiveField(fieldName: string): boolean {
  const lowerField = fieldName.toLowerCase()
  return SENSITIVE_FIELDS.some((sensitive) =>
    lowerField.includes(sensitive.toLowerCase()),
  )
}

/**
 * Sanitize a value by redacting it if it's from a sensitive field
 */
function sanitizeValue(fieldName: string, value: unknown): unknown {
  if (isSensitiveField(fieldName)) {
    return '[REDACTED]'
  }
  return value
}

/**
 * Extract validation error details from Zod error issues
 */
function extractValidationErrors(
  issues: z.ZodIssue[],
  receivedData: unknown,
): Array<{
  field: string
  message: string
  received?: unknown
  expected?: string
}> {
  return issues.map((issue) => {
    const fieldPath = issue.path.join('.')
    const field = fieldPath || 'root'

    // Extract received value from the data
    let received: unknown
    if (receivedData && typeof receivedData === 'object') {
      try {
        // Navigate the path to get the actual value
        received = issue.path.reduce(
          // biome-ignore lint/suspicious/noExplicitAny: Need to navigate dynamic object paths
          (obj: any, key) => obj?.[key],
          receivedData,
        )
        // Sanitize if sensitive
        received = sanitizeValue(field, received)
      } catch {
        received = undefined
      }
    }

    // Extract expected type/constraint from the issue
    let expected: string | undefined
    // biome-ignore lint/suspicious/noExplicitAny: Zod issue types vary by code
    const anyIssue = issue as any
    switch (issue.code) {
      case 'invalid_type':
        expected = anyIssue.expected
        break
      case 'too_small':
        expected = `min ${anyIssue.minimum}`
        break
      case 'too_big':
        expected = `max ${anyIssue.maximum}`
        break
      default:
        // Handle other issue types that might have options or validation
        if (anyIssue.options && Array.isArray(anyIssue.options)) {
          expected = `one of: ${anyIssue.options.join(', ')}`
        } else if (anyIssue.validation) {
          expected = anyIssue.validation
        }
        break
    }

    return {
      field,
      message: issue.message,
      ...(received !== undefined && { received }),
      ...(expected && { expected }),
    }
  })
}

/**
 * Handle validation errors from zValidator middleware
 *
 * This function is called when validation fails and logs detailed
 * information about what went wrong while sanitizing sensitive data.
 *
 * @param result - Zod validation result containing error details
 * @param c - Hono context
 * @param validationType - Type of validation (param, json, form, query)
 * @returns 400 error response with validation error details
 */
export function handleValidationError(
  result: { success: false; error: z.ZodError },
  c: Context,
  validationType: 'param' | 'json' | 'form' | 'query',
) {
  const logger = getLogger('validation:error')

  // Extract request details
  const path = c.req.path
  const method = c.req.method

  // Get the raw data that failed validation
  let receivedData: unknown
  try {
    if (validationType === 'param') {
      receivedData = c.req.param()
    } else if (validationType === 'query') {
      receivedData = c.req.query()
    } else if (validationType === 'json') {
      // For JSON, we need to read from the already-parsed body
      // But we can't re-read it, so we extract from error context
      receivedData = undefined
    } else if (validationType === 'form') {
      receivedData = undefined
    }
  } catch {
    receivedData = undefined
  }

  // Extract and format validation errors
  const errors = extractValidationErrors(result.error.issues, receivedData)

  // Log the validation failure with details
  logger.warn(
    {
      validationType,
      path,
      method,
      errorCount: errors.length,
      errors,
    },
    'Validation failed',
  )

  // Return 400 response with error details
  return c.json(
    {
      error: 'Validation failed',
      validationType,
      details: result.error.issues.map((issue) => ({
        field: issue.path.join('.') || 'root',
        message: issue.message,
      })),
    },
    400,
  )
}

/**
 * Create a validation error handler for a specific validation type
 *
 * This is a factory function that creates a validation error handler
 * that can be passed as the third argument to zValidator.
 *
 * @example
 * ```typescript
 * import { zValidator } from '@hono/zod-validator'
 * import { createValidationErrorHandler } from '@/lib/validation-error-handler'
 *
 * app.post(
 *   '/users',
 *   zValidator('json', userSchema, createValidationErrorHandler('json')),
 *   async (c) => {
 *     const user = c.req.valid('json')
 *     // ...
 *   }
 * )
 * ```
 */
export function createValidationErrorHandler(
  validationType: 'param' | 'json' | 'form' | 'query',
) {
  return (
    result: { success: boolean; error?: z.ZodError },
    c: Context,
  ): Response | void => {
    if (!result.success && result.error) {
      return handleValidationError(
        { success: false, error: result.error },
        c,
        validationType,
      )
    }
  }
}
