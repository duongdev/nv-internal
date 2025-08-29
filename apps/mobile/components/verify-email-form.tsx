import { useSignUp } from '@clerk/clerk-expo'
import { router, useLocalSearchParams } from 'expo-router'
import * as React from 'react'
import { type TextStyle, View } from 'react-native'
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

const RESEND_CODE_INTERVAL_SECONDS = 30

const TABULAR_NUMBERS_STYLE: TextStyle = { fontVariant: ['tabular-nums'] }

export function VerifyEmailForm() {
  const { signUp, setActive, isLoaded } = useSignUp()
  const { email = '' } = useLocalSearchParams<{ email?: string }>()
  const [code, setCode] = React.useState('')
  const [error, setError] = React.useState('')
  const { countdown, restartCountdown } = useCountdown(
    RESEND_CODE_INTERVAL_SECONDS,
  )

  async function onSubmit() {
    if (!isLoaded) {
      return
    }

    try {
      // Use the code the user provided to attempt verification
      const signUpAttempt = await signUp.attemptEmailAddressVerification({
        code,
      })

      // If verification was completed, set the session to active
      // and redirect the user
      if (signUpAttempt.status === 'complete') {
        await setActive({ session: signUpAttempt.createdSessionId })
        return
      }
      // TODO: Handle other statuses
      // If the status is not complete, check why. User may need to
      // complete further steps.
      console.error(JSON.stringify(signUpAttempt, null, 2))
    } catch (err) {
      // See https://go.clerk.com/mRUDrIe for more info on error handling
      if (err instanceof Error) {
        setError(err.message)
        return
      }
      console.error(JSON.stringify(err, null, 2))
    }
  }

  async function onResendCode() {
    if (!isLoaded) {
      return
    }

    try {
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
      restartCountdown()
    } catch (err) {
      // See https://go.clerk.com/mRUDrIe for more info on error handling
      if (err instanceof Error) {
        setError(err.message)
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
            Verify your email
          </CardTitle>
          <CardDescription className="text-center sm:text-left">
            Enter the verification code sent to {email || 'your email'}
          </CardDescription>
        </CardHeader>
        <CardContent className="gap-6">
          <View className="gap-6">
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
              {!error ? null : (
                <Text className="font-medium text-destructive text-sm">
                  {error}
                </Text>
              )}
              <Button
                disabled={countdown > 0}
                onPress={onResendCode}
                size="sm"
                variant="link"
              >
                <Text className="text-center text-xs">
                  Didn&apos;t receive the code? Resend{' '}
                  {countdown > 0 ? (
                    <Text className="text-xs" style={TABULAR_NUMBERS_STYLE}>
                      ({countdown})
                    </Text>
                  ) : null}
                </Text>
              </Button>
            </View>
            <View className="gap-3">
              <Button className="w-full" onPress={onSubmit}>
                <Text>Continue</Text>
              </Button>
              <Button className="mx-auto" onPress={router.back} variant="link">
                <Text>Cancel</Text>
              </Button>
            </View>
          </View>
        </CardContent>
      </Card>
    </View>
  )
}

function useCountdown(seconds = 30) {
  const [countdown, setCountdown] = React.useState(seconds)
  const intervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null)

  const startCountdown = React.useCallback(() => {
    setCountdown(seconds)

    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    intervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [seconds])

  React.useEffect(() => {
    startCountdown()

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [startCountdown])

  return { countdown, restartCountdown: startCountdown }
}
