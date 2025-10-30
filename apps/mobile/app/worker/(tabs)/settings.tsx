import { ScrollView } from 'react-native'
import { UserSettingsScreen } from '@/components/user-settings/user-settings-screen'

export default function WorkerSettingsScreen() {
  return (
    <ScrollView
      bounces={false}
      className="flex-1 bg-background"
      contentContainerClassName="px-4 pt-safe pb-safe"
    >
      <UserSettingsScreen isAdminView={false} />
    </ScrollView>
  )
}
