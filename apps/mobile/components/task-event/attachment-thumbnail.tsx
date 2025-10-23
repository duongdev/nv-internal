import { Image as ExpoImage } from 'expo-image'
import { FileIcon, PlayIcon, XIcon } from 'lucide-react-native'
import { Pressable, View } from 'react-native'
import type { TaskEventAttachment } from '@/hooks/use-task-event'
import { cn } from '@/lib/utils'
import { Icon } from '../ui/icon'
import { Text } from '../ui/text'

export interface AttachmentThumbnailProps {
  attachment: TaskEventAttachment
  onRemove?: () => void
  showRemoveButton?: boolean
  size?: 'default' | 'compact'
}

/**
 * Thumbnail display for local task event attachments (before upload)
 */
export function AttachmentThumbnail({
  attachment,
  onRemove,
  showRemoveButton = false,
  size = 'default',
}: AttachmentThumbnailProps) {
  const sizeClass = size === 'compact' ? 'h-[77px] w-[77px]' : 'h-24 w-24'
  const iconSize = size === 'compact' ? 24 : 32

  return (
    <View className={cn('relative overflow-visible rounded-lg', sizeClass)}>
      {/* Thumbnail */}
      {attachment.type === 'image' && (
        <ExpoImage
          contentFit="cover"
          source={{ uri: attachment.uri }}
          style={{ width: '100%', height: '100%', borderRadius: 8 }}
          transition={200}
        />
      )}

      {attachment.type === 'video' && (
        <View className="h-full w-full items-center justify-center rounded-lg bg-black">
          <ExpoImage
            contentFit="cover"
            source={{ uri: attachment.uri }}
            style={{
              width: '100%',
              height: '100%',
              borderRadius: 8,
              opacity: 0.6,
            }}
          />
          <View className="absolute rounded-full bg-white/20 p-3">
            <Icon as={PlayIcon} className="text-white" size={iconSize} />
          </View>
        </View>
      )}

      {attachment.type === 'document' && (
        <View className="h-full w-full items-center justify-center rounded-lg bg-muted">
          <Icon
            as={FileIcon}
            className="text-muted-foreground"
            size={iconSize}
          />
          <Text
            className="mt-1 text-muted-foreground text-xs"
            numberOfLines={1}
          >
            {attachment.filename.split('.').pop()?.toUpperCase()}
          </Text>
        </View>
      )}

      {/* Remove Button */}
      {showRemoveButton && onRemove && (
        <Pressable
          className="-top-2 -right-2 absolute rounded-full bg-card p-1.5"
          onPress={onRemove}
        >
          <Icon as={XIcon} className="text-foreground" size={12} />
        </Pressable>
      )}
    </View>
  )
}
