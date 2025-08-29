import { orderBy } from 'lodash-es'
import { type FC, useState } from 'react'
import { FlatList, RefreshControl, View } from 'react-native'
import { cn } from '@/lib/utils'
import { EmptyState } from './ui/empty-state'
import { Text } from './ui/text'

export type AdminUserListProps = {
  contentContainerClassName?: string
}

export const AdminUserList: FC<AdminUserListProps> = ({
  contentContainerClassName,
}) => {
  const [refreshing, setRefreshing] = useState(false)
  const users = orderBy(MOCK_USERS, ['firstName'], ['asc'])
  // const users = [] as typeof MOCK_USERS;

  const onRefresh = async () => {
    setRefreshing(true)
    // Fetch new data here
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setRefreshing(false)
  }

  return (
    <FlatList
      contentContainerClassName={cn(contentContainerClassName)}
      contentInsetAdjustmentBehavior="automatic"
      data={users}
      keyboardShouldPersistTaps="handled"
      keyExtractor={(item) => item.id}
      ListEmptyComponent={
        <EmptyState
          image="laziness"
          messageDescription="Hãy tạo nhân viên mới để bắt đầu làm việc."
          messageTitle="Chưa có nhân viên"
        />
      }
      refreshControl={
        <RefreshControl onRefresh={onRefresh} refreshing={refreshing} />
      }
      renderItem={({ item }) => <UserListItem user={item} />}
    />
  )
}

export type UserListItemProps = {
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
}

export const UserListItem: FC<UserListItemProps> = ({ user }) => {
  return (
    <View className="border-muted border-b py-2">
      <Text className="font-semibold text-lg">
        {user.firstName} {user.lastName}
      </Text>
      <Text className="text-muted-foreground text-sm">{user.email}</Text>
    </View>
  )
}

const MOCK_USERS = [
  { id: '1', firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
  { id: '2', firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com' },
  {
    id: '3',
    firstName: 'Alice',
    lastName: 'Johnson',
    email: 'alice@example.com',
  },
  { id: '4', firstName: 'Bob', lastName: 'Brown', email: 'bob@example.com' },
]
