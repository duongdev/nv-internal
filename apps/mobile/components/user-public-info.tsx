import type { FC } from 'react'
import { useUserPublicInfo } from '@/api/user/use-user-public-info'
import { cn } from '@/lib/utils'
import { getUserFullName } from '@/utils/user-helper'
import { Skeleton } from './ui/skeleton'
import { Text } from './ui/text'

export type UserPublicInfoProps = {
  userId: string
  className?: string
}

export const UserFullName: FC<UserPublicInfoProps> = ({
  userId,
  className,
}) => {
  const { data, isLoading } = useUserPublicInfo(userId)

  if (isLoading) {
    return <Skeleton className="h-5 w-[150px]" />
  }

  if (!data) {
    return '[deleted]'
  }

  return (
    <Text
      className={cn(className, {
        'line-through': data.banned,
      })}
    >
      {getUserFullName(data)}
    </Text>
  )
}
