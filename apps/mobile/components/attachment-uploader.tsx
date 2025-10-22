import { BottomSheetModal } from '@gorhom/bottom-sheet'
import { useUser } from '@clerk/clerk-expo'
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
  const isAdmin = user?.publicMetadata?.roles?.includes('nv_internal_admin')
  const isAssigned = assigneeIds.includes(user?.id || '')
  const canUpload = isAdmin || isAssigned

  if (!canUpload) {
    return null
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onPress={() => sheetRef.current?.present()}
        className="mt-2"
      >
        <Icon as={PlusIcon} />
        <Text>Thêm tệp đính kèm</Text>
      </Button>

      <AttachmentUploadSheet ref={sheetRef} taskId={taskId} />
    </>
  )
}
