import * as ImagePicker from 'expo-image-picker'
import { ArrowUpIcon, CameraIcon, ImageIcon, XIcon } from 'lucide-react-native'
import { type FC, useState } from 'react'
import {
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  View,
} from 'react-native'
import { useAddTaskComment } from '@/api/task/use-add-task-comment'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Icon } from './ui/icon'
import { Text } from './ui/text'
import { Textarea } from './ui/textarea'
import { toast } from './ui/toasts'

export type TaskCommentBoxProps = {
  taskId: number
  onCommentSent?: () => void
}

const MAX_PHOTOS = 5

export const TaskCommentBox: FC<TaskCommentBoxProps> = ({
  taskId,
  onCommentSent,
}) => {
  const [commentText, setCommentText] = useState('')
  const [selectedPhotos, setSelectedPhotos] = useState<
    ImagePicker.ImagePickerAsset[]
  >([])
  const addComment = useAddTaskComment({
    onSuccess: () => {
      setCommentText('')
      setSelectedPhotos([])
      onCommentSent?.()
      // Toast is now handled by the hook
    },
  })

  const handleSendComment = async () => {
    const trimmedComment = commentText.trim()
    if (!trimmedComment) {
      toast.error('Vui lòng nhập bình luận')
      return
    }

    if (trimmedComment.length > 5000) {
      toast.error('Bình luận không được vượt quá 5000 ký tự')
      return
    }

    if (selectedPhotos.length > MAX_PHOTOS) {
      toast.error(`Tối đa ${MAX_PHOTOS} ảnh`)
      return
    }

    addComment.mutate({
      taskId,
      comment: trimmedComment,
      photos: selectedPhotos.length > 0 ? selectedPhotos : undefined,
    })
  }

  const handleCamera = async () => {
    if (selectedPhotos.length >= MAX_PHOTOS) {
      toast.error(`Tối đa ${MAX_PHOTOS} ảnh`)
      return
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync()

    if (status !== 'granted') {
      Alert.alert(
        'Cần quyền truy cập camera',
        'Ứng dụng cần quyền truy cập camera để chụp ảnh. Vui lòng cấp quyền trong Cài đặt.',
        [
          {
            text: 'Hủy',
            style: 'cancel',
          },
          {
            text: 'Mở Cài đặt',
            onPress: () => Linking.openSettings(),
          },
        ],
      )
      return
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: false,
    })

    if (!result.canceled && result.assets.length > 0) {
      const newPhotos = result.assets.slice(
        0,
        MAX_PHOTOS - selectedPhotos.length,
      )

      setSelectedPhotos([...selectedPhotos, ...newPhotos])

      if (result.assets.length > newPhotos.length) {
        toast.error(
          `Chỉ thêm được ${newPhotos.length} ảnh (tối đa ${MAX_PHOTOS})`,
        )
      }
    }
  }

  const handleGallery = async () => {
    if (selectedPhotos.length >= MAX_PHOTOS) {
      toast.error(`Tối đa ${MAX_PHOTOS} ảnh`)
      return
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert(
        'Cần quyền truy cập thư viện',
        'Ứng dụng cần quyền truy cập thư viện ảnh. Vui lòng cấp quyền trong Cài đặt.',
        [
          {
            text: 'Hủy',
            style: 'cancel',
          },
          {
            text: 'Mở Cài đặt',
            onPress: () => Linking.openSettings(),
          },
        ],
      )
      return
    }

    const remainingSlots = MAX_PHOTOS - selectedPhotos.length
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: remainingSlots,
    })

    if (!result.canceled && result.assets.length > 0) {
      const newPhotos = result.assets.slice(0, remainingSlots)

      setSelectedPhotos([...selectedPhotos, ...newPhotos])

      if (result.assets.length > newPhotos.length) {
        toast.error(
          `Chỉ thêm được ${newPhotos.length} ảnh (tối đa ${MAX_PHOTOS})`,
        )
      }
    }
  }

  const removePhoto = (index: number) => {
    setSelectedPhotos(selectedPhotos.filter((_, i) => i !== index))
  }

  return (
    <View className="gap-2">
      <Textarea
        accessibilityLabel="Nội dung bình luận"
        accessibilityRole="text"
        className="!rounded-md !bg-background dark:!border-white/20"
        multiline
        numberOfLines={3}
        onChangeText={setCommentText}
        placeholder="Viết bình luận..."
        testID="comment-input"
        value={commentText}
      />

      {/* Photo Previews */}
      {selectedPhotos.length > 0 && (
        <View className="gap-2">
          <View className="flex-row items-center gap-2">
            <Text className="text-muted-foreground text-sm">Ảnh đính kèm</Text>
            <Badge variant="secondary">
              <Text className="text-xs">
                {selectedPhotos.length}/{MAX_PHOTOS}
              </Text>
            </Badge>
          </View>

          <ScrollView
            className="gap-2"
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            {selectedPhotos.map((photo, index) => (
              <View
                className="relative mr-2"
                key={`${photo.uri}-${index.toString()}`}
              >
                <Image
                  className="h-20 w-20 rounded-lg border border-border bg-muted"
                  resizeMode="cover"
                  source={{ uri: photo.uri }}
                />
                <Pressable
                  accessibilityHint="Xóa ảnh này khỏi bình luận"
                  accessibilityLabel={`Xóa ảnh ${index + 1}`}
                  accessibilityRole="button"
                  className="absolute top-0 right-0 h-6 w-6 items-center justify-center rounded-full border border-border bg-muted"
                  onPress={() => removePhoto(index)}
                  testID={`comment-remove-photo-${index}`}
                >
                  <Icon as={XIcon} className="text-destructive" size={14} />
                </Pressable>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Action Buttons */}
      <View className="flex-row justify-end gap-2">
        {/* Camera Button */}
        <Button
          accessibilityHint="Chụp ảnh để đính kèm vào bình luận"
          accessibilityLabel="Chụp ảnh"
          accessibilityRole="button"
          className="dark:border-white/20"
          disabled={addComment.isPending || selectedPhotos.length >= MAX_PHOTOS}
          onPress={handleCamera}
          size="sm"
          testID="comment-camera-button"
          variant="outline"
        >
          <Icon as={CameraIcon} />
          <Text>Chụp</Text>
        </Button>

        {/* Gallery Button */}
        <Button
          accessibilityHint="Chọn ảnh từ thư viện để đính kèm"
          accessibilityLabel="Thư viện ảnh"
          accessibilityRole="button"
          className="dark:border-white/20"
          disabled={addComment.isPending || selectedPhotos.length >= MAX_PHOTOS}
          onPress={handleGallery}
          size="sm"
          testID="comment-gallery-button"
          variant="outline"
        >
          <Icon as={ImageIcon} />
          <Text>Thư viện</Text>
        </Button>

        {/* Send Button */}
        <Button
          accessibilityHint="Gửi bình luận"
          accessibilityLabel={
            addComment.isPending ? 'Đang gửi bình luận' : 'Gửi bình luận'
          }
          accessibilityRole="button"
          disabled={!commentText.trim() || addComment.isPending}
          onPress={handleSendComment}
          size="sm"
          testID="comment-send-button"
        >
          <Icon as={ArrowUpIcon} className="text-primary-foreground" />
          <Text>{addComment.isPending ? 'Đang gửi...' : 'Gửi'}</Text>
        </Button>
      </View>
    </View>
  )
}
