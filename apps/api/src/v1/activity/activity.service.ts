import type { Prisma } from '@nv-internal/prisma-client'
import { getLogger } from '../../lib/log'
import { getPrisma } from '../../lib/prisma'

type TopicParams =
  | {
      entityType: 'GENERAL'
    }
  | {
      entityType: 'TASK'
      entityId: number
    }
export function getActivityTopic(params: TopicParams): string {
  if (params.entityType === 'TASK') {
    return `TASK_${params.entityId}`
  }
  return 'GENERAL'
}

export async function getActivityList({
  cursor,
  take,
  topic,
}: {
  cursor?: string
  take?: number
  topic?: TopicParams | string
}) {
  const prisma = getPrisma()
  const topicValue =
    (typeof topic === 'string' && topic) ||
    (typeof topic === 'object' && getActivityTopic(topic)) ||
    undefined

  const where: Prisma.ActivityWhereInput = {
    ...(topic ? { topic: topicValue } : {}),
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

export async function createActivity(
  {
    topic,
    payload,
    action,
    userId,
  }: {
    action: string
    userId: string | null
    topic: TopicParams
    payload: Prisma.InputJsonValue
  },
  tx?: Prisma.TransactionClient,
) {
  const logger = getLogger('activity.service:createActivity')
  const prisma = tx ?? getPrisma()

  logger.trace({ topic, payload, action, userId }, 'Creating activity log')
  const activity = await prisma.activity.create({
    data: {
      topic: getActivityTopic(topic),
      payload,
      action,
      userId,
    },
  })
  logger.trace({ activity }, 'Activity log created')

  return activity
}
