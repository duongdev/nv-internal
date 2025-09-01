import { type ComponentProps, type FC, useMemo } from 'react'
import type { User } from '@/api/user/use-user-list'
import { getUserFullName } from '@/utils/user-helper'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Text } from './ui/text'

export type UserAvatarProps = Omit<ComponentProps<typeof Avatar>, 'alt'> & {
  user: User
}

export const UserAvatar: FC<UserAvatarProps> = ({ user, ...props }) => {
  const fullName = getUserFullName(user)
  const { initials, imageSource, userName } = useMemo(() => {
    const userName =
      fullName || user.emailAddresses[0]?.emailAddress || 'Unknown'
    const initials = userName
      .split(' ')
      .map((name) => name[0])
      .join('')

    const imageSource = user.imageUrl ? { uri: user.imageUrl } : undefined
    return { initials, imageSource, userName }
  }, [user.imageUrl, fullName, user.emailAddresses[0]?.emailAddress])

  return (
    <Avatar alt={`${userName}'s avatar`} {...props}>
      <AvatarImage source={imageSource} />
      <AvatarFallback>
        <Text>{initials}</Text>
      </AvatarFallback>
    </Avatar>
  )
}
