import type { ClerkClient } from '@clerk/backend'
import type { Prisma } from '@nv-internal/prisma-client'
import { getLogger } from '../../lib/log'
import { getPrisma } from '../../lib/prisma'

/**
 * Account deletion service
 *
 * Implements Apple App Store Guideline 5.1.1(v) compliance requirement
 * by allowing users to delete their account from within the app.
 *
 * Strategy:
 * - Deletes user from Clerk authentication service ONLY
 * - Keeps all historical data in database (tasks, check-ins, photos, activities)
 * - Logs all deletion attempts to Activity table for audit trail
 * - Idempotent: Safe to retry if user already deleted (returns success)
 *
 * Security:
 * - User can only delete their own account (enforced by route middleware)
 * - Uses Clerk JWT validation for authentication
 */

/**
 * Delete a user account from Clerk
 *
 * This function deletes the user from the Clerk authentication service while
 * preserving all historical data in the database. All deletion attempts are
 * logged to the Activity table for audit purposes.
 *
 * @param clerkClient - Clerk backend client instance
 * @param userId - Clerk user ID to delete
 * @returns Object with success status and optional error message
 *
 * @example
 * ```typescript
 * const result = await deleteAccount(clerkClient, 'user_123')
 * if (result.success) {
 *   console.log('Account deleted successfully')
 * } else {
 *   console.error('Deletion failed:', result.error)
 * }
 * ```
 */
export async function deleteAccount(
  clerkClient: ClerkClient,
  userId: string,
): Promise<{ success: boolean; error?: string; alreadyDeleted?: boolean }> {
  const logger = getLogger('account.service:deleteAccount')
  const prisma = getPrisma()

  logger.info({ userId }, 'Starting account deletion')

  try {
    // Log deletion initiation
    await logActivity({
      prisma,
      userId,
      action: 'ACCOUNT_DELETION_INITIATED',
      metadata: {
        timestamp: new Date().toISOString(),
      },
    })

    // Attempt to delete user from Clerk
    try {
      await clerkClient.users.deleteUser(userId)

      // Log successful deletion
      await logActivity({
        prisma,
        userId,
        action: 'ACCOUNT_DELETION_COMPLETED',
        metadata: {
          timestamp: new Date().toISOString(),
        },
      })

      logger.info({ userId }, 'Account deleted successfully from Clerk')

      return { success: true }
    } catch (clerkError: unknown) {
      // Check if error is 404 (user already deleted)
      const error = clerkError as { status?: number; message?: string }

      if (error.status === 404) {
        // User already deleted - this is idempotent, return success
        await logActivity({
          prisma,
          userId,
          action: 'ACCOUNT_DELETION_ALREADY_DELETED',
          metadata: {
            timestamp: new Date().toISOString(),
            message: 'User already deleted from Clerk',
          },
        })

        logger.info({ userId }, 'User already deleted from Clerk (idempotent)')

        return { success: true, alreadyDeleted: true }
      }

      // Other Clerk API errors (network, 500, etc.)
      const errorMessage = error.message || 'Unknown Clerk API error'

      await logActivity({
        prisma,
        userId,
        action: 'ACCOUNT_DELETION_FAILED',
        metadata: {
          timestamp: new Date().toISOString(),
          error: errorMessage,
          status: error.status,
        },
      })

      logger.error(
        { userId, error: clerkError },
        'Failed to delete account from Clerk',
      )

      return {
        success: false,
        error: errorMessage,
      }
    }
  } catch (error: unknown) {
    // Unexpected errors (database failures, etc.)
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'

    logger.error({ userId, error }, 'Unexpected error during account deletion')

    // Try to log failure (may fail if database is down)
    try {
      await logActivity({
        prisma,
        userId,
        action: 'ACCOUNT_DELETION_FAILED',
        metadata: {
          timestamp: new Date().toISOString(),
          error: errorMessage,
        },
      })
    } catch (logError) {
      logger.error({ logError }, 'Failed to log deletion failure')
    }

    return {
      success: false,
      error: errorMessage,
    }
  }
}

/**
 * Log activity for account deletion operations
 *
 * Helper function to create activity records with consistent formatting.
 *
 * @param params - Activity parameters
 * @param params.prisma - Prisma client instance
 * @param params.userId - User ID performing the action
 * @param params.action - Activity action type
 * @param params.metadata - Additional metadata to store
 */
async function logActivity({
  prisma,
  userId,
  action,
  metadata,
}: {
  prisma: ReturnType<typeof getPrisma> | Prisma.TransactionClient
  userId: string
  action: string
  metadata: Prisma.InputJsonValue
}): Promise<void> {
  await prisma.activity.create({
    data: {
      topic: 'GENERAL',
      userId,
      action,
      payload: metadata,
    },
  })
}
