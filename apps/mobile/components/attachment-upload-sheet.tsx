import {
  type BottomSheetModalProps,
  BottomSheetScrollView,
  BottomSheetView,
} from '@gorhom/bottom-sheet'
import type { BottomSheetModalMethods } from '@gorhom/bottom-sheet/lib/typescript/types'
import * as DocumentPicker from 'expo-document-picker'
import * as ImagePicker from 'expo-image-picker'
import {
  CameraIcon,
  CheckIcon,
  FolderIcon,
  ImageIcon,
  XIcon,
} from 'lucide-react-native'
import { forwardRef, useRef, useState } from 'react'
import { Alert, Image, Linking, Pressable, View } from 'react-native'
import { useUploadAttachments } from '@/api/attachment/use-upload-attachments'
import { Badge } from './ui/badge'
import { BottomSheet } from './ui/bottom-sheet'
import { Button } from './ui/button'
import { Icon } from './ui/icon'
import { Text } from './ui/text'
import { toast } from './ui/toasts'

type CapturedPhoto = ImagePicker.ImagePickerAsset

export const AttachmentUploadSheet = forwardRef<
  BottomSheetModalMethods,
  Omit<BottomSheetModalProps, 'children'> & {
    taskId: number
  }
>(({ taskId, ...props }, ref) => {
  const [mode, setMode] = useState<'choice' | 'camera-review'>('choice')
  const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>([])
  const loadingToastIdRef = useRef<string | null>(null)
  const uploadMutation = useUploadAttachments()

  const handleCamera = async () => {
    // Close choice sheet immediately
    if (typeof ref !== 'function' && ref?.current) {
      ref.current.dismiss()
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
      mediaTypes: ['images', 'videos'],
      quality: 0.8,
    })

    if (!result.canceled) {
      setCapturedPhotos([...capturedPhotos, ...result.assets])
      setMode('camera-review')
      // Re-open sheet in camera-review mode
      if (typeof ref !== 'function' && ref?.current) {
        ref.current.present()
      }
    }
  }

  const handleGallery = async () => {
    // Close choice sheet immediately
    if (typeof ref !== 'function' && ref?.current) {
      ref.current.dismiss()
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 10,
    })

    if (!result.canceled && result.assets.length > 0) {
      // Auto-upload immediately
      await uploadFiles(result.assets)
    }
  }

  const handleFiles = async () => {
    // Close choice sheet immediately
    if (typeof ref !== 'function' && ref?.current) {
      ref.current.dismiss()
    }

    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*', 'video/*'],
      multiple: true,
      copyToCacheDirectory: true,
    })

    if (!result.canceled && result.assets.length > 0) {
      // Auto-upload immediately
      await uploadFiles(result.assets)
    }
  }

  const uploadFiles = async (
    assets: (
      | ImagePicker.ImagePickerAsset
      | DocumentPicker.DocumentPickerAsset
    )[],
  ) => {
    // Show loading toast with 30 second maximum duration
    const fileCount = assets.length
    const loadingMessage =
      fileCount === 1
        ? 'Đang tải lên 1 tệp...'
        : `Đang tải lên ${fileCount} tệp...`
    const toastId = toast.loading(loadingMessage, { duration: 30000 })
    const toastStartTime = Date.now()
    loadingToastIdRef.current = toastId

    try {
      // Upload assets directly without thumbnail generation
      await uploadMutation.mutateAsync({
        taskId,
        assets,
        loadingToastId: toastId,
        toastStartTime,
      })
    } finally {
      loadingToastIdRef.current = null
    }
  }

  const handleCameraUpload = async () => {
    await uploadFiles(capturedPhotos)
    // Reset and close
    setCapturedPhotos([])
    setMode('choice')
    if (typeof ref === 'function') {
      // Handle ref function
    } else if (ref?.current) {
      ref.current.dismiss()
    }
  }

  const removePhoto = (index: number) => {
    setCapturedPhotos(capturedPhotos.filter((_, i) => i !== index))
    if (capturedPhotos.length === 1) {
      // Last photo removed, go back to choice
      setMode('choice')
    }
  }

  const addMorePhotos = async () => {
    await handleCamera()
  }

  return (
    <BottomSheet
      onChange={(index) => {
        if (index === -1) {
          // Sheet dismissed, reset state
          setCapturedPhotos([])
          setMode('choice')
        }
      }}
      ref={ref}
      snapPoints={mode === 'choice' ? ['35%'] : ['60%', '90%']}
      {...props}
    >
      {mode === 'choice' ? (
        <BottomSheetView className="gap-3 px-4 pb-safe">
          <Text className="font-sans-semibold text-lg">Thêm tệp đính kèm</Text>
          <View className="flex-row justify-around gap-4 py-2">
            <Pressable
              className="flex-1 items-center gap-2 rounded-lg border border-border bg-muted p-4 active:bg-muted/80"
              onPress={handleCamera}
            >
              <Icon as={CameraIcon} className="text-foreground" size={24} />
              <Text className="text-sm">Chụp ảnh</Text>
            </Pressable>
            <Pressable
              className="flex-1 items-center gap-2 rounded-lg border border-border bg-muted p-4 active:bg-muted/80"
              onPress={handleGallery}
            >
              <Icon as={ImageIcon} className="text-foreground" size={24} />
              <Text className="text-sm">Thư viện</Text>
            </Pressable>
            <Pressable
              className="flex-1 items-center gap-2 rounded-lg border border-border bg-muted p-4 active:bg-muted/80"
              onPress={handleFiles}
            >
              <Icon as={FolderIcon} className="text-foreground" size={24} />
              <Text className="text-sm">Tệp tin</Text>
            </Pressable>
          </View>
        </BottomSheetView>
      ) : (
        <BottomSheetView className="flex-1 gap-3 px-4 pb-safe">
          {/* Camera Review Header */}
          <View className="flex-row items-center gap-3">
            <Text className="flex-1 font-sans-semibold text-lg">
              Ảnh đã chụp
            </Text>
            <Badge variant="secondary">
              <Text className="text-sm">{capturedPhotos.length}/10</Text>
            </Badge>
          </View>

          {/* Captured Photos Grid */}
          <BottomSheetScrollView
            className="flex-1"
            contentContainerClassName="gap-3"
          >
            {capturedPhotos.map((photo, index) => (
              <View
                className="flex-row items-center gap-3 rounded-lg border border-border bg-muted p-3"
                key={`photo-${photo.uri}-${index}`}
              >
                <Image
                  className="h-16 w-16 rounded"
                  resizeMode="cover"
                  source={{ uri: photo.uri }}
                />
                <View className="flex-1">
                  <Text className="font-sans-medium" numberOfLines={1}>
                    Ảnh {index + 1}
                  </Text>
                  <Text className="text-muted-foreground text-xs">
                    {photo.width} × {photo.height}
                  </Text>
                </View>
                <Pressable
                  className="rounded-full bg-destructive p-2"
                  onPress={() => removePhoto(index)}
                >
                  <Icon
                    as={XIcon}
                    className="text-destructive-foreground"
                    size={16}
                  />
                </Pressable>
              </View>
            ))}
          </BottomSheetScrollView>

          {/* Action Buttons */}
          <View className="gap-2">
            <Button
              disabled={uploadMutation.isPending || capturedPhotos.length >= 10}
              onPress={addMorePhotos}
              size="default"
              variant="outline"
            >
              <Icon as={CameraIcon} className="text-foreground" />
              <Text>Chụp thêm</Text>
            </Button>

            <Button
              disabled={uploadMutation.isPending}
              onPress={handleCameraUpload}
              size="default"
            >
              <Icon as={CheckIcon} className="text-primary-foreground" />
              <Text className="text-primary-foreground">
                {uploadMutation.isPending
                  ? 'Đang tải lên...'
                  : `Tải lên ${capturedPhotos.length} ảnh`}
              </Text>
            </Button>
          </View>
        </BottomSheetView>
      )}
    </BottomSheet>
  )
})
