import type { FC } from 'react'
import { FlatList, RefreshControl, View } from 'react-native'
import { type User, useUserList } from '@/api/user/use-user-list'
import { cn } from '@/lib/utils'
import { EmptyState } from './ui/empty-state'
import { Text } from './ui/text'

export type AdminUserListProps = {
  contentContainerClassName?: string
}

export const AdminUserList: FC<AdminUserListProps> = ({
  contentContainerClassName,
}) => {
  const { data: users, isFetching: isLoading, refetch } = useUserList()

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
      <Text className="font-semibold text-lg text-muted-foreground">
        {user.lastName} <Text>{user.firstName}</Text>
      </Text>
      <Text className="text-muted-foreground text-sm">@{user.username}</Text>
    </View>
  )
}
