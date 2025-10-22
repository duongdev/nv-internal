import { FileIcon } from 'lucide-react-native'
import { Image, View } from 'react-native'
import { useAttachments } from '@/api/attachment/use-attachments'
import type { Task } from '@/api/task/use-task'
import { Icon } from './ui/icon'
import { Text } from './ui/text'

type Attachment = NonNullable<Task['attachments']>[number]

export function AttachmentList({ attachments }: { attachments: Attachment[] }) {
  const attachmentIds = attachments.map((a) => a.id)
  const { data: resolvedAttachments, isLoading } = useAttachments(attachmentIds)

  if (attachments.length === 0) {
    return (
      <Text className="text-muted-foreground text-sm">
        Chưa có tệp đính kèm
      </Text>
    )
  }

  if (isLoading) {
    return (
      <Text className="text-muted-foreground text-sm">
        Đang tải tệp đính kèm...
      </Text>
    )
  }

  return (
    <View className="gap-2">
      <Text className="font-sans-medium text-muted-foreground text-sm">
        {attachments.length} tệp đính kèm
      </Text>
      {resolvedAttachments?.map((attachment) => {
        const isImage = attachment.mimeType.startsWith('image/')

        return (
          <View className="gap-3 rounded-lg bg-muted p-3" key={attachment.id}>
            {isImage && (
              <Image
                className="h-48 w-full rounded-lg"
                resizeMode="cover"
                source={{
                  uri: `${process.env.EXPO_PUBLIC_API_URL}${attachment.url}`,
                }}
              />
            )}
            <View className="flex-row items-center gap-3">
              <Icon as={FileIcon} className="text-muted-foreground" />
              <View className="flex-1">
                <Text className="font-sans-medium">
                  {attachment.originalFilename}
                </Text>
                <Text className="text-muted-foreground text-xs">
                  {new Date(attachment.createdAt).toLocaleDateString('vi-VN')}
                  {' • '}
                  {(attachment.size / 1024 / 1024).toFixed(2)} MB
                </Text>
              </View>
            </View>
          </View>
        )
      })}
    </View>
  )
}
