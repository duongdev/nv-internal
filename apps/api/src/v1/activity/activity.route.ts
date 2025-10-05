import { zValidator } from '@hono/zod-validator'
import { zActivityListQuery } from '@nv-internal/validation/src/activity.zod'
import { Hono } from 'hono'
import { getAuthUserStrict } from '../middlewares/auth'
import { getActivityList } from './activity.service'

const router = new Hono()
  // Get activity infinite list
  .get('/', zValidator('query', zActivityListQuery), async (c) => {
    getAuthUserStrict(c)
    const { cursor, take = '10', topic } = c.req.valid('query')

    const { activities, hasNextPage, nextCursor } = await getActivityList({
      cursor,
      take: Number(take),
      topic,
    })

    return c.json({
      activities,
      hasNextPage,
      nextCursor,
    })
  })

export default router
