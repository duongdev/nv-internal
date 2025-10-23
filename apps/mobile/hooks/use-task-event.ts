import { useQueryClient } from '@tanstack/react-query'
import * as DocumentPicker from 'expo-document-picker'
import * as ImagePicker from 'expo-image-picker'
import * as Location from 'expo-location'
import { useRouter } from 'expo-router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTask } from '@/api/task/use-task'
import type { TaskStatus } from '@/components/ui/task-status-badge'
import { toast } from '@/components/ui/toasts'

const DISTANCE_THRESHOLD = 100 // meters

/**
 * Attachment types for check-in/check-out
 */
export interface TaskEventAttachment {
  uri: string
  type: 'image' | 'video' | 'document'
  filename: string
  mimeType: string
}

/**
 * Location data structure
 */
export interface TaskEventLocation {
  coords: {
    latitude: number
    longitude: number
    accuracy: number | null
  }
}

/**
 * React Native FormData file type
 */
interface ReactNativeFile {
  uri: string
  name: string
  type: string
}

/**
 * Task event configuration - defines behavior differences between check-in and check-out
 */
export interface TaskEventConfig {
  title: string
  buttonLabel: string
  requiredStatus: TaskStatus
  successMessage: string
  endpoint: 'check-in' | 'check-out'
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @returns Distance in meters
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371e3 // Earth's radius in meters
  const phi1 = (lat1 * Math.PI) / 180
  const phi2 = (lat2 * Math.PI) / 180
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) *
      Math.cos(phi2) *
      Math.sin(deltaLambda / 2) *
      Math.sin(deltaLambda / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c // Distance in meters
}

/**
 * Infer MIME type from file extension (fallback)
 */
function inferMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase()
  const mimeTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    mp4: 'video/mp4',
    mov: 'video/quicktime',
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  }
  return mimeTypes[ext || ''] || 'application/octet-stream'
}

/**
 * Shared hook for task events (check-in/check-out)
 * Handles GPS, attachments, and event submission
 */
