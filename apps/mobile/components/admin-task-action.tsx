import { TaskStatus } from '@nv-internal/api/generated/prisma/client'
import type { FC } from 'react'
import { Alert } from 'react-native'
import type { Task } from '@/api/task/use-task'
import { useUpdateTaskStatus } from '@/api/task/use-update-task-status'
import { Button } from './ui/button'
import { Text } from './ui/text'

export type AdminTaskActionProps = {
  task: Task
}

export const AdminTaskAction: FC<AdminTaskActionProps> = ({ task }) => {
  const { mutateAsync } = useUpdateTaskStatus()

  const handleUpdateStatus = async (status: Task['status']) => {
    await mutateAsync({ taskId: task.id, status })
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
