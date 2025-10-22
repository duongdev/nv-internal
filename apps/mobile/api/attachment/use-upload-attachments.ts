import {
  type UseMutationOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import type * as DocumentPicker from 'expo-document-picker'
import type * as ImagePicker from 'expo-image-picker'
import { activitiesQueryOptions } from '../activity/use-activities'
import { taskQueryOptions } from '../task/use-task'
import { TASK_LIST_QUERY_KEY } from '../task/use-task-infinite-list'

type AssetType =
  | ImagePicker.ImagePickerAsset
  | DocumentPicker.DocumentPickerAsset

/**
 * Get MIME type from file extension as fallback
 */
function getMimeTypeFromExtension(filename: string): string | null {
  const ext = filename.toLowerCase().split('.').pop()
  const mimeMap: Record<string, string> = {
    // Images
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    heic: 'image/heic',
    heif: 'image/heif',
    // Videos
    mov: 'video/quicktime',
    mp4: 'video/mp4',
    webm: 'video/webm',
    // Documents
    pdf: 'application/pdf',
  }
  return ext ? mimeMap[ext] || null : null
}

async function uploadAttachmentsReal({
  taskId,
  assets,
}: {
  taskId: number
  assets: AssetType[]
}) {
  const formData = new FormData()

  // React Native FormData requires a specific format
  for (const asset of assets) {
    const fileName =
      'name' in asset
        ? asset.name
        : 'fileName' in asset
          ? asset.fileName
          : 'file.jpg'

    // Try to get MIME type from asset, then from file extension, finally use default
    let mimeType =
      'mimeType' in asset ? asset.mimeType : 'type' in asset ? asset.type : null

    // If mimeType is not available or is the generic type, try to infer from filename
    if (!mimeType || mimeType === 'application/octet-stream') {
      const inferredType = getMimeTypeFromExtension(fileName || '')
      if (inferredType) {
        mimeType = inferredType
      }
    }

    // React Native FormData format
    // @ts-ignore - React Native FormData types differ from web
    formData.append('files', {
      uri: asset.uri,
      name: fileName || 'file',
      type: mimeType || 'application/octet-stream',
    })
  }

  // Use native fetch since Hono RPC client doesn't support file uploads
  // See: https://github.com/orgs/honojs/discussions/2298
  const { clerk } = await import('@/lib/api-client')
  const token = await clerk.session?.getToken()

  const response = await fetch(
    `${process.env.EXPO_PUBLIC_API_URL}/v1/task/${taskId}/attachments`,
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
    let errorMessage = 'Không thể tải tệp lên. Vui lòng thử lại.'
    try {
      const errorText = await response.text()
      const errorJson = JSON.parse(errorText)
      errorMessage = errorJson.message || errorText
    } catch {
      // If parsing fails, use default message
    }
    throw new Error(errorMessage)
  }

  const data = await response.json()
  return data
}

export type UploadAttachmentsResponse = Awaited<
  ReturnType<typeof uploadAttachmentsReal>
>

export function useUploadAttachments(
  mutationOptions?: UseMutationOptions<
    UploadAttachmentsResponse,
    Error,
    { taskId: number; assets: AssetType[] }
  >,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: uploadAttachmentsReal,
    ...mutationOptions,
    onSuccess: (...args) => {
      mutationOptions?.onSuccess?.(...args)

      // Show success toast
      const { toast } = require('@/components/ui/toasts')
      toast.success('Tải tệp lên thành công')
    },
    onError: (error, ...args) => {
      mutationOptions?.onError?.(error, ...args)

      // Show error toast
      const { toast } = require('@/components/ui/toasts')
      const errorMessage =
        error.message || 'Không thể tải tệp lên. Vui lòng thử lại.'
      toast.error(errorMessage)
    },
    onSettled: (...args) => {
      mutationOptions?.onSettled?.(...args)

      const taskId = args[2]?.taskId
      if (!taskId) {
        return
      }

      queryClient.invalidateQueries({
        queryKey: taskQueryOptions({ id: taskId }).queryKey,
      })
      queryClient.invalidateQueries({ queryKey: TASK_LIST_QUERY_KEY })
      queryClient.invalidateQueries({
        queryKey: activitiesQueryOptions({ topic: `TASK_${taskId}` }).queryKey,
      })
    },
  })
}
