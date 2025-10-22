import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Task } from '@/api/task/use-task'
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
    onMutate: async (attachmentId: string) => {
      // Cancel any outgoing refetches to avoid overwriting our optimistic update
      await queryClient.cancelQueries({ queryKey: ['attachments'] })
      await queryClient.cancelQueries({ queryKey: ['task'] })
      await queryClient.cancelQueries({ queryKey: ['tasks'] })

      // Snapshot the previous values for rollback
      const previousAttachmentQueries = queryClient.getQueriesData({
        queryKey: ['attachments'],
      })
      const previousTaskQueries = queryClient.getQueriesData({
        queryKey: ['task'],
      })
      const previousTasksQueries = queryClient.getQueriesData({
        queryKey: ['tasks'],
      })

      // Optimistically update attachment queries - remove the deleted attachment
      queryClient.setQueriesData(
        { queryKey: ['attachments'] },
        (old: unknown) => {
          if (Array.isArray(old)) {
            return old.filter((att: { id: string }) => att.id !== attachmentId)
          }
          return old
        },
      )

      // Optimistically update task queries - remove from attachments array
      queryClient.setQueriesData({ queryKey: ['task'] }, (old: unknown) => {
        if (old && typeof old === 'object' && 'attachments' in old) {
          const task = old as Task
          return {
            ...task,
            attachments: task.attachments?.filter(
              (att) => att.id !== attachmentId,
            ),
          }
        }
        return old
      })

      // Optimistically update tasks list queries - remove from attachments arrays
      queryClient.setQueriesData({ queryKey: ['tasks'] }, (old: unknown) => {
        if (old && typeof old === 'object' && 'tasks' in old) {
          const data = old as {
            tasks: Task[]
            nextCursor?: string
            hasNextPage: boolean
          }
          return {
            ...data,
            tasks: data.tasks.map((task) => ({
              ...task,
              attachments: task.attachments?.filter(
                (att) => att.id !== attachmentId,
              ),
            })),
          }
        }
        return old
      })

      // Return context with previous values for rollback
      return {
        previousAttachmentQueries,
        previousTaskQueries,
        previousTasksQueries,
      }
    },
    onError: (_error, _variables, context) => {
      // Rollback to previous values on error
      if (context?.previousAttachmentQueries) {
        for (const [queryKey, queryData] of context.previousAttachmentQueries) {
          queryClient.setQueryData(queryKey, queryData)
        }
      }
      if (context?.previousTaskQueries) {
        for (const [queryKey, queryData] of context.previousTaskQueries) {
          queryClient.setQueryData(queryKey, queryData)
        }
      }
      if (context?.previousTasksQueries) {
        for (const [queryKey, queryData] of context.previousTasksQueries) {
          queryClient.setQueryData(queryKey, queryData)
        }
      }
    },
    onSuccess: () => {
      // Invalidate all attachment queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: ['attachments'] })
      // Invalidate task queries since tasks include attachment lists
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['task'] })
    },
  })
}
