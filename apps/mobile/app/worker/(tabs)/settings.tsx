import { ScrollView } from 'react-native'
import { UserSettingsScreen } from '@/components/user-settings/user-settings-screen'

export default function WorkerSettingsScreen() {
  return (
    <ScrollView contentContainerClassName="mt-4 flex-1">
      <UserSettingsScreen isAdminView={false} />
    </ScrollView>
  )
}
