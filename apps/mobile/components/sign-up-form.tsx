import { useSignUp } from '@clerk/clerk-expo'
import { Link, router } from 'expo-router'
import * as React from 'react'
import { type TextInput, View } from 'react-native'
import { SocialConnections } from '@/components/social-connections'
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
import { Separator } from '@/components/ui/separator'
import { Text } from '@/components/ui/text'

export function SignUpForm() {
  const { signUp, isLoaded } = useSignUp()
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const passwordInputRef = React.useRef<TextInput>(null)
  const [error, setError] = React.useState<{
    email?: string
    password?: string
  }>({})

  async function onSubmit() {
    if (!isLoaded) {
      return
    }

    // Start sign-up process using email and password provided
    try {
      await signUp.create({
        emailAddress: email,
        password,
      })

      // Send user an email with verification code
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })

      router.push(`/(auth)/sign-up/verify-email?email=${email}`)
    } catch (err) {
      // See https://go.clerk.com/mRUDrIe for more info on error handling
      if (err instanceof Error) {
        const isEmailMessage =
          err.message.toLowerCase().includes('identifier') ||
          err.message.toLowerCase().includes('email')
        setError(
          isEmailMessage ? { email: err.message } : { password: err.message },
        )
        return
      }
      console.error(JSON.stringify(err, null, 2))
    }
  }

  function onEmailSubmitEditing() {
    passwordInputRef.current?.focus()
  }

  return (
    <View className="gap-6">
      <Card className="border-border/0 shadow-none sm:border-border sm:shadow-black/5 sm:shadow-sm">
        <CardHeader>
          <CardTitle className="text-center text-xl sm:text-left">
            Create your account
          </CardTitle>
          <CardDescription className="text-center sm:text-left">
            Welcome! Please fill in the details to get started.
          </CardDescription>
        </CardHeader>
        <CardContent className="gap-6">
          <View className="gap-6">
            <View className="gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                autoCapitalize="none"
                autoComplete="email"
                id="email"
                keyboardType="email-address"
                onChangeText={setEmail}
                onSubmitEditing={onEmailSubmitEditing}
                placeholder="m@example.com"
                returnKeyType="next"
                submitBehavior="submit"
              />
              {error.email ? (
                <Text className="font-medium text-destructive text-sm">
                  {error.email}
                </Text>
              ) : null}
            </View>
            <View className="gap-1.5">
              <View className="flex-row items-center">
                <Label htmlFor="password">Password</Label>
              </View>
              <Input
                id="password"
                onChangeText={setPassword}
                onSubmitEditing={onSubmit}
                ref={passwordInputRef}
                returnKeyType="send"
                secureTextEntry
              />
              {error.password ? (
                <Text className="font-medium text-destructive text-sm">
                  {error.password}
                </Text>
              ) : null}
            </View>
            <Button className="w-full" onPress={onSubmit}>
              <Text>Continue</Text>
            </Button>
          </View>
          <Text className="text-center text-sm">
            Already have an account?{' '}
            <Link
              className="text-sm underline underline-offset-4"
              dismissTo
              href="/(auth)/sign-in"
            >
              Sign in
            </Link>
          </Text>
          <View className="flex-row items-center">
            <Separator className="flex-1" />
            <Text className="px-4 text-muted-foreground text-sm">or</Text>
            <Separator className="flex-1" />
          </View>
          <SocialConnections />
        </CardContent>
      </Card>
    </View>
  )
}
