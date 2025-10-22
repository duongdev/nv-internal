import { useMutation, useQueryClient } from '@tanstack/react-query'
import { callHonoApi } from '@/lib/api-client'

export async function deleteAttachment(attachmentId: string) {
  const { data } = await callHonoApi(
    (c) => c.v1.attachments[':id'].$delete({ param: { id: attachmentId } }),
    { throwOnError: true },
  )
  return data
}

export function useDeleteAttachment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteAttachment,
    onSuccess: () => {
      // Invalidate all attachment queries to refetch
      queryClient.invalidateQueries({ queryKey: ['attachments'] })
      // Invalidate task queries since tasks include attachment lists
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['task'] })
    },
  })
}
