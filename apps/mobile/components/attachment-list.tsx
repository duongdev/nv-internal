import { FileIcon } from 'lucide-react-native'
import { View } from 'react-native'
import type { Task } from '@/api/task/use-task'
import { Icon } from './ui/icon'
import { Text } from './ui/text'

type Attachment = NonNullable<Task['attachments']>[number]

export function AttachmentList({ attachments }: { attachments: Attachment[] }) {
  if (attachments.length === 0) {
    return (
      <Text className="text-muted-foreground text-sm">
        Chưa có tệp đính kèm
      </Text>
    )
  }

  return (
    <View className="gap-2">
      <Text className="font-sans-medium text-muted-foreground text-sm">
        {attachments.length} tệp đính kèm
      </Text>
      {attachments.map((attachment) => (
        <View
          className="flex-row items-center gap-3 rounded-lg bg-muted p-3"
          key={attachment.id}
        >
          <Icon as={FileIcon} className="text-muted-foreground" />
          <View className="flex-1">
            <Text className="font-sans-medium">
              {attachment.originalFilename}
            </Text>
            <Text className="text-muted-foreground text-xs">
              {new Date(attachment.createdAt).toLocaleDateString('vi-VN')}
            </Text>
          </View>
        </View>
      ))}
    </View>
  )
}
