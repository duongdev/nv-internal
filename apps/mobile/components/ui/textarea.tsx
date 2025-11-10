import { BottomSheetTextInput } from '@gorhom/bottom-sheet'
import { forwardRef } from 'react'
import { Platform, TextInput, type TextInputProps } from 'react-native'
import { cn } from '@/lib/utils'

interface TextareaProps extends TextInputProps {
  isInBottomSheet?: boolean
}

const Textarea = forwardRef<TextInput, TextareaProps>(
  (
    {
      className,
      multiline = true,
      numberOfLines = Platform.select({ web: 2, native: 8 }), // On web, numberOfLines also determines initial height. On native, it determines the maximum height.
      placeholderClassName,
      isInBottomSheet = false,
      ...props
    },
    ref,
  ) => {
    const sharedClassName = cn(
      'flex min-h-16 w-full flex-row rounded-md border border-input bg-transparent px-3 py-2 text-base text-foreground md:text-sm dark:bg-input/30',
      Platform.select({
        web: 'field-sizing-content resize-y outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40',
      }),
      props.editable === false && 'opacity-50',
      className,
    )

    const sharedPlaceholderClassName = cn(
      'text-muted-foreground',
      placeholderClassName,
    )

    if (isInBottomSheet) {
      return (
        <BottomSheetTextInput
          className={sharedClassName}
          multiline={multiline}
          numberOfLines={numberOfLines}
          placeholderClassName={sharedPlaceholderClassName}
          // biome-ignore lint/suspicious/noExplicitAny: BottomSheetTextInput ref type incompatibility
          ref={ref as any}
          textAlignVertical="top"
          {...props}
        />
      )
    }

    return (
      <TextInput
        className={sharedClassName}
        multiline={multiline}
        numberOfLines={numberOfLines}
        placeholderClassName={sharedPlaceholderClassName}
        ref={ref}
        textAlignVertical="top"
        {...props}
      />
    )
  },
)

Textarea.displayName = 'Textarea'

export { Textarea }
