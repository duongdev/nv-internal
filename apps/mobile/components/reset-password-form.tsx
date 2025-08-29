import { useSignIn } from '@clerk/clerk-expo'
import * as React from 'react'
import { type TextInput, View } from 'react-native'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Text } from '@/components/ui/text'

export function ResetPasswordForm() {
  const { signIn, setActive, isLoaded } = useSignIn()
  const [password, setPassword] = React.useState('')
  const [code, setCode] = React.useState('')
  const codeInputRef = React.useRef<TextInput>(null)
  const [error, setError] = React.useState({ code: '', password: '' })

  async function onSubmit() {
    if (!isLoaded) {
      return
    }
    try {
      const result = await signIn?.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code,
        password,
      })

      if (result.status === 'complete') {
        // Set the active session to
        // the newly created session (user is now signed in)
        setActive({ session: result.createdSessionId })
        return
      }
      // TODO: Handle other statuses
    } catch (err) {
      // See https://go.clerk.com/mRUDrIe for more info on error handling
      if (err instanceof Error) {
        const isPasswordMessage = err.message.toLowerCase().includes('password')
        setError({ code: '', password: isPasswordMessage ? err.message : '' })
        return
      }
      console.error(JSON.stringify(err, null, 2))
    }
  }

  function onPasswordSubmitEditing() {
    codeInputRef.current?.focus()
  }

  return (
    <View className="gap-6">
      <Card className="border-border/0 shadow-none sm:border-border sm:shadow-black/5 sm:shadow-sm">
        <CardHeader>
          <CardTitle className="text-center text-xl sm:text-left">
            Reset password
          </CardTitle>
          <CardDescription className="text-center sm:text-left">
            Enter the code sent to your email and set a new password
          </CardDescription>
        </CardHeader>
        <CardContent className="gap-6">
          <View className="gap-6">
            <View className="gap-1.5">
              <View className="flex-row items-center">
                <Label htmlFor="password">New password</Label>
              </View>
              <Input
                id="password"
                onChangeText={setPassword}
                onSubmitEditing={onPasswordSubmitEditing}
                returnKeyType="next"
                secureTextEntry
                submitBehavior="submit"
              />
              {error.password ? (
                <Text className="font-medium text-destructive text-sm">
                  {error.password}
                </Text>
              ) : null}
            </View>
            <View className="gap-1.5">
              <Label htmlFor="code">Verification code</Label>
              <Input
                autoCapitalize="none"
                autoComplete="sms-otp"
                id="code"
                keyboardType="numeric"
                onChangeText={setCode}
                onSubmitEditing={onSubmit}
                returnKeyType="send"
                textContentType="oneTimeCode"
              />
              {error.code ? (
                <Text className="font-medium text-destructive text-sm">
                  {error.code}
                </Text>
              ) : null}
            </View>
            <Button className="w-full" onPress={onSubmit}>
              <Text>Reset Password</Text>
            </Button>
          </View>
        </CardContent>
      </Card>
    </View>
  )
}
