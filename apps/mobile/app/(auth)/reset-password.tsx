import { ScrollView, View } from 'react-native'
import { ResetPasswordForm } from '@/components/reset-password-form'

export default function ResetPasswordScreen() {
  return (
    <ScrollView
      contentContainerClassName="mt-safe items-center justify-center p-4 py-8 sm:flex-1 sm:p-6 sm:py-4"
      keyboardDismissMode="interactive"
      keyboardShouldPersistTaps="handled"
    >
      <View className="w-full max-w-sm">
        <ResetPasswordForm />
      </View>
    </ScrollView>
  )
}
