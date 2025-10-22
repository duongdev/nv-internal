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
      // After successful deletion, refetch to get fresh data
      queryClient.invalidateQueries({ queryKey: ['attachments'] })
      queryClient.invalidateQueries({ queryKey: ['task'] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}
