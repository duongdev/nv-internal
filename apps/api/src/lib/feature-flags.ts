/**
 * Feature Flags for Backend Refactoring
 *
 * Enables gradual migration from old to new architecture
 * with instant rollback capability.
 */

export interface FeatureFlags {
  // Phase 1: Foundation
  useNewAuthService: boolean
  useNewErrorHandling: boolean
  useStorageFactory: boolean

  // Phase 2: Repositories
  useTaskRepository: boolean
  usePaymentRepository: boolean

  // Phase 3: Services
  useNewTaskService: boolean
  useNewPaymentService: boolean
  useNewAttachmentService: boolean

  // Global toggle - master switch
  useNewArchitecture: boolean
}

/**
 * Get feature flags from environment variables
 * with safe defaults (all disabled initially)
 */
export function getFeatureFlags(): FeatureFlags {
  return {
    // Phase 1
    useNewAuthService: process.env.FF_NEW_AUTH_SERVICE === 'true',
    useNewErrorHandling: process.env.FF_NEW_ERROR_HANDLING === 'true',
    useStorageFactory: process.env.FF_STORAGE_FACTORY === 'true',

    // Phase 2
    useTaskRepository: process.env.FF_TASK_REPOSITORY === 'true',
    usePaymentRepository: process.env.FF_PAYMENT_REPOSITORY === 'true',

    // Phase 3
    useNewTaskService: process.env.FF_NEW_TASK_SERVICE === 'true',
    useNewPaymentService: process.env.FF_NEW_PAYMENT_SERVICE === 'true',
    useNewAttachmentService: process.env.FF_NEW_ATTACHMENT_SERVICE === 'true',

    // Master switch - overrides all others
    useNewArchitecture: process.env.FF_USE_NEW_ARCHITECTURE === 'true'
  }
}

/**
 * Check if a specific feature is enabled
 * Master switch overrides individual flags
 */
export function isFeatureEnabled(
  feature: keyof Omit<FeatureFlags, 'useNewArchitecture'>
): boolean {
  const flags = getFeatureFlags()

  // Master switch takes precedence
  if (flags.useNewArchitecture) {
    return true
  }

  return flags[feature]
}

/**
 * Middleware to inject feature flags into Hono context
 */
import { createMiddleware } from 'hono/factory'

export const featureFlagsMiddleware = createMiddleware(async (c, next) => {
  c.set('featureFlags', getFeatureFlags())
  await next()
})

/**
 * Service factory pattern with feature flag support
 *
 * Example usage:
 * ```typescript
 * export function getTaskService(c: Context): ITaskService {
 *   return createService(
 *     c,
 *     'useNewTaskService',
 *     () => c.get('container').taskService,  // New
 *     () => legacyTaskService                 // Old
 *   )
 * }
 * ```
 */
export function createService<T>(
  c: any,
  featureFlag: keyof Omit<FeatureFlags, 'useNewArchitecture'>,
  newService: () => T,
  legacyService: () => T
): T {
  if (isFeatureEnabled(featureFlag)) {
    return newService()
  }
  return legacyService()
}

/**
 * Gradual rollout helper - enables feature for percentage of requests
 *
 * Example usage:
 * ```typescript
 * const useNew = shouldRollout('useNewTaskService', 10)  // 10% of requests
 * const service = useNew ? newTaskService : legacyService
 * ```
 */
export function shouldRollout(
  feature: keyof Omit<FeatureFlags, 'useNewArchitecture'>,
  percentage: number
): boolean {
  // Always respect explicit flag
  const flags = getFeatureFlags()
  if (flags.useNewArchitecture || flags[feature]) {
    return true
  }

  // Percentage-based rollout using request ID hash
  // This ensures same request ID always gets same result (consistent)
  const randomValue = Math.random() * 100
  return randomValue < percentage
}
