import { CameraIcon, FileIcon, ImageIcon } from 'lucide-react-native'
import { ScrollView, View } from 'react-native'
import type { TaskEventAttachment } from '@/hooks/use-task-event'
import { Button } from '../ui/button'
import { Icon } from '../ui/icon'
import { Text } from '../ui/text'
import { AttachmentThumbnail } from './attachment-thumbnail'

export interface AttachmentManagerProps {
  attachments: TaskEventAttachment[]
  onAddFromCamera: () => void
  onAddFromLibrary: () => void
  onAddFromFiles: () => void
  onRemove: (index: number) => void
  minRequired?: number
  maxAllowed?: number
  eventType: 'check-in' | 'check-out'
}

/**
 * Manages multiple attachments for task events (check-in/check-out)
 * Supports camera, library, and file picker uploads
 */
export function AttachmentManager({
  attachments,
  onAddFromCamera,
  onAddFromLibrary,
  onAddFromFiles,
  onRemove,
  minRequired = 1,
  maxAllowed = 10,
  eventType,
}: AttachmentManagerProps) {
  const canAddMore = attachments.length < maxAllowed
  const needsMore = attachments.length < minRequired

  return (
    <View className="gap-4">
      {/* Header */}
      <View className="flex-row items-center justify-between">
        <Text className="text-muted-foreground">
          {attachments.length}/{maxAllowed}
          {minRequired > 0 && ` (tối thiểu ${minRequired})`}
        </Text>
      </View>

      {/* Attachment Grid */}
      {attachments.length > 0 && (
        <ScrollView
          className="-mx-4"
          contentContainerClassName="px-4 py-2"
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          <View className="flex-row gap-2">
            {attachments.map((attachment, index) => (
              <AttachmentThumbnail
                attachment={attachment}
                key={`${attachment.uri}-${index}`}
                onRemove={() => onRemove(index)}
                showRemoveButton
              />
            ))}
          </View>
        </ScrollView>
      )}

      {/* Add Buttons */}
      {canAddMore && (
        <View className="flex-row flex-wrap gap-2">
          <Button
            accessibilityHint="Mở camera để chụp ảnh mới"
            accessibilityLabel="Chụp ảnh từ camera"
            className="min-w-[100px] flex-1"
            onPress={onAddFromCamera}
            size="sm"
            testID={`${eventType}-camera-button`}
            variant="outline"
          >
            <Icon as={CameraIcon} className="text-foreground" size={16} />
            <Text>Chụp ảnh</Text>
          </Button>

          <Button
            accessibilityHint="Mở thư viện để chọn ảnh hoặc video"
            accessibilityLabel="Chọn từ thư viện ảnh"
            className="min-w-[100px] flex-1"
            onPress={onAddFromLibrary}
            size="sm"
            testID={`${eventType}-library-button`}
            variant="outline"
          >
            <Icon as={ImageIcon} className="text-foreground" size={16} />
            <Text>Thư viện</Text>
          </Button>

          <Button
            accessibilityHint="Mở trình chọn tệp để chọn tài liệu"
            accessibilityLabel="Chọn tệp tin"
            className="min-w-[100px] flex-1"
            onPress={onAddFromFiles}
            size="sm"
            testID={`${eventType}-files-button`}
            variant="outline"
          >
            <Icon as={FileIcon} className="text-foreground" size={16} />
            <Text>Tệp tin</Text>
          </Button>
        </View>
      )}

      {/* Validation Message */}
      {needsMore && (
        <Text className="text-destructive text-sm">
          Cần ít nhất {minRequired} tệp đính kèm
        </Text>
      )}
    </View>
  )
}
