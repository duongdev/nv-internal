import type { FC, ReactNode } from 'react'
import {
  type FetchUserPublicInfoResponse,
  useUserPublicInfo,
} from '@/api/user/use-user-public-info'
import { cn } from '@/lib/utils'
import { getUserFullName } from '@/utils/user-helper'
import { Skeleton } from './ui/skeleton'
import { Text } from './ui/text'

export type UserPublicInfoBaseProps = {
  userId: string
  className?: string
}

export const UserPublicInfo: FC<
  UserPublicInfoBaseProps & {
    children: (user: FetchUserPublicInfoResponse) => ReactNode
  }
> = ({ userId, className, children }) => {
  const { data, isLoading } = useUserPublicInfo(userId)

  if (isLoading) {
    return <Skeleton className="h-5 w-[150px]" />
  }

  if (!data) {
    return '[deleted]'
  }

  return <>{children(data)}</>
}

export const UserFullName: FC<UserPublicInfoBaseProps> = ({
  userId,
  className,
}) => {
  return (
    <UserPublicInfo userId={userId}>
      {(user) => (
        <Text
          className={cn(className, {
            'line-through': user.banned,
          })}
        >
          {getUserFullName(user)}
        </Text>
      )}
    </UserPublicInfo>
  )
}
