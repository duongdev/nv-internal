import { cn } from '@/lib/utils';
import { useState, type FC } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import { Text } from './ui/text';
import { EmptyState } from './ui/empty-state';
import { orderBy } from 'lodash-es';

export type AdminUserListProps = {
  contentContainerClassName?: string;
};

export const AdminUserList: FC<AdminUserListProps> = ({ contentContainerClassName }) => {
  const [refreshing, setRefreshing] = useState(false);
  const users = orderBy(MOCK_USERS, ['firstName'], ['asc']);
  // const users = [] as typeof MOCK_USERS;

  const onRefresh = async () => {
    setRefreshing(true);
    // Fetch new data here
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setRefreshing(false);
  };

  return (
    <FlatList
      data={users}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <UserListItem user={item} />}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      contentContainerClassName={cn(contentContainerClassName)}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListEmptyComponent={
        <EmptyState
          image="laziness"
          messageTitle="Chưa có nhân viên"
          messageDescription="Hãy tạo nhân viên mới để bắt đầu làm việc."
        />
      }
    />
  );
};

export type UserListItemProps = {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
};

export const UserListItem: FC<UserListItemProps> = ({ user }) => {
  return (
    <View className="border-b border-muted py-2">
      <Text className="text-lg font-semibold">
        {user.firstName} {user.lastName}
      </Text>
      <Text className="text-sm text-muted-foreground">{user.email}</Text>
    </View>
  );
};

const MOCK_USERS = [
  { id: '1', firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
  { id: '2', firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com' },
  { id: '3', firstName: 'Alice', lastName: 'Johnson', email: 'alice@example.com' },
  { id: '4', firstName: 'Bob', lastName: 'Brown', email: 'bob@example.com' },
];
