import type { BottomSheetModalMethods } from '@gorhom/bottom-sheet/lib/typescript/types'
import { MapPinnedIcon, PhoneCallIcon, UsersIcon } from 'lucide-react-native'
import { type FC, useEffect, useRef, useState } from 'react'
import { Linking, View } from 'react-native'
import type { Task } from '@/api/task/use-task'
import { useUpdateTaskAssignees } from '@/api/task/use-update-task-assignees'
import { useAppRole } from '@/hooks/use-app-role'
import { formatTaskId } from '@/utils/task-id-helper'
import { AttachmentList } from './attachment-list'
import { AttachmentUploader } from './attachment-uploader'
import { TaskAction } from './task-action'
import { Badge } from './ui/badge'
import { BottomSheet } from './ui/bottom-sheet'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Icon } from './ui/icon'
import { TaskStatusBadge } from './ui/task-status-badge'
import { Text } from './ui/text'
import { UserFullName } from './user-public-info'
import { UserSelectBottomSheetModal } from './user-select-bottom-sheet-modal'

export type TaskDetailsProps = {
  task: Task
}

export const TaskDetails: FC<TaskDetailsProps> = ({ task }) => {
  const appRole = useAppRole()
  const [assigneeIds, setAssigneeIds] = useState<string[]>(task.assigneeIds)
  const originalAssigneeIds = useRef<string[]>(task.assigneeIds)
  const assigneeModalRef = useRef<BottomSheetModalMethods>(null)
  const { mutateAsync } = useUpdateTaskAssignees()

  const saveAssignees = async () => {
    await mutateAsync({ taskId: task.id, assigneeIds })
    originalAssigneeIds.current = assigneeIds
    assigneeModalRef.current?.dismiss()
  }

  const handleModalDismiss = async () => {
    // Check if there are changes
    const hasChanges =
      assigneeIds.length !== originalAssigneeIds.current.length ||
      assigneeIds.some((id) => !originalAssigneeIds.current.includes(id))

    if (hasChanges) {
      await mutateAsync({ taskId: task.id, assigneeIds })
      originalAssigneeIds.current = assigneeIds
    }
  }

  useEffect(() => {
    setAssigneeIds(task.assigneeIds)
    originalAssigneeIds.current = task.assigneeIds
  }, [task.assigneeIds])

  return (
    <>
      {/* Flat Header - No Card */}
      <View className="gap-2">
        <Badge className="self-start" variant="outline">
          <Text>#{formatTaskId(task.id)}</Text>
        </Badge>
        <Text className="font-sans-bold text-2xl">
          {task.title || 'Chưa có tiêu đề'}
        </Text>
        <TaskStatusBadge status={task.status} />
      </View>

      {/* CTA Buttons Row */}
      <View className="flex-row gap-2">
        {/* Status Transition Button */}
        <View className="flex-1">
          <TaskAction task={task} />
        </View>

        {/* Open Map Button */}
        <Button
          disabled={!task.geoLocation}
          onPress={() => {
            if (task.geoLocation) {
              const url = `https://www.google.com/maps/search/?api=1&query=${task.geoLocation.lat},${task.geoLocation.lng}`
              Linking.openURL(url)
            }
          }}
          size="icon"
          variant="outline"
        >
          <Icon as={MapPinnedIcon} />
        </Button>

        {/* Call Customer Button */}
        <Button
          disabled={!task.customer?.phone}
          onPress={() => {
            if (task.customer?.phone) {
              Linking.openURL(`tel:${task.customer.phone}`)
            }
          }}
          size="icon"
          variant="outline"
        >
          <Icon as={PhoneCallIcon} />
        </Button>

        {/* Assign Button (Admin Only) */}
        {appRole === 'admin' && (
          <Button
            onPress={() => assigneeModalRef.current?.present()}
            size="icon"
            variant="outline"
          >
            <Icon as={UsersIcon} />
          </Button>
        )}
      </View>

      {/* Work Location & Customer Info Card */}
      <Card className="bg-muted dark:border-white/20">
        <CardHeader>
          <CardTitle>Địa chỉ làm việc</CardTitle>
        </CardHeader>
        <CardContent className="gap-3">
          {task.geoLocation ? (
            <>
              {task.geoLocation.name && (
                <Text className="font-sans-medium">
                  {task.geoLocation.name}
                </Text>
              )}
              {task.geoLocation.address && (
                <Text className="text-primary">{task.geoLocation.address}</Text>
              )}
            </>
          ) : (
            <Text className="text-muted-foreground">Chưa có địa chỉ</Text>
          )}

          <View className="gap-1">
            <Text className="font-sans-medium text-muted-foreground leading-none">
              Thông tin khách hàng
            </Text>
            <Text className="font-sans-medium">
              {task.customer?.name || 'Không có tên'}
            </Text>
            <Text className="text-primary">
              {task.customer?.phone || 'Không có số điện thoại'}
            </Text>
          </View>
        </CardContent>
      </Card>

      {/* Task Description Card */}
      <Card className="bg-muted dark:border-white/20">
        <CardHeader>
          <CardTitle>Mô tả công việc</CardTitle>
        </CardHeader>
        <CardContent>
          <Text>{task.description || 'Chưa có mô tả'}</Text>
        </CardContent>
      </Card>

      {/* Assignee Card */}
      <Card className="bg-muted dark:border-white/20">
        <CardHeader>
          <CardTitle>Nhân viên thực hiện</CardTitle>
        </CardHeader>
        <CardContent className="gap-3">
          <View>
            {task.assigneeIds.length === 0 ? (
              <Text className="text-muted-foreground">
                Chưa có nhân viên được giao
              </Text>
            ) : (
              task.assigneeIds.map((userId) => (
                <UserFullName key={userId} userId={userId} />
              ))
            )}
          </View>
          {appRole === 'admin' && (
            <Button
              className="dark:border-white/20"
              onPress={() => assigneeModalRef.current?.present()}
              variant="outline"
            >
              <Icon as={UsersIcon} />
              <Text>Phân công</Text>
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Assignee Selection Bottom Sheet (Admin Only) */}
      {appRole === 'admin' && (
        <BottomSheet
          onDismiss={handleModalDismiss}
          ref={assigneeModalRef}
          snapPoints={['50%', '90%']}
        >
          <UserSelectBottomSheetModal
            onCancel={() => assigneeModalRef.current?.dismiss()}
            onChangeSelectedUserIds={setAssigneeIds}
            onSave={saveAssignees}
            selectedUserIds={assigneeIds}
          />
        </BottomSheet>
      )}

      {/* Attachments Card */}
      <Card className="bg-muted dark:border-white/20">
        <CardHeader>
          <CardTitle>Tệp đính kèm</CardTitle>
        </CardHeader>
        <CardContent className="gap-3">
          <AttachmentList attachments={task.attachments || []} />
          <AttachmentUploader assigneeIds={task.assigneeIds} taskId={task.id} />
        </CardContent>
      </Card>
    </>
  )
}
