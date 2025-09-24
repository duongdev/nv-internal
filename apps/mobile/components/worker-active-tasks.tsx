import { Link } from 'expo-router'
import type { FC } from 'react'
import { Pressable, View } from 'react-native'
import type { Task } from '@/api/task/use-task'
import { TaskListItem } from './task-list-item'
import { Text } from './ui/text'

export type WorkerActiveTasksProps = {
  tasks: Task[]
}

export const WorkerActiveTasks: FC<WorkerActiveTasksProps> = ({ tasks }) => {
  const onGoingTasks = tasks.filter((t) => t.status === 'IN_PROGRESS')
  const nextTasks = tasks.filter((t) => t.status === 'READY')
  const completedTasks = tasks.filter((t) => t.status === 'COMPLETED')

  return (
    <View className="flex-1 gap-4">
      <View>
        <Text className="font-sans-medium" variant="h4">
          Việc đang làm
        </Text>
        <TaskList tasks={onGoingTasks} />
      </View>
      <View>
        <Text className="font-sans-medium" variant="h4">
          Việc tiếp theo
        </Text>
        <TaskList tasks={nextTasks} />
      </View>
      <View>
        <Text className="font-sans-medium" variant="h4">
          Việc đã hoàn thành
        </Text>
        <TaskList tasks={completedTasks} />
      </View>
    </View>
  )
}

export type TaskListProps = {
  tasks: Task[]
}

export const TaskList: FC<TaskListProps> = ({ tasks }) => {
  if (tasks.length === 0) {
    return taskEmpty
  }
  return (
    <View className="mt-2 gap-2">
      {tasks.map((task) => (
        <Link
          asChild
          href={{
            pathname: '/worker/tasks/[taskId]/view',
            params: {
              taskId: task.id.toString(),
            },
          }}
          key={task.id}
        >
          <Pressable className="rounded-md border border-border p-3 active:bg-muted">
            <TaskListItem task={task} />
          </Pressable>
        </Link>
      ))}
    </View>
  )
}

const taskEmpty = (
  <Text className="text-muted-foreground">Chưa có công việc nào.</Text>
)
