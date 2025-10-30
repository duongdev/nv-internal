import { type FC, Fragment } from 'react'
import { View } from 'react-native'
import { useUserPublicInfo } from '@/api/user/use-user-public-info'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Text } from '@/components/ui/text'
import { cn } from '@/lib/utils'
import { getUserInitials } from '@/utils/user-helper'

type AssigneeAvatarsProps = {
  /**
   * Array of user IDs assigned to the task
   */
  assigneeIds: string[]
  /**
   * Maximum number of avatars to show before collapsing to "+N"
   * @default 3
   */
  maxVisible?: number
  /**
   * Size of the avatars
   * @default 'md'
   */
  size?: 'sm' | 'md'
  /**
   * Optional className for the container
   */
  className?: string
}

/**
 * AssigneeAvatar - Single avatar with user initials
 */
const AssigneeAvatar: FC<{
  userId: string
  size: 'sm' | 'md'
  index: number
  maxVisible: number
}> = ({ userId, size, index, maxVisible }) => {
  const { data: user } = useUserPublicInfo(userId)

  if (index >= maxVisible) {
    return null
  }

  const sizeClass = size === 'sm' ? 'size-6' : 'size-8'
  const textSize = size === 'sm' ? 'text-[9px]' : 'text-xs'

  return (
    <Avatar
      alt={user ? `${user.firstName} ${user.lastName}` : 'Người dùng'}
      className={cn(sizeClass, index > 0 && '-ml-2')}
    >
      <AvatarFallback className="border-2 border-card bg-muted">
        <Text className={cn('font-sans-semibold', textSize)}>
          {user ? getUserInitials(user) : '?'}
        </Text>
      </AvatarFallback>
    </Avatar>
  )
}

/**
 * AssigneeAvatars - Display assignee avatars with overflow indicator
 *
 * Shows up to `maxVisible` avatars in a horizontal row with slight overlap.
 * If there are more assignees, shows a "+N" badge.
 *
 * @example
 * ```tsx
 * <AssigneeAvatars assigneeIds={['user1', 'user2', 'user3']} maxVisible={3} />
 * // Shows 3 avatars
 *
 * <AssigneeAvatars assigneeIds={['user1', 'user2', 'user3', 'user4']} maxVisible={2} />
 * // Shows 2 avatars + "+2" badge
 * ```
 */
export const AssigneeAvatars: FC<AssigneeAvatarsProps> = ({
  assigneeIds,
  maxVisible = 3,
  size = 'md',
  className,
}) => {
  if (assigneeIds.length === 0) {
    return null
  }

  const overflowCount = assigneeIds.length - maxVisible
  const hasOverflow = overflowCount > 0

  const sizeClass = size === 'sm' ? 'size-6' : 'size-8'
  const textSize = size === 'sm' ? 'text-[9px]' : 'text-xs'

  return (
    <View className={cn('flex-row items-center', className)}>
      {assigneeIds.slice(0, maxVisible).map((userId, index) => (
        <Fragment key={userId}>
          <AssigneeAvatar
            index={index}
            maxVisible={maxVisible}
            size={size}
            userId={userId}
          />
        </Fragment>
      ))}
      {hasOverflow && (
        <View
          className={cn(
            '-ml-2 flex-row items-center justify-center rounded-full border-2 border-card bg-muted',
            sizeClass,
          )}
        >
          <Text
            className={cn('font-sans-semibold text-muted-foreground', textSize)}
          >
            +{overflowCount}
          </Text>
        </View>
      )}
    </View>
  )
}
