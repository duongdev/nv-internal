import { useSignIn } from '@clerk/clerk-expo'
import * as React from 'react'
import { Image, type TextInput, View } from 'react-native'
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

function Logo({ size = 120 }: { size?: number }) {
  return (
    <Image
      resizeMode="contain"
      source={require('@/assets/images/icon.png')}
      style={{ width: size, height: size, alignSelf: 'center' }}
    />
  )
}

export function SignInForm() {
  const { signIn, setActive, isLoaded } = useSignIn()
  const [username, setUsername] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(false)
  const passwordInputRef = React.useRef<TextInput>(null)
  const [error, setError] = React.useState<{
    username?: string
    password?: string
  }>({})

  async function onSubmit() {
    if (!isLoaded || isLoading) {
      return
    }

    setIsLoading(true)

    // Start the sign-in process using the username and password provided
    try {
      const signInAttempt = await signIn.create({
        identifier: username,
        password,
      })

      // If sign-in process is complete, set the created session as active
      // and redirect the user
      if (signInAttempt.status === 'complete') {
        setError({ username: '', password: '' })
        await setActive({ session: signInAttempt.createdSessionId })
        // Keep loading state true - navigation will unmount this component
        return
      }
      // TODO: Handle other statuses
      console.error(JSON.stringify(signInAttempt, null, 2))
      setIsLoading(false)
    } catch (err) {
      setIsLoading(false)
      // See https://go.clerk.com/mRUDrIe for more info on error handling
      if (err instanceof Error) {
        const errorMessage = err.message.toLowerCase()
        let vietnameseError: string

        // Translate common Clerk error messages to Vietnamese
        if (errorMessage.includes("couldn't find your account")) {
          vietnameseError = 'Không tìm thấy tài khoản của bạn.'
        } else if (
          errorMessage.includes('identifier') ||
          errorMessage.includes('username')
        ) {
          if (errorMessage.includes('is required')) {
            vietnameseError = 'Vui lòng nhập tên đăng nhập.'
          } else if (errorMessage.includes('invalid')) {
            vietnameseError = 'Tên đăng nhập không hợp lệ.'
          } else {
            vietnameseError = 'Không tìm thấy tài khoản của bạn.'
          }
        } else if (errorMessage.includes('password')) {
          if (errorMessage.includes('is required')) {
            vietnameseError = 'Vui lòng nhập mật khẩu.'
          } else if (errorMessage.includes('incorrect')) {
            vietnameseError = 'Mật khẩu không chính xác.'
          } else if (errorMessage.includes('invalid')) {
            vietnameseError = 'Mật khẩu không hợp lệ.'
          } else {
            vietnameseError = 'Đăng nhập thất bại. Vui lòng thử lại.'
          }
        } else {
          vietnameseError = 'Đăng nhập thất bại. Vui lòng thử lại.'
        }

        const isUsernameMessage =
          errorMessage.includes('identifier') ||
          errorMessage.includes('username')

        setError(
          isUsernameMessage
            ? { username: vietnameseError }
            : { password: vietnameseError },
        )
        return
      }
      console.error(JSON.stringify(err, null, 2))
    }
  }

  function onUsernameSubmitEditing() {
    passwordInputRef.current?.focus()
  }

  return (
    <View className="gap-6">
      <Card className="border-border/0 shadow-none sm:border-border sm:shadow-black/5 sm:shadow-sm">
        <CardHeader>
          <View className="mb-4">
            <Logo size={120} />
          </View>
          <CardTitle className="text-center text-2xl text-primary sm:text-left">
            Nam Việt Solution
          </CardTitle>
          <CardDescription className="text-center text-base sm:text-left">
            Chào mừng! Vui lòng đăng nhập để tiếp tục
          </CardDescription>
        </CardHeader>
        <CardContent className="gap-6">
          <View className="gap-6">
            <View className="gap-1.5">
              <Label htmlFor="username">Tên đăng nhập</Label>
              <Input
                accessibilityHint="Nhập tên đăng nhập của bạn"
                accessibilityLabel="Tên đăng nhập"
                autoCapitalize="none"
                editable={!isLoading}
                id="username"
                onChangeText={setUsername}
                onSubmitEditing={onUsernameSubmitEditing}
                placeholder="Nhập tên đăng nhập"
                returnKeyType="next"
                submitBehavior="submit"
                testID="sign-in-username-input"
              />
              {error.username ? (
                <Text className="font-medium text-destructive text-sm">
                  {error.username}
                </Text>
              ) : null}
            </View>
            <View className="gap-1.5">
              <Label htmlFor="password">Mật khẩu</Label>
              <Input
                accessibilityHint="Nhập mật khẩu của bạn"
                accessibilityLabel="Mật khẩu"
                editable={!isLoading}
                id="password"
                onChangeText={setPassword}
                onSubmitEditing={onSubmit}
                placeholder="••••••••"
                ref={passwordInputRef}
                returnKeyType="send"
                secureTextEntry
                testID="sign-in-password-input"
              />
              {error.password ? (
                <Text className="font-medium text-destructive text-sm">
                  {error.password}
                </Text>
              ) : null}
            </View>
            <Button
              accessibilityHint="Nhấn để đăng nhập vào hệ thống"
              accessibilityLabel="Đăng nhập"
              className="w-full"
              disabled={isLoading || !isLoaded}
              onPress={onSubmit}
              testID="sign-in-submit-button"
            >
              <Text>{isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}</Text>
            </Button>
          </View>
        </CardContent>
      </Card>
    </View>
  )
}
