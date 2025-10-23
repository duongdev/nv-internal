import { ScrollView } from 'react-native'
import { UserSettingsScreen } from '@/components/user-settings/user-settings-screen'

export default function AdminSettingsScreen() {
  return (
    <ScrollView
      bounces={false}
      className="flex-1 bg-background"
      contentContainerClassName="px-4 pt-4 pb-24"
    >
      <UserSettingsScreen isAdminView />
    </ScrollView>
  )
}
