import { UserRole } from '@nv-internal/validation'
import { CrownIcon } from 'lucide-react-native'
import type { FC } from 'react'
import { Badge } from './ui/badge'
import { Icon } from './ui/icon'
import { Text } from './ui/text'

export type UserRoleBadgeProps = {
  role: UserRole
}

export const UserRoleBadge: FC<UserRoleBadgeProps> = ({ role }) => {
  if (role === UserRole.nvInternalAdmin) {
    return (
      <Badge className="bg-yellow-500 dark:bg-yellow-600" variant="secondary">
        <Icon as={CrownIcon} className="text-white" />
        <Text className="text-white">Admin</Text>
      </Badge>
    )
  }

  if (role === UserRole.nvInternalWorker) {
    return (
      <Badge variant="secondary">
        <Text>Thợ</Text>
      </Badge>
    )
  }

  return null
}
