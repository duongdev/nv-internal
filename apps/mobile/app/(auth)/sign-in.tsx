import { ScrollView, View } from 'react-native'
import { SignInForm } from '@/components/sign-in-form'

export default function SignInScreen() {
  return (
    <ScrollView
      contentContainerClassName="mt-safe items-center justify-center p-4 py-8 sm:flex-1 sm:p-6 sm:py-4"
      keyboardDismissMode="interactive"
      keyboardShouldPersistTaps="handled"
    >
      <View className="w-full max-w-sm">
        <SignInForm />
      </View>
    </ScrollView>
  )
}
