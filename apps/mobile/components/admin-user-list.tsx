import { useQuery } from '@tanstack/react-query'
import { orderBy } from 'lodash-es'
import type { FC } from 'react'
import { FlatList, RefreshControl, View } from 'react-native'
import { getHonoClient } from '@/lib/api-client'
import { cn } from '@/lib/utils'
import { EmptyState } from './ui/empty-state'
import { Text } from './ui/text'

async function getUsers() {
  const client = await getHonoClient()
  return await (await client.v1.user.$get()).json()
}

type User = Awaited<ReturnType<typeof getUsers>>[number]

export type AdminUserListProps = {
  contentContainerClassName?: string
}

export const AdminUserList: FC<AdminUserListProps> = ({
  contentContainerClassName,
}) => {
  const {
    data: users,
    isFetching: isLoading,
    refetch,
  } = useQuery({
    queryFn: async () => {
      const client = await getHonoClient()
      const users = await (await client.v1.user.$get()).json()
      return orderBy(users, ['firstName'], ['asc'])
    },
    queryKey: ['admin_users'],
  })

  const onRefresh = async () => {
    await refetch()
  }

  return (
    <FlatList
      contentContainerClassName={cn(contentContainerClassName)}
      contentInsetAdjustmentBehavior="automatic"
      data={users}
      keyboardShouldPersistTaps="handled"
      keyExtractor={(item) => item.id}
      ListEmptyComponent={
        (!isLoading && (
          <EmptyState
            image="laziness"
            messageDescription="Hãy tạo nhân viên mới để bắt đầu làm việc."
            messageTitle="Chưa có nhân viên"
          />
        )) ||
        null
      }
      refreshControl={
        <RefreshControl onRefresh={onRefresh} refreshing={isLoading} />
      }
      renderItem={({ item }) => <UserListItem user={item} />}
    />
  )
}

export type UserListItemProps = {
  user: User
}

export const UserListItem: FC<UserListItemProps> = ({ user }) => {
  return (
    <View className="border-muted border-b py-2">
      <Text className="font-semibold text-lg">
        {user.firstName} {user.lastName}
      </Text>
      <Text className="text-muted-foreground text-sm">@{user.username}</Text>
    </View>
  )
}
