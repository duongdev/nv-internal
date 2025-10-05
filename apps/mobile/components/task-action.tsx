import { TaskStatus } from '@nv-internal/api/generated/prisma/client'
import type { FC } from 'react'
import { Alert } from 'react-native'
import type { Task } from '@/api/task/use-task'
import { useUpdateTaskStatus } from '@/api/task/use-update-task-status'
import { type AppRole, useAppRole } from '@/hooks/use-app-role'
import { Button } from './ui/button'
import { Text } from './ui/text'

const TASK_STATUS_TO_NEXT_ACTION: Record<
  AppRole,
  {
    [Key in TaskStatus]?: {
      label: string
      nextStatus: Task['status']
      alert?: {
        title: string
        message: string
        confirmText?: string
        cancelText?: string
      }
    }
  }
> = {
  admin: {
    [TaskStatus.PREPARING]: {
      label: 'Sẵn sàng',
      nextStatus: TaskStatus.READY,
      alert: {
        title: 'Cho phép nhân viên bắt đầu?',
        message: 'Nhân viên sẽ nhận được công việc và bắt đầu làm việc.',
        confirmText: 'Xác nhận',
        cancelText: 'Hủy',
      },
    },
  },
  worker: {
    [TaskStatus.READY]: {
      label: 'Bắt đầu',
      nextStatus: TaskStatus.IN_PROGRESS,
      alert: {
        title: 'Xác nhận bắt đầu công việc?',
        message:
          'Công việc sẽ được đánh dấu là đang tiến hành. Vị trí hiện tại của bạn sẽ được chia sẻ với quản trị viên.',
        confirmText: 'Xác nhận',
        cancelText: 'Hủy',
      },
    },
    [TaskStatus.IN_PROGRESS]: {
      label: 'Hoàn thành',
      nextStatus: TaskStatus.COMPLETED,
      alert: {
        title: 'Xác nhận hoàn thành công việc?',
        message:
          'Công việc sẽ được đánh dấu là hoàn thành và không thể thay đổi trạng thái nữa. Vị trí hiện tại của bạn sẽ được chia sẻ với quản trị viên.',
        confirmText: 'Xác nhận',
        cancelText: 'Hủy',
      },
    },
  },
}

export type TaskActionProps = {
  task: Task
}

export const TaskAction: FC<TaskActionProps> = ({ task }) => {
  const { mutateAsync } = useUpdateTaskStatus()
  const appRole = useAppRole()

  const handleUpdateStatus = async (status: Task['status']) => {
    await mutateAsync({ taskId: task.id, status })
  }

  const action = TASK_STATUS_TO_NEXT_ACTION[appRole][task.status]
  if (action) {
    return (
      <Button
        onPress={() => {
          if (action.alert) {
            Alert.alert(
              action.alert.title,
              action.alert.message,
              [
                { text: action.alert.cancelText || 'Hủy', style: 'cancel' },
                {
                  text: action.alert.confirmText || 'Xác nhận',
                  style: 'default',
                  onPress: () => handleUpdateStatus(action.nextStatus),
                },
              ],
              { cancelable: true },
            )
          } else {
            handleUpdateStatus(action.nextStatus)
          }
        }}
        size="sm"
      >
        <Text className="font-sans-medium">{action.label}</Text>
      </Button>
    )
  }

  if (task.status === 'PREPARING') {
    return (
      <Button
        className="h-14 w-full"
        onPress={() => {
          Alert.alert(
            'Cho phép bắt đầu?',
            'Nhân viên sẽ nhận được công việc và bắt đầu làm việc.',
            [
              { text: 'Hủy', style: 'cancel' },
              {
                text: 'Xác nhận',
                style: 'default',
                onPress: () => handleUpdateStatus(TaskStatus.READY),
              },
            ],
          )
        }}
        size="lg"
      >
        <Text className="font-sans-medium text-base">Sẵn sàng làm việc</Text>
      </Button>
    )
  }

  return null
}
