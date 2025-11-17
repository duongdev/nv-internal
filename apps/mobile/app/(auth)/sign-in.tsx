import { View } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { SignInForm } from '@/components/sign-in-form'

export default function SignInScreen() {
  return (
    <KeyboardAwareScrollView
      bottomOffset={40}
      className="flex-1 bg-background"
      contentContainerClassName="flex-1 items-center justify-center p-4 py-8"
      keyboardDismissMode="interactive"
      keyboardShouldPersistTaps="handled"
    >
      <View className="w-full max-w-sm">
        <SignInForm />
      </View>
    </KeyboardAwareScrollView>
  )
}
