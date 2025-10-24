import * as ImagePicker from 'expo-image-picker'
import { Camera, FileImage, Trash2 } from 'lucide-react-native'
import { Image, Pressable, View } from 'react-native'
import { useAttachments } from '@/api/attachment/use-attachments'
import { toast } from '@/components/ui/toasts'
import { cn } from '@/lib/utils'
import { Button } from '../ui/button'
import { Icon } from '../ui/icon'
import { Label } from '../ui/label'
import { Text } from '../ui/text'

export interface InvoiceFile {
  uri: string
  name: string
  type: string
}

interface InvoicePhotoCaptureProps {
  /**
   * Current file value
   */
  value?: InvoiceFile | null
  /**
   * Callback when file changes
   */
  onChange?: (file: InvoiceFile | null) => void
  /**
   * Label text (defaults to "Ảnh hóa đơn (Tùy chọn)")
   */
  label?: string
  /**
   * Existing attachment ID (for showing current invoice in edit mode)
   */
  currentAttachmentId?: string | null
  /**
   * Whether to show inline preview (default true)
   */
  inline?: boolean
  /**
   * Optional error message
   */
  error?: string
}

/**
 * InvoicePhotoCapture Component
 * - CRITICAL: Invoice is OPTIONAL - show "Tùy chọn" label clearly
 * - Inline camera preview (NOT modal)
 * - Camera or gallery selection
 * - Preview/retake/remove functionality
 * - Image compression before upload
 */
export function InvoicePhotoCapture({
  value,
  onChange,
  label = 'Ảnh hóa đơn (Tùy chọn)',
  currentAttachmentId,
  inline = true,
  error,
}: InvoicePhotoCaptureProps) {
  const handleCameraCapture = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync()
      if (status !== 'granted') {
        toast.error('Cần quyền truy cập camera')
        return
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
      })

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0]
        const filename = `invoice-${Date.now()}.jpg`

        onChange?.({
          uri: asset.uri,
          name: filename,
          type: asset.mimeType || 'image/jpeg',
        })
      }
    } catch (error) {
      console.error('Error capturing from camera:', error)
      toast.error('Không thể chụp ảnh')
    }
  }

  const handleGalleryPick = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== 'granted') {
        toast.error('Cần quyền truy cập thư viện ảnh')
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
      })

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0]
        const filename = asset.fileName || `invoice-${Date.now()}.jpg`

        onChange?.({
          uri: asset.uri,
          name: filename,
          type: asset.mimeType || 'image/jpeg',
        })
      }
    } catch (error) {
      console.error('Error picking from gallery:', error)
      toast.error('Không thể chọn ảnh từ thư viện')
    }
  }

  const handleRemove = () => {
    onChange?.(null)
  }

  // Fetch attachment data if we have an ID
  const { data: attachments } = useAttachments(
    currentAttachmentId ? [currentAttachmentId] : [],
    { enabled: !!currentAttachmentId && !value?.uri },
  )
  const currentAttachment = attachments?.[0]

  const hasImage = value?.uri || currentAttachment?.url

  return (
    <View className="gap-2">
      {label && <Label>{label}</Label>}

      {inline && hasImage ? (
        // Inline Preview Mode
        <View className="gap-2">
          <View className="relative">
            <Image
              className="h-48 w-full rounded-lg bg-muted"
              resizeMode="cover"
              source={{
                uri: value?.uri || currentAttachment?.url,
              }}
            />
            {/* Remove button overlay */}
            <Pressable
              className="absolute top-2 right-2 h-8 w-8 items-center justify-center rounded-full bg-destructive active:bg-destructive/90"
              onPress={handleRemove}
            >
              <Trash2 className="text-white" size={16} />
            </Pressable>
          </View>

          {/* Replace buttons */}
          <View className="flex-row gap-2">
            <Button
              className="flex-1 dark:border-white/50"
              onPress={handleCameraCapture}
              size="sm"
              variant="outline"
            >
              <Icon as={Camera} className="text-foreground" size={16} />
              <Text>Chụp lại</Text>
            </Button>
            <Button
              className="flex-1 dark:border-white/50"
              onPress={handleGalleryPick}
              size="sm"
              variant="outline"
            >
              <Icon as={FileImage} className="text-foreground" size={16} />
              <Text>Thay ảnh</Text>
            </Button>
          </View>
        </View>
      ) : (
        // Empty State - Add buttons
        <View className="gap-2">
          <View
            className={cn(
              'h-32 items-center justify-center rounded-lg border-2 border-dashed bg-muted/30',
              error
                ? 'border-destructive'
                : 'border-border dark:border-white/20',
            )}
          >
            <Icon
              as={FileImage}
              className="mb-2 text-muted-foreground"
              size={32}
            />
            <Text className="text-center text-muted-foreground text-sm">
              Thêm ảnh hóa đơn (tùy chọn)
            </Text>
          </View>

          <View className="flex-row gap-2">
            <Button
              className="flex-1 dark:border-white/50"
              onPress={handleCameraCapture}
              size="sm"
              variant="outline"
            >
              <Icon as={Camera} className="text-foreground" size={16} />
              <Text>Chụp ảnh</Text>
            </Button>
            <Button
              className="flex-1 dark:border-white/50"
              onPress={handleGalleryPick}
              size="sm"
              variant="outline"
            >
              <Icon as={FileImage} className="text-foreground" size={16} />
              <Text>Chọn ảnh</Text>
            </Button>
          </View>
        </View>
      )}

      {error && (
        <Text className="text-destructive text-xs leading-tight">{error}</Text>
      )}
    </View>
  )
}
