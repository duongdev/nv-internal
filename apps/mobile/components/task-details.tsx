import { MapPinnedIcon, PhoneCallIcon } from 'lucide-react-native'
import { type FC, useEffect, useState } from 'react'
import { Linking, View } from 'react-native'
import type { Task } from '@/api/task/use-task'
import { useUpdateTaskAssignees } from '@/api/task/use-update-task-assignees'
import { Button } from './ui/button'
import { ContentSection } from './ui/content-section'
import { Icon } from './ui/icon'
import { InlineEditableBottomSheet } from './ui/inline-editable'
import { Separator } from './ui/separator'
import { TaskStatusBadge } from './ui/task-status-badge'
import { Text } from './ui/text'
import { UserFullName } from './user-public-info'
import { UserSelectBottomSheetModal } from './user-select-bottom-sheet-modal'

export type TaskDetailsProps = {
  task: Task
}

export const TaskDetails: FC<TaskDetailsProps> = ({ task }) => {
  return (
    <>
      {/* <ContentSection label="Tiêu đề công việc">
        <Text className="font-sans-medium" variant="h4">
          {task.title || 'Chưa có tiêu đề'}
        </Text>
      </ContentSection> */}
      <Text className="font-sans-medium" variant="h4">
        {task.title || 'Chưa có tiêu đề'}
      </Text>
      <ContentSection label="Mô tả công việc">
        <Text>{task.description || 'Chưa có mô tả'}</Text>
      </ContentSection>
      <ContentSection label="Địa chỉ làm việc">
        {task.geoLocation ? (
          <View className="flex-row gap-2">
            <View className="flex-1">
              {task.geoLocation.name && <Text>{task.geoLocation.name}</Text>}
              {task.geoLocation.address && (
                <Text className="text-sm">{task.geoLocation.address}</Text>
              )}
            </View>
            <Button
              className="shrink-0 self-start"
              onPress={() => {
                const url = `https://www.google.com/maps/search/?api=1&query=${task.geoLocation?.lat},${task.geoLocation?.lng}`
                Linking.openURL(url)
              }}
              size="icon"
              variant="secondary"
            >
              <Icon as={MapPinnedIcon} className="size-6" />
            </Button>
          </View>
        ) : (
          <Text>Chưa có địa chỉ</Text>
        )}
      </ContentSection>
      <ContentSection label="Thông tin khách hàng">
        <View className="flex-row gap-2">
          <View className="flex-1">
            <Text>{task.customer?.name || 'Không có tên'}</Text>
            <Text>{task.customer?.phone || 'Không có số điện thoại'}</Text>
          </View>
          {task.customer?.phone && (
            <Button
              className="shrink-0 self-start"
              onPress={() => {
                const url = `tel:${task.customer?.phone}`
                Linking.openURL(url)
              }}
              size="icon"
              variant="secondary"
            >
              <Icon as={PhoneCallIcon} className="size-6" />
            </Button>
          )}
        </View>
      </ContentSection>
      <Separator className="my-2" />
      <ContentSection label="Trạng thái công việc">
        <TaskStatusBadge className="mt-1" status={task.status} />
      </ContentSection>
    </>
  )
}

export type TaskAssigneesProps = {
  assigneeIds: string[]
  taskId: number
}

export const TaskAssignees: FC<TaskAssigneesProps> = ({
  assigneeIds: initialAssigneeIds,
  taskId,
}) => {
  const [assigneeIds, setAssigneeIds] = useState<string[]>(initialAssigneeIds)
  const { mutateAsync } = useUpdateTaskAssignees()

  const saveAssignees = async () => {
    await mutateAsync({ taskId, assigneeIds })
  }

  useEffect(() => {
    setAssigneeIds(initialAssigneeIds)
  }, [initialAssigneeIds])

  return (
    <InlineEditableBottomSheet
      bottomSheetContent={
        <UserSelectBottomSheetModal
          onChangeSelectedUserIds={setAssigneeIds}
          selectedUserIds={assigneeIds}
        />
      }
      onClose={saveAssignees}
      trigger={
        <ContentSection label="Nhân viên thực hiện">
          <View>
            {assigneeIds.length === 0 ? (
              <Text>Chưa có nhân viên được giao</Text>
            ) : (
              assigneeIds.map((userId) => (
                <UserFullName key={userId} userId={userId} />
              ))
            )}
          </View>
        </ContentSection>
      }
    />
  )
}
