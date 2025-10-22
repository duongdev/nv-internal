import { useQuery } from '@tanstack/react-query'
import { callHonoApi } from '@/lib/api-client'

export interface Attachment {
  id: string
  originalFilename: string
  size: number
  mimeType: string
  createdAt: Date
  url: string
  expiresAt: string
}

export async function fetchAttachmentsByIds(ids: string[]) {
  if (ids.length === 0) {
    return []
  }

  const { data } = await callHonoApi(
    (c) =>
      c.v1.attachments.$get({
        query: { ids: ids.join(',') },
      }),
    { throwOnError: true },
  )

  return data?.attachments ?? []
}

export function useAttachments(
  ids: string[],
  options?: {
    enabled?: boolean
  },
) {
  return useQuery({
    queryKey: ['attachments', ids.sort().join(',')] as const,
    queryFn: () => fetchAttachmentsByIds(ids),
    enabled: options?.enabled !== false && ids.length > 0,
    staleTime: 0, // Always refetch to get fresh signed URLs
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}