export function useTaskEvent(
  taskId: number,
  eventType: 'check-in' | 'check-out',
) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [attachments, setAttachments] = useState<TaskEventAttachment[]>([])
  const [notes, setNotes] = useState('')
  const [location, setLocation] = useState<TaskEventLocation | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch task data
  const { data: task, isLoading: isLoadingTask } = useTask(
    { id: taskId },
    { refetchOnWindowFocus: true },
  )

  // Get GPS location on mount
  useEffect(() => {
    let mounted = true

    async function requestLocation() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync()
        if (status !== 'granted') {
          toast.error('Cần quyền truy cập vị trí để check-in/check-out')
          return
        }

        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        })

        if (mounted) {
          setLocation(currentLocation)
        }
      } catch (error) {
        console.error('Error getting location:', error)
        toast.error('Không thể lấy vị trí hiện tại')
      }
    }

    requestLocation()

    return () => {
      mounted = false
    }
  }, [])

  // Calculate distance from task location
  const distance = useMemo(() => {
    if (!location || !task?.geoLocation) {
      return null
    }
    return calculateDistance(
      location.coords.latitude,
      location.coords.longitude,
      task.geoLocation.lat,
      task.geoLocation.lng,
    )
  }, [location, task])

  // Generate warnings
  const warnings = useMemo(() => {
    const w: string[] = []
    if (distance && distance > DISTANCE_THRESHOLD) {
      w.push(`Bạn đang ở cách vị trí công việc ${Math.round(distance)}m`)
    }
    if (location?.coords.accuracy && location.coords.accuracy > 50) {
      w.push('Độ chính xác GPS thấp')
    }
    return w
  }, [distance, location])

  /**
   * Add attachment from camera
   */
  const addFromCamera = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync()
      if (status !== 'granted') {
        toast.error('Cần quyền truy cập camera')
        return
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images', 'videos'],
        allowsEditing: false,
        quality: 0.8,
      })

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0]
        const filename = `${eventType}-${Date.now()}.${asset.type === 'video' ? 'mp4' : 'jpg'}`
        const mimeType =
          asset.mimeType ||
          (asset.type === 'video' ? 'video/mp4' : 'image/jpeg')

        setAttachments((prev) => [
          ...prev,
          {
            uri: asset.uri,
            type: asset.type === 'video' ? 'video' : 'image',
            filename,
            mimeType,
          },
        ])
      }
    } catch (error) {
      console.error('Error adding from camera:', error)
      toast.error('Không thể chụp ảnh')
    }
  }, [eventType])

  /**
   * Add attachments from library
   */
  const addFromLibrary = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== 'granted') {
        toast.error('Cần quyền truy cập thư viện ảnh')
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsEditing: false,
        allowsMultipleSelection: true,
        quality: 0.8,
      })

      if (!result.canceled) {
        const newAttachments = result.assets.map((asset, idx) => {
          const filename = `${eventType}-${Date.now()}-${idx}.${asset.type === 'video' ? 'mp4' : 'jpg'}`
          const mimeType =
            asset.mimeType ||
            (asset.type === 'video' ? 'video/mp4' : 'image/jpeg')

          return {
            uri: asset.uri,
            type:
              asset.type === 'video' ? ('video' as const) : ('image' as const),
            filename,
            mimeType,
          }
        })
        setAttachments((prev) => [...prev, ...newAttachments])
      }
    } catch (error) {
      console.error('Error adding from library:', error)
      toast.error('Không thể chọn ảnh từ thư viện')
    }
  }, [eventType])

  /**
   * Add attachments from file picker
   */
  const addFromFiles = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*', 'video/*'],
        multiple: true,
        copyToCacheDirectory: true,
      })

      if (!result.canceled) {
        const newAttachments = result.assets.map((asset) => {
          const mimeType = asset.mimeType || inferMimeType(asset.name)
          const type = mimeType.startsWith('image/')
            ? ('image' as const)
            : mimeType.startsWith('video/')
              ? ('video' as const)
              : ('document' as const)

          return {
            uri: asset.uri,
            type,
            filename: asset.name,
            mimeType,
          }
        })
        setAttachments((prev) => [...prev, ...newAttachments])
      }
    } catch (error) {
      console.error('Error adding from files:', error)
      toast.error('Không thể chọn tệp tin')
    }
  }, [])

  /**
   * Remove attachment by index
   */
  const removeAttachment = useCallback((index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }, [])

  /**
   * Submit check-in/out event
   */
  const handleSubmit = useCallback(async () => {
    if (!location || !task) {
      return
    }

    setIsSubmitting(true)

    try {
      // Prepare FormData for file upload
      const formData = new FormData()
      formData.append('latitude', location.coords.latitude.toString())
      formData.append('longitude', location.coords.longitude.toString())

      if (notes.trim()) {
        formData.append('notes', notes.trim())
      }

      // Append all files (React Native FormData format)
      for (const attachment of attachments) {
        const file: ReactNativeFile = {
          uri: attachment.uri,
          name: attachment.filename,
          type: attachment.mimeType,
        }
        formData.append('files', file as unknown as Blob)
      }

      // Make API call using native fetch (not Hono RPC - doesn't support file uploads)
      const { clerk } = await import('@/lib/api-client')
      const token = await clerk.session?.getToken()

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/v1/task/${taskId}/${eventType}`,
        {
          method: 'POST',
          headers: {
            // biome-ignore lint/style/useNamingConvention: <header>
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Lỗi khi gửi dữ liệu')
      }

      const data = await response.json()

      toast.success(
        eventType === 'check-in'
          ? 'Đã bắt đầu làm việc'
          : 'Đã hoàn thành công việc',
      )

      // Show warnings if any (using info toast for warnings)
      if (data.warnings && data.warnings.length > 0) {
        for (const warning of data.warnings) {
          toast.error(warning) // Use error toast to display warnings prominently
        }
      }

      // Navigate away FIRST to unmount component before queries refetch
      router.back()

      // Invalidate task cache to refetch updated status, attachments, and activity
      // This happens after navigation starts, so the component is unmounted before re-render
      queryClient.invalidateQueries({ queryKey: ['task', taskId] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      // Invalidate activities for this task to show new check-in/out events
      queryClient.invalidateQueries({
        queryKey: ['activities', `TASK_${taskId}`],
      })
    } catch (error) {
      console.error('Error submitting event:', error)
      toast.error(
        error instanceof Error ? error.message : 'Lỗi khi gửi dữ liệu',
      )
    } finally {
      setIsSubmitting(false)
    }
  }, [
    location,
    attachments,
    task,
    notes,
    taskId,
    eventType,
    router,
    queryClient,
  ])

  return {
    task,
    isLoadingTask,
    location,
    distance,
    attachments,
    notes,
    isSubmitting,
    warnings,
    addFromCamera,
    addFromLibrary,
    addFromFiles,
    removeAttachment,
    setNotes,
    handleSubmit,
  }
}
