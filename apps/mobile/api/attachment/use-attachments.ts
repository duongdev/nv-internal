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
  thumbnailUrl?: string
  blurhash?: string
  width?: number
  height?: number
  uploadedBy: string
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

  const apiBaseUrl = process.env.EXPO_PUBLIC_API_URL || ''

  // Convert relative URLs to absolute URLs using the API base URL
  const attachments = (data?.attachments ?? []).map((attachment) => {
    const url = attachment.url.startsWith('/')
      ? `${apiBaseUrl}${attachment.url}`
      : attachment.url
    const thumbnailUrl = attachment.thumbnailUrl?.startsWith('/')
      ? `${apiBaseUrl}${attachment.thumbnailUrl}`
      : attachment.thumbnailUrl

    return {
      ...attachment,
      url,
      thumbnailUrl,
    }
  })

  return attachments
}

export function useAttachments(
  ids: string[],
  options?: {
    enabled?: boolean
  },
) {
  return useQuery({
    queryKey: ['attachments', 'v2', ids.sort().join(',')] as const, // Added v2 to bust cache
    queryFn: () => fetchAttachmentsByIds(ids),
    enabled: options?.enabled !== false && ids.length > 0,
    staleTime: 1000 * 60 * 5, // 5 minutes (signed URLs are valid for 1 hour)
    gcTime: 1000 * 60 * 60, // 1 hour (match signed URL expiry)
  })
}
