import type { Prisma } from '../../../generated/prisma'
import { getPrisma } from '../../lib/prisma'

export async function getActivityList({
  cursor,
  take,
  topic,
}: {
  cursor?: string
  take?: number
  topic?: string
}) {
  const prisma = getPrisma()

  const where: Prisma.ActivityWhereInput = {
    ...(topic ? { topic } : {}),
  }

  const activities = await prisma.activity.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  })

  const hasNextPage = activities.length === take
  const nextCursor = hasNextPage
    ? activities[activities.length - 1].id.toString()
    : undefined

  return {
    activities,
    nextCursor,
    hasNextPage,
  }
}
