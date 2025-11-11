import {
  type UseMutationOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { callHonoApi } from '@/lib/api-client'
import { TASK_LIST_QUERY_KEY } from './use-task-infinite-list'

export async function deleteTask(taskId: number) {
  const { data } = await callHonoApi(
    (c) => c.v1.task[':id'].$delete({ param: { id: taskId.toString() } }),
    { toastOnError: true },
  )
  return data
}

export type DeleteTaskResponse = Awaited<ReturnType<typeof deleteTask>>

export function useDeleteTask(
  mutationOptions?: UseMutationOptions<DeleteTaskResponse, Error, number>,
) {
  const queryClient = useQueryClient()
  const router = useRouter()

  const mutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: (...args) => {
      mutationOptions?.onSuccess?.(...args)
      // Navigate back after successful deletion
      router.back()
    },
    onError: (err, ...args) => {
      mutationOptions?.onError?.(err, ...args)
    },
    onSettled: (...args) => {
      mutationOptions?.onSettled?.(...args)
      // Invalidate task list
      queryClient.invalidateQueries({ queryKey: TASK_LIST_QUERY_KEY })
    },
  })

  return mutation
}
