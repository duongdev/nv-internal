import { getAuth } from '@hono/clerk-auth'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { getLogger } from '../../lib/log'
import { deleteAccount } from './account.service'

const router = new Hono()
  /**
   * DELETE /v1/account/me
   *
   * Delete the authenticated user's account
   *
   * Apple App Store Guideline 5.1.1(v) Compliance:
   * - Required for App Store submission
   * - Allows users to delete their account from within the app
   *
   * Behavior:
   * - Deletes user from Clerk authentication service
   * - Preserves all historical data in database
   * - Logs deletion attempt to Activity table
   * - Idempotent: Returns success even if user already deleted
   *
   * Authorization:
   * - User can only delete their own account
   * - Clerk JWT authentication required
   *
   * Response:
   * - 200: Account deleted successfully
   * - 404: Account already deleted (idempotent success)
   * - 500: Clerk API failure or other errors
   */
  .delete('/me', async (c) => {
    const logger = getLogger('account.route:deleteMe')
    const auth = getAuth(c)

    // Get authenticated user ID
    const userId = auth?.userId

    if (!userId) {
      throw new HTTPException(401, {
        message: 'Unauthorized',
        cause: 'MISSING_USER_ID',
      })
    }

    logger.info({ userId }, 'User requested account deletion')

    try {
      // Get Clerk client from context
      const clerkClient = c.get('clerk')

      if (!clerkClient) {
        throw new HTTPException(500, {
          message: 'Clerk client not available',
          cause: 'MISSING_CLERK_CLIENT',
        })
      }

      // Attempt to delete account
      const result = await deleteAccount(clerkClient, userId)

      if (result.success) {
        const message = result.alreadyDeleted
          ? 'Account already deleted'
          : 'Account deleted successfully'

        logger.info(
          { userId, alreadyDeleted: result.alreadyDeleted },
          'Account deletion completed',
        )

        return c.json(
          {
            success: true,
            message,
          },
          result.alreadyDeleted ? 200 : 200,
        )
      }

      // Deletion failed
      logger.error({ userId, error: result.error }, 'Account deletion failed')

      throw new HTTPException(500, {
        message: result.error || 'Failed to delete account',
        cause: 'DELETION_FAILED',
      })
    } catch (error) {
      if (error instanceof HTTPException) {
        throw error
      }

      logger.error(
        { userId, error },
        'Unexpected error during account deletion',
      )

      throw new HTTPException(500, {
        message: 'An unexpected error occurred. Please try again later.',
        cause: error,
      })
    }
  })

export default router
