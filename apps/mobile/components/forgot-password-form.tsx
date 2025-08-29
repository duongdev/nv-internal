import { useSignIn } from '@clerk/clerk-expo'
import { router } from 'expo-router'
import { useLocalSearchParams } from 'expo-router/build/hooks'
import * as React from 'react'
import { View } from 'react-native'
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

export function ForgotPasswordForm() {
  const { email: emailParam = '' } = useLocalSearchParams<{ email?: string }>()
  const [email, setEmail] = React.useState(emailParam)
  const { signIn, isLoaded } = useSignIn()
  const [error, setError] = React.useState<{
    email?: string
    password?: string
  }>({})

  const onSubmit = async () => {
    if (!email) {
      setError({ email: 'Email is required' })
      return
    }
    if (!isLoaded) {
      return
    }

    try {
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: email,
      })

      router.push(`/(auth)/reset-password?email=${email}`)
    } catch (err) {
      // See https://go.clerk.com/mRUDrIe for more info on error handling
      if (err instanceof Error) {
        setError({ email: err.message })
        return
      }
      console.error(JSON.stringify(err, null, 2))
    }
  }

  return (
    <View className="gap-6">
      <Card className="border-border/0 shadow-none sm:border-border sm:shadow-black/5 sm:shadow-sm">
        <CardHeader>
          <CardTitle className="text-center text-xl sm:text-left">
            Forgot password?
          </CardTitle>
          <CardDescription className="text-center sm:text-left">
            Enter your email to reset your password
          </CardDescription>
        </CardHeader>
        <CardContent className="gap-6">
          <View className="gap-6">
            <View className="gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                autoCapitalize="none"
                autoComplete="email"
                defaultValue={email}
                id="email"
                keyboardType="email-address"
                onChangeText={setEmail}
                onSubmitEditing={onSubmit}
                placeholder="m@example.com"
                returnKeyType="send"
              />
              {error.email ? (
                <Text className="font-medium text-destructive text-sm">
                  {error.email}
                </Text>
              ) : null}
            </View>
            <Button className="w-full" onPress={onSubmit}>
              <Text>Reset your password</Text>
            </Button>
          </View>
        </CardContent>
      </Card>
    </View>
  )
}
