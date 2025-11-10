import { BottomSheetTextInput } from '@gorhom/bottom-sheet'
import { forwardRef } from 'react'
import { Platform, TextInput, type TextInputProps } from 'react-native'
import { cn } from '@/lib/utils'

interface InputProps extends TextInputProps {
  isInBottomSheet?: boolean
}

const Input = forwardRef<TextInput, InputProps>(
  (
    { className, placeholderClassName, isInBottomSheet = false, ...props },
    ref,
  ) => {
    const sharedClassName = cn(
      'flex h-10 w-full min-w-0 flex-row items-center rounded-md border border-input bg-background px-3 py-1 text-base text-foreground leading-5 sm:h-9 dark:bg-input/30',
      props.editable === false &&
        cn(
          'opacity-50',
          Platform.select({
            web: 'disabled:pointer-events-none disabled:cursor-not-allowed',
          }),
        ),
      Platform.select({
        web: cn(
          'outline-none transition-[color,box-shadow] selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground md:text-sm',
          'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
          'aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40',
        ),
        native: 'placeholder:text-muted-foreground/50',
      }),
      className,
    )

    if (isInBottomSheet) {
      return (
        <BottomSheetTextInput
          className={sharedClassName}
          placeholderClassName={placeholderClassName}
          // biome-ignore lint/suspicious/noExplicitAny: BottomSheetTextInput ref type incompatibility
          ref={ref as any}
          {...props}
        />
      )
    }

    return (
      <TextInput
        className={sharedClassName}
        placeholderClassName={placeholderClassName}
        ref={ref}
        {...props}
      />
    )
  },
)

Input.displayName = 'Input'

export { Input }
