import { View, type ViewProps } from 'react-native'
import { Text, TextClassContext } from '@/components/ui/text'
import { cn } from '@/lib/utils'

function Card({ className, ...props }: ViewProps & React.RefAttributes<View>) {
  return (
    <TextClassContext.Provider value="text-card-foreground">
      <View
        className={cn(
          'flex flex-col gap-3 rounded-xl border border-border bg-card py-3',
          className,
        )}
        {...props}
      />
    </TextClassContext.Provider>
  )
}

function CardHeader({
  className,
  ...props
}: ViewProps & React.RefAttributes<View>) {
  return (
    <View className={cn('flex flex-col gap-1.5 px-4', className)} {...props} />
  )
}

function CardTitle({
  className,
  ...props
}: React.ComponentProps<typeof Text> & React.RefAttributes<Text>) {
  return (
    <Text
      aria-level={3}
      className={cn(
        'font-sans-medium text-muted-foreground leading-none',
        className,
      )}
      role="heading"
      {...props}
    />
  )
}

function CardDescription({
  className,
  ...props
}: React.ComponentProps<typeof Text> & React.RefAttributes<Text>) {
  return (
    <Text
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  )
}

function CardContent({
  className,
  ...props
}: ViewProps & React.RefAttributes<View>) {
  return <View className={cn('px-4', className)} {...props} />
}

function CardFooter({
  className,
  ...props
}: ViewProps & React.RefAttributes<View>) {
  return (
    <View
      className={cn('flex flex-row items-center px-6', className)}
      {...props}
    />
  )
}

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle }
