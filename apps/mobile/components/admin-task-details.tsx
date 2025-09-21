import { type FC, useEffect, useState } from 'react'
import { View } from 'react-native'
import type { Task } from '@/api/task/use-task'
import { useUpdateTaskAssignees } from '@/api/task/use-update-task-assignees'
import { ContentSection } from './ui/content-section'
import { InlineEditableBottomSheet } from './ui/inline-editable'
import { Separator } from './ui/separator'
import { Text } from './ui/text'
import { UserFullName } from './user-public-info'
import { UserSelectBottomSheetModal } from './user-select-bottom-sheet-modal'

export type AdminTaskDetailsProps = {
  task: Task
}

export const AdminTaskDetails: FC<AdminTaskDetailsProps> = ({ task }) => {
  return (
    <View className="flex-1 gap-3">
      <ContentSection label="Tiêu đề công việc">
        <Text variant="h4">{task.title || 'Chưa có tiêu đề'}</Text>
      </ContentSection>
      <ContentSection label="Mô tả công việc">
        <Text>{task.description || 'Chưa có mô tả'}</Text>
      </ContentSection>
      <ContentSection label="Địa chỉ làm việc">
        <Text>{task.address || 'Chưa có địa chỉ'}</Text>
      </ContentSection>
      <ContentSection label="Thông tin khách hàng">
        <Text>{task.customer?.name || 'Không có tên'}</Text>
        <Text>{task.customer?.phone || 'Không có số điện thoại'}</Text>
      </ContentSection>
      <Separator className="my-2" />
      <ContentSection label="Trạng thái công việc">
        <Text className="capitalize">{task.status}</Text>
      </ContentSection>
      <TaskAssignees assigneeIds={task.assigneeIds} taskId={task.id} />
    </View>
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
