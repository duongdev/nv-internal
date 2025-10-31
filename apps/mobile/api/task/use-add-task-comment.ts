import {
  type UseMutationOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import type * as ImagePicker from 'expo-image-picker'
import {
  type Activity,
  activitiesQueryOptions,
} from '../activity/use-activities'

export type PhotoAsset = ImagePicker.ImagePickerAsset

async function addTaskCommentReal({
  taskId,
  comment,
  photos,
}: {
  taskId: number
  comment: string
  photos?: PhotoAsset[]
}) {
  const formData = new FormData()

  // Always add comment as FormData field
  formData.append('comment', comment)

  // Add photos if provided
  if (photos && photos.length > 0) {
    for (const [index, photo] of photos.entries()) {
      // React Native FormData format (same as use-upload-attachments.ts)
      // @ts-ignore - React Native FormData types differ from web
      formData.append('files', {
        uri: photo.uri,
        name: photo.fileName || `photo-${index}.jpg`,
        type: photo.mimeType || 'image/jpeg',
      })
    }
  }

  // Use native fetch since Hono RPC client doesn't support file uploads
  // See: https://github.com/orgs/honojs/discussions/2298
  const { clerk } = await import('@/lib/api-client')
  const token = await clerk.session?.getToken()

  const url = `${process.env.EXPO_PUBLIC_API_URL}/v1/task/${taskId}/comment`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      // biome-ignore lint/style/useNamingConvention: <header>
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  })

  // Error handling (same pattern as use-upload-attachments.ts)
  if (!response.ok) {
    let errorMessage = 'Không thể gửi bình luận. Vui lòng thử lại.'
    try {
      const errorText = await response.text()
      const errorJson = JSON.parse(errorText)
      errorMessage = errorJson.message || errorText
    } catch {
      // Use default error message
    }
    throw new Error(errorMessage)
  }

  const data = await response.json()
  return data.data as Activity
}

export type AddTaskCommentResponse = Awaited<
  ReturnType<typeof addTaskCommentReal>
>

export function useAddTaskComment(
  mutationOptions?: UseMutationOptions<
    AddTaskCommentResponse,
    Error,
    { taskId: number; comment: string; photos?: PhotoAsset[] }
  >,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: addTaskCommentReal,
    ...mutationOptions,
    onSuccess: (data, variables, ...args) => {
      const { toast } = require('@/components/ui/toasts')

      mutationOptions?.onSuccess?.(data, variables, ...args)

      // Invalidate task activities query to refresh feed
      const queryKey = activitiesQueryOptions({
        topic: `TASK_${variables.taskId}`,
      }).queryKey
      queryClient.invalidateQueries({ queryKey })

      // Success toast
      toast.success('Đã gửi bình luận')
    },
    onError: (error, variables, ...args) => {
      const { toast } = require('@/components/ui/toasts')

      mutationOptions?.onError?.(error, variables, ...args)

      // Error toast
      const errorMessage =
        error.message || 'Không thể gửi bình luận. Vui lòng thử lại.'
      toast.error(errorMessage)
    },
  })
}
