import { TaskStatus } from '@nv-internal/prisma-client'
import { useRouter } from 'expo-router'
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
      nextStatus?: Task['status']
      route?: string
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
      label: 'Bắt đầu làm việc',
      route: 'check-in',
    },
    [TaskStatus.IN_PROGRESS]: {
      label: 'Hoàn thành công việc',
      route: 'check-out',
    },
  },
}

export type TaskActionProps = {
  task: Task
}

export const TaskAction: FC<TaskActionProps> = ({ task }) => {
  const { mutateAsync } = useUpdateTaskStatus()
  const appRole = useAppRole()
  const router = useRouter()

  const handleUpdateStatus = async (status: Task['status']) => {
    await mutateAsync({ taskId: task.id, status })
  }

  // If task is completed, show disabled button
  if (task.status === TaskStatus.COMPLETED) {
    return (
      <Button className="w-full" disabled size="default">
        <Text className="font-sans-medium">Hoàn thành</Text>
      </Button>
    )
  }

  // If admin viewing READY status, show disabled button
  if (appRole === 'admin' && task.status === TaskStatus.READY) {
    return (
      <Button className="w-full" disabled size="default">
        <Text className="font-sans-medium">Đã sẵn sàng làm việc</Text>
      </Button>
    )
  }

  // If admin viewing IN_PROGRESS status, show disabled button
  if (appRole === 'admin' && task.status === TaskStatus.IN_PROGRESS) {
    return (
      <Button className="w-full" disabled size="default">
        <Text className="font-sans-medium">Đang tiến hành</Text>
      </Button>
    )
  }

  const action = TASK_STATUS_TO_NEXT_ACTION[appRole][task.status]
  if (action) {
    return (
      <Button
        className="w-full"
        onPress={() => {
          // If action has a route, navigate to it (check-in/check-out)
          if (action.route) {
            router.push(
              `/worker/tasks/${task.id}/${action.route}` as '/worker/tasks/[taskId]/check-in',
            )
            return
          }

          // Otherwise, handle status update with optional alert
          if (action.alert && action.nextStatus) {
            Alert.alert(
              action.alert.title,
              action.alert.message,
              [
                { text: action.alert.cancelText || 'Hủy', style: 'cancel' },
                {
                  text: action.alert.confirmText || 'Xác nhận',
                  style: 'default',
                  onPress: () => {
                    if (action.nextStatus) {
                      handleUpdateStatus(action.nextStatus)
                    }
                  },
                },
              ],
              { cancelable: true },
            )
          } else if (action.nextStatus) {
            handleUpdateStatus(action.nextStatus)
          }
        }}
        size="default"
      >
        <Text className="font-sans-medium">{action.label}</Text>
      </Button>
    )
  }

  // For PREPARING status in admin view
  if (task.status === TaskStatus.PREPARING) {
    return (
      <Button
        className="w-full"
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
        size="default"
      >
        <Text className="font-sans-medium">Sẵn sàng làm việc</Text>
      </Button>
    )
  }

  return null
}
