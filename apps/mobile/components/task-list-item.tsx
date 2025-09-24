import { MapPinIcon, TextIcon, User2Icon } from 'lucide-react-native'
import { type FC, Fragment } from 'react'
import { View } from 'react-native'
import type { FetchTaskListResponse } from '@/api/task/use-task-infinite-list'
import { formatTaskId } from '@/utils/task-id-helper'
import { Icon } from './ui/icon'
import { TaskStatusBadge } from './ui/task-status-badge'
import { Text } from './ui/text'
import { UserFullName } from './user-public-info'

export type TaskListItemProps = {
  task: NonNullable<FetchTaskListResponse>['tasks'][number]
  className?: string
}

export const TaskListItem: FC<TaskListItemProps> = ({ task, className }) => {
  return (
    <View className={`relative ${className}`}>
      <TaskStatusBadge
        className="absolute top-0 right-0 font-gilroy-medium font-medium text-muted-foreground text-sm"
        status={task.status}
      />
      <Text className="font-sans-bold text-muted-foreground text-xs">
        {formatTaskId(task.id)}
      </Text>
      <Text className="text-lg">{task.title}</Text>
      {task.description && (
        <View className="flex-row flex-wrap items-start gap-2">
          <View className="pt-1">
            <Icon as={TextIcon} className="text-muted-foreground" />
          </View>
          <Text className="line-clamp-2 flex-1 text-muted-foreground">
            {task.description}
          </Text>
        </View>
      )}
      {task.assigneeIds.length > 0 && (
        <View className="flex-row items-start gap-2">
          <View className="pt-1">
            <Icon as={User2Icon} className="text-muted-foreground" />
          </View>
          <View className="flex-1 flex-row flex-wrap items-center gap-1">
            {task.assigneeIds.map((userId, index) => (
              <Fragment key={userId}>
                <UserFullName
                  className="text-muted-foreground"
                  userId={userId}
                />
                {index < task.assigneeIds.length - 1 && (
                  <Text className="text-muted-foreground">/</Text>
                )}
              </Fragment>
            ))}
          </View>
        </View>
      )}
      {task.geoLocation && (
        <View className="flex-row items-start gap-2">
          <View className="pt-1.5">
            <Icon as={MapPinIcon} className="text-muted-foreground" />
          </View>
          <Text className="flex-1 text-muted-foreground">
            {task.geoLocation.address}
          </Text>
        </View>
      )}
    </View>
  )
}
