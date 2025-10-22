import { type FC, Fragment, useMemo } from 'react'
import { ActivityIndicator, FlatList, View } from 'react-native'
import { type Activity, useActivities } from '@/api/activity/use-activities'
import { AttachmentList } from './attachment-list'
import { TaskStatusBadge } from './ui/task-status-badge'
import { Text } from './ui/text'
import { UserFullName } from './user-public-info'

export type ActivityFeedProps = {
  topic: string
  removeDuplicate?: boolean
}

export const ActivityFeed: FC<ActivityFeedProps> = ({
  topic,
  removeDuplicate = true,
}) => {
  const { data, isLoading } = useActivities({ topic })

  const activities = useMemo(() => {
    if (!data || !removeDuplicate) {
      return data
    }

    const activityItems: Activity[] = []
    data.forEach((activity) => {
      // Don't add item if the previous item has the same action and timestamp is within 1 minute
      if (
        activityItems.length === 0 ||
        activityItems[activityItems.length - 1].action !== activity.action ||
        new Date(activityItems[activityItems.length - 1].createdAt).getTime() -
          new Date(activity.createdAt).getTime() >
          60000
      ) {
        activityItems.push(activity)
      }
    })
    return activityItems
  }, [data, removeDuplicate])

  if (isLoading && !activities) {
    return <ActivityIndicator />
  }

  return (
    <FlatList
      contentContainerClassName="gap-3"
      data={activities}
      keyExtractor={(item) => item.id}
      ListEmptyComponent={
        <Text className="text-muted-foreground">Chưa có hoạt động</Text>
      }
      renderItem={({ item }) => <ActivityItem activity={item} />}
      scrollEnabled={false}
    />
  )
}

export type ActivityItemProps = {
  activity: Activity
}

export const ActivityItem: FC<ActivityItemProps> = ({ activity }) => {
  const { action, payload: pl } = activity

  const content = useMemo(() => {
    // biome-ignore lint/suspicious/noExplicitAny: <flexible>
    const payload = pl as Record<string, any> | null | undefined

    if (action === 'TASK_CREATED') {
      return <Text>Đã tạo công việc.</Text>
    }
    if (action === 'TASK_STATUS_UPDATED' && payload?.newStatus) {
      return (
        <View className="inline-flex flex-row flex-wrap items-baseline">
          <Text>Đã cập nhật trạng thái công việc sang </Text>
          <TaskStatusBadge status={payload.newStatus} />
        </View>
      )
    }
    if (action === 'TASK_ASSIGNEES_UPDATED' && payload?.newAssigneeIds) {
      return (
        <View className="inline-flex flex-row flex-wrap items-baseline">
          <Text>
            Đã cập nhật nhân viên làm việc:{' '}
            {payload.newAssigneeIds.length ? (
              (payload.newAssigneeIds as string[]).map(
                (userId: string, index: number) => (
                  <Fragment key={userId}>
                    <UserFullName
                      className="font-sans-medium"
                      userId={userId}
                    />
                    {index <
                      (payload.newAssigneeIds as string[]).length - 1 && (
                      <Text className="text-muted-foreground">, </Text>
                    )}
                  </Fragment>
                ),
              )
            ) : (
              <Text className="font-sans-medium">Không có nhân viên</Text>
            )}
          </Text>
        </View>
      )
    }
    if (action === 'TASK_ATTACHMENTS_UPLOADED' && payload?.attachments) {
      const attachments = payload.attachments as Array<{ id?: string }>
      const count = attachments.length

      // Check if attachments have IDs (new format)
      const hasIds = attachments.every((att) => att.id)

      if (hasIds && attachments.length > 0) {
        return (
          <View className="gap-2">
            <Text>Đã tải lên {count} tệp đính kèm</Text>
            <AttachmentList
              attachments={attachments as Array<{ id: string }>}
              compact
            />
          </View>
        )
      }

      // Fallback for old activities without IDs
      return <Text>Đã tải lên {count} tệp đính kèm</Text>
    }

    return <Text className="text-muted-foreground text-sm">{action}</Text>
  }, [action, pl])

  return (
    <View className="rounded-md border border-border bg-secondary px-3 py-2">
      <View className="flex-row items-baseline justify-between">
        {activity.userId ? (
          <UserFullName className="font-sans-medium" userId={activity.userId} />
        ) : (
          <Text className="font-sans-medium">Hệ thống</Text>
        )}
        <Text className="text-gray-500 text-sm">
          {new Date(activity.createdAt).toLocaleString()}
        </Text>
      </View>
      <View>{content}</View>
    </View>
  )
}
