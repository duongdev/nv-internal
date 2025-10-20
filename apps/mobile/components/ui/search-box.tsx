import { BottomSheetTextInput } from '@gorhom/bottom-sheet'
import type { BottomSheetTextInputProps } from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheetTextInput'
import { SearchIcon, XIcon } from 'lucide-react-native'
import { type FC, useRef, useState } from 'react'
import { Pressable, TextInput, type TextInputProps } from 'react-native'
import { useDebounce } from '@/hooks/use-debounce'
import { cn } from '@/lib/utils'
import { Button } from './button'
import { Icon } from './icon'

export type SearchBoxProps = TextInputProps & {
  onChangeTextDebounced?: (text: string) => void
  isInBottomSheet?: boolean
  className?: string
}

export const SearchBox: FC<SearchBoxProps> = ({
  value,
  onChangeText,
  onChangeTextDebounced,
  className,
  isInBottomSheet = false,
  ...props
}) => {
  const inputRef = useRef<TextInput>(null)
  const bottomSheetInputRef = useRef<BottomSheetTextInputProps>(null)
  const [val, setVal] = useState(value ?? '')

  const handleTextChange = (text: string) => {
    setVal(text)
    onChangeText?.(text)
  }
  const handleClear = () => {
    handleTextChange('')
    onChangeTextDebounced?.('')
    inputRef.current?.focus()
  }
  const Comp = isInBottomSheet ? BottomSheetTextInput : TextInput

  useDebounce(
    () => {
      onChangeTextDebounced?.(val)
    },
    300,
    [val],
  )

  return (
    <Pressable
      className={cn(
        'flex-row items-center gap-2 rounded-md bg-muted p-3',
        className,
      )}
      onPress={() => inputRef.current?.focus()}
    >
      <Icon as={SearchIcon} className="size-5 shrink-0 text-muted-foreground" />
      <Comp
        className="flex-1 text-primary"
        onChangeText={handleTextChange}
        placeholder="Tìm kiếm..."
        ref={isInBottomSheet ? bottomSheetInputRef : (inputRef as unknown as React.Ref<TextInput>)}
        value={val}
        {...(props as TextInputProps)}
      />
      {val && (
        <Button onPress={handleClear} size={null} variant={null}>
          <Icon as={XIcon} className="size-5 shrink-0 text-muted-foreground" />
        </Button>
      )}
    </Pressable>
  )
}
