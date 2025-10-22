import { ImpactFeedbackStyle, impactAsync } from 'expo-haptics'
import { Image } from 'expo-image'
import { Trash2Icon, XIcon } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StatusBar,
  View,
} from 'react-native'
import Gallery from 'react-native-awesome-gallery'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import type { Attachment } from '@/api/attachment/use-attachments'
import { useDeleteAttachment } from '@/api/attachment/use-delete-attachment'
import { AttachmentViewerPdf } from './attachment-viewer-pdf'
import { AttachmentViewerVideo } from './attachment-viewer-video'
import { Icon } from './ui/icon'
import { Text } from './ui/text'
import { UserFullName } from './user-public-info'

interface AttachmentViewerProps {
  visible: boolean
  attachments: Attachment[]
  initialIndex: number
  onClose: () => void
}

export function AttachmentViewer({
  visible,
  attachments,
  initialIndex,
  onClose,
}: AttachmentViewerProps) {
  const insets = useSafeAreaInsets()
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const deleteAttachmentMutation = useDeleteAttachment()

  const currentAttachment = attachments[currentIndex]

  useEffect(() => {
    if (visible) {
      setCurrentIndex(initialIndex)
    }
  }, [visible, initialIndex])

  const handleDelete = () => {
    if (!currentAttachment) {
      return
    }

    impactAsync(ImpactFeedbackStyle.Light)

    Alert.alert(
      'Xóa tệp đính kèm',
      `Bạn có chắc chắn muốn xóa "${currentAttachment.originalFilename}"?`,
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            impactAsync(ImpactFeedbackStyle.Medium)
            try {
              // Delete the attachment
              await deleteAttachmentMutation.mutateAsync(currentAttachment.id)

              // If this was the last attachment, close the viewer
              // Otherwise, the refetch will update the attachments array
              if (attachments.length === 1) {
                onClose()
              }
            } catch (_error) {
              Alert.alert(
                'Lỗi',
                'Không thể xóa tệp đính kèm. Vui lòng thử lại.',
              )
            }
          },
        },
      ],
    )
  }

  if (!currentAttachment) {
    return null
  }

  // Format upload timestamp
  const formatUploadDate = (date: Date) => {
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date))
  }

  const renderItem = ({ item, index }: { item: string; index: number }) => {
    const attachment = attachments[index]
    const isImage = attachment?.mimeType.startsWith('image/')
    const isVideo = attachment?.mimeType.startsWith('video/')
    const isPdf = attachment?.mimeType === 'application/pdf'

    if (isImage) {
      return (
        <Image
          contentFit="contain"
          placeholder={
            attachment?.blurhash ? { blurhash: attachment.blurhash } : undefined
          }
          source={{ uri: item }}
          style={{ width: '100%', height: '100%' }}
          transition={200}
        />
      )
    }

    if (isVideo) {
      return (
        <AttachmentViewerVideo
          attachment={attachment}
          isActive={index === currentIndex}
        />
      )
    }

    if (isPdf) {
      // Calculate header height to prevent overlap
      // Header includes: safe area top + paddingTop(12) + py-3(12) + content(~50) + py-3(12)
      const headerHeight = insets.top + 12 + 12 + 50 + 12
      return (
        <AttachmentViewerPdf
          attachment={attachment}
          headerHeight={headerHeight}
        />
      )
    }

    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-white">Không hỗ trợ định dạng tệp này</Text>
      </View>
    )
  }

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <StatusBar hidden />
      <View className="flex-1 bg-black">
        {/* Header */}
        <View
          className="absolute top-0 right-0 left-0 z-10 flex-row items-center justify-between bg-black/50 px-4 py-3"
          style={{ paddingTop: insets.top + 12 }}
        >
          <View className="flex-1">
            <Text className="font-sans-medium text-white" numberOfLines={1}>
              {currentAttachment.originalFilename}
            </Text>
            <View className="flex-row items-center gap-1">
              <Text className="text-white/70 text-xs">
                {currentIndex + 1} / {attachments.length} •{' '}
                {formatUploadDate(currentAttachment.createdAt)} •{' '}
              </Text>
              <UserFullName
                className="text-white/70 text-xs"
                userId={currentAttachment.uploadedBy}
              />
            </View>
          </View>
          <View className="ml-3 flex-row gap-2">
            <Pressable
              className="rounded-full bg-black/50 p-2"
              disabled={deleteAttachmentMutation.isPending}
              onPress={handleDelete}
            >
              {deleteAttachmentMutation.isPending ? (
                <ActivityIndicator color="#ef4444" size={24} />
              ) : (
                <Icon as={Trash2Icon} className="text-red-500" size={24} />
              )}
            </Pressable>
            <Pressable
              className="rounded-full bg-black/50 p-2"
              disabled={deleteAttachmentMutation.isPending}
              onPress={onClose}
            >
              <Icon as={XIcon} className="text-white" size={24} />
            </Pressable>
          </View>
        </View>

        {/* Unified Gallery for all attachment types */}
        <Gallery
          data={attachments.map((a) => a.url)}
          initialIndex={initialIndex}
          keyExtractor={(item) => item}
          onIndexChange={setCurrentIndex}
          renderItem={renderItem}
        />
      </View>
    </Modal>
  )
}
