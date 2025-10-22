import { useUser } from '@clerk/clerk-expo'
import type { BottomSheetModal } from '@gorhom/bottom-sheet'
import { PlusIcon } from 'lucide-react-native'
import { useRef } from 'react'
import { AttachmentUploadSheet } from './attachment-upload-sheet'
import { Button } from './ui/button'
import { Icon } from './ui/icon'
import { Text } from './ui/text'

export function AttachmentUploader({
  taskId,
  assigneeIds,
}: {
  taskId: number
  assigneeIds: string[]
}) {
  const sheetRef = useRef<BottomSheetModal>(null)
  const { user } = useUser()

  // Permission check
  const roles = user?.publicMetadata?.roles
  const isAdmin =
    Array.isArray(roles) && roles.includes('nv_internal_admin')
  const isAssigned = assigneeIds.includes(user?.id || '')
  const canUpload = isAdmin || isAssigned

  if (!canUpload) {
    return null
  }

  return (
    <>
      <Button
        className="mt-2"
        onPress={() => sheetRef.current?.present()}
        size="sm"
        variant="outline"
      >
        <Icon as={PlusIcon} />
        <Text>Thêm tệp đính kèm</Text>
      </Button>

      <AttachmentUploadSheet ref={sheetRef} taskId={taskId} />
    </>
  )
}
