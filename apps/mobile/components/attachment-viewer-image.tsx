import { Image } from 'expo-image'
import Gallery from 'react-native-awesome-gallery'
import type { Attachment } from '@/api/attachment/use-attachments'

interface AttachmentViewerImageProps {
  attachments: Attachment[]
  initialIndex: number
  onIndexChange?: (index: number) => void
}

export function AttachmentViewerImage({
  attachments,
  initialIndex,
  onIndexChange,
}: AttachmentViewerImageProps) {
  if (attachments.length === 0) {
    return null
  }

  return (
    <Gallery
      data={attachments.map((a) => a.url)}
      initialIndex={initialIndex}
      keyExtractor={(item) => item}
      onIndexChange={onIndexChange}
      renderItem={({ item, index }) => {
        const attachment = attachments[index]
        return (
          <Image
            contentFit="contain"
            placeholder={
              attachment?.blurhash
                ? { blurhash: attachment.blurhash }
                : undefined
            }
            source={{ uri: item }}
            style={{ width: '100%', height: '100%' }}
            transition={200}
          />
        )
      }}
    />
  )
}
