import { ScrollView, View } from 'react-native'
import { VerifyEmailForm } from '@/components/verify-email-form'

export default function VerifyEmailScreen() {
  return (
    <ScrollView
      contentContainerClassName="ios:mt-0 mt-safe items-center justify-center p-4 py-8 sm:flex-1 sm:p-6 sm:py-4"
      keyboardDismissMode="interactive"
      keyboardShouldPersistTaps="handled"
    >
      <View className="w-full max-w-sm">
        <VerifyEmailForm />
      </View>
    </ScrollView>
  )
}
