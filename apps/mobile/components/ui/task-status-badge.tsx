import { TaskStatus as Status } from '@nv-internal/api/generated/prisma/client'
import { type FC, useMemo } from 'react'
import { View } from 'react-native'
import { cn } from '@/lib/utils'
import { Text } from './text'

export type TaskStatusBadgeProps = {
  status: Status
  className?: string
}

export type TaskStatus = Status

export const TaskStatusBadge: FC<TaskStatusBadgeProps> = ({
  status,
  className,
}) => {
  const statusConfig = useMemo(() => {
    return {
      [Status.PREPARING]: {
        text: 'Đang chuẩn bị',
        iconColor: 'text-yellow-500',
        borderColor: 'border-yellow-500',
      },
      [Status.READY]: {
        text: 'Sẵn sàng',
        iconColor: 'text-green-500',
        borderColor: 'border-green-500',
      },
      [Status.IN_PROGRESS]: {
        text: 'Đang tiến hành',
        iconColor: 'text-blue-500',
        borderColor: 'border-blue-500',
      },
      [Status.COMPLETED]: {
        text: 'Đã hoàn thành',
        iconColor: 'text-green-500',
        borderColor: 'border-green-500',
      },
      [Status.ON_HOLD]: {
        text: 'Tạm dừng',
        iconColor: 'text-gray-500',
        borderColor: 'border-gray-500',
      },
    }[status]
  }, [status])

  return (
    <View
      className={cn(
        'flex flex-row items-center gap-1 self-start rounded-full border border-primary px-2 py-1',
        // statusConfig.borderColor,
        className,
      )}
    >
      <Text
        className={`-my-2 -ml-1 font-sans-medium text-2xl ${statusConfig.iconColor}`}
      >
        •
      </Text>
      <Text className={`-my-[1px] font-sans-medium text-xs`}>
        {statusConfig.text}
      </Text>
    </View>
  )
}
