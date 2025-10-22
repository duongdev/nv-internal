import { Image as ExpoImage } from 'expo-image'
import { FileIcon, PlayIcon } from 'lucide-react-native'
import { useState } from 'react'
import { Pressable, ScrollView, View } from 'react-native'
import { useAttachments } from '@/api/attachment/use-attachments'
import type { Task } from '@/api/task/use-task'
import { cn } from '@/lib/utils'
import { AttachmentViewer } from './attachment-viewer'
import { Icon } from './ui/icon'
import { Skeleton } from './ui/skeleton'
import { Text } from './ui/text'

type Attachment = NonNullable<Task['attachments']>[number]

// Simplified type for components that only need the ID
type AttachmentWithId = Pick<Attachment, 'id'> | { id: string }

function VideoPlaceholder() {
  return (
    <View className="h-full w-full items-center justify-center rounded-lg bg-black">
      <View className="rounded-full bg-white/20 p-3">
        <Icon as={PlayIcon} className="text-white" size={32} />
      </View>
    </View>
  )
}

interface ImageWithBlurhashProps {
  imageUrl: string
  blurhash?: string
}

function ImageWithBlurhash({ imageUrl, blurhash }: ImageWithBlurhashProps) {
  return (
    <ExpoImage
      contentFit="cover"
      placeholder={blurhash ? { blurhash } : undefined}
      source={{ uri: imageUrl }}
      style={{ width: '100%', height: '100%', borderRadius: 8 }}
      transition={200}
    />
  )
}

export function AttachmentList({
  attachments,
  compact = false,
}: {
  attachments: AttachmentWithId[]
  compact?: boolean
}) {
  const attachmentIds = attachments.map((a) => a.id)
  const { data: resolvedAttachments, isLoading } = useAttachments(attachmentIds)
  const [viewerVisible, setViewerVisible] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)

  const handleAttachmentPress = (index: number) => {
    setSelectedIndex(index)
    setViewerVisible(true)
  }

  // Size classes: normal is 96px (h-24 w-24), compact is ~77px (h-[77px] w-[77px]) = 20% smaller
  const iconSize = compact ? 24 : 32
  const skeletonSizeClass = compact ? 'h-[77px] w-[77px]' : 'h-24 w-24'

  if (attachments.length === 0) {
    return (
      <Text className="text-muted-foreground text-sm">
        Chưa có tệp đính kèm
      </Text>
    )
  }

  if (isLoading) {
    return (
      <View className="gap-2">
        {!compact && (
          <Text className="font-sans-medium text-muted-foreground text-sm">
            {attachments.length} tệp đính kèm
          </Text>
        )}
        <ScrollView
          className="flex-row gap-2"
          contentContainerClassName="gap-2"
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          {attachments.map((attachment) => (
            <Skeleton
              className={cn('rounded-lg', skeletonSizeClass)}
              key={attachment.id}
            />
          ))}
        </ScrollView>
      </View>
    )
  }

  return (
    <>
      <View className="gap-2">
        {!compact && (
          <Text className="font-sans-medium text-muted-foreground text-sm">
            {attachments.length} tệp đính kèm
          </Text>
        )}
        <ScrollView
          className="flex-row gap-2"
          contentContainerClassName="gap-2"
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          {resolvedAttachments?.map((attachment, index) => {
            const isImage = attachment.mimeType.startsWith('image/')
            const isVideo = attachment.mimeType.startsWith('video/')

            return (
              <Pressable
                className={cn(
                  'rounded-lg bg-muted',
                  compact ? 'h-[77px] w-[77px]' : 'h-24 w-24',
                )}
                key={attachment.id}
                onPress={() => handleAttachmentPress(index)}
              >
                {isVideo ? (
                  <VideoPlaceholder />
                ) : isImage ? (
                  <ImageWithBlurhash
                    blurhash={attachment.blurhash}
                    imageUrl={attachment.url}
                  />
                ) : (
                  <View className="h-full w-full items-center justify-center rounded-lg">
                    <Icon
                      as={FileIcon}
                      className="text-muted-foreground"
                      size={iconSize}
                    />
                  </View>
                )}
              </Pressable>
            )
          })}
        </ScrollView>
      </View>

      {/* Full-screen viewer modal */}
      {resolvedAttachments && (
        <AttachmentViewer
          attachments={
            resolvedAttachments as unknown as import('@/api/attachment/use-attachments').Attachment[]
          }
          initialIndex={selectedIndex}
          onClose={() => setViewerVisible(false)}
          visible={viewerVisible}
        />
      )}
    </>
  )
}
