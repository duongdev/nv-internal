import { type FC, useEffect, useState } from 'react'
import { View } from 'react-native'
import type { Task } from '@/api/task/use-task'
import { ContentSection } from './ui/content-section'
import { InlineEditableBottomSheet } from './ui/inline-editable'
import { Separator } from './ui/separator'
import { Text } from './ui/text'
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
      <TaskAssignees assigneeIds={task.assigneeIds} />
    </View>
  )
}

export type TaskAssigneesProps = {
  assigneeIds: string[]
}

export const TaskAssignees: FC<TaskAssigneesProps> = ({
  assigneeIds: initialAssigneeIds,
}) => {
  const [assigneeIds, setAssigneeIds] = useState<string[]>(initialAssigneeIds)

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
      onClose={() => console.log(assigneeIds)}
      trigger={
        <ContentSection label="Nhân viên thực hiện">
          <Text>{assigneeIds.join(', ') || 'Chưa có nhân viên'}</Text>
        </ContentSection>
      }
    />
  )
}
